import { Clock, CalendarCheck, Target, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import mockData from '../../data/mockData.json'
function Dashboard() {
  const resumen = mockData.resumenNacional
  const kpis = [
    { title: 'Horas semanales totales', value: resumen.horasSemanalesTotales.toLocaleString('es-CL'), description: 'Horas contractuales informadas', icon: Clock },
    { title: 'Atenciones planificadas anuales', value: resumen.atencionesAnualesTotales.toLocaleString('es-CL'), description: 'Proyección nacional', icon: CalendarCheck },
    { title: 'Meta de gestión asistencial', value: resumen.metaGestionNacional.toLocaleString('es-CL'), description: 'Meta nacional de referencia (90%)', icon: Target },
    { title: '% FOJA promedio', value: `${resumen.fojaPromedioNacional.toLocaleString('es-CL')}%`, description: 'Indicador promedio simulado', icon: Percent }
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-[#003366]">TELETÓN · GESTIÓN NACIONAL</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard nacional</h1><p className="mt-1 text-slate-500">Resumen general de la planificación asistencial.</p></div>
        <Badge type="warning">Datos simulados</Badge>
      </div>
      <section aria-label="Indicadores nacionales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => <Card key={item.title} {...item} accent={index === 1 ? 'blue' : 'red'} />)}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5"><h2 className="text-lg font-semibold text-slate-900">Atenciones planificadas por instituto</h2><p className="mt-1 text-sm text-slate-500">Vista preliminar de los 17 institutos contabilizados.</p></div>
        <div className="h-80 w-full" role="img" aria-label="Gráfico de barras con atenciones planificadas por instituto">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={mockData.institutos} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={65} /><YAxis tickFormatter={(value) => value.toLocaleString('es-CL')} /><Tooltip formatter={(value) => [Number(value).toLocaleString('es-CL'), 'Atenciones']} /><Bar dataKey="atenciones" name="Atenciones" fill="#003366" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs text-slate-500">Cifras de ejemplo para validar la interfaz; no representan resultados oficiales por sede.</p>
      </section>
    </div>
  )
}
export default Dashboard
