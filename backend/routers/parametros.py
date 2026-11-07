"""
routers/parametros.py
Endpoints de parámetros del bot (minutos estándar, meta de gestión, etc.)
En memoria para el demo.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/api/parametros", tags=["Parámetros"])

# Parámetros base copiados del Parametros_Bot.xlsx (simulados)
_parametros = {
    "metaGestionPct": 0.90,
    "archivo": "Parametros_Bot.xlsx",
    "minutosEstandarPorCargo": {
        "MEDICO FISIATRA": {"directa": 50, "indirecta": 15},
        "KINESIOLOGO": {"directa": 60, "indirecta": 20},
        "TERAPEUTA OCUPACIONAL": {"directa": 60, "indirecta": 20},
        "FONOAUDIOLOGO": {"directa": 50, "indirecta": 15},
        "PSICOLOGO": {"directa": 50, "indirecta": 15},
        "ASISTENTE SOCIAL": {"directa": 60, "indirecta": 20},
        "MEDICO GENERAL": {"directa": 20, "indirecta": 10},
        "NUTRICIONISTA": {"directa": 45, "indirecta": 15},
        "EDUCADOR DIFERENCIAL": {"directa": 60, "indirecta": 20},
    },
    "tramosJornada": [
        {"tramo": "< 22h", "pctDirecto": 0.55, "pctIndirecto": 0.10},
        {"tramo": "22-39h", "pctDirecto": 0.60, "pctIndirecto": 0.15},
        {"tramo": ">= 40h", "pctDirecto": 0.65, "pctIndirecto": 0.20},
    ],
}

_historial: list[dict] = []


class ParametroUpdate(BaseModel):
    campo: str
    valor: float = Field(gt=0)
    justificacion: str = Field(min_length=5)
    responsable: Optional[str] = None


@router.get("/")
def obtener_parametros():
    """Devuelve la configuración actual del bot."""
    return _parametros


@router.get("/historial")
def historial_cambios():
    """Historial de cambios de parámetros (trazabilidad)."""
    return {"total": len(_historial), "historial": _historial}


@router.patch("/meta-gestion")
def actualizar_meta_gestion(body: ParametroUpdate):
    """
    Actualiza el % de meta de gestión asistencial.
    El cambio se registra en el historial de trazabilidad.
    """
    global _parametros
    if body.campo != "metaGestionPct":
        raise HTTPException(status_code=422, detail="Solo se puede actualizar 'metaGestionPct' en este endpoint.")
    if not 0.5 <= body.valor <= 1.0:
        raise HTTPException(status_code=422, detail="El valor debe estar entre 0.5 y 1.0 (50%-100%)")

    anterior = _parametros["metaGestionPct"]
    _parametros["metaGestionPct"] = body.valor
    from datetime import datetime
    _historial.append({
        "campo": "metaGestionPct",
        "valorAnterior": anterior,
        "valorNuevo": body.valor,
        "justificacion": body.justificacion,
        "responsable": body.responsable or "sistema",
        "timestamp": datetime.now().isoformat(),
    })
    return {"metaGestionPct": body.valor, "mensaje": "Parámetro actualizado correctamente."}
