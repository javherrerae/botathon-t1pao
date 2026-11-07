"""
routers/resultados.py
Endpoints de resultados (planificación por profesional/periodo).
Lógica calculada a partir de lo que genera Blue Prism en mockDataActualizado.
"""
from fastapi import APIRouter, Query
from typing import Optional
from data_loader import get_resultados

router = APIRouter(prefix="/api/resultados", tags=["Resultados"])


def _aplicar_filtros(
    resultados: list,
    instituto: Optional[str],
    cargo: Optional[str],
    periodo: Optional[str],
    persona_id: Optional[int],
    busqueda: Optional[str],
) -> list:
    if persona_id:
        resultados = [r for r in resultados if r["personaId"] == persona_id]
    if instituto:
        resultados = [r for r in resultados if r["instituto"] == instituto or r.get("institutoNombre", "").lower() == instituto.lower()]
    if cargo:
        resultados = [r for r in resultados if r["cargo"].lower() == cargo.lower()]
    if periodo:
        resultados = [r for r in resultados if r["periodo"] == periodo]
    if busqueda:
        q = busqueda.lower()
        resultados = [
            r for r in resultados
            if q in r.get("nombre", "").lower()
            or q in str(r.get("personaId", ""))
            or q in r.get("cargo", "").lower()
        ]
    return resultados


@router.get("/")
def listar_resultados(
    instituto: Optional[str] = Query(None, description="Código o nombre de instituto, ej. 'San' o 'Santiago'"),
    cargo: Optional[str] = Query(None, description="Cargo exacto"),
    periodo: Optional[str] = Query(None, description="Periodo YYYY-MM-DD"),
    persona_id: Optional[int] = Query(None, alias="personaId"),
    busqueda: Optional[str] = Query(None, description="Texto libre: nombre o ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500, alias="pageSize"),
):
    """
    Lista paginada de resultados individuales del bot.
    Soporta filtros por instituto, cargo, periodo, personaId y búsqueda de texto.
    """
    datos = get_resultados()
    filtrados = _aplicar_filtros(datos, instituto, cargo, periodo, persona_id, busqueda)
    total = len(filtrados)
    inicio = (page - 1) * page_size
    pagina = filtrados[inicio: inicio + page_size]
    return {
        "total": total,
        "page": page,
        "pageSize": page_size,
        "pages": (total + page_size - 1) // page_size,
        "resultados": pagina,
    }


@router.get("/profesionales")
def listar_profesionales(
    instituto: Optional[str] = Query(None),
    cargo: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
):
    """
    Lista de profesionales únicos (último periodo disponible).
    Usado para selector de profesional en asignaciones especiales.
    """
    datos = get_resultados()
    # Tomamos el registro más reciente por profesional
    por_persona: dict[int, dict] = {}
    for r in datos:
        pid = r["personaId"]
        if pid not in por_persona or r["periodo"] > por_persona[pid]["periodo"]:
            por_persona[pid] = r

    profesionales = list(por_persona.values())

    if instituto:
        profesionales = [p for p in profesionales if p["instituto"] == instituto or p.get("institutoNombre", "").lower() == instituto.lower()]
    if cargo:
        profesionales = [p for p in profesionales if p["cargo"].lower() == cargo.lower()]
    if busqueda:
        q = busqueda.lower()
        profesionales = [
            p for p in profesionales
            if q in p.get("nombre", "").lower() or q in str(p.get("personaId", ""))
        ]

    return {
        "total": len(profesionales),
        "profesionales": [
            {
                "personaId": p["personaId"],
                "nombre": p["nombre"],
                "instituto": p.get("institutoNombre", p["instituto"]),
                "institutoCode": p["instituto"],
                "cargo": p["cargo"],
                "horasContrato": p["horasContrato"],
                "tramoJornada": p["tramoJornada"],
                "fojaPct": p["fojaPct"],
            }
            for p in profesionales
        ],
    }


@router.get("/profesionales/{persona_id}")
def detalle_profesional(persona_id: int):
    """
    Todos los periodos de un profesional con sus atenciones, meta, FOJA.
    """
    datos = get_resultados()
    registros = [r for r in datos if r["personaId"] == persona_id]
    if not registros:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    registros.sort(key=lambda x: x["periodo"])
    return {
        "personaId": persona_id,
        "nombre": registros[0]["nombre"],
        "cargo": registros[0]["cargo"],
        "instituto": registros[0].get("institutoNombre", registros[0]["instituto"]),
        "horasContrato": registros[0]["horasContrato"],
        "tramoJornada": registros[0]["tramoJornada"],
        "periodos": registros,
    }


@router.get("/filtros/opciones")
def opciones_filtros():
    """Devuelve listas únicas de institutos, cargos y periodos disponibles."""
    datos = get_resultados()
    institutos = sorted({(r["instituto"], r.get("institutoNombre", r["instituto"])) for r in datos}, key=lambda x: x[1])
    cargos = sorted({r["cargo"] for r in datos})
    periodos = sorted({r["periodo"] for r in datos})
    return {
        "institutos": [{"codigo": i[0], "nombre": i[1]} for i in institutos],
        "cargos": cargos,
        "periodos": periodos,
    }
