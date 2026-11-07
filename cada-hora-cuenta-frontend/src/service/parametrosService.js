// Servicio de parámetros del bot.
// HOY: datos simulados en memoria.
// MAÑANA: GET/PUT a la API; el backend lee y escribe Parametros_Bot.xlsx para el bot.

import { PARAMETROS, ES_SIMULADO } from '../data/mockParametros'
import { compararParametros } from '../utils/validacionesParametros'

let parametros = structuredClone(PARAMETROS)
let historial = [] // cambios guardados (para trazabilidad)

const esperar = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const esDatoSimulado = () => ES_SIMULADO

export const obtenerParametros = async () => {
  await esperar()
  return structuredClone(parametros)
}

export const obtenerHistorialParametros = async () => {
  await esperar()
  return structuredClone(historial)
}

export const guardarParametros = async (nuevos, { usuario, justificacion }) => {
  await esperar()
  const cambios = compararParametros(parametros, nuevos)
  if (cambios.length === 0) throw new Error('No hay cambios para guardar.')

  const fechaHora = new Date().toISOString().slice(0, 19)
  const registros = cambios.map((c) => ({
    ...c,
    usuario,
    fechaHora,
    modulo: 'Parámetros',
    accion: 'MODIFICAR_PARAMETRO',
    justificacion: justificacion.trim(),
  }))

  historial = [...registros, ...historial] // lo más nuevo primero
  parametros = { ...structuredClone(nuevos), version: parametros.version + 1, actualizado: fechaHora }
  return structuredClone(parametros)
}