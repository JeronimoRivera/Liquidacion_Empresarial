import os
import sys

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.insert(0, SRC)

from model.calculadora import CalculadoraLiquidacion


def test_comparar_escenarios_muestra_incremento_por_dias_adicionales():
    calculadora = CalculadoraLiquidacion()

    resultado = calculadora.comparar_escenarios(
        salario_basico=2_000_000,
        fecha_inicio_labores='01/01/2024',
        fecha_salida_actual='01/07/2024',
        fecha_salida_proyectada='01/08/2024',
        dias_acumulados_vacaciones=0,
    )

    assert resultado['proyectado']['total_pagar'] > resultado['actual']['total_pagar']
    assert resultado['dias_adicionales'] == 31
    assert resultado['diferencias']['cesantias'] == 172222.22
    assert resultado['diferencias']['primas'] == 172222.22