/**
 * api.js
 * Capa de acceso a la API REST del backend.
 * Cambiar BASE_URL en producción.
 *
 * CONVENCIÓN: cada función devuelve el mismo shape que el servicio mock
 * equivalente → el resto del frontend no necesita cambios.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

async function get(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`)
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res.json()
}

async function patch(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `API error ${res.status}`)
  }
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `API error ${res.status}`)
  }
  return res.json()
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const obtenerResumenNacional = () => get('/api/resumen-instituto/nacional')

export const obtenerInstitutos = (params = {}) =>
  get('/api/resumen-instituto/por-instituto', params).then((r) => r.institutos)

export const obtenerEvolucion = (params = {}) =>
  get('/api/resumen-instituto/por-periodo', params).then((r) => r.evolucion)

// ─── Planificación ───────────────────────────────────────────────────────────

export const obtenerProfesionales = (params = {}) =>
  get('/api/resultados/profesionales', params).then((r) => r.profesionales)

export const obtenerDetalleProfesional = (personaId) =>
  get(`/api/resultados/profesionales/${personaId}`)

export const obtenerOpcionesFiltros = () => get('/api/resultados/filtros/opciones')

export const obtenerResultados = (params = {}) => get('/api/resultados', params)

// ─── Excepciones Blue Prism ──────────────────────────────────────────────────

export const obtenerExcepciones = (params = {}) =>
  get('/api/excepciones', params).then((r) => r.excepciones)

export const obtenerResumenExcepciones = () => get('/api/excepciones/resumen')

// ─── Novedades ───────────────────────────────────────────────────────────────

export const obtenerNovedades = (params = {}) => get('/api/novedades', params)

export const actualizarEstadoNovedad = (novedadId, estado) =>
  patch(`/api/novedades/${novedadId}/estado`, { estado })

// ─── Monitoreo RPA ───────────────────────────────────────────────────────────

export const obtenerEjecuciones = () => get('/api/ejecuciones')

export const obtenerEjecucion = (id) => get(`/api/ejecuciones/${id}`)

export const obtenerErroresEjecucion = (id) => get(`/api/ejecuciones/${id}/errores`)

// ─── Asignaciones especiales ─────────────────────────────────────────────────

export const obtenerTiposAsignacion = () =>
  get('/api/asignaciones/tipos').then((r) => r.tipos)

export const obtenerReglasAsignacion = () =>
  get('/api/asignaciones/tipos').then((r) => r.reglas)

export const obtenerAsignaciones = (params = {}) =>
  get('/api/asignaciones', params).then((r) => r.asignaciones)

export const registrarAsignacion = (datos) => post('/api/asignaciones', datos)

export const actualizarEstadoAsignacion = (id, estado) =>
  patch(`/api/asignaciones/${id}/estado`, { estado })

// ─── Parámetros ──────────────────────────────────────────────────────────────

export const obtenerParametros = () => get('/api/parametros')

export const obtenerHistorialParametros = () => get('/api/parametros/historial')

export const actualizarMetaGestion = (valor, justificacion, responsable) =>
  patch('/api/parametros/meta-gestion', { campo: 'metaGestionPct', valor, justificacion, responsable })

// Excepciones de distribución multi-instituto (persistencia JSON temporal, sin BD).
export const obtenerExcepcionesMultiInstituto = () => get('/api/excepciones/multi-instituto')
export const registrarExcepcionMultiInstituto = (datos) => post('/api/excepciones/multi-instituto', datos)
