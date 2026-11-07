"""
data_loader.py — Única puerta de entrada a los datos para todos los routers.

Dos fuentes, elegidas con FUENTE_DATOS en backend/.env:
  - "postgres": datos REALES del bot, importados a PostgreSQL (última ejecución).
  - "mock":     plan B, mockDataActualizado.json (datos simulados).

Ambas devuelven EXACTAMENTE la misma forma de datos, por eso los routers y el
frontend no cambian al pasar de una fuente a otra.

Los datos se cachean en memoria y se recargan con recargar() (lo llama el
importador después de cada importación).
"""
import json
from decimal import Decimal
from pathlib import Path

from db import FUENTE_DATOS

_MOCK_PATH = Path(__file__).resolve().parent.parent / "mockDataActualizado.json"
_cache: dict | None = None


# ---------------------------------------------------------------------------
# Fuente mock (plan B)
# ---------------------------------------------------------------------------
def _cargar_mock() -> dict:
    with open(_MOCK_PATH, encoding="utf-8") as f:
        datos = json.load(f)
    datos.setdefault("multiInstituto", [])
    datos["meta"]["fuente"] = "mock"
    return datos


# ---------------------------------------------------------------------------
# Fuente PostgreSQL
# ---------------------------------------------------------------------------
def _num(v):
    """NUMERIC de PostgreSQL llega como Decimal: se convierte a int/float para JSON y sumas."""
    if isinstance(v, Decimal):
        return int(v) if v == v.to_integral_value() else float(v)
    return v


def _fecha(v):
    return v.isoformat() if v is not None else None


def _cargar_postgres() -> dict:
    from db import consultar

    ultima = consultar("SELECT * FROM v_ultima_ejecucion")
    ejecucion_actual = ultima[0] if ultima else None

    resultados = [{
        "clave": r["clave_anon"],
        "personaId": r["persona_anon"],
        "nombre": r["nombre"],
        "it": r["it"],
        "instituto": r["instituto"],
        "institutoNombre": r["instituto_nombre"],
        "cargo": r["cargo"],
        "periodo": _fecha(r["periodo"]),
        "tipoContrato": None,
        "fechaTermino": None,
        "horasContrato": _num(r["horas_contrato"]),
        "tramoJornada": r["tramo_jornada"],
        "pctDirecto": _num(r["pct_directo"]),
        "pctIndirecto": _num(r["pct_indirecto"]),
        "semanasHabiles": _num(r["semanas_habiles"]),
        "atencionesDirectas": r["atenciones_directas"],
        "atencionesIndirectas": r["atenciones_indirectas"],
        "atencionesTotal": r["atenciones_total"],
        "metaGestion": _num(r["meta_gestion"]),
        "fojaPct": round(float(r["pct_directo"]) * 100, 1) if r["pct_directo"] is not None else None,
        "estado": r["estado"],
        "motivo": r["motivo"],
    } for r in consultar("SELECT * FROM v_resultados ORDER BY persona_anon, periodo")]

    # Errores de TODAS las ejecuciones (historial de Monitoreo), anonimizados.
    errores_por_ejec: dict[str, list] = {}
    for e in consultar(
        """SELECT r.ejecucion_id, p.persona_anon, r.instituto, r.periodo, r.motivo,
                  p.persona_anon::text || '_' || to_char(r.periodo, 'YYYYMM') AS clave_anon
           FROM resultados r JOIN personas_anon p ON p.persona_id_real = r.persona_id_real
           WHERE r.estado = 'EXCEPCION' ORDER BY r.ejecucion_id, p.persona_anon, r.periodo"""):
        errores_por_ejec.setdefault(e["ejecucion_id"], []).append({
            "clave": e["clave_anon"], "personaId": e["persona_anon"], "instituto": e["instituto"],
            "periodo": _fecha(e["periodo"]), "tipo": "Business Exception", "motivo": e["motivo"]})

    ejecuciones = [{
        "ejecucionId": e["ejecucion_id"],
        "archivo": e["archivo"],
        "fuente": e["fuente"],
        "fechaHora": e["fecha_hora"].isoformat(timespec="seconds"),
        "importadoEn": e["importado_en"].isoformat(timespec="seconds"),
        "estado": e["estado"],
        "totalRegistros": e["total_registros"],
        "validos": e["validos"],
        "rechazados": e["rechazados"],
        "errores": errores_por_ejec.get(e["ejecucion_id"], []),
    } for e in consultar("SELECT * FROM ejecuciones ORDER BY fecha_hora DESC, importado_en DESC")]

    resumen = [{
        "it": r["it"], "instituto": r["instituto"], "institutoNombre": r["instituto_nombre"],
        "periodo": _fecha(r["periodo"]), "profesionales": r["profesionales"],
        "horasContrato": _num(r["horas_contrato"]), "horasDirectas": _num(r["horas_directas"]) or 0,
        "atencionesDirectas": _num(r["atenciones_directas"]), "atencionesIndirectas": _num(r["atenciones_indirectas"]),
        "atencionesTotal": _num(r["atenciones_total"]), "metaGestion": _num(r["meta_gestion"]),
        "registros": r["registros"], "excepciones": r["excepciones"],
    } for r in consultar("SELECT * FROM v_resumen_instituto ORDER BY it, periodo")]

    novedades = [{
        "id": n["id"], "personaId": n["persona_anon"], "tipoCambio": n["tipo_cambio"],
        "valorAnterior": n["valor_anterior"], "valorNuevo": n["valor_nuevo"],
        "fechaVigencia": _fecha(n["fecha_vigencia"]), "instituto": n["instituto"],
        "estadoValidacion": n["estado_validacion"], "simulado": n["simulado"],
    } for n in consultar("SELECT * FROM novedades ORDER BY id")]

    multi = [{
        "personaId": m["persona_anon"], "cargo": m["cargo"], "periodo": _fecha(m["periodo"]),
        "horasContrato": _num(m["horas_contrato"]), "institutoContrato": m["instituto_contrato"],
        "distribucion": m["distribucion"], "sumaDistribucion": _num(m["suma_distribucion"]),
        "diferencia": _num(m["diferencia"]), "estado": m["estado"], "motivo": m["motivo"],
        "simulado": m["simulado"],
    } for m in consultar("SELECT * FROM multi_instituto ORDER BY persona_anon, periodo")]

    periodos = sorted({r["periodo"] for r in resultados})
    return {
        "meta": {
            "simulado": False,
            "fuente": "postgres",
            "descripcion": "Datos reales entregados por el bot Blue Prism (última ejecución importada). IDs anonimizados.",
            "generado": ejecucion_actual["importado_en"].isoformat(timespec="seconds") if ejecucion_actual else None,
            "ejecucionId": ejecucion_actual["ejecucion_id"] if ejecucion_actual else None,
            "novedadesSimuladas": any(n["simulado"] for n in novedades),
            "multiInstitutoSimulado": any(m["simulado"] for m in multi),
            "periodos": periodos,
            "conteos": {
                "resultados": len(resultados),
                "profesionales": len({r["personaId"] for r in resultados}),
                "errores": sum(r["estado"] == "EXCEPCION" for r in resultados),
                "novedades": len(novedades),
                "resumenInstituto": len(resumen),
                "multiInstituto": len(multi),
                "ejecuciones": len(ejecuciones),
            },
        },
        "ejecuciones": ejecuciones,
        "resultados": resultados,
        "novedades": novedades,
        "resumenInstituto": resumen,
        "multiInstituto": multi,
    }


# ---------------------------------------------------------------------------
# API pública (la usan los routers)
# ---------------------------------------------------------------------------
def _datos() -> dict:
    global _cache
    if _cache is None:
        _cache = _cargar_postgres() if FUENTE_DATOS == "postgres" else _cargar_mock()
    return _cache


def recargar() -> None:
    """Vacía la caché; la próxima consulta lee de nuevo la fuente."""
    global _cache
    _cache = None


def get_meta() -> dict:
    return _datos()["meta"]

def get_ejecuciones() -> list:
    return _datos()["ejecuciones"]

def get_resultados() -> list:
    return _datos()["resultados"]

def get_novedades() -> list:
    return _datos()["novedades"]

def get_resumen_instituto() -> list:
    return _datos()["resumenInstituto"]

def get_multi_instituto() -> list:
    return _datos().get("multiInstituto", [])
