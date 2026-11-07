# Puesta en marcha: PostgreSQL + datos reales del bot

Flujo completo:

```
Blue Prism (VM) ──escribe──▶ Resultados_AAAAMMDD_HHMM.xlsx ──▶ carpeta compartida (RESULTADOS_DIR)
                                                                   │
                     Monitoreo: "Importar última ejecución"  ──────┘  (o "Subir Resultados.xlsx", plan B)
                                                                   ▼
                                            backend/importador.py ──▶ PostgreSQL ──▶ API ──▶ Frontend
```

Principio: **Blue Prism calcula; el backend guarda y agrega.** Ninguna consulta recalcula atenciones.

## 1. Base de datos (una vez)

En *SQL Shell (psql)* o pgAdmin, como `postgres`:

```sql
CREATE USER cada_hora WITH PASSWORD 'elijan-una-clave';
CREATE DATABASE cada_hora_cuenta OWNER cada_hora;
```

## 2. Configuración del backend

```bash
cd backend
copy .env.example .env        # en Windows (en Linux/Mac: cp)
pip install -r requirements.txt
```

Editar `backend/.env`:

| Variable | Valor |
|---|---|
| `FUENTE_DATOS` | `postgres` (datos reales) o `mock` (plan B) |
| `DATABASE_URL` | `postgresql://cada_hora:CLAVE@localhost:5432/cada_hora_cuenta` |
| `RESULTADOS_DIR` | Carpeta del equipo compartida con la VM, por ejemplo `C:\BotSalida` |
| `PARAMETROS_BOT_PATH` | Ruta del `Parametros_Bot.xlsx` **que lee el bot** (ver punto 5) |

`backend/.env` tiene la clave: **no se sube al repositorio** (está en `.gitignore`).

## 3. Crear las tablas

```bash
python db.py            # aplica schema.sql (se puede ejecutar varias veces)
```

## 4. Primera carga

**Importen primero el archivo de la corrida COMPLETA** (3.123 filas). Así los IDs anónimos
quedan iguales a los del mock y calzan con las novedades y el multi-instituto simulados.

```bash
python importador.py "C:\BotSalida\Resultados_20261107_0843.xlsx"
python importador.py --semilla      # novedades y multi-instituto (simulados hasta que el bot los entregue)
```

Resultado esperado del primer comando: `totalRegistros 3123 · validos 2891 · rechazados 232 · atencionesTotal 511769`.

Luego iniciar el backend (`start.bat`) y comprobar `http://localhost:8000/health`:
debe decir `"fuenteDatos": "postgres"` y `"datosSimulados": false`.

## 5. Parámetros: un solo archivo para la app y para el bot

La página Parámetros escribe `Parametros_Bot.xlsx` y el bot lo lee al iniciar. **Tiene que ser el mismo archivo.**
Pongan el Excel en la carpeta compartida (`C:\BotSalida\Parametros_Bot.xlsx`), apunten `PARAMETROS_BOT_PATH`
a esa ruta y, en el Performer, `Ruta Parametros` a la misma carpeta vista desde la VM.

La meta de gestión ahora se guarda en la hoja **`General`** (`MetaGestionPct`), que el bot puede leer.

## 6. Plan B en la demo

Si PostgreSQL falla: en `backend/.env` cambien `FUENTE_DATOS=mock`, reinicien el backend y la app sigue
funcionando con los datos simulados (que son idénticos a los del bot, salvo la marca "simulado").

## Endpoints nuevos

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/importaciones` | Fuente activa, carpeta y ejecuciones importadas |
| `POST` | `/api/importaciones/ultima` | Importa el `Resultados_*.xlsx` más reciente de `RESULTADOS_DIR` |
| `POST` | `/api/importaciones/archivo` | Importa un archivo subido (campo `archivo`, multipart) |
| `GET` | `/api/excepciones/multi-instituto/validacion` | Distribución multi-instituto mensual validada (OK / ADVERTENCIA / ERROR) |

## Reglas del importador

1. Valida la hoja `Resultados` y los 17 encabezados **antes** de tocar la base; si algo falla, informa la fila exacta.
2. Todo en **una transacción**: entra el archivo completo o nada.
3. En filas `EXCEPCION`, los ceros del bot se guardan como `NULL`.
4. El mismo archivo no se importa dos veces.
5. `periodo` se acepta como texto `AAAA-MM-DD` o como fecha (Excel suele convertirlo).
6. Los `personaId` reales quedan solo en la tabla `personas_anon`; la API entrega IDs anónimos (900001…).
