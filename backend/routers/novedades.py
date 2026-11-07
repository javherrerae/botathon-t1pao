"""
routers/novedades.py
Endpoints de novedades detectadas por Blue Prism
(cambios de jornada, fin de contrato, nuevos ingresos, etc.)
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from data_loader import get_novedades

router = APIRouter(prefix="/api/novedades", tags=["Novedades"])

ESTADOS_VALIDOS = {"PENDIENTE", "APROBADA", "RECHAZADA", "INFORMATIVA"}

# Estado en memoria (para demo: se reinicia al reiniciar el servidor)
_estado_novedades: dict[str, str] = {}


def _get_novedad_con_estado(n: dict) -> dict:
    return {
        **n,
        "estadoValidacion": _estado_novedades.get(n["id"], n.get("estadoValidacion", "PENDIENTE")),
    }


@router.get("/")
def listar_novedades(
    tipo: Optional[str] = Query(None, description="FIN_CONTRATO | CAMBIO_JORNADA | NUEVO_INGRESO …"),
    estado: Optional[str] = Query(None, description="PENDIENTE | APROBADA | RECHAZADA"),
    instituto: Optional[str] = Query(None),
    persona_id: Optional[int] = Query(None, alias="personaId"),
):
    """Lista todas las novedades detectadas por el bot, con filtros opcionales."""
    novedades = [_get_novedad_con_estado(n) for n in get_novedades()]

    if tipo:
        novedades = [n for n in novedades if n.get("tipoCambio") == tipo]
    if estado:
        novedades = [n for n in novedades if n.get("estadoValidacion") == estado]
    if instituto:
        novedades = [n for n in novedades if n.get("instituto") == instituto]
    if persona_id:
        novedades = [n for n in novedades if n.get("personaId") == persona_id]

    pendientes = sum(1 for n in novedades if n.get("estadoValidacion") == "PENDIENTE")
    return {
        "total": len(novedades),
        "pendientes": pendientes,
        "novedades": novedades,
    }


@router.get("/tipos")
def tipos_novedad():
    """Lista de tipos únicos de novedad presentes en los datos."""
    novedades = get_novedades()
    tipos = sorted({n.get("tipoCambio", "") for n in novedades if n.get("tipoCambio")})
    return {"tipos": tipos}


@router.get("/{novedad_id}")
def detalle_novedad(novedad_id: str):
    """Detalle de una novedad específica."""
    n = next((n for n in get_novedades() if n["id"] == novedad_id), None)
    if not n:
        raise HTTPException(status_code=404, detail="Novedad no encontrada")
    return _get_novedad_con_estado(n)


@router.patch("/{novedad_id}/estado")
def actualizar_estado_novedad(novedad_id: str, body: dict):
    """
    Actualiza el estado de validación de una novedad.
    Body: { "estado": "APROBADA" | "RECHAZADA" }
    (Simulado en memoria; en producción, persiste en BD.)
    """
    nuevo_estado = body.get("estado", "")
    if nuevo_estado not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=422,
            detail=f"Estado inválido. Valores permitidos: {', '.join(ESTADOS_VALIDOS)}"
        )
    n = next((n for n in get_novedades() if n["id"] == novedad_id), None)
    if not n:
        raise HTTPException(status_code=404, detail="Novedad no encontrada")
    _estado_novedades[novedad_id] = nuevo_estado
    return {"novedad_id": novedad_id, "estadoValidacion": nuevo_estado, "ok": True}
