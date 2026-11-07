"""
routers/resumen_instituto.py
Endpoints de resumen agregado por instituto y periodo.
Alimenta el Dashboard y la vista de Planificación.
"""
from fastapi import APIRouter, Query
from typing import Optional
from data_loader import get_resumen_instituto

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


@router.get("/nacional")
def resumen_nacional():
    """
    KPIs nacionales agregados: horas, atenciones, meta.
    Usado por el Dashboard principal.
    """
    datos = get_resumen_instituto()

    # Tomamos el último periodo disponible para los totales
    periodos = sorted({d["periodo"] for d in datos})
    ultimo_periodo = periodos[-1] if periodos else None
    datos_ultimo = [d for d in datos if d["periodo"] == ultimo_periodo] if ultimo_periodo else datos

    horas_totales = sum(d.get("horasContrato", 0) for d in datos_ultimo)
    atenciones_directas = sum(d.get("atencionesDirectas", 0) for d in datos_ultimo)
    atenciones_indirectas = sum(d.get("atencionesIndirectas", 0) for d in datos_ultimo)
    atenciones_total = sum(d.get("atencionesTotal", 0) for d in datos_ultimo)
    meta_gestion = sum(d.get("metaGestion", 0) for d in datos_ultimo)
    profesionales = sum(d.get("profesionales", 0) for d in datos_ultimo)
    excepciones = sum(d.get("excepciones", 0) for d in datos_ultimo)
    institutos_count = len({d["instituto"] for d in datos_ultimo})

    # Proyección anual = promedio mensual de los periodos procesados × 12.
    # (Antes se tomaba solo el último mes × 12/n, lo que subestimaba el año.)
    periodos_count = len(periodos) if periodos else 1
    atenciones_anuales = round(sum(d.get("atencionesTotal", 0) for d in datos) / periodos_count * 12)
    meta_anual = round(sum(d.get("metaGestion", 0) for d in datos) / periodos_count * 12, 1)

    # FOJA = horas mensuales de atención directa / horas contratadas (definición del Excel).
    # Se calcula con los resultados del bot (registros COMPLETADO del último periodo).
    from data_loader import get_resultados
    ok = [r for r in get_resultados() if r["periodo"] == ultimo_periodo and r["estado"] == "COMPLETADO"]
    horas_ok = sum(r["horasContrato"] for r in ok)
    foja = round(sum(r["horasContrato"] * r["pctDirecto"] for r in ok) / horas_ok * 100, 1) if horas_ok else 0

    return {
        "periodoUltimo": ultimo_periodo,
        "periodosProcesados": periodos_count,
        "institutosContabilizados": institutos_count,
        "profesionales": profesionales,
        "horasSemanalesTotales": horas_totales,
        "atencionesUltimoPeriodo": atenciones_total,
        "atencionesDirectas": atenciones_directas,
        "atencionesIndirectas": atenciones_indirectas,
        "metaGestionUltimoPeriodo": meta_gestion,
        "atencionesAnualesProyectadas": atenciones_anuales,
        "metaGestionNacional": meta_anual,
        "fojaPromedioNacional": foja,
        "excepciones": excepciones,
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
