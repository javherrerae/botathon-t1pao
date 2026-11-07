
import { useState } from 'react'
import { Bot, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import mockRPA from '../../data/mockRPA.json'

const estilosEstado = {
  Completado: 'bg-green-100 text-green-800',
  'Con observaciones': 'bg-yellow-100 text-yellow-900',
  Pendiente: 'bg-slate-100 text-slate-700',
  Error: 'bg-red-100 text-red-800'
}

function MonitoreoRPA() {
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('Todos')

  const { ejecuciones, novedades } = mockRPA

  const procesados = ejecuciones.filter(
    (item) =>
      item.estado === 'Completado' ||
      item.estado === 'Con observaciones'
  )

  const totalValidos = procesados.reduce(
    (total, item) => total + item.validos, 0
  )

  const totalErrores = procesados.reduce(
    (total, item) => total + item.errores, 0
  )

  const filtrados = ejecuciones.filter((item) => {
    const coincideNombre = item.archivo
      .toLowerCase()
      .includes(busqueda.toLowerCase())

    const coincideEstado =
      estado === 'Todos' || item.estado === estado

    return coincideNombre && coincideEstado
  })

  const indicadores = [
    {
      titulo: 'Archivos procesados',
      valor: procesados.length,
      icono: FileSpreadsheet
    },
    {
      titulo: 'Registros válidos',
      valor: totalValidos,
      icono: CheckCircle
    },
    {
      titulo: 'Registros con error',
      valor: totalErrores,
      icono: AlertTriangle
    },
    {
      titulo: 'Novedades detectadas',
      valor: novedades.length,
      icono: Bot
    }
  ]

  return (
    <div className="space-y-6">

      <div>
        <p className="text-sm font-semibold text-[#003366]">
          AUTOMATIZACIÓN RPA
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Monitoreo Blue Prism
        </h1>

        <p className="mt-1 text-slate-600">
          Supervisión de archivos BUK y SIC procesados.
        </p>

        <p className="mt-2 text-sm font-semibold text-amber-800">
          Modo demostración: datos simulados
        </p>
      </div>

      {/* Indicadores principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {indicadores.map((item) => {
          const Icono = item.icono

          return (
            <div
              key={item.titulo}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  {item.titulo}
                </p>

                <Icono
                  size={22}
                  className="text-[#003366]"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {item.valor.toLocaleString('es-CL')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Tabla de ejecuciones */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold">
          Historial de ejecuciones
        </h2>

        <div className="mb-5 flex flex-wrap gap-4">

          <div className="flex-1">
            <label
              htmlFor="buscar-archivo"
              className="mb-1 block text-sm font-medium"
            >
              Buscar archivo
            </label>

            <input
              id="buscar-archivo"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. BUK_2026"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="filtrar-estado"
              className="mb-1 block text-sm font-medium"
            >
              Estado
            </label>

            <select
              id="filtrar-estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option>Todos</option>
              <option>Completado</option>
              <option>Con observaciones</option>
              <option>Pendiente</option>
              <option>Error</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Archivo</th>
                <th scope="col" className="p-3">Fuente</th>
                <th scope="col" className="p-3">Fecha</th>
                <th scope="col" className="p-3">Estado</th>
                <th scope="col" className="p-3">Registros</th>
                <th scope="col" className="p-3">Errores</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200"
                >
                  <td className="p-3">{item.archivo}</td>
                  <td className="p-3">{item.fuente}</td>
                  <td className="p-3">{item.fecha || 'Sin ejecutar'}</td>

                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        estilosEstado[item.estado] || estilosEstado.Error
                      }`}
                    >
                      {item.estado}
                    </span>
                  </td>

                  <td className="p-3">{item.registros}</td>
                  <td className="p-3">{item.errores}</td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-600">
                    No se encontraron ejecuciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Novedades contractuales */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold">
          Novedades contractuales
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Profesional</th>
                <th scope="col" className="p-3">Tipo de cambio</th>
                <th scope="col" className="p-3">Valor anterior</th>
                <th scope="col" className="p-3">Valor nuevo</th>
                <th scope="col" className="p-3">Vigencia</th>
              </tr>
            </thead>

            <tbody>
              {novedades.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200"
                >
                  <td className="p-3">{item.profesionalId}</td>
                  <td className="p-3">{item.tipo}</td>
                  <td className="p-3">{item.valorAnterior}</td>
                  <td className="p-3">{item.valorNuevo}</td>
                  <td className="p-3">{item.fechaVigencia}</td>
                </tr>
              ))}

              {novedades.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-600">
                    No hay novedades registradas.
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

export default MonitoreoRPA
