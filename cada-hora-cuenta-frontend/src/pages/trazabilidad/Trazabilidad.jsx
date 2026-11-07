import { useEffect, useState } from 'react'
import { obtenerNovedades, actualizarEstadoNovedad } from '../../service/api'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 15

const TIPO_LABELS = {
  FIN_CONTRATO: 'Fin de contrato',
  CAMBIO_JORNADA: 'Cambio de jornada',
  NUEVO_INGRESO: 'Nuevo ingreso',
  CAMBIO_CARGO: 'Cambio de cargo',
}

const ESTADO_CONFIG = {
  PENDIENTE: { type: 'warning', label: 'Pendiente' },
  APROBADA: { type: 'success', label: 'Aprobada' },
  RECHAZADA: { type: 'danger', label: 'Rechazada' },
  INFORMATIVA: { type: 'default', label: 'Informativa' },
}

function Trazabilidad() {
  const [novedades, setNovedades] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState(null)
  const [page, setPage] = useState(1)

  const cargar = (params = {}) => {
    setCargando(true)
    obtenerNovedades(params)
      .then((r) => setNovedades(r.novedades ?? []))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    let vigente = true
    obtenerNovedades()
      .then((r) => { if (vigente) setNovedades(r.novedades ?? []) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [])

  const aplicarFiltros = () => {
    const params = {}
    if (filtroEstado) params.estado = filtroEstado
    if (filtroTipo) params.tipo = filtroTipo
    cargar(params)
  }

  const cambiarEstado = async (id, estado) => {
    setActualizando(id)
    try {
      await actualizarEstadoNovedad(id, estado)
      setNovedades((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estadoValidacion: estado } : n))
      )
    } catch (e) {
      alert(`Error: ${e.message}`)
    } finally {
      setActualizando(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(novedades.length / PAGE_SIZE))
  const paginadas = novedades.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pendientes = novedades.filter((n) => n.estadoValidacion === 'PENDIENTE').length

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Novedades y Trazabilidad</h1>
          <p className="mt-1 text-slate-500">
            Cambios detectados por Blue Prism que requieren validación.
          </p>
        </div>
        {pendientes > 0 && <Badge type="warning">{pendientes} pendiente(s)</Badge>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#003366] focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="APROBADA">Aprobada</option>
          <option value="RECHAZADA">Rechazada</option>
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => { setFiltroTipo(e.target.value); setPage(1) }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#003366] focus:outline-none"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={aplicarFiltros}
          className="rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004080]"
        >
          Filtrar
        </button>
        <button
          onClick={() => { setFiltroEstado(''); setFiltroTipo(''); setPage(1); cargar() }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {cargando ? (
          <p className="p-6 text-slate-500">Cargando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Profesional</th>
                  <th className="px-4 py-3">Tipo cambio</th>
                  <th className="px-4 py-3">Valor anterior</th>
                  <th className="px-4 py-3">Valor nuevo</th>
                  <th className="px-4 py-3">Vigencia</th>
                  <th className="px-4 py-3">Instituto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.map((n) => {
                  const cfg = ESTADO_CONFIG[n.estadoValidacion] ?? { type: 'default', label: n.estadoValidacion }
                  return (
                    <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{n.id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{n.personaId}</td>
                      <td className="px-4 py-3">{TIPO_LABELS[n.tipoCambio] ?? n.tipoCambio}</td>
                      <td className="px-4 py-3 text-slate-600">{n.valorAnterior ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{n.valorNuevo ?? '—'}</td>
                      <td className="px-4 py-3">{n.fechaVigencia?.slice(0, 7)}</td>
                      <td className="px-4 py-3">{n.instituto}</td>
                      <td className="px-4 py-3">
                        <Badge type={cfg.type}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {n.estadoValidacion === 'PENDIENTE' && (
                          <div className="flex gap-2">
                            <button
                              disabled={actualizando === n.id}
                              onClick={() => cambiarEstado(n.id, 'APROBADA')}
                              className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              disabled={actualizando === n.id}
                              onClick={() => cambiarEstado(n.id, 'RECHAZADA')}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {novedades.length === 0 && (
              <p className="p-6 text-center text-slate-500">No hay novedades con estos filtros.</p>
            )}
          </div>
        )}
      </div>
      {!cargando && <Pagination page={page} totalPages={totalPages} totalItems={novedades.length} pageSize={PAGE_SIZE} onChange={setPage} />}
    </section>
  )
}

export default Trazabilidad
