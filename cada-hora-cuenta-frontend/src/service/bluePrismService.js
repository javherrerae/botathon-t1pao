
/*
 * Servicio de datos para la integración con Blue Prism.
 *
 * Por ahora consulta un JSON local que representa
 * la información procesada del Excel.
 *
 * Cuando exista el backend, reemplazaremos la
 * consulta local por una petición a la API REST.
 */

const URL_DATOS =
  `${import.meta.env.BASE_URL}datos/blueprism-referencia.json`

let datosGuardados = null

// Obtener los datos de referencia
export async function obtenerDatosBluePrism() {
  if (!datosGuardados) {
    datosGuardados = fetch(URL_DATOS)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(
            `Error al cargar los datos: ${respuesta.status}`
          )
        }

        return respuesta.json()
      })
      .then((datos) => {
        if (
          !datos.meta ||
          !Array.isArray(datos.ejecuciones) ||
          !Array.isArray(datos.resultados) ||
          !Array.isArray(datos.novedades) ||
          !Array.isArray(datos.resumenInstituto)
        ) {
          throw new Error(
            'El archivo JSON tiene un formato incorrecto'
          )
        }

        return datos
      })
      .catch((error) => {
        datosGuardados = null
        throw error
      })
  }

  return datosGuardados
}

// Obtener historial de ejecuciones
export async function obtenerEjecuciones() {
  const datos = await obtenerDatosBluePrism()
  return datos.ejecuciones
}

// Obtener errores de una ejecución
export async function obtenerErroresEjecucion(ejecucionId) {
  const ejecuciones = await obtenerEjecuciones()

  const ejecucion = ejecuciones.find(
    (item) => item.ejecucionId === ejecucionId
  )

  return ejecucion?.errores ?? []
}

// Obtener novedades contractuales
export async function obtenerNovedades() {
  const datos = await obtenerDatosBluePrism()
  return datos.novedades
}

// Obtener resultados por profesional y mes
export async function obtenerResultados() {
  const datos = await obtenerDatosBluePrism()
  return datos.resultados
}

// Obtener resumen mensual por instituto
export async function obtenerResumenInstituto() {
  const datos = await obtenerDatosBluePrism()
  return datos.resumenInstituto
}

// Obtener metadatos y conteos generales
export async function obtenerMeta() {
  const datos = await obtenerDatosBluePrism()
  return datos.meta
}
