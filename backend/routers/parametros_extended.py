"""Parámetros de Blue Prism. Sin BD: XLSX local + historial JSON en memoria durante el demo."""
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator, model_validator
import openpyxl
import os

router = APIRouter(prefix="/api/parametros", tags=["Parámetros"])
ROOT = Path(__file__).resolve().parents[2]
EXCEL_PATH = Path(os.getenv("PARAMETROS_BOT_PATH", str(ROOT / "Parametros_Bot.xlsx"))).expanduser().resolve()
MAX_CARGOS = 99
MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

class Tramo(BaseModel):
    pctDirecto: Optional[float] = Field(default=None, ge=0, le=1)
    pctIndirecto: Optional[float] = Field(default=None, ge=0, le=1)
    @model_validator(mode="after")
    def suma(self):
        if (self.pctDirecto or 0) + (self.pctIndirecto or 0) > 1 + 1e-9:
            raise ValueError("Directo + indirecto no puede superar 100 %")
        return self

class Cargo(BaseModel):
    cargo: str = Field(min_length=1)
    stdDirMin: float = Field(gt=0)
    stdIndMin: float = Field(gt=0)
    tramos: Dict[Literal[">= 40h", "22-39h", "< 22h"], Tramo]
    @field_validator("cargo")
    @classmethod
    def limpiar(cls, v): return v.strip()
    @model_validator(mode="after")
    def tramos_completos(self):
        required={">= 40h", "22-39h", "< 22h"}
        if set(self.tramos) != required: raise ValueError("Cada cargo debe incluir los tres tramos")
        return self

class Semana(BaseModel):
    periodo: str = Field(pattern=r"^\d{6}$")
    mes: str
    semanasHabiles: float = Field(gt=0)

class Parametros(BaseModel):
    cargos: List[Cargo]
    semanas: List[Semana]
    metaGestionPct: float = Field(default=0.9, gt=0, le=1)
    version: int = 1
    actualizado: Optional[str] = None
    @model_validator(mode="after")
    def validar_conjunto(self):
        nombres=[c.cargo.strip().casefold() for c in self.cargos]
        if len(nombres) != len(set(nombres)): raise ValueError("No puede haber cargos duplicados")
        if len(self.cargos)>MAX_CARGOS: raise ValueError("El bot admite máximo 99 cargos")
        periodos=[s.periodo for s in self.semanas]
        if len(periodos)!=12 or len(set(periodos))!=12: raise ValueError("Debe haber exactamente 12 periodos únicos")
        if periodos != [f"2026{m:02d}" for m in range(1,13)]: raise ValueError("Los periodos deben cubrir enero a diciembre de 2026")
        return self

HISTORIAL_PATH = ROOT / "parametros_historial.json"
CONFIG_PATH = ROOT / "parametros_config.json"
def _config():
    import json
    try: return json.loads(CONFIG_PATH.read_text(encoding="utf-8")) if CONFIG_PATH.exists() else {"metaGestionPct":0.9,"version":1,"actualizado":None}
    except Exception: return {"metaGestionPct":0.9,"version":1,"actualizado":None}
try:
    _historial: List[Dict[str, Any]] = __import__("json").loads(HISTORIAL_PATH.read_text(encoding="utf-8")) if HISTORIAL_PATH.exists() else []
except Exception:
    _historial = []

def _persistir_historial():
    import json
    HISTORIAL_PATH.write_text(json.dumps(_historial, ensure_ascii=False, indent=2), encoding="utf-8")

def _leer() -> Parametros:
    if not EXCEL_PATH.exists(): raise HTTPException(500, detail=f"No se encuentra {EXCEL_PATH.name}")
    wb=openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    for sheet, headers in {"Cargos":["Cargo","Std_Dir_Min","Std_Ind_Min","Dir_40mas","Ind_40mas","Dir_22a40","Ind_22a40","Dir_menos22","Ind_menos22"],"Semanas":["Periodo","Mes","Semanas_Habiles"]}.items():
        if sheet not in wb.sheetnames: raise HTTPException(500, detail=f"Falta la hoja {sheet}")
        ws=wb[sheet]
        if ws.merged_cells.ranges: raise HTTPException(422, detail=f"No se permiten celdas combinadas en {sheet}")
        if ws.max_column != len(headers): raise HTTPException(422, detail=f"La hoja {sheet} debe tener exactamente {len(headers)} columnas")
        if any(cell.data_type == "f" for row in ws.iter_rows() for cell in row): raise HTTPException(422, detail=f"No se permiten fórmulas en {sheet}")
        actual=[c.value for c in ws[1]]
        if actual != headers: raise HTTPException(500, detail=f"Encabezados incorrectos en hoja {sheet}")
    cargos=[]
    fin_cargos=False
    for row in wb["Cargos"].iter_rows(min_row=2,max_row=100,max_col=9,values_only=True):
        if not any(v is not None for v in row):
            fin_cargos=True
            continue
        if fin_cargos: raise HTTPException(422, detail="No se permiten filas vacías entre cargos")
        if not row[0]: raise HTTPException(422, detail="Hay una fila vacía o cargo sin nombre entre los datos")
        cargos.append({"cargo":str(row[0]).strip(),"stdDirMin":row[1],"stdIndMin":row[2],"tramos":{
            ">= 40h":{"pctDirecto":row[3],"pctIndirecto":row[4]},"22-39h":{"pctDirecto":row[5],"pctIndirecto":row[6]},"< 22h":{"pctDirecto":row[7],"pctIndirecto":row[8]}}})
    semanas=[]
    for i,row in enumerate(wb["Semanas"].iter_rows(min_row=2,max_row=13,max_col=3,values_only=True)):
        periodo,mes,valor=row
        if periodo is None or valor is None: raise HTTPException(422, detail="La hoja Semanas debe contener 12 filas completas")
        periodo=str(periodo).strip()
        mes=MESES[i] if isinstance(mes,(int,float)) else str(mes).strip()
        semanas.append({"periodo":periodo,"mes":mes,"semanasHabiles":valor})
    cfg=_config()
    return Parametros(cargos=cargos,semanas=semanas,metaGestionPct=cfg.get("metaGestionPct",0.9),version=cfg.get("version",1),actualizado=cfg.get("actualizado") or datetime.fromtimestamp(EXCEL_PATH.stat().st_mtime).isoformat(timespec="seconds"))

def _guardar(data: Parametros):
    if EXCEL_PATH.exists(): wb=openpyxl.load_workbook(EXCEL_PATH)
    else: wb=openpyxl.Workbook(); wb.active.title="Cargos"; wb.create_sheet("Semanas"); wb.create_sheet("Fuente")
    ws=wb["Cargos"]
    headers=["Cargo","Std_Dir_Min","Std_Ind_Min","Dir_40mas","Ind_40mas","Dir_22a40","Ind_22a40","Dir_menos22","Ind_menos22"]
    for j,h in enumerate(headers,1): ws.cell(1,j).value=h
    for row in ws.iter_rows(min_row=2,max_row=max(ws.max_row,100),max_col=9):
        for c in row: c.value=None
    for i,c in enumerate(data.cargos,2):
        vals=[c.cargo,c.stdDirMin,c.stdIndMin,c.tramos[">= 40h"].pctDirecto,c.tramos[">= 40h"].pctIndirecto,c.tramos["22-39h"].pctDirecto,c.tramos["22-39h"].pctIndirecto,c.tramos["< 22h"].pctDirecto,c.tramos["< 22h"].pctIndirecto]
        for j,v in enumerate(vals,1): ws.cell(i,j).value=v
    ws=wb["Semanas"]
    for j,h in enumerate(["Periodo","Mes","Semanas_Habiles"],1): ws.cell(1,j).value=h
    for row in ws.iter_rows(min_row=2,max_row=max(ws.max_row,13),max_col=3):
        for c in row: c.value=None
    for i,s in enumerate(data.semanas,2):
        ws.cell(i,1).number_format="@"
        for j,v in enumerate([s.periodo,s.mes,s.semanasHabiles],1): ws.cell(i,j).value=v
    wb.save(EXCEL_PATH)

@router.get("")
def obtener(): return _leer().model_dump()
@router.get("/")
def obtener_slash(): return obtener()
@router.get("/historial")
def historial(): return {"total":len(_historial),"historial":_historial}
@router.put("")
def actualizar(body: Parametros, usuario: str="Administrador", justificacion: str=""):
    if not justificacion.strip(): raise HTTPException(422,detail="La justificación es obligatoria")
    anterior=_leer().model_dump()
    nuevo=body.model_dump(); nuevo["version"]=anterior["version"]+1; nuevo["actualizado"]=datetime.now().isoformat(timespec="seconds")
    data=Parametros(**nuevo)
    _guardar(data)
    import json
    CONFIG_PATH.write_text(json.dumps({"metaGestionPct":data.metaGestionPct,"version":data.version,"actualizado":data.actualizado},ensure_ascii=False,indent=2),encoding="utf-8")
    antes={(c["cargo"],k):v for c in anterior["cargos"] for k,v in c.items() if k!="tramos"}
    ahora={(c["cargo"],k):v for c in nuevo["cargos"] for k,v in c.items() if k!="tramos"}
    for cargo in nuevo["cargos"]:
        old=next((x for x in anterior["cargos"] if x["cargo"].casefold()==cargo["cargo"].casefold()),{})
        for campo,valor in [(k,v) for k,v in cargo.items() if k not in ("cargo","tramos")]+[(f"{t} · {k}",v) for t,vals in cargo["tramos"].items() for k,v in vals.items()]:
            oldval=old.get(campo) if " · " not in campo else old.get("tramos",{}).get(campo.split(" · ")[0],{}).get(campo.split(" · ")[1])
            if oldval!=valor: _historial.insert(0,{"usuario":usuario,"fechaHora":nuevo["actualizado"],"campo":f"{cargo['cargo']} · {campo}","valorAnterior":oldval,"valorNuevo":valor,"justificacion":justificacion,"modulo":"Parámetros"})
    if anterior.get("metaGestionPct") != nuevo.get("metaGestionPct"):
        _historial.insert(0,{"usuario":usuario,"fechaHora":nuevo["actualizado"],"campo":"Meta de gestión","valorAnterior":anterior.get("metaGestionPct"),"valorNuevo":nuevo.get("metaGestionPct"),"justificacion":justificacion,"modulo":"Parámetros"})
    for old,s in zip(anterior["semanas"],nuevo["semanas"]):
        if old["semanasHabiles"]!=s["semanasHabiles"]: _historial.insert(0,{"usuario":usuario,"fechaHora":nuevo["actualizado"],"campo":f"Semanas hábiles {s['periodo']}","valorAnterior":old["semanasHabiles"],"valorNuevo":s["semanasHabiles"],"justificacion":justificacion,"modulo":"Parámetros"})
    _persistir_historial()
    return data.model_dump()
