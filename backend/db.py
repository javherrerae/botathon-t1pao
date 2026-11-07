"""
db.py — Conexión a PostgreSQL y lectura de la configuración (.env).

La configuración se lee del archivo backend/.env (ver .env.example).
No se agregan dependencias extra: el .env se interpreta con un lector mínimo.
"""
import os
from pathlib import Path

_BACKEND = Path(__file__).resolve().parent


def _cargar_env() -> None:
    """Carga backend/.env en os.environ sin pisar variables ya definidas."""
    env = _BACKEND / ".env"
    if not env.exists():
        return
    for linea in env.read_text(encoding="utf-8").splitlines():
        linea = linea.strip()
        if not linea or linea.startswith("#") or "=" not in linea:
            continue
        clave, valor = linea.split("=", 1)
        os.environ.setdefault(clave.strip(), valor.strip().strip('"').strip("'"))


_cargar_env()

# "postgres" = datos reales importados del bot | "mock" = plan B (mockDataActualizado.json)
FUENTE_DATOS = os.getenv("FUENTE_DATOS", "mock").strip().lower()
DATABASE_URL = os.getenv("DATABASE_URL", "")
# Carpeta donde Blue Prism deja los Resultados_*.xlsx (carpeta compartida con la VM)
RESULTADOS_DIR = os.getenv("RESULTADOS_DIR", "")


def conectar():
    """Abre una conexión nueva. Las filas se devuelven como diccionarios."""
    if not DATABASE_URL:
        raise RuntimeError("Falta DATABASE_URL en backend/.env")
    import psycopg
    from psycopg.rows import dict_row
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def consultar(sql: str, params: tuple | list | None = None) -> list[dict]:
    """Ejecuta un SELECT y devuelve la lista de filas (diccionarios)."""
    with conectar() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def aplicar_esquema() -> None:
    """Ejecuta schema.sql (re-ejecutable). Uso: python db.py"""
    sql = (_BACKEND / "schema.sql").read_text(encoding="utf-8")
    with conectar() as conn:
        conn.execute(sql)
        conn.commit()


if __name__ == "__main__":
    aplicar_esquema()
    print("Esquema aplicado correctamente en", DATABASE_URL.rsplit("@", 1)[-1])
