import { useState } from 'react'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 20
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Select from '../../components/ui/Select'
import { actualizarEstadoAsignacion } from '../../service/asignacionesService'

// Texto + color de cada estado (el texto evita depender solo del color)
const ESTADOS = {
  REGISTRADA: { texto: 'Registrada', tipo: 'default' },
  PENDIENTE: { texto: 'Pendiente DMN', tipo: 'warning' },
  APROBADA: { texto: 'Aprobada', tipo: 'success' },
  RECHAZADA: { texto: 'Rechazada', tipo: 'danger' },
}

const OPCIONES_FILTRO = [
  { value: 'TODOS', label: 'Todos los estados' },
  ...Object.entries(ESTADOS).map(([value, estado]) => ({ value, label: estado.texto })),
]

// '2026-05-01' → '01-05-2026'
const formatearFecha = (iso) => iso.split('-').reverse().join('-')

function TablaAsignaciones({ asignaciones, tipos, onCambioEstado }) {
  const [filtro, setFiltro] = useState('TODOS')
  const [seleccionada, setSeleccionada] = useState(null) // asignación abierta en el modal
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')

  const nombreTipo = (tipoId) => tipos.find((t) => t.id === tipoId)?.nombre ?? tipoId
  const pendientes = asignaciones.filter((a) => a.estado === 'PENDIENTE').length
  const filtradas = filtro === 'TODOS' ? asignaciones : asignaciones.filter((a) => a.estado === filtro)

  const cerrarModal = () => {
    setSeleccionada(null)
    setError('')
  }

  const resolver = async (nuevoEstado) => {
    setProcesando(true)
    setError('')
    try {
      await actualizarEstadoAsignacion(seleccionada.id, nuevoEstado)
      cerrarModal()
      onCambioEstado?.() // la página recarga la lista
    } catch (e) {
      setError(e.message)
    } finally {
      setProcesando(false)
    }
  }

    const [page, setPage] = useState(1);
  const totalItems = filtradas.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginated = filtradas.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const columnas = [
    { key: 'id', label: 'ID' },
    { key: 'personaId', label: 'Profesional' },
    { key: 'tipoId', label: 'Tipo', render: (a) => nombreTipo(a.tipoId) },
    { key: 'horasSemanales', label: 'H/S', render: (a) => a.horasSemanales.toLocaleString('es-CL') },
    {
      key: 'vigencia',
      label: 'Vigencia',
      render: (a) => `${formatearFecha(a.vigenciaDesde)} al ${formatearFecha(a.vigenciaHasta)}`,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (a) => <Badge type={ESTADOS[a.estado]?.tipo}>{ESTADOS[a.estado]?.texto ?? a.estado}</Badge>,
    },
    { key: 'responsable', label: 'Autoriza', render: (a) => a.responsableAutorizacion ?? 'No requiere' },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (a) => (
        <Button
          variant={a.estado === 'PENDIENTE' ? 'secondary' : 'outline'}
          onClick={() => setSeleccionada(a)}
          className="px-3 py-1 text-xs"
        >
          {a.estado === 'PENDIENTE' ? 'Revisar' : 'Ver detalle'}
        </Button>
      ),
    },
  ]

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Asignaciones registradas</h2>
          <p className="text-sm text-slate-500">
            {pendientes > 0
              ? `${pendientes} asignación(es) pendiente(s) de aprobación DMN.`
              : 'No hay asignaciones pendientes de aprobación.'}
          </p>
        </div>
        <Select
          id="filtroEstado"
          label="Filtrar por estado"
          value={filtro}
          onChange={setFiltro}
          options={OPCIONES_FILTRO}
          className="w-56"
        />
      </div>

      <Table
        columns={columnas}
        data={paginated}
        emptyMessage="No hay asignaciones con ese estado."
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      <Modal open={Boolean(seleccionada)} title={`Asignación ${seleccionada?.id ?? ''}`} onClose={cerrarModal}>
        {seleccionada && (
          <div className="space-y-4">
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Profesional</dt>
              <dd className="col-span-2 font-medium">{seleccionada.personaId}</dd>
              <dt className="text-slate-500">Tipo</dt>
              <dd className="col-span-2 font-medium">{nombreTipo(seleccionada.tipoId)}</dd>
              <dt className="text-slate-500">Horas</dt>
              <dd className="col-span-2 font-medium">{seleccionada.horasSemanales} H/S</dd>
              <dt className="text-slate-500">Vigencia</dt>
              <dd className="col-span-2 font-medium">
                {formatearFecha(seleccionada.vigenciaDesde)} al {formatearFecha(seleccionada.vigenciaHasta)}
              </dd>
              <dt className="text-slate-500">Estado</dt>
              <dd className="col-span-2">
                <Badge type={ESTADOS[seleccionada.estado]?.tipo}>{ESTADOS[seleccionada.estado]?.texto}</Badge>
              </dd>
              <dt className="text-slate-500">Autoriza</dt>
              <dd className="col-span-2 font-medium">{seleccionada.responsableAutorizacion ?? 'No requiere'}</dd>
              <dt className="text-slate-500">Justificación</dt>
              <dd className="col-span-2">{seleccionada.justificacion}</dd>
            </dl>

            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

            {seleccionada.estado === 'PENDIENTE' && (
              <>
                <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                  Simulación: la aprobación efectiva la realizará el backend.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="primary" disabled={procesando} onClick={() => resolver('RECHAZADA')}>
                    Rechazar
                  </Button>
                  <Button variant="secondary" disabled={procesando} onClick={() => resolver('APROBADA')}>
                    Aprobar
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}

export default TablaAsignaciones