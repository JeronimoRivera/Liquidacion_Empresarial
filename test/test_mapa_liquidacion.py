import os
import sys

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, SRC)

from model.mapa_liquidacion import MapaLiquidacion


def test_mapa_desglosa_componentes_sin_persistencia():
    resultado = MapaLiquidacion().generar(
        salario_basico=2_000_000,
        fecha_inicio_labores='01/01/2024',
        fecha_salida='01/07/2024',
        dias_acumulados_vacaciones=0,
    )

    assert len(resultado['componentes']) == 6
    assert resultado['total_pagar'] > 0
    assert resultado['mayor_impacto']['valor'] > 0
    assert sum(componente['porcentaje'] for componente in resultado['componentes']) != 0