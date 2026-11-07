"""Datos para las rutas FastAPI.

Usa el último Resultados_*.xlsx cuando está disponible. Si no hay Excel,
conserva el mock de demostración para que la aplicación siga arrancando.
Las novedades siguen siendo simuladas porque ese archivo no lo entrega el bot.
"""
import json
from pathlib import Path
from zipfile import BadZipFile
import threading

from blueprism_excel import buscar_ultimo_resultado, importar_archivo

_RAIZ = Path(__file__).resolve().parent.parent
_MOCK = json.loads((_RAIZ / 'mockDataActualizado.json').read_text(encoding='utf-8'))
_cache = _MOCK
_cache_key = None
_error_importacion = None
_bloqueo = threading.Lock()


def _datos():
    global _cache, _cache_key, _error_importacion
    actual = buscar_ultimo_resultado()
    if actual is None:
        with _bloqueo:
            _cache, _cache_key, _error_importacion = _MOCK, None, None
        return _MOCK
    signature = (str(actual), actual.stat().st_size, actual.stat().st_mtime_ns)
    with _bloqueo:
        if signature != _cache_key:
            try:
                importado = importar_archivo(actual)
                # El bot aún no genera novedades: conservar SOLO ese módulo como demo.
                importado['novedades'] = _MOCK['novedades']
                importado['meta']['conteos']['novedades'] = len(_MOCK['novedades'])
                _cache, _cache_key, _error_importacion = importado, signature, None
            except (OSError, ValueError, KeyError, BadZipFile, EOFError) as exc:
                # Mantiene último snapshot válido si el Excel aún se está copiando.
                _error_importacion = f'No se pudo importar {actual.name}: {exc}'
        return _cache


def get_meta():
    datos = _datos()
    meta = dict(datos['meta'])
    if _error_importacion:
        meta['errorImportacion'] = _error_importacion
    return meta


def get_ejecuciones(): return _datos()['ejecuciones']
def get_resultados(): return _datos()['resultados']
def get_novedades(): return _datos()['novedades']
def get_resumen_instituto(): return _datos()['resumenInstituto']
