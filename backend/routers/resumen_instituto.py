"""
routers/resumen_instituto.py
Endpoints de resumen agregado por instituto y periodo.
Alimenta el Dashboard y la vista de Planificación.
"""
from fastapi import APIRouter, Query
from typing import Optional
from data_loader import get_resumen_instituto, get_resultados, get_meta

router = APIRouter(prefix="/api/resumen-instituto", tags=["Resumen Instituto"])


@router.get("/")
def listar_resumen(
    instituto: Optional[str] = Query(None, description="Código de instituto, ej. 'San'"),
    periodo: Optional[str] = Query(None, description="Periodo YYYY-MM-DD"),
):
    """Lista de filas de resumen por instituto y periodo."""
    datos = get_resumen_instituto()
    if instituto:
        datos = [d for d in datos if d["instituto"] == instituto]
    if periodo:
        datos = [d for d in datos if d["periodo"] == periodo]
    return {"total": len(datos), "resumen": datos}


# UTILIZAR ESTE ARCHIVO SOLO COMO MODULO DE REEMPLAZO DE FUNCION via aplicar_cambios.py
@router.get("/nacional")
def resumen_nacional():
    """KPIs del último mes + sumas de los meses realmente procesados.

    NO se extrapolan automáticamente los meses futuros ni se confunden atenciones con FOJA.
    """
    datos = get_resumen_instituto()
    resultados = get_resultados()
    periodos = sorted({d['periodo'] for d in datos})
    ultimo = periodos[-1] if periodos else None
    recientes = [d for d in datos if d['periodo'] == ultimo]
    resultados_recientes = [r for r in resultados
                           if r.get('periodo') == ultimo and r.get('estado') == 'COMPLETADO'
                           and r.get('pctDirecto') is not None and r.get('horasContrato') is not None]
    denominador = sum(r['horasContrato'] for r in resultados_recientes)
    numerador = sum(r['horasContrato'] * r['pctDirecto'] for r in resultados_recientes)
    # Promedio ponderado sobre las jornadas calculadas (sin contar las excepciones como FOJA=0).
    foja = round(100 * numerador / denominador, 1) if denominador else 0
    acumuladas = sum(d.get('atencionesTotal', 0) for d in datos)
    metas = sum(d.get('metaGestion', 0) for d in datos)
    return {
        'periodoUltimo': ultimo,
        'periodosProcesados': len(periodos),
        'institutosContabilizados': len({d['instituto'] for d in recientes}),
        'profesionales': sum(d.get('profesionales',0) for d in recientes),
        'horasSemanalesTotales': sum(d.get('horasContrato',0) for d in recientes),
        'atencionesUltimoPeriodo': sum(d.get('atencionesTotal',0) for d in recientes),
        'atencionesDirectas': sum(d.get('atencionesDirectas',0) for d in recientes),
        'atencionesIndirectas': sum(d.get('atencionesIndirectas',0) for d in recientes),
        'metaGestionUltimoPeriodo': sum(d.get('metaGestion',0) for d in recientes),
        'atencionesAcumuladas': acumuladas,
        'metaGestionAcumulada': metas,
        # Campos de compatibilidad: mismo total acumulado, NO proyección a 12 meses.
        'atencionesAnualesProyectadas': acumuladas,
        'metaGestionNacional': metas,
        'fojaPromedioNacional': foja,
        'excepciones': sum(d.get('excepciones',0) for d in recientes),
        'datosSimulados': get_meta().get('simulado',True),
    }


@router.get("/por-instituto")
def por_instituto(periodo: Optional[str] = Query(None)):
    """
    Agrega por instituto para el gráfico de barras del Dashboard.
    """
    datos = get_resumen_instituto()
    if periodo:
        datos = [d for d in datos if d["periodo"] == periodo]

    agrupado: dict[str, dict] = {}
    for d in datos:
        key = d["instituto"]
        if key not in agrupado:
            agrupado[key] = {
                "instituto": key,
                "nombre": d.get("institutoNombre", key),
                "atenciones": 0,
                "metaGestion": 0,
                "profesionales": 0,
                "excepciones": 0,
            }
        agrupado[key]["atenciones"] += d.get("atencionesTotal", 0)
        agrupado[key]["metaGestion"] += d.get("metaGestion", 0)
        agrupado[key]["profesionales"] += d.get("profesionales", 0)
        agrupado[key]["excepciones"] += d.get("excepciones", 0)

    result = sorted(agrupado.values(), key=lambda x: x["atenciones"], reverse=True)
    return {"institutos": result}


@router.get("/por-periodo")
def por_periodo(instituto: Optional[str] = Query(None)):
    """
    Evolución temporal de atenciones/meta para un instituto o para todos.
    """
    datos = get_resumen_instituto()
    if instituto:
        datos = [d for d in datos if d["instituto"] == instituto]

    agrupado: dict[str, dict] = {}
    for d in datos:
        key = d["periodo"]
        if key not in agrupado:
            agrupado[key] = {
                "periodo": key,
                "atenciones": 0,
                "metaGestion": 0,
                "profesionales": 0,
            }
        agrupado[key]["atenciones"] += d.get("atencionesTotal", 0)
        agrupado[key]["metaGestion"] += d.get("metaGestion", 0)
        agrupado[key]["profesionales"] += d.get("profesionales", 0)

    result = sorted(agrupado.values(), key=lambda x: x["periodo"])
    return {"evolucion": result}
