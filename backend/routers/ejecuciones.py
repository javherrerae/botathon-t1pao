"""
routers/ejecuciones.py
Endpoints de ejecuciones del bot Blue Prism.
"""
from fastapi import APIRouter
from data_loader import get_ejecuciones, get_meta

router = APIRouter(prefix="/api/ejecuciones", tags=["Ejecuciones"])


@router.get("/")
def listar_ejecuciones():
    """
    Devuelve todas las ejecuciones registradas por Blue Prism.
    Incluye meta, estado, totales, registros válidos/rechazados y errores.
    """
    ejecuciones = get_ejecuciones()
    return {
        "total": len(ejecuciones),
        "ejecuciones": ejecuciones,
    }


@router.get("/{ejecucion_id}")
def detalle_ejecucion(ejecucion_id: str):
    """Detalle de una ejecución específica por su ID."""
    ejecuciones = get_ejecuciones()
    ej = next((e for e in ejecuciones if e["ejecucionId"] == ejecucion_id), None)
    if not ej:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ejecución no encontrada")
    return ej


@router.get("/{ejecucion_id}/errores")
def errores_ejecucion(ejecucion_id: str):
    """Lista de errores/excepciones de Blue Prism para una ejecución."""
    ejecuciones = get_ejecuciones()
    ej = next((e for e in ejecuciones if e["ejecucionId"] == ejecucion_id), None)
    if not ej:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Ejecución no encontrada")
    errores = ej.get("errores", [])
    return {
        "ejecucionId": ejecucion_id,
        "total": len(errores),
        "errores": errores,
    }
