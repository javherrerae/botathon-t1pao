"""Comprueba que los KPIs acumulados y FOJA no usan datos SIC inventados."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from routers.resumen_instituto import resumen_nacional

class TestResumenNacional(unittest.TestCase):
    def test_foja_y_totales_sin_extrapolar(self):
        meses = ['2026-01-01','2026-02-01']
        agregados = [{'periodo':p,'instituto':'San','profesionales':1,
            'horasContrato':40,'atencionesTotal':100,'atencionesDirectas':70,
            'atencionesIndirectas':30,'metaGestion':90,'excepciones':0} for p in meses]
        profesionales = [{'periodo':meses[-1],'estado':'COMPLETADO',
            'horasContrato':40,'pctDirecto':0.65}]
        with patch('routers.resumen_instituto.get_resumen_instituto', return_value=agregados), \
             patch('routers.resumen_instituto.get_resultados',return_value=profesionales), \
             patch('routers.resumen_instituto.get_meta',return_value={'simulado':False}):
            result = resumen_nacional()
        self.assertEqual(result['fojaPromedioNacional'],65.0)
        self.assertEqual(result['atencionesAcumuladas'],200)
        self.assertEqual(result['metaGestionAcumulada'],180)
        self.assertEqual(result['periodosProcesados'],2)
        self.assertFalse(result['datosSimulados'])

if __name__=='__main__': unittest.main()
