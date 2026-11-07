import { useEffect, useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from 'recharts'
import { obtenerMeta, obtenerResumenInstituto } from '../../service/bluePrismService'

const numero = (valor) => Number(valor ?? 0).toLocaleString('es-CL')
const mes = (periodo) => periodo || 'Sin período'

function ComparativaSIC() {
  const [datos, setDatos] = useState({ resumen: [], meta: null })
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)
  const [instituto, setInstituto] = useState('Todos')
  const [periodo, setPeriodo] = useState('Todos')

  useEffect(() => {
    let activo = true
    Promise.all([obtenerResumenInstituto(), obtenerMeta()])
      .then(([resumen, meta]) => {
        if (activo) {
          setDatos({ resumen, meta })
          setErrorCarga('')
        }
      })
      .catch((error) => {
        if (activo) setErrorCarga(error.message || 'No se pudieron cargar los datos')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => { activo = false }
  }, [intento])

  const { resumen, meta } = datos
  const institutos = useMemo(
    () => [...new Set(resumen.map((fila) => fila.institutoNombre || fila.instituto))].sort(),
    [resumen]
  )
  const periodos = useMemo(
    () => [...new Set(resumen.map((fila) => fila.periodo))].sort(),
    [resumen]
  )

  const filtrados = useMemo(() => resumen.filter((fila) =>
    (instituto === 'Todos' || (fila.institutoNombre || fila.instituto) === instituto) &&
    (periodo === 'Todos' || fila.periodo === periodo)
  ), [resumen, instituto, periodo])

  const planificadas = filtrados.reduce((suma, fila) => suma + Number(fila.atencionesTotal ?? 0), 0)
  const metaGestion = filtrados.reduce((suma, fila) => suma + Number(fila.metaGestion ?? 0), 0)
  const porcentajeMeta = Number(meta?.parametros?.metaGestionPct ?? 0) * 100

  const datosGrafico = useMemo(() => {
    const grupos = new Map()
    for (const fila of filtrados) {
      const nombre = fila.institutoNombre || fila.instituto
      const actual = grupos.get(nombre) || { instituto: nombre, planificadas: 0, meta: 0 }
      actual.planificadas += Number(fila.atencionesTotal ?? 0)
      actual.meta += Number(fila.metaGestion ?? 0)
      grupos.set(nombre, actual)
    }
    return [...grupos.values()].sort((a, b) => a.instituto.localeCompare(b.instituto))
  }, [filtrados])

  if (cargando) return <p role="status" className="p-6 text-slate-600">Cargando planificación de referencia...</p>

  if (errorCarga) {
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-red-800">No se pudo cargar la planificación</h1>
        <p className="mt-2 text-sm text-slate-600">{errorCarga}</p>
        <button
          type="button"
          className="mt-4 rounded-lg bg-[#003366] px-4 py-2 text-white"
          onClick={() => {
            setCargando(true)
            setErrorCarga('')
            setIntento((valor) => valor + 1)
          }}
        >Reintentar</button>
      </section>
    )
  }

  const indicadores = [
    { titulo: 'Atenciones planificadas', valor: numero(planificadas) },
    { titulo: `Meta de gestión (${numero(porcentajeMeta)} %)`, valor: numero(metaGestion) },
    { titulo: 'Atenciones ejecutadas', valor: 'Sin información SIC' },
    { titulo: 'Cumplimiento real', valor: 'No disponible' }
  ]

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#003366]">GESTIÓN ASISTENCIAL</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Comparativa Planificado vs. Ejecutado</h1>
        <p className="mt-1 text-slate-600">Planificación mensual por instituto y seguimiento de los datos pendientes de SIC.</p>
        <p className="mt-2 text-sm font-semibold text-amber-800">
          Modo demostración: cifras de planificación representadas en un JSON de referencia, no una ejecución real de Blue Prism.
        </p>
      </header>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2" aria-label="Filtros de comparación">
        <div>
          <label htmlFor="sic-instituto" className="mb-1 block text-sm font-medium">Instituto</label>
          <select id="sic-instituto" value={instituto} onChange={(e) => setInstituto(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2">
            <option value="Todos">Todos los institutos</option>
            {institutos.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sic-periodo" className="mb-1 block text-sm font-medium">Período</label>
          <select id="sic-periodo" value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2">
            <option value="Todos">Todos los períodos</option>
            {periodos.map((valor) => <option key={valor} value={valor}>{mes(valor)}</option>)}
          </select>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores de planificación y SIC">
        {indicadores.map((item) => (
          <article key={item.titulo} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">{item.titulo}</p>
            <p className="mt-3 text-xl font-bold text-[#003366] sm:text-2xl">{item.valor}</p>
          </article>
        ))}
      </section>

      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Sin información SIC.</strong> El JSON actual contiene planificación BUK, pero no atenciones ejecutadas.
        No se calcula cumplimiento ni se considera el dato ausente como cero.
        Los cambios de parámetros hechos en la interfaz no recalculan este JSON: eso necesitará integración con el backend.
      </p>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Planificación y meta por instituto</h2>
        <p className="mb-4 text-sm text-slate-600">Este gráfico muestra solo planificación y meta, no ejecución SIC.</p>
        {datosGrafico.length ? (
          <div className="h-80 w-full" role="img" aria-label="Atenciones planificadas y meta por instituto; los valores también aparecen en la tabla.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="instituto" />
                <YAxis />
                <Tooltip formatter={(valor) => numero(valor)} />
                <Legend />
                <Bar dataKey="planificadas" name="Planificadas" fill="#003366" />
                <Bar dataKey="meta" name="Meta de gestión" fill="#16A34A" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-slate-600">No hay registros para los filtros seleccionados.</p>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Detalle mensual ({filtrados.length} filas instituto-período)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Período</th>
                <th scope="col" className="p-3">Instituto</th>
                <th scope="col" className="p-3">Planificadas</th>
                <th scope="col" className="p-3">Meta</th>
                <th scope="col" className="p-3">Ejecutadas SIC</th>
                <th scope="col" className="p-3">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((fila) => (
                <tr key={`${fila.it}-${fila.periodo}`} className="border-b border-slate-200">
                  <td className="p-3">{mes(fila.periodo)}</td>
                  <td className="p-3">{fila.institutoNombre || fila.instituto}</td>
                  <td className="p-3">{numero(fila.atencionesTotal)}</td>
                  <td className="p-3">{numero(fila.metaGestion)}</td>
                  <td className="p-3 text-slate-600">Sin información SIC</td>
                  <td className="p-3">—</td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-600">No hay registros para estos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default ComparativaSIC
