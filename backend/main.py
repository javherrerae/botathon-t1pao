"""API del MVP Cada Hora Cuenta. Datos mock en memoria; sin BD por ahora."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (asignaciones, ejecuciones, excepciones, novedades,
                     parametros_extended, resultados, resumen_instituto)

app = FastAPI(title="Cada Hora Cuenta – API", version="0.2.0", docs_url="/docs", redoc_url="/redoc")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
for module in (ejecuciones, resultados, novedades, resumen_instituto, asignaciones, excepciones, parametros_extended):
    app.include_router(module.router)

@app.get("/", tags=["Health"])
def root(): return {"status":"ok", "app":"Cada Hora Cuenta API", "version":"0.2.0"}

@app.get("/health", tags=["Health"])
def health():
    from data_loader import get_meta
    meta = get_meta()
    return {"status":"ok", "datosSimulados":meta.get("simulado", True), "generado":meta.get("generado"), "conteos":meta.get("conteos")}
