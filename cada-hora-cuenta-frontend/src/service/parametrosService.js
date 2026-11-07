// Servicio único de parámetros: intenta API FastAPI y conserva fallback local para demo offline.
import { PARAMETROS } from '../data/mockParametros'
import { compararParametros } from '../utils/validacionesParametros'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
let parametros = structuredClone(PARAMETROS)
let historial = []
let conectado = false
const esperar = (ms=180) => new Promise(r => setTimeout(r, ms))

async function request(path, options={}) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.detail || `Error API ${res.status}`)
  return body
}
export const esDatoSimulado = () => !conectado
export async function obtenerParametros() {
  try {
    const data = await request('/api/parametros')
    parametros = { ...data, metaGestionPct: data.metaGestionPct ?? 0.9 }
    conectado = true
    return structuredClone(parametros)
  } catch {
    await esperar(); conectado = false
    return structuredClone(parametros)
  }
}
export async function obtenerHistorialParametros() {
  try {
    const data = await request('/api/parametros/historial')
    conectado = true; historial = data.historial || []
  } catch { await esperar() }
  return structuredClone(historial)
}
export async function guardarParametros(nuevos, { usuario='Administrador', justificacion }) {
  const cambios = compararParametros(parametros, nuevos)
  if (!cambios.length) throw new Error('No hay cambios para guardar.')
  try {
    const guardado = await request(`/api/parametros?usuario=${encodeURIComponent(usuario)}&justificacion=${encodeURIComponent(justificacion)}`, { method:'PUT', body:JSON.stringify(nuevos) })
    conectado = true; parametros = structuredClone(guardado)
    return structuredClone(parametros)
  } catch (error) {
    // La simulación local sigue disponible si el backend no está iniciado.
    if (conectado) throw error
    await esperar()
    const fechaHora = new Date().toISOString().slice(0,19)
    historial = cambios.map(c => ({ ...c, usuario, fechaHora, modulo:'Parámetros', accion:'MODIFICAR_PARAMETRO', justificacion:justificacion.trim() })).concat(historial)
    parametros = { ...structuredClone(nuevos), version:(parametros.version||0)+1, actualizado:fechaHora }
    return structuredClone(parametros)
  }
}
