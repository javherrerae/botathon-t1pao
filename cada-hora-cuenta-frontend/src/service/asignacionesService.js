// asignacionesService.js
// AHORA: consume el backend FastAPI en lugar de datos en memoria.
// Mantiene el mismo contrato de funciones → las pantallas no cambian.

import {
  obtenerProfesionales as _obtenerProfesionales,
  obtenerTiposAsignacion as _obtenerTipos,
  obtenerReglasAsignacion as _obtenerReglas,
  obtenerAsignaciones as _obtenerAsignaciones,
  registrarAsignacion as _registrarAsignacion,
  actualizarEstadoAsignacion as _actualizarEstado,
} from './api'

export const esDatoSimulado = () => true

export const obtenerProfesionales = () => _obtenerProfesionales()

export const obtenerTiposAsignacion = () => _obtenerTipos()

export const obtenerReglasAsignacion = () => _obtenerReglas()

export const obtenerAsignaciones = ({ personaId } = {}) =>
  _obtenerAsignaciones(personaId ? { personaId } : {})

export const registrarAsignacion = (datos) => _registrarAsignacion(datos)

export const actualizarEstadoAsignacion = (id, nuevoEstado) =>
  _actualizarEstado(id, nuevoEstado)
