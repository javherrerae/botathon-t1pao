"""
routers/asignaciones.py
Endpoints de asignaciones especiales (NAS).
En memoria para el demo; en producción se persiste en BD.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from data_loader import get_resultados

router = APIRouter(prefix="/api/asignaciones", tags=["Asignaciones Especiales"])

# ---------------------------------------------------------------------------
# Catálogos (replicados del mockAsignaciones.js del frontend)
# ---------------------------------------------------------------------------
TIPOS_ASIGNACION = [
    {"id": "LIDER_EQUIPO",      "nombre": "Líder de equipo",                      "horasSemanales": 2,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "INVESTIGACION",     "nombre": "Investigación (aprobada por CEC)",     "horasSemanales": 2,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "TUTOR_DOCENTE",     "nombre": "Tutor docente",                        "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "COORD_DOCENTE",     "nombre": "Coordinador docente",                  "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "RESP_TECNICO",      "nombre": "Responsable técnico (voluntariado)",   "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "CASA_ACOGIDA_SCL",  "nombre": "Casa de acogida Santiago",             "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "WEEFIM_LOCAL",      "nombre": "Coordinación WeeFIM (Local) por IT",   "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "GMFM_LOCAL",        "nombre": "GMFM (Local) por IT",                  "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "TETCA_UTA_LOCAL",   "nombre": "Coordinación Tetca/Tetco/UTA (Local)", "horasSemanales": 1,    "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "COMITE_PARITARIO",  "nombre": "Comité paritario",                     "horasSemanales": 0.5, "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "MESA_SSYC",         "nombre": "Mesas técnicas SSYC",                  "horasSemanales": 0.5, "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "MESA_SDM",          "nombre": "Mesas técnicas SDM",                   "horasSemanales": 0.5, "definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "CEA",               "nombre": "CEA",                                  "horasSemanales": 0.25,"definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "REUNION_SINDICAL",  "nombre": "Reunión sindical (dentro de contrato)","horasSemanales": 0.25,"definidoPor": "FIJO",   "requiereAutorizacion": False},
    {"id": "WEEFIM_NACIONAL",   "nombre": "Coordinación nacional WeeFIM",         "horasSemanales": None,"definidoPor": "DMN",    "requiereAutorizacion": True},
    {"id": "CAPACITACION",      "nombre": "Capacitación",                         "horasSemanales": None,"definidoPor": "DMN",    "requiereAutorizacion": True},
    {"id": "ACREDITACION",      "nombre": "Acreditación",                         "horasSemanales": None,"definidoPor": "DMN",    "requiereAutorizacion": True},
    {"id": "DOCENCIA_DMN",      "nombre": "Docencia DMN",                         "horasSemanales": None,"definidoPor": "DMN",    "requiereAutorizacion": True},
    {"id": "ATENCIONES_OTRO_IT","nombre": "Atenciones otro IT",                   "horasSemanales": None,"definidoPor": "DMN_GP", "requiereAutorizacion": True},
    {"id": "COORD_CASA_ACOGIDA","nombre": "Coordinación casa acogida",            "horasSemanales": None,"definidoPor": "DMN_GP", "requiereAutorizacion": True},
    {"id": "DIRIGENTE_SINDICAL","nombre": "Dirigente sindical",                   "horasSemanales": None,"definidoPor": "GP",     "requiereAutorizacion": False},
    {"id": "COORD_KINE",        "nombre": "Coordinador kinesiología",             "horasSemanales": None,"definidoPor": "GP",     "requiereAutorizacion": False},
    {"id": "DESARROLLO_TECNICO","nombre": "Desarrollo técnico",                   "horasSemanales": None,"definidoPor": "GP",     "requiereAutorizacion": False},
]

REGLAS = {
    "umbralHorasSemanales": 30,
    "maxAsignacionesSobreUmbral": 2,
}

# Almacén en memoria
_asignaciones: list[dict] = [
    {"id": "ASG-001", "personaId": 900001, "tipoId": "LIDER_EQUIPO", "horasSemanales": 2,
     "vigenciaDesde": "2026-01-01", "vigenciaHasta": "2026-12-31",
     "justificacion": "Liderazgo de equipo de fisiatría", "estado": "REGISTRADA", "responsableAutorizacion": None},
]
_contador_id = 1


def _get_tipo(tipo_id: str) -> Optional[dict]:
    return next((t for t in TIPOS_ASIGNACION if t["id"] == tipo_id), None)


def _horas_contrato(persona_id: int) -> float:
    datos = get_resultados()
    registros = [r for r in datos if r["personaId"] == persona_id]
    return registros[-1]["horasContrato"] if registros else 0


# ---------------------------------------------------------------------------
# Schemas Pydantic
# ---------------------------------------------------------------------------
class AsignacionCreate(BaseModel):
    personaId: int
    tipoId: str
    horasSemanales: float = Field(gt=0)
    vigenciaDesde: date
    vigenciaHasta: date
    justificacion: str = Field(min_length=5)


class EstadoUpdate(BaseModel):
    estado: str  # APROBADA | RECHAZADA | PENDIENTE | REGISTRADA


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.get("/tipos")
def listar_tipos():
    """Catálogo de tipos de asignación especial."""
    return {"tipos": TIPOS_ASIGNACION, "reglas": REGLAS}


@router.get("/")
def listar_asignaciones(personaId: Optional[int] = None):
    """Lista todas las asignaciones especiales, o filtra por profesional."""
    global _asignaciones
    result = _asignaciones
    if personaId:
        result = [a for a in result if a["personaId"] == personaId]
    return {"total": len(result), "asignaciones": result}


@router.post("/", status_code=201)
def registrar_asignacion(body: AsignacionCreate):
    """
    Registra una nueva asignación especial.
    Aplica la regla de máximo 2 asignaciones para >30 h/s.
    """
    global _asignaciones, _contador_id

    tipo = _get_tipo(body.tipoId)
    if not tipo:
        raise HTTPException(status_code=422, detail="Tipo de asignación no válido")

    horas = _horas_contrato(body.personaId)
    if horas > REGLAS["umbralHorasSemanales"]:
        existentes = [a for a in _asignaciones if a["personaId"] == body.personaId]
        if len(existentes) >= REGLAS["maxAsignacionesSobreUmbral"]:
            raise HTTPException(
                status_code=422,
                detail=f"El profesional ya tiene {len(existentes)} asignaciones. "
                       f"Máximo {REGLAS['maxAsignacionesSobreUmbral']} para jornadas >30 h/s."
            )

    _contador_id += 1
    nueva = {
        "id": f"ASG-{str(_contador_id).zfill(3)}",
        "personaId": body.personaId,
        "tipoId": body.tipoId,
        "horasSemanales": body.horasSemanales,
        "vigenciaDesde": str(body.vigenciaDesde),
        "vigenciaHasta": str(body.vigenciaHasta),
        "justificacion": body.justificacion.strip(),
        "estado": "PENDIENTE" if tipo["requiereAutorizacion"] else "REGISTRADA",
        "responsableAutorizacion": tipo["definidoPor"] if tipo["requiereAutorizacion"] else None,
    }
    _asignaciones.append(nueva)
    return nueva


@router.patch("/{asignacion_id}/estado")
def actualizar_estado(asignacion_id: str, body: EstadoUpdate):
    """Aprueba, rechaza o actualiza el estado de una asignación (vista DMN)."""
    global _asignaciones
    asg = next((a for a in _asignaciones if a["id"] == asignacion_id), None)
    if not asg:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    estados_validos = {"REGISTRADA", "PENDIENTE", "APROBADA", "RECHAZADA"}
    if body.estado not in estados_validos:
        raise HTTPException(status_code=422, detail=f"Estado inválido. Valores: {estados_validos}")
    asg["estado"] = body.estado
    return asg
