import { useMemo, useState, useEffect } from 'react'
import Table from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import { obtenerProfesionales, obtenerOpcionesFiltros } from '../../service/api'

const PAGE_SIZE = 20

function Planificacion() {
  const [busqueda, setBusqueda] = useState('')
  const [instituto, setInstituto] = useState('Todos')
  const [cargo, setCargo] = useState('Todos')
  const [profesionales, setProfesionales] = useState([])
  const [opciones, setOpciones] = useState({ institutos: [], cargos: [], periodos: [] })
  const [cargando, setCargando] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    Promise.all([obtenerProfesionales(), obtenerOpcionesFiltros()])
      .then(([profs, opts]) => {
        setProfesionales(profs)
        setOpciones(opts)
      })
      .finally(() => setCargando(false))
  }, [])


  const filtrados = useMemo(() => {
    return profesionales.filter((p) => {
      const coincideTexto = `${p.nombre} ${p.personaId}`.toLowerCase().includes(busqueda.toLowerCase())
      const coincideInstituto = instituto === 'Todos' || p.institutoCode === instituto || p.instituto === instituto
      const coincideCargo = cargo === 'Todos' || p.cargo.toLowerCase() === cargo.toLowerCase()
      return coincideTexto && coincideInstituto && coincideCargo
    })
  }, [profesionales, busqueda, instituto, cargo])

  const totalPages = Math.ceil(filtrados.length / PAGE_SIZE)
  const paginados = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const columns = [
    { key: 'nombre', label: 'Profesional' },
    { key: 'personaId', label: 'ID' },
    { key: 'instituto', label: 'Instituto' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'horasContrato', label: 'H/S' },
    { key: 'tramoJornada', label: 'Tramo' },
    {
      key: 'fojaPct',
      label: '% FOJA',
      render: (p) => (
        <Badge type={p.fojaPct >= 90 ? 'success' : p.fojaPct >= 80 ? 'warning' : 'danger'}>
          {p.fojaPct}%
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#003366]">GESTIÓN ASISTENCIAL</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Planificación total</h1>
        <p className="mt-1 text-slate-500">Profesionales procesados por Blue Prism.</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-semibold text-slate-900">Consolidado de profesionales</h2>
          <p className="text-sm text-slate-500">Último periodo disponible por profesional.</p>
        </div>

        {/* Filtros */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Buscar por profesional o ID
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. Profesional o 900001"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <Select
            id="filtro-instituto"
            label="Instituto"
            value={instituto}
            onChange={(v) => { setInstituto(v); setPage(1) }}
            options={[
              { value: 'Todos', label: 'Todos los institutos' },
              ...opciones.institutos.map((i) => ({ value: i.codigo, label: i.nombre })),
            ]}
          />
          <Select
            id="filtro-cargo"
            label="Cargo / especialidad"
            value={cargo}
            onChange={(v) => { setCargo(v); setPage(1) }}
            options={[
              { value: 'Todos', label: 'Todos los cargos' },
              ...opciones.cargos.map((v) => ({ value: v, label: v })),
            ]}
          />
        </div>

        {cargando ? (
          <p className="text-slate-500">Cargando profesionales…</p>
        ) : (
          <>
            <Table columns={columns} data={paginados} rowKey="personaId" />
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtrados.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  )
}

export default Planificacion
