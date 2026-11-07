
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'

import mockSIC from '../../data/mockSIC.json'

// Clasifica el cumplimiento
function obtenerEstado(porcentaje) {
  if (porcentaje === null) {
    return {
      texto: 'Sin datos SIC',
      estilo: 'bg-slate-100 text-slate-700'
    }
  }

  if (porcentaje >= 90) {
    return {
      texto: 'Cumplimiento',
      estilo: 'bg-green-100 text-green-800'
    }
  }

  if (porcentaje >= 80) {
    return {
      texto: 'Alerta',
      estilo: 'bg-yellow-100 text-yellow-900'
    }
  }

  return {
    texto: 'Déficit',
    estilo: 'bg-red-100 text-red-800'
  }
}

const formato = (valor) =>
  valor.toLocaleString('es-CL')

function ComparativaSIC() {
  const { registros, porcentajeMeta } = mockSIC

  const [instituto, setInstituto] = useState('Todos')
  const [periodo, setPeriodo] = useState('Todos')

  const institutos = [
    ...new Set(registros.map((r) => r.instituto))
  ].sort()

  const periodos = [
    ...new Set(registros.map((r) => r.periodo))
  ].sort()

  // Aplicar filtros
  const filtrados = registros.filter((item) => {
    return (
      (instituto === 'Todos' ||
        item.instituto === instituto) &&
      (periodo === 'Todos' ||
        item.periodo === periodo)
    )
  })

  // Solo comparar registros con información SIC
  const comparables = filtrados.filter(
    (item) => Number.isFinite(item.ejecutadas)
  )

  const planificadas = comparables.reduce(
    (total, item) => total + item.planificadas, 0
  )

  const ejecutadas = comparables.reduce(
    (total, item) => total + item.ejecutadas, 0
  )

  const cumplimiento = planificadas > 0
    ? (ejecutadas / planificadas) * 100
    : null

  const pendientes = filtrados.length - comparables.length

  // Agrupar las cifras por instituto
  const datosGrafico = institutos
    .map((nombre) => {
      const filas = comparables.filter(
        (item) => item.instituto === nombre
      )

      return {
        instituto: nombre,
        planificadas: filas.reduce(
          (suma, item) => suma + item.planificadas, 0
        ),
        ejecutadas: filas.reduce(
          (suma, item) => suma + item.ejecutadas, 0
        )
      }
    })
    .filter((item) =>
      item.planificadas > 0 &&
      (instituto === 'Todos' || item.instituto === instituto)
    )

  const indicadores = [
    {
      titulo: 'Atenciones planificadas',
      valor: formato(planificadas)
    },
    {
      titulo: 'Atenciones ejecutadas',
      valor: formato(ejecutadas)
    },
    {
      titulo: 'Cumplimiento',
      valor: cumplimiento === null
        ? 'Sin datos'
        : `${cumplimiento.toFixed(1)}%`
    },
    {
      titulo: 'Registros sin SIC',
      valor: pendientes
    }
  ]

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#003366]">
          GESTIÓN ASISTENCIAL
        </p>

        <h1 className="mt-1 text-2xl font-bold">
          Comparativa Planificado vs. Ejecutado
        </h1>

        <p className="mt-1 text-slate-600">
          Seguimiento de las atenciones registradas en SIC.
        </p>

        <p className="mt-2 text-sm font-semibold text-amber-800">
          Modo demostración: datos simulados
        </p>
      </header>

      {/* Filtros */}
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div>
          <label
            htmlFor="sic-instituto"
            className="mb-1 block text-sm font-medium"
          >
            Instituto
          </label>

          <select
            id="sic-instituto"
            value={instituto}
            onChange={(e) => setInstituto(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2"
          >
            <option value="Todos">Todos los institutos</option>
            {institutos.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sic-periodo"
            className="mb-1 block text-sm font-medium"
          >
            Período
          </label>

          <select
            id="sic-periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2"
          >
            <option value="Todos">Todos los períodos</option>
            {periodos.map((mes) => (
              <option key={mes} value={mes}>
                {mes}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map((item) => (
          <article
            key={item.titulo}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-slate-600">
              {item.titulo}
            </p>
            <p className="mt-3 text-3xl font-bold text-[#003366]">
              {item.valor}
            </p>
          </article>
        ))}
      </section>

      <p className="text-sm text-slate-600">
        Los indicadores y el gráfico consideran únicamente
        períodos con datos SIC disponibles. La meta de gestión
        configurada para esta demostración es {porcentajeMeta}%.
      </p>

      {/* Gráfico */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Atenciones por instituto
        </h2>

        {datosGrafico.length > 0 ? (
          <div
            className="h-80 w-full"
            role="img"
            aria-label="Comparación gráfica de atenciones planificadas y ejecutadas por instituto. Los mismos valores están disponibles en la tabla inferior."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="instituto" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="planificadas"
                  name="Planificadas"
                  fill="#003366"
                />
                <Bar
                  dataKey="ejecutadas"
                  name="Ejecutadas"
                  fill="#16A34A"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-600">
            No hay datos SIC para generar el gráfico.
          </p>
        )}
      </section>

      {/* Tabla */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">
          Detalle mensual de cumplimiento
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Período</th>
                <th scope="col" className="p-3">Instituto</th>
                <th scope="col" className="p-3">Planificadas</th>
                <th scope="col" className="p-3">Ejecutadas</th>
                <th scope="col" className="p-3">Cumplimiento</th>
                <th scope="col" className="p-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((item) => {
                const tieneSIC = Number.isFinite(
                  item.ejecutadas
                )

                const porcentaje = tieneSIC &&
                  item.planificadas > 0
                  ? (item.ejecutadas / item.planificadas) * 100
                  : null

                const estado = obtenerEstado(porcentaje)

                return (
                  <tr
                    key={item.id}
                    className="border-b border-slate-200"
                  >
                    <td className="p-3">{item.periodo}</td>
                    <td className="p-3">{item.instituto}</td>
                    <td className="p-3">
                      {formato(item.planificadas)}
                    </td>
                    <td className="p-3">
                      {tieneSIC
                        ? formato(item.ejecutadas)
                        : 'Sin datos SIC'}
                    </td>
                    <td className="p-3">
                      {porcentaje === null
                        ? '—'
                        : `${porcentaje.toFixed(1)}%`}
                    </td>
                    <td className="p-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${estado.estilo}`}>
                        {estado.texto}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-5 text-center text-slate-600"
                  >
                    No hay registros para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default ComparativaSIC
