// Reglas para validar y comparar los parámetros del bot.

// Los 3 tramos de jornada, con las llaves que usa Parametros_Bot.xlsx
export const TRAMOS = [
  { id: '40mas', etiqueta: '>= 40h', dir: 'dir40mas', ind: 'ind40mas' },
  { id: '22a40', etiqueta: '22-39h', dir: 'dir22a40', ind: 'ind22a40' },
  { id: 'menos22', etiqueta: '< 22h', dir: 'dirMenos22', ind: 'indMenos22' },
]

export const CAMPOS_CARGO = ['stdDirMin', 'stdIndMin', 'dir40mas', 'ind40mas', 'dir22a40', 'ind22a40', 'dirMenos22', 'indMenos22']

// % NAS = lo que sobra después de directo e indirecto (se muestra, no se guarda)
export const calcularNas = (dir, ind) => {
  if (dir === null && ind === null) return null
  return Math.round((1 - (dir ?? 0) - (ind ?? 0)) * 10000) / 10000
}

// null se acepta: significa "no definido" en el Excel original
const esFraccion = (v) => v === null || (typeof v === 'number' && v >= 0 && v <= 1)

// Valida UN cargo. Devuelve { campo: mensaje }
export function validarCargo(c) {
  const errores = {}
  if (!c.cargo?.trim()) errores.cargo = 'El cargo no puede estar vacío.'
  if (!(c.stdDirMin > 0)) errores.stdDirMin = 'Debe ser mayor a 0.'
  if (!(c.stdIndMin > 0)) errores.stdIndMin = 'Debe ser mayor a 0.'

  TRAMOS.forEach((t) => {
    if (!esFraccion(c[t.dir])) errores[t.dir] = 'Entre 0 % y 100 %.'
    if (!esFraccion(c[t.ind])) errores[t.ind] = 'Entre 0 % y 100 %.'
    // 1e-9: tolerancia por decimales (0.1 + 0.2 no da exactamente 0.3 en JS)
    if ((c[t.dir] ?? 0) + (c[t.ind] ?? 0) > 1 + 1e-9) {
      errores[t.id] = `Directo + indirecto supera 100 % (tramo ${t.etiqueta}).`
    }
  })
  return errores
}

// Valida TODOS los parámetros antes de guardar
export function validarParametros(parametros, { justificacion } = {}) {
  const errores = {}

  if (!(parametros.metaGestionPct > 0 && parametros.metaGestionPct <= 1)) {
    errores.metaGestionPct = 'La meta debe estar entre 1 % y 100 %.'
  }

  const nombres = new Set()
  parametros.cargos.forEach((c, i) => {
    const nombre = c.cargo?.trim().toUpperCase()
    if (nombre && nombres.has(nombre)) errores[`cargo-${i}-cargo`] = 'Cargo repetido.'
    nombres.add(nombre)
    // Reutiliza la validación de un cargo, con el índice como prefijo
    Object.entries(validarCargo(c)).forEach(([campo, mensaje]) => {
      errores[`cargo-${i}-${campo}`] = mensaje
    })
  })

  if (parametros.semanas.length !== 12) errores.semanas = 'Debe haber exactamente 12 meses.'
  const periodos = parametros.semanas.map((s) => String(s.periodo))
  const esperados = Array.from({ length: 12 }, (_, i) => `2026${String(i + 1).padStart(2, '0')}`)
  if (new Set(periodos).size !== 12 || esperados.some((p) => !periodos.includes(p))) errores.semanas = 'Los periodos deben ser los 12 meses de 2026 (AAAAMM).'
  parametros.semanas.forEach((s, i) => {
    if (!(s.semanasHabiles > 0)) errores[`semana-${i}`] = 'Debe ser mayor a 0.'
  })

  if (justificacion !== undefined && !justificacion.trim()) {
    errores.justificacion = 'Agrega una justificación del cambio.'
  }

  return { valido: Object.keys(errores).length === 0, errores }
}

// Lista de cambios campo por campo (sirve para la bitácora de trazabilidad)
export function compararParametros(antes, despues) {
  const cambios = []

  if (antes.metaGestionPct !== despues.metaGestionPct) {
    cambios.push({ campo: 'Meta de gestión', valorAnterior: antes.metaGestionPct, valorNuevo: despues.metaGestionPct })
  }

  despues.cargos.forEach((c) => {
    const previo = antes.cargos.find((x) => x.cargo === c.cargo)
    if (!previo) {
      cambios.push({ campo: `Cargo ${c.cargo}`, valorAnterior: null, valorNuevo: 'NUEVO' })
      return
    }
    CAMPOS_CARGO.forEach((k) => {
      if (previo[k] !== c[k]) cambios.push({ campo: `${c.cargo} · ${k}`, valorAnterior: previo[k], valorNuevo: c[k] })
    })
  })

  despues.semanas.forEach((s) => {
    const previa = antes.semanas.find((x) => x.periodo === s.periodo)
    if (previa && previa.semanasHabiles !== s.semanasHabiles) {
      cambios.push({ campo: `Semanas hábiles ${s.periodo}`, valorAnterior: previa.semanasHabiles, valorNuevo: s.semanasHabiles })
    }
  })

  return cambios
}