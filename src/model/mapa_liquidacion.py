"""Desglose local de una liquidacion laboral."""

from model.calculadora import CalculadoraLiquidacion


class MapaLiquidacion:
    """Convierte una liquidacion en un resumen visual sin usar una base de datos."""

    CONCEPTOS = (
        ("indemnizacion", "Indemnizacion"),
        ("vacaciones", "Vacaciones"),
        ("cesantias", "Cesantias"),
        ("intereses_cesantias", "Intereses sobre cesantias"),
        ("primas", "Prima de servicios"),
        ("retencion_fuente", "Retencion en la fuente"),
    )

    def generar(
        self,
        salario_basico: float,
        fecha_inicio_labores: str,
        fecha_salida: str,
        dias_acumulados_vacaciones: int,
    ) -> dict[str, object]:
        liquidacion = CalculadoraLiquidacion().calcular_escenario(
            salario_basico,
            fecha_inicio_labores,
            fecha_salida,
            dias_acumulados_vacaciones,
        )
        total = liquidacion["total_pagar"]
        componentes = []
        for clave, etiqueta in self.CONCEPTOS:
            valor = liquidacion[clave]
            componentes.append({
                "clave": clave,
                "etiqueta": etiqueta,
                "valor": valor,
                "porcentaje": round((valor / total) * 100, 1) if total else 0.0,
            })

        mayor_impacto = max(componentes, key=lambda componente: componente["valor"])
        return {
            "componentes": componentes,
            "total_pagar": total,
            "mayor_impacto": mayor_impacto,
            "dias_trabajados": liquidacion["dias_trabajados"] if "dias_trabajados" in liquidacion else None,
        }