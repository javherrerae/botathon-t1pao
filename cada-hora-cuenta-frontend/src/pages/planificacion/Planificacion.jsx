import { useMemo, useState } from 'react'
import mockData from '../../data/mockData.json'
import Table from '../../components/ui/Table'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
function Planificacion() {
  const [busqueda, setBusqueda] = useState('')
  const [instituto, setInstituto] = useState('Todos')
  const [cargo, setCargo] = useState('Todos')
  const institutos = [...new Set(mockData.profesionales.map((p) => p.instituto))]
  const cargos = [...new Set(mockData.profesionales.map((p) => p.cargo))]
  const filtrados = useMemo(() => mockData.profesionales.filter((p) => {
    const coincideTexto = `${p.nombre} ${p.personaId}`.toLowerCase().includes(busqueda.toLowerCase())
    return coincideTexto && (instituto === 'Todos' || p.instituto === instituto) && (cargo === 'Todos' || p.cargo === cargo)
  }), [busqueda, instituto, cargo])
  const columns = [
    { key: 'nombre', label: 'Profesional' },
    { key: 'personaId', label: 'ID anonimizado' },
    { key: 'instituto', label: 'Instituto' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'horasContrato', label: 'Horas contrato' },
    { key: 'fojaPct', label: '% FOJA', render: (p) => <Badge type={p.fojaPct >= 90 ? 'success' : p.fojaPct >= 80 ? 'warning' : 'danger'}>{p.fojaPct}%</Badge> }
  ]
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-[#003366]">GESTIÓN ASISTENCIAL</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Planificación total</h1><p className="mt-1 text-slate-500">Consulta preliminar de profesionales y jornadas.</p></div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-semibold text-slate-900">Consolidado de profesionales</h2><p className="text-sm text-slate-500">Búsqueda y filtros sobre los registros de demostración.</p></div>
      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3"><label className="text-sm font-medium text-slate-700">Buscar por profesional o ID<input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Profesional o 137732" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-blue-100" /></label>
        <Select id="filtro-instituto" label="Instituto" value={instituto} onChange={setInstituto} options={[{ value: 'Todos', label: 'Todos los institutos' }, ...institutos.map((v) => ({ value: v, label: v }))]} />
        <Select id="filtro-cargo" label="Cargo / especialidad" value={cargo} onChange={setCargo} options={[{ value: 'Todos', label: 'Todos los cargos' }, ...cargos.map((v) => ({ value: v, label: v }))]} />
      </div>
      <p className="mb-3 text-sm text-slate-500">Mostrando {filtrados.length} de {mockData.profesionales.length} registros simulados.</p>
      <Table columns={columns} data={filtrados} rowKey="personaId" />
    </section>
  </div>
}
export default Planificacion
