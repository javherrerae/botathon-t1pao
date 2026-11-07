import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Table from '../../components/ui/Table'
import {
  esDatoSimulado,
  obtenerPeriodos,
  obtenerProfesionalesMultiInstituto,
} from '../../service/excepcionesService'
import { construirFilas } from '../../utils/validacionesMultiInstituto'

const ESTADOS = {
  OK: { texto: 'Consistente', tipo: 'success' },
  ADVERTENCIA: { texto: 'Advertencia', tipo: 'warning' },
  ERROR: { texto: 'Inconsistencia', tipo: 'danger' },
}

const OPCIONES_ESTADO = [
  { value: 'TODOS', label: 'Todos los estados' },
  ...Object.entries(ESTADOS).map(([value, e]) => ({ value, label: e.texto })),
]

function Excepciones() {
  const [datos, setDatos] = useState(null) // { profesionales, periodos }
  const [error, setError] = useState('')
  const [filtroPeriodo, setFiltroPeriodo] = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  useEffect(() => {
    Promise.all([obtenerProfesionalesMultiInstituto(), obtenerPeriodos()])
      .then(([profesionales, periodos]) => setDatos({ profesionales, periodos }))
      .catch(() => setError('No se pudieron cargar los profesionales multi-instituto.'))
  }, [])

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>
  if (!datos) return <p className="text-slate-500">Cargando profesionales multi-instituto...</p>

  // Filas calculadas + filtros
  const filas = construirFilas(datos.profesionales, datos.periodos)
  const filtradas = filas.filter(
    (f) =>
      (filtroPeriodo === 'TODOS' || f.periodoId === filtroPeriodo) &&
      (filtroEstado === 'TODOS' || f.estado === filtroEstado)
  )

  const cantidadErrores = filas.filter((f) => f.estado === 'ERROR').length
  const cantidadAdvertencias = filas.filter((f) => f.estado === 'ADVERTENCIA').length

  const opcionesPeriodo = [
    { value: 'TODOS', label: 'Todos los periodos' },
    ...datos.periodos.map((p) => ({ value: p.id, label: p.nombre })),
  ]

  const columnas = [
    {
      key: 'personaId',
      label: 'Profesional',
      render: (f) => (
        <div>
          <p className="font-semibold text-slate-900">{f.personaId}</p>
          <p className="text-xs text-slate-500">{f.cargo}</p>
        </div>
      ),
    },
    { key: 'periodoNombre', label: 'Periodo' },
    {
      key: 'distribucion',
      label: 'Horas por instituto',
      render: (f) => (
        <ul className="space-y-1">
          {f.distribucion.map((d) => (
            <li key={d.instituto} className={d.horas === 0 ? 'text-slate-400' : ''}>
              {d.instituto}: <strong>{d.horas} h</strong>
            </li>
          ))}
        </ul>
      ),
    },
    { key: 'totalAsignado', label: 'Total asignado', render: (f) => `${f.totalAsignado} H/S` },
    { key: 'horasContrato', label: 'Contrato', render: (f) => `${f.horasContrato} H/S` },
    {
      key: 'estado',
      label: 'Estado',
      render: (f) => (
        <div className="space-y-1">
          <Badge type={ESTADOS[f.estado].tipo}>{ESTADOS[f.estado].texto}</Badge>
          <p className="text-xs text-slate-600">{f.mensaje}</p>
        </div>
      ),
    },
    {
      key: 'observaciones',
      label: 'Observaciones',
      render: (f) => (
        <div className="space-y-1 text-xs">
          <p>{f.observaciones}</p>
          {f.institutosSinHoras.length > 0 && (
            <p className="text-slate-500">Sin horas este periodo en: {f.institutosSinHoras.join(', ')}</p>
          )}
        </div>
      ),
    },
  ]

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Excepciones multi-instituto</h1>
          <p className="mt-1 text-slate-500">Profesionales que distribuyen su jornada entre dos o más institutos.</p>
        </div>
        {esDatoSimulado() && <Badge type="warning">Datos simulados</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Profesionales multi-instituto" value={datos.profesionales.length} icon={Users} accent="blue" />
        <Card title="Inconsistencias" value={cantidadErrores} description="Más horas que las del contrato" />
        <Card title="Advertencias" value={cantidadAdvertencias} description="Horas sin distribuir" />
      </div>

      <div className="flex flex-wrap gap-4">
        <Select id="filtroPeriodo" label="Periodo" value={filtroPeriodo} onChange={setFiltroPeriodo} options={opcionesPeriodo} className="w-60" />
        <Select id="filtroEstadoMulti" label="Estado" value={filtroEstado} onChange={setFiltroEstado} options={OPCIONES_ESTADO} className="w-60" />
      </div>

      <Table columns={columnas} data={filtradas} emptyMessage="No hay profesionales con esos filtros." />
    </section>
  )
}

export default Excepciones