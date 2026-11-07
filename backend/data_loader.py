"""
data_loader.py
Carga el mockDataActualizado.json una sola vez en memoria.
Cuando llegue la API real de Blue Prism, sólo se reemplaza esta capa.
"""
import json
import os
from pathlib import Path

_BASE = Path(__file__).parent.parent  # raíz del proyecto
_MOCK_PATH = _BASE / "mockDataActualizado.json"

def _load() -> dict:
    with open(_MOCK_PATH, encoding="utf-8") as f:
        return json.load(f)

# Singleton: se carga una sola vez al importar el módulo
_data = _load()

def get_meta() -> dict:
    return _data["meta"]

def get_ejecuciones() -> list:
    return _data["ejecuciones"]

def get_resultados() -> list:
    return _data["resultados"]

def get_novedades() -> list:
    return _data["novedades"]

def get_resumen_instituto() -> list:
    return _data["resumenInstituto"]
