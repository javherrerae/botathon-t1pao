// Servicio de asignaciones especiales.
// AHORA: trabaja con datos simulados en memoria.
// DESPUES: cada función se reemplaza por un fetch a la API REST, sin tocar las pantallas.

import mockData from '../data/mockData.json'
import { ASIGNACIONES, TIPOS_ASIGNACION, REGLAS_ASIGNACION, ES_SIMULADO } from '../data/mockAsignaciones'

// Copia en memoria: los cambios duran mientras no recargues la página
let asignaciones = structuredClone(ASIGNACIONES)
let contadorId = asignaciones.length

// Simula el tiempo de respuesta de una API real
const esperar = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const esDatoSimulado = () => ES_SIMULADO

export const obtenerProfesionales = async () => {
  await esperar()
  return mockData.profesionales.map((p) => ({
    personaId: p.personaId,
    nombre: p.nombre,
    instituto: p.instituto,
    cargo: p.cargo,
    horasContrato: p.horasContrato,
  }))
}

export const obtenerTiposAsignacion = async () => {
  await esperar()
  return structuredClone(TIPOS_ASIGNACION)
}

export const obtenerReglasAsignacion = async () => {
  await esperar()
  return { ...REGLAS_ASIGNACION }
}

// Sin filtro → todas. Con personaId → solo las de ese profesional
export const obtenerAsignaciones = async ({ personaId } = {}) => {
  await esperar()
  const resultado = personaId
    ? asignaciones.filter((a) => a.personaId === Number(personaId))
    : asignaciones
  return structuredClone(resultado)
}

export const registrarAsignacion = async (datos) => {
  await esperar()
  const tipo = TIPOS_ASIGNACION.find((t) => t.id === datos.tipoId)
  if (!tipo) throw new Error('Tipo de asignación no válido.')

  contadorId += 1
  const nueva = {
    id: `ASG-${String(contadorId).padStart(3, '0')}`,
    personaId: Number(datos.personaId),
    tipoId: datos.tipoId,
    horasSemanales: Number(datos.horasSemanales),
    vigenciaDesde: datos.vigenciaDesde,
    vigenciaHasta: datos.vigenciaHasta,
    justificacion: datos.justificacion.trim(),
    // Si el tipo requiere DMN, queda pendiente; si no, queda registrada directo
    estado: tipo.requiereAutorizacion ? 'PENDIENTE' : 'REGISTRADA',
    responsableAutorizacion: tipo.requiereAutorizacion ? 'DMN' : null,
  }
  asignaciones.push(nueva)
  return structuredClone(nueva)
}

// Para la vista DMN (simulado: la aprobación real la hará el backend)
export const actualizarEstadoAsignacion = async (id, nuevoEstado) => {
  await esperar()
  const asignacion = asignaciones.find((a) => a.id === id)
  if (!asignacion) throw new Error('Asignación no encontrada.')
  asignacion.estado = nuevoEstado
  return structuredClone(asignacion)
}