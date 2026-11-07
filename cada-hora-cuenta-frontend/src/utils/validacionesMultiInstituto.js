// Reglas para revisar la distribución de horas entre institutos.

export const sumarHorasDistribuidas = (distribucion) =>
  distribucion.reduce((total, d) => total + d.horas, 0)

// Compara las horas repartidas por instituto con las horas del contrato
export function revisarPeriodo({ horasContrato, distribucion }) {
  const totalAsignado = sumarHorasDistribuidas(distribucion)
  const diferencia = totalAsignado - horasContrato
  const institutosSinHoras = distribucion.filter((d) => d.horas === 0).map((d) => d.instituto)

  let estado = 'OK'
  let mensaje = 'Las horas distribuidas coinciden con el contrato.'

  if (diferencia > 0) {
    estado = 'ERROR'
    mensaje = `Se asignan ${diferencia} H/S más que las del contrato.`
  } else if (diferencia < 0) {
    estado = 'ADVERTENCIA'
    mensaje = `Faltan ${Math.abs(diferencia)} H/S por distribuir.`
  }

  return { totalAsignado, diferencia, estado, mensaje, institutosSinHoras }
}

// Convierte cada profesional + periodo en una fila para la tabla
export function construirFilas(profesionales, periodos) {
  return profesionales.flatMap((p) =>
    p.periodos.map((per) => ({
      id: `${p.personaId}-${per.periodoId}`,
      personaId: p.personaId,
      cargo: p.cargo,
      observaciones: p.observaciones,
      periodoId: per.periodoId,
      periodoNombre: periodos.find((x) => x.id === per.periodoId)?.nombre ?? per.periodoId,
      horasContrato: per.horasContrato,
      distribucion: per.distribucion,
      ...revisarPeriodo(per),
    }))
  )
}