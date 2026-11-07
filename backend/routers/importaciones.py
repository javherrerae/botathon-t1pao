"""
routers/importaciones.py — Cómo llega cada corrida del bot a PostgreSQL.

Dos caminos (el segundo es el plan B si falla la carpeta compartida con la VM):
  POST /api/importaciones/ultima   → importa el Resultados_*.xlsx más reciente de RESULTADOS_DIR
  POST /api/importaciones/archivo  → importa un archivo subido desde el frontend (multipart)
  GET  /api/importaciones          → estado de la configuración y ejecuciones importadas
"""
import shutil
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

import data_loader
from db import FUENTE_DATOS, RESULTADOS_DIR
from importador import ArchivoInvalido, importar, ultimo_archivo

router = APIRouter(prefix="/api/importaciones", tags=["Importaciones Blue Prism"])


def _exigir_postgres():
    if FUENTE_DATOS != "postgres":
        raise HTTPException(409, detail="La importación requiere FUENTE_DATOS=postgres en backend/.env")


def _ejecutar(ruta: Path, nombre: str) -> dict:
    try:
        resumen = importar(ruta, nombre_archivo=nombre)
    except ArchivoInvalido as e:
        raise HTTPException(422, detail={"mensaje": str(e), "errores": e.errores})
    data_loader.recargar()   # el dashboard muestra la nueva ejecución de inmediato
    return resumen


@router.get("")
def estado_importaciones():
    from data_loader import get_ejecuciones
    return {
        "fuenteDatos": FUENTE_DATOS,
        "carpetaResultados": RESULTADOS_DIR or None,
        "ejecuciones": [{k: e[k] for k in ("ejecucionId", "archivo", "fechaHora", "estado",
                                            "totalRegistros", "validos", "rechazados")}
                        for e in get_ejecuciones()],
    }


@router.post("/ultima")
def importar_ultima():
    _exigir_postgres()
    if not RESULTADOS_DIR:
        raise HTTPException(500, detail="Falta RESULTADOS_DIR en backend/.env")
    try:
        ruta = ultimo_archivo(RESULTADOS_DIR)
    except FileNotFoundError as e:
        raise HTTPException(404, detail=str(e))
    return _ejecutar(ruta, ruta.name)


@router.post("/archivo")
async def importar_archivo(archivo: UploadFile = File(...)):
    _exigir_postgres()
    if not (archivo.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(422, detail="Solo se aceptan archivos .xlsx generados por el bot")
    with tempfile.TemporaryDirectory() as tmp:
        destino = Path(tmp) / "subido.xlsx"
        with destino.open("wb") as f:
            shutil.copyfileobj(archivo.file, f)
        return _ejecutar(destino, Path(archivo.filename).name)
