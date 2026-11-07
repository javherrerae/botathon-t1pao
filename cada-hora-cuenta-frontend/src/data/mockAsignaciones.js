// Datos SIMULADOS del Integrante 2 (asignaciones especiales).
// Los profesionales NO se duplican aquí: se leen de mockData.json mediante personaId.

export const ES_SIMULADO = true

// Regla del desafío: profesionales con MÁS de 30 H/S → máximo 2 asignaciones
export const REGLAS_ASIGNACION = {
  umbralHorasSemanales: 30,
  maxAsignacionesSobreUmbral: 2,
}

// Catálogo de tipos (Excel: hoja Distribucion_NAC, columnas R–T)
// horasSemanales: null → horas variables, se ingresan caso a caso
export const TIPOS_ASIGNACION = [
  // --- Horas fijas ---
  { id: 'LIDER_EQUIPO',      nombre: 'Líder de equipo',                       horasSemanales: 2,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'INVESTIGACION',     nombre: 'Investigación (aprobada por CEC)',      horasSemanales: 2,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'TUTOR_DOCENTE',     nombre: 'Tutor docente',                         horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'COORD_DOCENTE',     nombre: 'Coordinador docente',                   horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'RESP_TECNICO',      nombre: 'Responsable técnico (voluntariado)',    horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'CASA_ACOGIDA_SCL',  nombre: 'Casa de acogida Santiago',              horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'WEEFIM_LOCAL',      nombre: 'Coordinación WeeFIM (Local) por IT',    horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'GMFM_LOCAL',        nombre: 'GMFM (Local) por IT',                   horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'TETCA_UTA_LOCAL',   nombre: 'Coordinación Tetca/Tetco/UTA (Local)',  horasSemanales: 1,    definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'COMITE_PARITARIO',  nombre: 'Comité paritario',                      horasSemanales: 0.5,  definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'MESA_SSYC',         nombre: 'Mesas técnicas SSYC',                   horasSemanales: 0.5,  definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'MESA_SDM',          nombre: 'Mesas técnicas SDM',                    horasSemanales: 0.5,  definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'CEA',               nombre: 'CEA',                                   horasSemanales: 0.25, definidoPor: 'FIJO', requiereAutorizacion: false },
  { id: 'REUNION_SINDICAL',  nombre: 'Reunión sindical (dentro de contrato)', horasSemanales: 0.25, definidoPor: 'FIJO', requiereAutorizacion: false },

  // --- Horas variables (definidas por DMN, GP o programa local) ---
  { id: 'WEEFIM_NACIONAL',    nombre: 'Coordinación nacional WeeFIM', horasSemanales: null, definidoPor: 'DMN',    requiereAutorizacion: true },
  { id: 'CAPACITACION',       nombre: 'Capacitación',                 horasSemanales: null, definidoPor: 'DMN',    requiereAutorizacion: true },
  { id: 'ACREDITACION',       nombre: 'Acreditación',                 horasSemanales: null, definidoPor: 'DMN',    requiereAutorizacion: true },
  { id: 'DOCENCIA_DMN',       nombre: 'Docencia DMN',                 horasSemanales: null, definidoPor: 'DMN',    requiereAutorizacion: true },
  { id: 'ATENCIONES_OTRO_IT', nombre: 'Atenciones otro IT',           horasSemanales: null, definidoPor: 'DMN_GP', requiereAutorizacion: true },
  { id: 'COORD_CASA_ACOGIDA', nombre: 'Coordinación casa acogida',    horasSemanales: null, definidoPor: 'DMN_GP', requiereAutorizacion: true },
  { id: 'DIRIGENTE_SINDICAL', nombre: 'Dirigente sindical',           horasSemanales: null, definidoPor: 'GP',     requiereAutorizacion: false },
  { id: 'COORD_KINE',         nombre: 'Coordinador kinesiología',     horasSemanales: null, definidoPor: 'GP',     requiereAutorizacion: false },
  { id: 'DESARROLLO_TECNICO', nombre: 'Desarrollo técnico',           horasSemanales: null, definidoPor: 'GP',     requiereAutorizacion: false },
]

// Asignaciones registradas. personaId → profesional de mockData.json
// estado: 'REGISTRADA' (no requiere aprobación) | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
export const ASIGNACIONES = [
  // 137732 (40 h): ya tiene 2 → una tercera debe ser BLOQUEADA
  {
    id: 'ASG-001', personaId: 137732, tipoId: 'LIDER_EQUIPO', horasSemanales: 2,
    vigenciaDesde: '2026-01-01', vigenciaHasta: '2026-12-31',
    justificacion: 'Liderazgo de equipo de fisiatría', estado: 'REGISTRADA', responsableAutorizacion: null,
  },
  {
    id: 'ASG-002', personaId: 137732, tipoId: 'TUTOR_DOCENTE', horasSemanales: 1,
    vigenciaDesde: '2026-03-01', vigenciaHasta: '2026-12-31',
    justificacion: 'Tutoría de internos', estado: 'REGISTRADA', responsableAutorizacion: null,
  },
  // 137733 (42 h): casos para la vista de aprobaciones DMN
  {
    id: 'ASG-003', personaId: 137733, tipoId: 'CAPACITACION', horasSemanales: 3,
    vigenciaDesde: '2026-05-01', vigenciaHasta: '2026-08-31',
    justificacion: 'Capacitación nacional en nuevo protocolo', estado: 'PENDIENTE', responsableAutorizacion: 'DMN',
  },
  {
    id: 'ASG-004', personaId: 137733, tipoId: 'DOCENCIA_DMN', horasSemanales: 2,
    vigenciaDesde: '2026-01-01', vigenciaHasta: '2026-06-30',
    justificacion: 'Docencia en curso de especialidad', estado: 'APROBADA', responsableAutorizacion: 'DMN',
  },
  // 137734 (22 h): ≤ 30 h → NO aplica el límite de 2
  {
    id: 'ASG-005', personaId: 137734, tipoId: 'COMITE_PARITARIO', horasSemanales: 0.5,
    vigenciaDesde: '2026-01-01', vigenciaHasta: '2026-12-31',
    justificacion: 'Integrante del comité paritario', estado: 'REGISTRADA', responsableAutorizacion: null,
  },
]