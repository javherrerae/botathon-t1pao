import { useEffect, useState } from 'react'
import { obtenerEjecuciones, obtenerErroresEjecucion } from '../../service/api'
import Badge from '../../components/ui/Badge'
import ImportarEjecucion from './ImportarEjecucion'

const ESTADO_CONFIG = {
  COMPLETADO: { type: 'success', label: 'Completado' },
  COMPLETADO_CON_OBSERVACIONES: { type: 'warning', label: 'Con observaciones' },
  ERROR: { type: 'danger', label: 'Error' },
  EN_PROCESO: { type: 'info', label: 'En proceso' },
}

function MonitoreoRPA() {
  const [ejecuciones, setEjecuciones] = useState([])
  const [erroresSeleccionados, setErroresSeleccionados] = useState([])
  const [ejecucionActiva, setEjecucionActiva] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cargandoErrores, setCargandoErrores] = useState(false)

  const cargarEjecuciones = () =>
    obtenerEjecuciones()
      .then((r) => setEjecuciones(r.ejecuciones ?? []))
      .finally(() => setCargando(false))

  useEffect(() => { cargarEjecuciones() }, [])

  const verErrores = async (ej) => {
    setEjecucionActiva(ej)
    setCargandoErrores(true)
    try {
      const r = await obtenerErroresEjecucion(ej.ejecucionId)
      setErroresSeleccionados(r.errores ?? [])
    } finally {
      setCargandoErrores(false)
    }
  }

  if (cargando) return <p className="text-slate-500">Cargando ejecuciones…</p>

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Monitoreo Blue Prism</h1>
        <p className="mt-1 text-slate-500">Supervisión de archivos procesados por el bot.</p>
      </div>

      <ImportarEjecucion onImportado={cargarEjecuciones} />

      {/* Tarjetas de ejecuciones */}
      {ejecuciones.map((ej) => {
        const cfg = ESTADO_CONFIG[ej.estado] ?? { type: 'default', label: ej.estado }
        const pctExito = ej.totalRegistros > 0
          ? Math.round((ej.validos / ej.totalRegistros) * 100)
          : 0
        return (
          <div key={ej.ejecucionId} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{ej.ejecucionId}</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{ej.archivo}</h2>
                <p className="text-sm text-slate-500">Fuente: {ej.fuente} · {new Date(ej.fechaHora).toLocaleString('es-CL')}</p>
              </div>
              <Badge type={cfg.type}>{cfg.label}</Badge>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Total registros</p>
                <p className="mt-1 text-xl font-bold text-slate-800">{ej.totalRegistros.toLocaleString('es-CL')}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-xs text-green-700">Válidos</p>
                <p className="mt-1 text-xl font-bold text-green-800">{ej.validos.toLocaleString('es-CL')}</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-xs text-red-700">Rechazados</p>
                <p className="mt-1 text-xl font-bold text-red-800">{ej.rechazados.toLocaleString('es-CL')}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">% Éxito</p>
                <p className={`mt-1 text-xl font-bold ${pctExito >= 90 ? 'text-green-700' : 'text-amber-700'}`}>{pctExito}%</p>
              </div>
            </div>

            {ej.rechazados > 0 && (
              <button
                onClick={() => verErrores(ej)}
                className="mt-2 rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004080] transition-colors"
              >
                Ver {ej.rechazados} excepciones
              </button>
            )}
          </div>
        )
      })}

      {/* Panel de errores */}
      {ejecucionActiva && (
        <div className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Excepciones · {ejecucionActiva.ejecucionId}
            </h2>
            <button onClick={() => setEjecucionActiva(null)} className="text-sm text-slate-500 hover:text-slate-800">
              Cerrar ✕
            </button>
          </div>
          {cargandoErrores ? (
            <p className="text-slate-500">Cargando errores…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="pb-2 pr-4">ID Profesional</th>
                    <th className="pb-2 pr-4">Instituto</th>
                    <th className="pb-2 pr-4">Periodo</th>
                    <th className="pb-2 pr-4">Tipo</th>
                    <th className="pb-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {erroresSeleccionados.map((e) => (
                    <tr key={e.clave} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 pr-4 font-mono text-xs">{e.personaId}</td>
                      <td className="py-2 pr-4">{e.instituto}</td>
                      <td className="py-2 pr-4">{e.periodo?.slice(0, 7)}</td>
                      <td className="py-2 pr-4">
                        <Badge type={e.tipo === 'Business Exception' ? 'warning' : 'danger'}>
                          {e.tipo}
                        </Badge>
                      </td>
                      <td className="py-2 text-slate-600">{e.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default MonitoreoRPA
