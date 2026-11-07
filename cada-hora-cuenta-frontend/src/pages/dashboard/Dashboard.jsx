import { useEffect, useState } from 'react'
import { Clock, CalendarCheck, Target, Percent } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { obtenerResumenNacional, obtenerInstitutos } from '../../service/api'

function Dashboard() {
  const [resumen, setResumen] = useState(null)
  const [institutos, setInstitutos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([obtenerResumenNacional(), obtenerInstitutos()])
      .then(([res, inst]) => {
        setResumen(res)
        setInstitutos(inst)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [])

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">No se pudo conectar con FastAPI: {error}</p>

  if (cargando || !resumen) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-[#003366]">TELETÓN · GESTIÓN NACIONAL</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard nacional</h1>
        </div>
        <p className="text-slate-500">Cargando datos…</p>
      </div>
    )
  }

  const kpis = [
    {
      title: 'Horas semanales totales',
      value: resumen.horasSemanalesTotales.toLocaleString('es-CL'),
      description: 'Horas contractuales del último periodo',
      icon: Clock,
    },
    {
      title: 'Atenciones acumuladas',
      value: resumen.atencionesAcumuladas.toLocaleString('es-CL'),
      description: 'Suma de períodos procesados',
      icon: CalendarCheck,
    },
    {
      title: 'Meta de gestión acumulada',
      value: Math.round(resumen.metaGestionAcumulada).toLocaleString('es-CL'),
      description: 'Suma de metas de los meses procesados',
      icon: Target,
    },
    {
      title: '% FOJA promedio',
      value: `${resumen.fojaPromedioNacional}%`,
      description: `${resumen.profesionales} profesionales · ${resumen.institutosContabilizados} institutos`,
      icon: Percent,
    },
  ]

  // Para el gráfico usamos atenciones del periodo más reciente
  const datosGrafico = institutos.map((i) => ({
    nombre: i.nombre,
    atenciones: i.atenciones,
    metaGestion: Math.round(i.metaGestion),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#003366]">TELETÓN · GESTIÓN NACIONAL</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard nacional</h1>
          <p className="mt-1 text-slate-500">
            Último período: {resumen.periodoUltimo?.slice(0, 7)} · {resumen.periodosProcesados} mes(es) procesado(s)
          </p>
        </div>
        <Badge type={resumen.datosSimulados ? 'warning' : 'success'}>{resumen.datosSimulados ? 'Datos simulados' : 'Salida Blue Prism importada'}</Badge>
      </div>

      <section aria-label="Indicadores nacionales" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <Card key={item.title} {...item} accent={index === 1 ? 'blue' : 'red'} />
        ))}
      </section>

      {resumen.excepciones > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            ⚠ {resumen.excepciones} excepciones detectadas en el último periodo — revisa el módulo de Excepciones.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Atenciones por instituto</h2>
          <p className="mt-1 text-sm text-slate-500">
            Total acumulado en los {institutos.length} institutos procesados.
          </p>
        </div>
        <div className="h-80 w-full" role="img" aria-label="Gráfico de barras con atenciones por instituto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={65} />
              <YAxis tickFormatter={(v) => v.toLocaleString('es-CL')} />
              <Tooltip formatter={(v) => [Number(v).toLocaleString('es-CL'), 'Atenciones']} />
              <Bar dataKey="atenciones" name="Atenciones" fill="#AB0C02" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
