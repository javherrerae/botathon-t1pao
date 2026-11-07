"""
routers/excepciones.py
Endpoints de excepciones Blue Prism (Business/System Exceptions).
Extrae los errores de la única ejecución disponible en el mock.
"""
from fastapi import APIRouter, Query
from typing import Optional
from data_loader import get_ejecuciones

router = APIRouter(prefix="/api/excepciones", tags=["Excepciones Blue Prism"])


def _todos_los_errores() -> list:
    """Aplana todos los errores de todas las ejecuciones en una sola lista."""
    errores = []
    for ej in get_ejecuciones():
        for e in ej.get("errores", []):
            errores.append({**e, "ejecucionId": ej["ejecucionId"]})
    return errores


@router.get("/")
def listar_excepciones(
    tipo: Optional[str] = Query(None, description="Business Exception | System Exception"),
    instituto: Optional[str] = Query(None),
    persona_id: Optional[int] = Query(None, alias="personaId"),
    motivo: Optional[str] = Query(None, description="Texto libre en el campo 'motivo'"),
):
    """
    Lista todas las excepciones detectadas por Blue Prism.
    Filtra por tipo, instituto, personaId o texto del motivo.
    """
    errores = _todos_los_errores()

    if tipo:
        errores = [e for e in errores if e.get("tipo", "").lower() == tipo.lower()]
    if instituto:
        errores = [e for e in errores if e.get("instituto", "") == instituto]
    if persona_id:
        errores = [e for e in errores if e.get("personaId") == persona_id]
    if motivo:
        q = motivo.lower()
        errores = [e for e in errores if q in e.get("motivo", "").lower()]

    return {
        "total": len(errores),
        "excepciones": errores,
    }


@router.get("/resumen")
def resumen_excepciones():
    """
    Agrupación de excepciones por tipo de error (motivo único).
    Útil para priorizarlas: qué cargos hay que parametrizar primero.
    """
    errores = _todos_los_errores()
    por_motivo: dict[str, dict] = {}
    por_instituto: dict[str, int] = {}

    for e in errores:
        motivo = e.get("motivo", "Sin motivo")
        if motivo not in por_motivo:
            por_motivo[motivo] = {"motivo": motivo, "count": 0, "institutos": set(), "personaIds": set()}
        por_motivo[motivo]["count"] += 1
        por_motivo[motivo]["institutos"].add(e.get("instituto", ""))
        por_motivo[motivo]["personaIds"].add(e.get("personaId"))

        inst = e.get("instituto", "")
        por_instituto[inst] = por_instituto.get(inst, 0) + 1

    resumen_motivo = [
        {
            "motivo": v["motivo"],
            "count": v["count"],
            "institutos": sorted(v["institutos"]),
            "profesionales": len(v["personaIds"]),
        }
        for v in sorted(por_motivo.values(), key=lambda x: -x["count"])
    ]
    resumen_inst = [{"instituto": k, "count": v} for k, v in sorted(por_instituto.items(), key=lambda x: -x[1])]

    return {
        "totalExcepciones": len(errores),
        "porMotivo": resumen_motivo,
        "porInstituto": resumen_inst,
    }
