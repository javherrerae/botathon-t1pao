"""Pruebas offline del importador. No necesita Blue Prism ni backend encendido.

Ejemplo desde la raíz del repositorio:
  backend\\.venv\\Scripts\\python.exe -m unittest discover -s backend/tests -v
"""
import os
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from blueprism_excel import importar_archivo, buscar_ultimo_resultado


class TestBluePrismExcel(unittest.TestCase):
    def setUp(self):
        archivo = os.environ.get('BLUEPRISM_ARCHIVO_PRUEBA')
        self.archivo = Path(archivo) if archivo else buscar_ultimo_resultado()
        if self.archivo is None or not self.archivo.exists():
            self.skipTest('Coloca Resultados_*.xlsx en backend/entrada_blueprism')

    def test_tamaños_y_totales(self):
        data = importar_archivo(self.archivo, secreto=b'secreto-temporal-solo-tests')
        e = data['ejecuciones'][0]
        self.assertEqual(e['totalRegistros'], len(data['resultados']))
        self.assertEqual(e['validos'] + e['rechazados'], e['totalRegistros'])
        if self.archivo.name == 'Resultados_20261107_0843.xlsx':
            self.assertEqual((e['totalRegistros'], e['validos'], e['rechazados']), (3123, 2891, 232))
            self.assertEqual(sum(r['atencionesTotal'] or 0 for r in data['resultados']), 511769)
            self.assertEqual(sum(r['atencionesDirectas'] or 0 for r in data['resultados']), 405698)
            self.assertEqual(len({r['personaId'] for r in data['resultados']}), 462)

    def test_no_publica_persona_id_original(self):
        data = importar_archivo(self.archivo, secreto=b'secreto-temporal-solo-tests')
        self.assertTrue(all(r['personaId'] >= 900_000_000_000 for r in data['resultados']))
        self.assertTrue(all(r['clave'].startswith(str(r['personaId'])) for r in data['resultados']))
        self.assertFalse(any(r['tramoJornada'] is not None or r['atencionesTotal'] is not None
                             for r in data['resultados'] if r['estado']=='EXCEPCION'))

    def test_importacion_repetible(self):
        uno = importar_archivo(self.archivo, secreto=b'secreto-temporal-solo-tests')
        dos = importar_archivo(self.archivo, secreto=b'secreto-temporal-solo-tests')
        self.assertEqual(uno['meta']['conteos'], dos['meta']['conteos'])
        self.assertEqual(uno['resultados'][0]['clave'], dos['resultados'][0]['clave'])
        self.assertEqual(len({r['clave'] for r in uno['resultados']}), len(uno['resultados']))


if __name__ == '__main__': unittest.main()
