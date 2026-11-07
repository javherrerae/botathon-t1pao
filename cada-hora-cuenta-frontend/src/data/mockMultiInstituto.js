// Datos SIMULADOS: profesionales que reparten su jornada entre 2 o más institutos.
// Estructura basada en la hoja "Excepciones" del Excel. IDs ficticios.
// Se separa ene–abr y may–dic por el cambio legal de jornada (44 → 42 h).

export const ES_SIMULADO = true

export const PERIODOS = [
  { id: 'ENE-ABR', nombre: 'Enero – Abril 2026', desde: '2026-01-01', hasta: '2026-04-30' },
  { id: 'MAY-DIC', nombre: 'Mayo – Diciembre 2026', desde: '2026-05-01', hasta: '2026-12-31' },
]

export const PROFESIONALES_MULTI = [
  // Caso OK: cumple en ambos periodos (incluye el cambio 44 → 42 h)
  {
    personaId: 900101,
    cargo: 'MEDICO FISIATRA',
    observaciones: 'Apoyo semanal a instituto de zona austral.',
    periodos: [
      { periodoId: 'ENE-ABR', horasContrato: 44, distribucion: [{ instituto: 'Iquique', horas: 36 }, { instituto: 'Coyhaique', horas: 8 }] },
      { periodoId: 'MAY-DIC', horasContrato: 42, distribucion: [{ instituto: 'Iquique', horas: 36 }, { instituto: 'Coyhaique', horas: 6 }] },
    ],
  },
  // Caso ERROR: en ene–abr se reparten más horas que las del contrato
  {
    personaId: 900102,
    cargo: 'MEDICO FISIATRA',
    observaciones: 'Se incorpora a Santiago desde mayo.',
    periodos: [
      { periodoId: 'ENE-ABR', horasContrato: 40, distribucion: [{ instituto: 'Valparaíso', horas: 34 }, { instituto: 'Copiapó', horas: 8 }] },
      { periodoId: 'MAY-DIC', horasContrato: 40, distribucion: [{ instituto: 'Valparaíso', horas: 8 }, { instituto: 'Copiapó', horas: 6 }, { instituto: 'Santiago', horas: 26 }] },
    ],
  },
  // Caso ADVERTENCIA: en ene–abr quedan horas sin distribuir
  {
    personaId: 900103,
    cargo: 'KINESIOLOGO',
    observaciones: 'Pendiente confirmar horas en Talca.',
    periodos: [
      { periodoId: 'ENE-ABR', horasContrato: 44, distribucion: [{ instituto: 'Concepción', horas: 30 }, { instituto: 'Talca', horas: 8 }] },
      { periodoId: 'MAY-DIC', horasContrato: 42, distribucion: [{ instituto: 'Concepción', horas: 30 }, { instituto: 'Talca', horas: 12 }] },
    ],
  },
  // Caso traslado: un instituto queda con 0 h en un periodo (no es error, es informativo)
  {
    personaId: 900104,
    cargo: 'MEDICO FISIATRA',
    observaciones: 'Traslado de Puerto Montt a Santiago en mayo.',
    periodos: [
      { periodoId: 'ENE-ABR', horasContrato: 40, distribucion: [{ instituto: 'Puerto Montt', horas: 40 }, { instituto: 'Santiago', horas: 0 }] },
      { periodoId: 'MAY-DIC', horasContrato: 40, distribucion: [{ instituto: 'Puerto Montt', horas: 0 }, { instituto: 'Santiago', horas: 40 }] },
    ],
  },
]