-- =============================================================================
-- schema.sql — Base de datos "Cada hora cuenta" (PostgreSQL 16+)
--
-- Se ejecuta UNA vez sobre una base vacía:
--   psql -U cada_hora -d cada_hora_cuenta -f schema.sql
-- Es re-ejecutable: usa IF NOT EXISTS / CREATE OR REPLACE.
--
-- Principio: Blue Prism CALCULA; la base GUARDA y AGREGA.
-- Ninguna tabla ni vista recalcula atenciones: solo suma lo que entregó el bot.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catálogo de institutos (el archivo del bot trae solo el código).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS institutos (
    it      INTEGER PRIMARY KEY,
    codigo  TEXT NOT NULL UNIQUE,
    nombre  TEXT NOT NULL
);

INSERT INTO institutos (it, codigo, nombre) VALUES
    (11,  'Ari', 'Arica'),
    (12,  'Iqu', 'Iquique'),
    (21,  'Ant', 'Antofagasta'),
    (22,  'Cal', 'Calama'),
    (31,  'Cop', 'Copiapó'),
    (41,  'Coq', 'Coquimbo'),
    (51,  'Val', 'Valparaíso'),
    (61,  'OHi', 'O''Higgins'),
    (71,  'Tal', 'Talca'),
    (81,  'Con', 'Concepción'),
    (91,  'Tem', 'Temuco'),
    (101, 'PMo', 'Puerto Montt'),
    (111, 'Coy', 'Coyhaique'),
    (131, 'San', 'Santiago'),
    (141, 'Vdv', 'Valdivia')
ON CONFLICT (it) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Anonimización: el ID real del kit NUNCA sale por la API.
-- Solo el backend conoce esta tabla; la API expone persona_anon / nombre.
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS seq_persona_anon START WITH 900001;

CREATE TABLE IF NOT EXISTS personas_anon (
    persona_id_real  BIGINT  PRIMARY KEY,
    persona_anon     INTEGER NOT NULL UNIQUE DEFAULT nextval('seq_persona_anon'),
    nombre           TEXT    NOT NULL DEFAULT ''
);

-- -----------------------------------------------------------------------------
-- Una fila por corrida del bot (= un archivo Resultados_*.xlsx importado).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ejecuciones (
    ejecucion_id     TEXT PRIMARY KEY,                 -- EJ-AAAAMMDD-HHMM
    archivo          TEXT NOT NULL UNIQUE,             -- evita importar dos veces el mismo archivo
    fuente           TEXT NOT NULL DEFAULT 'BUK',
    fecha_hora       TIMESTAMP NOT NULL,               -- inicio de la ejecución (sale del nombre del archivo)
    importado_en     TIMESTAMP NOT NULL DEFAULT now(),
    estado           TEXT NOT NULL CHECK (estado IN ('COMPLETADO','COMPLETADO_CON_OBSERVACIONES','ERROR')),
    total_registros  INTEGER NOT NULL,
    validos          INTEGER NOT NULL,
    rechazados       INTEGER NOT NULL
);

-- -----------------------------------------------------------------------------
-- Resultados del bot: una fila por profesional y mes, tal como vienen del Excel.
-- En excepciones, los campos calculados se guardan como NULL (el bot escribe 0).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resultados (
    id                     BIGSERIAL PRIMARY KEY,
    ejecucion_id           TEXT    NOT NULL REFERENCES ejecuciones(ejecucion_id) ON DELETE CASCADE,
    clave                  TEXT    NOT NULL,           -- clave REAL del bot (PersonaId_AAAAMM)
    persona_id_real        BIGINT  NOT NULL REFERENCES personas_anon(persona_id_real),
    it                     INTEGER NOT NULL,
    instituto              TEXT    NOT NULL,
    cargo                  TEXT    NOT NULL,
    periodo                DATE    NOT NULL,
    horas_contrato         NUMERIC(6,2) NOT NULL,
    tramo_jornada          TEXT,
    pct_directo            NUMERIC(6,4),
    pct_indirecto          NUMERIC(6,4),
    semanas_habiles        NUMERIC(6,2),
    atenciones_directas    INTEGER,
    atenciones_indirectas  INTEGER,
    atenciones_total       INTEGER,
    meta_gestion           NUMERIC(12,1),
    estado                 TEXT NOT NULL CHECK (estado IN ('COMPLETADO','EXCEPCION')),
    motivo                 TEXT,
    UNIQUE (ejecucion_id, clave)
);
CREATE INDEX IF NOT EXISTS ix_resultados_ejec_periodo ON resultados (ejecucion_id, periodo);
CREATE INDEX IF NOT EXISTS ix_resultados_ejec_it      ON resultados (ejecucion_id, it);

-- -----------------------------------------------------------------------------
-- Novedades contractuales y distribución multi-instituto.
-- Mientras el bot no las entregue, se cargan desde el mock (simulado = TRUE).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS novedades (
    id                 TEXT PRIMARY KEY,
    ejecucion_id       TEXT REFERENCES ejecuciones(ejecucion_id) ON DELETE SET NULL,
    persona_anon       INTEGER NOT NULL,
    tipo_cambio        TEXT NOT NULL,
    valor_anterior     JSONB,                -- conserva el tipo (44 h, 'KINESIOLOGO', null)
    valor_nuevo        JSONB,
    fecha_vigencia     DATE,
    instituto          TEXT,
    estado_validacion  TEXT NOT NULL DEFAULT 'PENDIENTE',
    simulado           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS multi_instituto (
    id                 BIGSERIAL PRIMARY KEY,
    persona_anon       INTEGER NOT NULL,
    cargo              TEXT,
    periodo            DATE NOT NULL,
    horas_contrato     NUMERIC(6,2),
    instituto_contrato TEXT,
    distribucion       JSONB NOT NULL,           -- [{"instituto":"Iqu","horas":36}, ...]
    suma_distribucion  NUMERIC(6,2) NOT NULL,
    diferencia         NUMERIC(6,2),
    estado             TEXT NOT NULL CHECK (estado IN ('OK','ADVERTENCIA','ERROR')),
    motivo             TEXT,
    simulado           BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (persona_anon, periodo)
);

-- -----------------------------------------------------------------------------
-- Vistas: el backend "solo agrega", y lo hace aquí, en un único lugar.
-- -----------------------------------------------------------------------------

-- Última ejecución importada (la que muestra el dashboard).
CREATE OR REPLACE VIEW v_ultima_ejecucion AS
SELECT * FROM ejecuciones ORDER BY fecha_hora DESC, importado_en DESC LIMIT 1;

-- Resultados de la última ejecución, ya anonimizados y con el nombre del instituto.
CREATE OR REPLACE VIEW v_resultados AS
SELECT r.*,
       p.persona_anon,
       p.nombre,
       COALESCE(i.nombre, r.instituto)                       AS instituto_nombre,
       p.persona_anon::text || '_' || to_char(r.periodo, 'YYYYMM') AS clave_anon
FROM resultados r
JOIN v_ultima_ejecucion e ON e.ejecucion_id = r.ejecucion_id
JOIN personas_anon p      ON p.persona_id_real = r.persona_id_real
LEFT JOIN institutos i    ON i.it = r.it;

-- Resumen por instituto y mes (alimenta el Dashboard).
-- Horas y atenciones suman SOLO registros COMPLETADO; 'excepciones' cuenta el resto.
CREATE OR REPLACE VIEW v_resumen_instituto AS
SELECT it,
       instituto,
       instituto_nombre,
       periodo,
       COUNT(DISTINCT persona_anon)                                                        AS profesionales,
       COALESCE(SUM(horas_contrato)        FILTER (WHERE estado = 'COMPLETADO'), 0)        AS horas_contrato,
       COALESCE(SUM(atenciones_directas)   FILTER (WHERE estado = 'COMPLETADO'), 0)        AS atenciones_directas,
       COALESCE(SUM(atenciones_indirectas) FILTER (WHERE estado = 'COMPLETADO'), 0)        AS atenciones_indirectas,
       COALESCE(SUM(atenciones_total)      FILTER (WHERE estado = 'COMPLETADO'), 0)        AS atenciones_total,
       COALESCE(SUM(meta_gestion)          FILTER (WHERE estado = 'COMPLETADO'), 0)        AS meta_gestion,
       SUM(horas_contrato * pct_directo)   FILTER (WHERE estado = 'COMPLETADO')            AS horas_directas,
       COUNT(*)                                                                            AS registros,
       COUNT(*) FILTER (WHERE estado = 'EXCEPCION')                                        AS excepciones
FROM v_resultados
GROUP BY it, instituto, instituto_nombre, periodo;
