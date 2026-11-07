
import { useMemo, useState } from 'react'
import { History, Search, Eye, X, FileClock } from 'lucide-react'
import mockTrazabilidad from '../../data/mockTrazabilidad.json'

function Trazabilidad() {
  const { historial } = mockTrazabilidad

  const [busqueda, setBusqueda] = useState('')
  const [instituto, setInstituto] = useState('Todos')
  const [accion, setAccion] = useState('Todas')
  const [detalleId, setDetalleId] = useState(null)

  // Opciones para los filtros
  const institutos = [...new Set(
    historial.map((item) => item.instituto)
  )]

  const acciones = [...new Set(
    historial.map((item) => item.accion)
  )]

  // Filtrar los registros del historial
  const registrosFiltrados = useMemo(() => {
    return historial.filter((item) => {
      const texto = `${item.usuario} ${item.profesionalId} ${item.accion}`
        .toLowerCase()

      const coincideBusqueda = texto.includes(
        busqueda.trim().toLowerCase()
      )

      const coincideInstituto =
        instituto === 'Todos' || item.instituto === instituto

      const coincideAccion =
        accion === 'Todas' || item.accion === accion

      return coincideBusqueda && coincideInstituto && coincideAccion
    }).sort((a, b) => {
      const fechaA = `${a.fecha}T${a.hora}`
      const fechaB = `${b.fecha}T${b.hora}`
      return fechaB.localeCompare(fechaA)
    })
  }, [historial, busqueda, instituto, accion])

  // Registro seleccionado para ver sus detalles
  const detalle = historial.find(
    (item) => item.id === detalleId
  )

  function limpiarFiltros() {
    setBusqueda('')
    setInstituto('Todos')
    setAccion('Todas')
  }

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <header>
        <p className="text-sm font-semibold text-[#003366]">
          AUDITORÍA DEL SISTEMA
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Bitácora de Trazabilidad
        </h1>

        <p className="mt-1 text-slate-600">
          Historial de modificaciones de la planificación asistencial.
        </p>

        <p className="mt-2 text-sm font-semibold text-amber-800">
          Modo demostración: datos simulados
        </p>
      </header>

      {/* Indicadores */}
      <section
        aria-label="Resumen de auditoría"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Modificaciones registradas
            </p>
            <History className="text-[#003366]" size={22} />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {historial.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Institutos involucrados
            </p>
            <FileClock className="text-[#003366]" size={22} />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {institutos.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Resultados de búsqueda
            </p>
            <Search className="text-[#003366]" size={22} />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {registrosFiltrados.length}
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Consultar historial
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div>
            <label
              htmlFor="buscar-trazabilidad"
              className="mb-1 block text-sm font-medium"
            >
              Buscar registro
            </label>

            <input
              id="buscar-trazabilidad"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Profesional, usuario o acción"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="filtro-instituto-trazabilidad"
              className="mb-1 block text-sm font-medium"
            >
              Instituto
            </label>

            <select
              id="filtro-instituto-trazabilidad"
              value={instituto}
              onChange={(e) => setInstituto(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              htmlFor="filtro-accion-trazabilidad"
              className="mb-1 block text-sm font-medium"
            >
              Tipo de acción
            </label>

            <select
              id="filtro-accion-trazabilidad"
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Todas">Todas las acciones</option>

              {acciones.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiarFiltros}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Limpiar filtros
        </button>
      </section>

      {/* Tabla de historial */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="mb-4 text-lg font-semibold">
          Historial de modificaciones
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Fecha</th>
                <th scope="col" className="p-3">Responsable</th>
                <th scope="col" className="p-3">Profesional</th>
                <th scope="col" className="p-3">Instituto</th>
                <th scope="col" className="p-3">Acción</th>
                <th scope="col" className="p-3">Detalle</th>
              </tr>
            </thead>

            <tbody>
              {registrosFiltrados.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="p-3">
                    <div>{item.fecha}</div>
                    <div className="text-xs text-slate-500">
                      {item.hora}
                    </div>
                  </td>

                  <td className="p-3">{item.usuario}</td>

                  <td className="p-3">
                    {item.profesionalId}
                  </td>

                  <td className="p-3">{item.instituto}</td>

                  <td className="p-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
                      {item.accion}
                    </span>
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => setDetalleId(item.id)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[#003366] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                      aria-label={`Ver detalle del registro ${item.id}`}
                    >
                      <Eye size={17} aria-hidden="true" />
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}

              {registrosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 text-center text-slate-600"
                  >
                    No se encontraron modificaciones con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detalle del registro seleccionado */}
      {detalle && (
        <section
          aria-label="Detalle de modificación"
          className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#003366]">
              Detalle de modificación
            </h2>

            <button
              type="button"
              onClick={() => setDetalleId(null)}
              aria-label="Cerrar detalle"
              className="rounded-lg p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-600">
                Responsable
              </p>
              <p className="font-medium">{detalle.usuario}</p>
            </div>

            <div>
              <p className="text-sm text-slate-600">
                Profesional
              </p>
              <p className="font-medium">
                {detalle.profesionalId}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-600">
                Campo modificado
              </p>
              <p className="font-medium">{detalle.campo}</p>
            </div>

            <div>
              <p className="text-sm text-slate-600">
                Origen del cambio
              </p>
              <p className="font-medium">{detalle.origen}</p>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                Valor anterior
              </p>
              <p className="mt-1 font-semibold">
                {detalle.valorAnterior}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Valor nuevo
              </p>
              <p className="mt-1 font-semibold">
                {detalle.valorNuevo}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold">
              Justificación
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {detalle.justificacion}
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

export default Trazabilidad
