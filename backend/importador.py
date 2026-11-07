"""
importador.py — Importa un Resultados_*.xlsx generado por Blue Prism a PostgreSQL.

Uso por consola (desde la carpeta backend/):
    python importador.py RUTA\\Resultados_20261107_0843.xlsx
    python importador.py --ultima          # toma el más reciente de RESULTADOS_DIR
    python importador.py --semilla         # carga novedades y multi-instituto del mock (simulados)

También lo usa la API (routers/importaciones.py).

Reglas (acordadas en el contrato bot → backend):
  1. Se valida la estructura ANTES de tocar la base: hoja 'Resultados' + 17 encabezados exactos.
  2. Todo se inserta en UNA transacción: entra el archivo completo o no entra nada.
  3. En filas EXCEPCION los campos calculados llegan en 0 y se guardan como NULL.
  4. El mismo archivo no se importa dos veces (archivo UNIQUE en ejecuciones).
  5. El backend NO recalcula: guarda tal cual lo que entregó el bot.
"""
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

import openpyxl

ENCABEZADOS = [
    "clave", "personaId", "it", "instituto", "cargo", "periodo", "horasContrato",
    "tramoJornada", "pctDirecto", "pctIndirecto", "semanasHabiles",
    "atencionesDirectas", "atencionesIndirectas", "atencionesTotal",
    "metaGestion", "estado", "motivo",
]
CALCULADOS = ["tramoJornada", "pctDirecto", "pctIndirecto", "semanasHabiles",
              "atencionesDirectas", "atencionesIndirectas", "atencionesTotal", "metaGestion"]
ESTADOS = {"COMPLETADO", "EXCEPCION"}
PATRON_NOMBRE = re.compile(r"Resultados_(\d{8})_(\d{4})", re.IGNORECASE)


class ArchivoInvalido(Exception):
    """El archivo no cumple el contrato. Se informa sin tocar la base de datos."""
    def __init__(self, mensaje: str, errores: list[str] | None = None):
        super().__init__(mensaje)
        self.errores = errores or []


# ---------------------------------------------------------------------------
# 1. Lectura y validación (no toca la base)
# ---------------------------------------------------------------------------
def _periodo(valor) -> date:
    """El bot escribe '2026-01-01' como texto, pero Excel suele convertirlo a fecha."""
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor
    return datetime.strptime(str(valor).strip()[:10], "%Y-%m-%d").date()


def leer_resultados(ruta: Path) -> list[dict]:
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    if "Resultados" not in wb.sheetnames:
        raise ArchivoInvalido(f"El archivo no tiene la hoja 'Resultados' (hojas: {', '.join(wb.sheetnames)})")
    try:
        filas = iter(list(wb["Resultados"].iter_rows(values_only=True)))
    finally:
        wb.close()   # en Windows un libro abierto bloquea el archivo
    encabezados = [str(v).strip() if v is not None else "" for v in next(filas, [])][:len(ENCABEZADOS)]
    if encabezados != ENCABEZADOS:
        raise ArchivoInvalido("Encabezados incorrectos en la hoja 'Resultados'",
                              [f"Esperados: {ENCABEZADOS}", f"Recibidos: {encabezados}"])

    registros, errores, claves = [], [], set()
    for n, fila in enumerate(filas, start=2):
        if fila is None or all(v in (None, "") for v in fila[:len(ENCABEZADOS)]):
            continue  # filas vacías al final
        r = dict(zip(ENCABEZADOS, fila[:len(ENCABEZADOS)]))
        try:
            r["clave"] = str(r["clave"]).strip()
            r["personaId"] = int(r["personaId"])
            r["it"] = int(r["it"])
            r["periodo"] = _periodo(r["periodo"])
            r["horasContrato"] = float(r["horasContrato"])
            r["estado"] = str(r["estado"]).strip().upper()
            if r["estado"] not in ESTADOS:
                raise ValueError(f"estado desconocido '{r['estado']}'")
            if r["clave"] in claves:
                raise ValueError(f"clave repetida {r['clave']}")
            claves.add(r["clave"])
            if r["estado"] == "EXCEPCION":
                for c in CALCULADOS:          # regla 3: 0 del bot -> NULL
                    r[c] = None
            else:
                r["tramoJornada"] = str(r["tramoJornada"]).strip()
                for c in ("pctDirecto", "pctIndirecto", "semanasHabiles", "metaGestion"):
                    r[c] = float(r[c])
                for c in ("atencionesDirectas", "atencionesIndirectas", "atencionesTotal"):
                    r[c] = int(r[c])
            r["motivo"] = (str(r["motivo"]).strip() or None) if r["motivo"] is not None else None
        except Exception as e:  # noqa: BLE001 — se informa la fila exacta
            errores.append(f"Fila {n}: {e}")
        else:
            registros.append(r)
    if errores:
        raise ArchivoInvalido(f"{len(errores)} filas con datos inválidos", errores[:20])
    if not registros:
        raise ArchivoInvalido("El archivo no contiene filas de resultados")
    return registros


def datos_ejecucion(nombre: str, ruta: Path) -> tuple[str, datetime]:
    """ID y fecha de la ejecución, tomados del nombre Resultados_AAAAMMDD_HHMM.xlsx."""
    m = PATRON_NOMBRE.search(nombre)
    if m:
        fecha = datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M")
    else:
        fecha = datetime.fromtimestamp(ruta.stat().st_mtime).replace(second=0, microsecond=0)
    return f"EJ-{fecha:%Y%m%d-%H%M}", fecha


# ---------------------------------------------------------------------------
# 2. Escritura en PostgreSQL (una transacción)
# ---------------------------------------------------------------------------
def importar(ruta: str | Path, nombre_archivo: str | None = None) -> dict:
    """Importa el archivo. Devuelve un resumen con los totales para validar."""
    from db import conectar

    ruta = Path(ruta)
    archivo = nombre_archivo or ruta.name
    registros = leer_resultados(ruta)                     # falla aquí => la base no se toca
    ejecucion_id, fecha = datos_ejecucion(archivo, ruta)
    validos = sum(r["estado"] == "COMPLETADO" for r in registros)
    rechazados = len(registros) - validos
    estado = "COMPLETADO_CON_OBSERVACIONES" if rechazados else "COMPLETADO"

    with conectar() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT ejecucion_id FROM ejecuciones WHERE archivo = %s", (archivo,))
            previo = cur.fetchone()
            if previo:
                return {"importado": False, "duplicado": True, "ejecucionId": previo["ejecucion_id"],
                        "mensaje": f"El archivo {archivo} ya estaba importado"}

            # Dos archivos distintos con la misma fecha/hora: se agrega un sufijo -2, -3...
            base, n = ejecucion_id, 1
            while True:
                cur.execute("SELECT 1 FROM ejecuciones WHERE ejecucion_id = %s", (ejecucion_id,))
                if not cur.fetchone():
                    break
                n += 1
                ejecucion_id = f"{base}-{n}"

            cur.execute(
                """INSERT INTO ejecuciones (ejecucion_id, archivo, fuente, fecha_hora, estado,
                                            total_registros, validos, rechazados)
                   VALUES (%s, %s, 'BUK', %s, %s, %s, %s, %s)""",
                (ejecucion_id, archivo, fecha, estado, len(registros), validos, rechazados))

            # Anonimización estable: los IDs nuevos se numeran en orden ascendente de ID real.
            for pid in sorted({r["personaId"] for r in registros}):
                cur.execute("INSERT INTO personas_anon (persona_id_real) VALUES (%s) "
                            "ON CONFLICT (persona_id_real) DO NOTHING", (pid,))
            cur.execute("UPDATE personas_anon SET nombre = 'Profesional Anonimizado ' || (persona_anon - 900000) "
                        "WHERE nombre = ''")

            cur.executemany(
                """INSERT INTO resultados (ejecucion_id, clave, persona_id_real, it, instituto, cargo, periodo,
                       horas_contrato, tramo_jornada, pct_directo, pct_indirecto, semanas_habiles,
                       atenciones_directas, atenciones_indirectas, atenciones_total, meta_gestion, estado, motivo)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                [(ejecucion_id, r["clave"], r["personaId"], r["it"], r["instituto"], r["cargo"], r["periodo"],
                  r["horasContrato"], r["tramoJornada"], r["pctDirecto"], r["pctIndirecto"], r["semanasHabiles"],
                  r["atencionesDirectas"], r["atencionesIndirectas"], r["atencionesTotal"], r["metaGestion"],
                  r["estado"], r["motivo"]) for r in registros])
        conn.commit()

    return {
        "importado": True, "duplicado": False, "ejecucionId": ejecucion_id, "archivo": archivo,
        "estado": estado, "totalRegistros": len(registros), "validos": validos, "rechazados": rechazados,
        "atencionesTotal": sum(r["atencionesTotal"] or 0 for r in registros),
        "atencionesDirectas": sum(r["atencionesDirectas"] or 0 for r in registros),
    }


def ultimo_archivo(carpeta: str | Path) -> Path:
    """El Resultados_*.xlsx más reciente de la carpeta compartida con la VM."""
    carpeta = Path(carpeta)
    if not carpeta.is_dir():
        raise FileNotFoundError(f"No existe la carpeta de resultados: {carpeta}")
    archivos = [p for p in carpeta.glob("Resultados_*.xlsx") if not p.name.startswith("~$")]
    if not archivos:
        raise FileNotFoundError(f"No hay archivos Resultados_*.xlsx en {carpeta}")
    return max(archivos, key=lambda p: (p.name, p.stat().st_mtime))


# ---------------------------------------------------------------------------
# 3. Semilla de datos que el bot aún no entrega (marcados como simulados)
# ---------------------------------------------------------------------------
def cargar_semilla(ruta_mock: str | Path | None = None) -> dict:
    """Carga novedades y multi-instituto desde el mock. Re-ejecutable (reemplaza lo simulado)."""
    from db import conectar
    ruta_mock = Path(ruta_mock or Path(__file__).resolve().parent.parent / "mockDataActualizado.json")
    datos = json.loads(ruta_mock.read_text(encoding="utf-8"))
    novedades, multi = datos.get("novedades", []), datos.get("multiInstituto", [])
    with conectar() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM novedades WHERE simulado")
            cur.executemany(
                """INSERT INTO novedades (id, persona_anon, tipo_cambio, valor_anterior, valor_nuevo,
                                          fecha_vigencia, instituto, estado_validacion, simulado)
                   VALUES (%s,%s,%s,%s::jsonb,%s::jsonb,%s,%s,%s,TRUE)
                   ON CONFLICT (id) DO NOTHING""",
                [(n["id"], n["personaId"], n["tipoCambio"], json.dumps(n.get("valorAnterior")),
                  json.dumps(n.get("valorNuevo")), n.get("fechaVigencia"), n.get("instituto"),
                  n.get("estadoValidacion", "PENDIENTE")) for n in novedades])
            cur.execute("DELETE FROM multi_instituto WHERE simulado")
            cur.executemany(
                """INSERT INTO multi_instituto (persona_anon, cargo, periodo, horas_contrato, instituto_contrato,
                                                distribucion, suma_distribucion, diferencia, estado, motivo, simulado)
                   VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,TRUE)
                   ON CONFLICT (persona_anon, periodo) DO NOTHING""",
                [(m["personaId"], m.get("cargo"), m["periodo"], m.get("horasContrato"), m.get("institutoContrato"),
                  json.dumps(m["distribucion"]), m["sumaDistribucion"], m.get("diferencia"), m["estado"],
                  m.get("motivo")) for m in multi])
        conn.commit()
    return {"novedades": len(novedades), "multiInstituto": len(multi)}


if __name__ == "__main__":
    from db import RESULTADOS_DIR
    args = sys.argv[1:]
    try:
        if not args:
            print(__doc__)
            sys.exit(1)
        if args[0] == "--semilla":
            print("Semilla cargada:", cargar_semilla(args[1] if len(args) > 1 else None))
            sys.exit(0)
        ruta = ultimo_archivo(RESULTADOS_DIR) if args[0] == "--ultima" else Path(args[0])
        print(json.dumps(importar(ruta), ensure_ascii=False, indent=2))
    except ArchivoInvalido as e:
        print("ARCHIVO RECHAZADO:", e)
        for detalle in e.errores:
            print("  -", detalle)
        sys.exit(2)
