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


# Excepciones de distribución multi-instituto: persistencia JSON temporal (sin BD).
from pathlib import Path
import json
from pydantic import BaseModel, Field, model_validator

MULTI_PATH = Path(__file__).resolve().parents[1] / "excepciones_multi_instituto.json"

class Distribucion(BaseModel):
    instituto: str = Field(min_length=2)
    horas: float = Field(ge=0)

class ExcepcionMultiInstituto(BaseModel):
    personaId: int = Field(gt=0)
    cargo: str = Field(min_length=2)
    periodoId: str = Field(pattern=r"^(ENE-ABR|MAY-DIC)$")
    horasContrato: float = Field(gt=0)
    distribucion: list[Distribucion] = Field(min_length=2)
    observaciones: str = ""
    @model_validator(mode="after")
    def validar_suma(self):
        nombres=[x.instituto.strip().casefold() for x in self.distribucion]
        if len(nombres)!=len(set(nombres)): raise ValueError("No repitas institutos dentro del mismo periodo")
        if sum(x.horas for x in self.distribucion)>self.horasContrato+1e-8: raise ValueError("La distribución supera las horas del contrato")
        return self

def _multi_leer():
    if MULTI_PATH.exists(): return json.loads(MULTI_PATH.read_text(encoding="utf-8"))
    return []

def _multi_guardar(rows):
    MULTI_PATH.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding="utf-8")

@router.get("/multi-instituto")
def listar_multi_instituto():
    rows=_multi_leer()
    return {"total":len(rows),"excepciones":rows,"simulado":True}

@router.post("/multi-instituto")
def crear_multi_instituto(body: ExcepcionMultiInstituto):
    rows=_multi_leer()
    if any(x["personaId"]==body.personaId and x["periodoId"]==body.periodoId for x in rows):
        raise HTTPException(409,detail="Ya existe una distribución para esa persona y periodo")
    row=body.model_dump()
    row["id"]=f"EXC-{body.personaId}-{body.periodoId}"
    row["estado"]="VALIDADA" if abs(sum(x.horas for x in body.distribucion)-body.horasContrato)<1e-8 else "INCOMPLETA"
    rows.append(row); _multi_guardar(rows)
    return {"mensaje":"Excepción registrada","excepcion":row,"simulado":True}

@router.delete("/multi-instituto/{excepcion_id}")
def eliminar_multi_instituto(excepcion_id: str):
    rows=_multi_leer(); nuevos=[x for x in rows if x.get("id")!=excepcion_id]
    if len(nuevos)==len(rows): raise HTTPException(404,detail="Excepción no encontrada")
    _multi_guardar(nuevos); return {"mensaje":"Excepción eliminada"}
