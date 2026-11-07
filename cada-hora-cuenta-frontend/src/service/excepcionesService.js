// Servicio de excepciones multi-instituto.
// HOY: datos simulados. MAÑANA: fetch a la API REST.

import { PROFESIONALES_MULTI, PERIODOS, ES_SIMULADO } from '../data/mockMultiInstituto'

const esperar = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const esDatoSimulado = () => ES_SIMULADO

export const obtenerPeriodos = async () => {
  await esperar()
  return structuredClone(PERIODOS)
}

export const obtenerProfesionalesMultiInstituto = async () => {
  await esperar()
  return structuredClone(PROFESIONALES_MULTI)
}