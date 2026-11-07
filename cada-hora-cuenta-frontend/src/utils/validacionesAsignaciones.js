// Reglas de validación de asignaciones especiales.
// Funciones "puras": reciben datos y devuelven un resultado. No llaman a la API ni modifican nada.

// ¿Dos periodos se cruzan? Las fechas 'AAAA-MM-DD' se pueden comparar como texto
export const seSuperponen = (a, b) =>
  a.vigenciaDesde <= b.vigenciaHasta && b.vigenciaDesde <= a.vigenciaHasta

// Asignaciones que "cuentan" en un periodo (las rechazadas no cuentan)
export const asignacionesVigentesEn = (asignaciones, periodo) =>
  asignaciones.filter((a) => a.estado !== 'RECHAZADA' && seSuperponen(a, periodo))

export const sumarHoras = (asignaciones) =>
  asignaciones.reduce((total, a) => total + Number(a.horasSemanales || 0), 0)

// Regla del desafío: el límite aplica solo con MÁS de 30 H/S
export const aplicaLimite = (profesional, reglas) =>
  profesional.horasContrato > reglas.umbralHorasSemanales

export function validarAsignacion({ datos, profesional, tipo, asignacionesExistentes, reglas }) {
  const errores = {}

  // --- 1. Campos obligatorios ---
  if (!datos.personaId || !profesional) errores.personaId = 'Selecciona un profesional.'
  if (!datos.tipoId || !tipo) errores.tipoId = 'Selecciona un tipo de asignación.'

  const horas = Number(datos.horasSemanales)
  if (!datos.horasSemanales || Number.isNaN(horas) || horas <= 0) {
    errores.horasSemanales = 'Ingresa las horas semanales (mayor a 0).'
  }

  if (!datos.vigenciaDesde) errores.vigenciaDesde = 'Indica la fecha de inicio.'
  if (!datos.vigenciaHasta) errores.vigenciaHasta = 'Indica la fecha de término.'
  if (datos.vigenciaDesde && datos.vigenciaHasta && datos.vigenciaHasta < datos.vigenciaDesde) {
    errores.vigenciaHasta = 'La fecha de término no puede ser anterior a la de inicio.'
  }

  if (!datos.justificacion?.trim()) errores.justificacion = 'Agrega una justificación.'

  // --- 2. Reglas de negocio (solo si lo básico está correcto) ---
  if (Object.keys(errores).length === 0) {
    const periodo = { vigenciaDesde: datos.vigenciaDesde, vigenciaHasta: datos.vigenciaHasta }
    const vigentes = asignacionesVigentesEn(asignacionesExistentes, periodo)

    // Máximo 2 asignaciones para profesionales con más de 30 H/S
    if (aplicaLimite(profesional, reglas) && vigentes.length >= reglas.maxAsignacionesSobreUmbral) {
      errores.general =
        `El profesional tiene ${profesional.horasContrato} H/S y ya cuenta con ${vigentes.length} ` +
        `asignaciones en ese periodo. Máximo permitido: ${reglas.maxAsignacionesSobreUmbral}.`
    }

    // No repetir la misma asignación en el mismo periodo
    if (vigentes.some((a) => a.tipoId === datos.tipoId)) {
      errores.tipoId = 'El profesional ya tiene esta asignación en ese periodo.'
    }

    // Las horas asignadas no pueden superar las horas del contrato
    const totalHoras = sumarHoras(vigentes) + horas
    if (totalHoras > profesional.horasContrato) {
      errores.horasSemanales =
        `Las asignaciones sumarían ${totalHoras} H/S y superan las ${profesional.horasContrato} H/S del contrato.`
    }
  }

  return { valido: Object.keys(errores).length === 0, errores }
}