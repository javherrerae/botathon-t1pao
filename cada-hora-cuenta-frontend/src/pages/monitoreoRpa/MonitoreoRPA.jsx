import { useEffect, useState } from 'react'
import { Bot, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import {
  obtenerEjecuciones,
  obtenerNovedades
} from '../../service/bluePrismService'

// Los estados provienen del JSON de referencia y, en el futuro, del backend.
const etiquetasEstado = {
  PENDIENTE: 'Pendiente',
  PROCESANDO: 'Procesando',
  COMPLETADO: 'Completado',
  COMPLETADO_CON_OBSERVACIONES: 'Con observaciones',
  ERROR: 'Error'
}

const estilosEstado = {
  PENDIENTE: 'bg-slate-100 text-slate-700',
  PROCESANDO: 'bg-blue-100 text-blue-800',
  COMPLETADO: 'bg-green-100 text-green-800',
  COMPLETADO_CON_OBSERVACIONES: 'bg-yellow-100 text-yellow-900',
  ERROR: 'bg-red-100 text-red-800'
}

const cantidad = (valor) => Number(valor ?? 0).toLocaleString('es-CL')
const mostrarValor = (valor) => valor === null || valor === undefined || valor === '' ? '—' : String(valor)

function mostrarFechaHora(valor) {
  if (!valor) return 'Sin ejecutar'
  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime())
    ? valor
    : fecha.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

function MonitoreoRPA() {
  const [datos, setDatos] = useState({ ejecuciones: [], novedades: [] })
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('TODOS')
  const [ejecucionSeleccionada, setEjecucionSeleccionada] = useState('')
  const [busquedaError, setBusquedaError] = useState('')
  const [busquedaNovedad, setBusquedaNovedad] = useState('')
  const [limiteErrores, setLimiteErrores] = useState(20)
  const [limiteNovedades, setLimiteNovedades] = useState(20)

  useEffect(() => {
    let activo = true

    Promise.all([obtenerEjecuciones(), obtenerNovedades()])
      .then(([ejecuciones, novedades]) => {
        if (activo) {
          setDatos({ ejecuciones, novedades })
          setErrorCarga('')
        }
      })
      .catch((error) => {
        if (activo) setErrorCarga(error.message || 'Error desconocido')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [intento])

  const { ejecuciones, novedades } = datos
  const totalValidos = ejecuciones.reduce((total, item) => total + Number(item.validos ?? 0), 0)
  const totalRechazados = ejecuciones.reduce((total, item) => total + Number(item.rechazados ?? 0), 0)
  const totalRegistros = ejecuciones.reduce((total, item) => total + Number(item.totalRegistros ?? 0), 0)

  const ejecucionesFiltradas = ejecuciones.filter((item) => {
    const coincideArchivo = `${item.archivo ?? ''} ${item.fuente ?? ''}`
      .toLowerCase().includes(busqueda.toLowerCase())
    return coincideArchivo && (estado === 'TODOS' || item.estado === estado)
  })

  const idSeleccionado = ejecucionSeleccionada || ejecuciones[0]?.ejecucionId || ''
  const ejecucionDetalle = ejecuciones.find((item) => item.ejecucionId === idSeleccionado)
  const errores = ejecucionDetalle?.errores ?? []
  const erroresFiltrados = errores.filter((item) =>
    `${item.clave ?? ''} ${item.personaId ?? ''} ${item.instituto ?? ''} ${item.periodo ?? ''} ${item.motivo ?? ''}`
      .toLowerCase().includes(busquedaError.toLowerCase())
  )
  const novedadesFiltradas = novedades.filter((item) =>
    `${item.personaId ?? ''} ${item.tipoCambio ?? ''} ${item.instituto ?? ''} ${item.valorAnterior ?? ''} ${item.valorNuevo ?? ''}`
      .toLowerCase().includes(busquedaNovedad.toLowerCase())
  )

  const indicadores = [
    { titulo: 'Registros informados', valor: totalRegistros, icono: FileSpreadsheet },
    { titulo: 'Registros válidos', valor: totalValidos, icono: CheckCircle },
    { titulo: 'Registros rechazados', valor: totalRechazados, icono: AlertTriangle },
    { titulo: 'Novedades detectadas', valor: novedades.length, icono: Bot }
  ]

  if (cargando) {
    return <p role="status" className="p-6 text-slate-600">Cargando datos de referencia BUK...</p>
  }

  if (errorCarga) {
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-red-800">No se pudieron cargar los datos</h1>
        <p className="mt-2 text-sm text-slate-700">{errorCarga}</p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-[#003366] px-4 py-2 text-sm text-white"
          onClick={() => {
            setCargando(true)
            setErrorCarga('')
            setIntento((actual) => actual + 1)
          }}
        >
          Reintentar
        </button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#003366]">AUTOMATIZACIÓN RPA</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Monitoreo Blue Prism</h1>
        <p className="mt-1 text-slate-600">
          Visualización de ejecuciones, registros rechazados y novedades contractuales.
        </p>
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Modo demostración: el JSON representa datos del Excel; no acredita una ejecución real de Blue Prism.
        </p>
      </header>

      <section aria-label="Indicadores de procesamiento" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((item) => {
          const Icono = item.icono
          return (
            <article key={item.titulo} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">{item.titulo}</p>
                <Icono size={22} className="text-[#003366]" aria-hidden="true" />
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{cantidad(item.valor)}</p>
            </article>
          )
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Historial de ejecuciones ({ejecuciones.length})</h2>
        <div className="mb-5 flex flex-wrap gap-4">
          <div className="min-w-48 flex-1">
            <label htmlFor="buscar-archivo" className="mb-1 block text-sm font-medium">Buscar archivo o fuente</label>
            <input
              id="buscar-archivo"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Ej. Base contratos o BUK"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="filtrar-estado" className="mb-1 block text-sm font-medium">Estado</label>
            <select
              id="filtrar-estado"
              value={estado}
              onChange={(evento) => setEstado(evento.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="TODOS">Todos</option>
              {Object.entries(etiquetasEstado).map(([codigo, etiqueta]) => (
                <option key={codigo} value={codigo}>{etiqueta}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Archivo</th>
                <th scope="col" className="p-3">Fuente</th>
                <th scope="col" className="p-3">Fecha y hora</th>
                <th scope="col" className="p-3">Estado</th>
                <th scope="col" className="p-3">Registros</th>
                <th scope="col" className="p-3">Válidos</th>
                <th scope="col" className="p-3">Rechazados</th>
                <th scope="col" className="p-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {ejecucionesFiltradas.map((item) => (
                <tr key={item.ejecucionId} className="border-b border-slate-200">
                  <td className="p-3">{item.archivo}</td>
                  <td className="p-3">{item.fuente}</td>
                  <td className="p-3">{mostrarFechaHora(item.fechaHora)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estilosEstado[item.estado] || estilosEstado.PENDIENTE}`}>
                      {etiquetasEstado[item.estado] || item.estado}
                    </span>
                  </td>
                  <td className="p-3">{cantidad(item.totalRegistros)}</td>
                  <td className="p-3">{cantidad(item.validos)}</td>
                  <td className="p-3">{cantidad(item.rechazados)}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEjecucionSeleccionada(item.ejecucionId)
                        setBusquedaError('')
                        setLimiteErrores(20)
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-[#003366] hover:bg-slate-50"
                      aria-label={`Ver errores de ${item.archivo}`}
                    >
                      Ver errores
                    </button>
                  </td>
                </tr>
              ))}
              {ejecucionesFiltradas.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-slate-600">No se encontraron ejecuciones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Errores de importación ({erroresFiltrados.length})</h2>
        <p className="mt-1 text-sm text-slate-600">
          Detalle de los registros rechazados para la ejecución seleccionada. No corresponde a excepciones multi-instituto.
        </p>
        <div className="my-4 flex flex-wrap gap-4">
          <div className="min-w-48 flex-1">
            <label htmlFor="ejecucion-detalle" className="mb-1 block text-sm font-medium">Ejecución</label>
            <select
              id="ejecucion-detalle"
              value={idSeleccionado}
              onChange={(evento) => {
                setEjecucionSeleccionada(evento.target.value)
                setLimiteErrores(20)
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {ejecuciones.map((item) => (
                <option key={item.ejecucionId} value={item.ejecucionId}>{item.archivo} ({item.ejecucionId})</option>
              ))}
            </select>
          </div>
          <div className="min-w-48 flex-1">
            <label htmlFor="buscar-error" className="mb-1 block text-sm font-medium">Buscar error</label>
            <input
              id="buscar-error"
              type="search"
              value={busquedaError}
              onChange={(evento) => {
                setBusquedaError(evento.target.value)
                setLimiteErrores(20)
              }}
              placeholder="ID, instituto o motivo"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Clave</th>
                <th scope="col" className="p-3">Profesional ID</th>
                <th scope="col" className="p-3">Instituto</th>
                <th scope="col" className="p-3">Período</th>
                <th scope="col" className="p-3">Motivo del rechazo</th>
              </tr>
            </thead>
            <tbody>
              {erroresFiltrados.slice(0, limiteErrores).map((item, indice) => (
                <tr key={`${item.clave}-${indice}`} className="border-b border-slate-200">
                  <td className="p-3">{item.clave}</td>
                  <td className="p-3">{item.personaId}</td>
                  <td className="p-3">{item.instituto}</td>
                  <td className="p-3">{item.periodo}</td>
                  <td className="p-3">{item.motivo}</td>
                </tr>
              ))}
              {erroresFiltrados.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-600">No hay errores para mostrar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {limiteErrores < erroresFiltrados.length && (
          <button
            type="button"
            onClick={() => setLimiteErrores((actual) => actual + 20)}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm text-[#003366] hover:bg-slate-50"
          >
            Mostrar 20 errores más
          </button>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Novedades contractuales ({novedadesFiltradas.length})</h2>
        <p className="mt-1 text-sm text-slate-600">Cambios detectados en los datos de referencia; no equivalen a modificaciones aprobadas.</p>
        <label htmlFor="buscar-novedad" className="mt-4 mb-1 block text-sm font-medium">Buscar novedad</label>
        <input
          id="buscar-novedad"
          type="search"
          value={busquedaNovedad}
          onChange={(evento) => {
            setBusquedaNovedad(evento.target.value)
            setLimiteNovedades(20)
          }}
          placeholder="ID, tipo de cambio o instituto"
          className="mb-4 w-full max-w-lg rounded-lg border border-slate-300 px-3 py-2"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Profesional ID</th>
                <th scope="col" className="p-3">Tipo de cambio</th>
                <th scope="col" className="p-3">Valor anterior</th>
                <th scope="col" className="p-3">Valor nuevo</th>
                <th scope="col" className="p-3">Vigencia</th>
                <th scope="col" className="p-3">Estado de validación</th>
              </tr>
            </thead>
            <tbody>
              {novedadesFiltradas.slice(0, limiteNovedades).map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="p-3">{item.personaId}</td>
                  <td className="p-3">{item.tipoCambio?.replaceAll('_', ' ')}</td>
                  <td className="p-3">{mostrarValor(item.valorAnterior)}</td>
                  <td className="p-3">{mostrarValor(item.valorNuevo)}</td>
                  <td className="p-3">{item.fechaVigencia}</td>
                  <td className="p-3">{item.estadoValidacion}</td>
                </tr>
              ))}
              {novedadesFiltradas.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-600">No se encontraron novedades.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {limiteNovedades < novedadesFiltradas.length && (
          <button
            type="button"
            onClick={() => setLimiteNovedades((actual) => actual + 20)}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm text-[#003366] hover:bg-slate-50"
          >
            Mostrar 20 novedades más
          </button>
        )}
      </section>
    </div>
  )
}

export default MonitoreoRPA
