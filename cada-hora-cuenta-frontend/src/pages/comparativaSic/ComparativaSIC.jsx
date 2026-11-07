import { useEffect, useState } from 'react'
import { obtenerEvolucion } from '../../service/api'

function ComparativaSIC() {
  const [periodos, setPeriodos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vigente = true
    obtenerEvolucion()
      .then((rows) => { if (vigente) setPeriodos(Array.isArray(rows) ? rows : []) })
      .catch((e) => { if (vigente) setError(e.message) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [])

  const total = periodos.reduce((acc, p) => acc + (Number(p.atenciones) || 0), 0)
  const meta = periodos.reduce((acc, p) => acc + (Number(p.metaGestion) || 0), 0)
  const formato = (v) => Math.round(v).toLocaleString('es-CL')

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Comparativa planificado vs. ejecutado</h1>
        <p className="mt-1 text-slate-500">Planificación procesada por Blue Prism y futuro contraste con atenciones ejecutadas en SIC.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">No se pudo consultar el backend: {error}</p>}
      {cargando ? <p className="text-slate-500">Cargando planificación…</p> : !error && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">Atenciones planificadas · períodos disponibles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formato(total)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">Meta de gestión acumulada</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formato(meta)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs text-slate-500">Meses disponibles</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{periodos.length}</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr><th className="px-4 py-3">Período</th><th className="px-4 py-3">Planificadas (BUK)</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Ejecutadas (SIC)</th></tr>
              </thead>
              <tbody>{periodos.map((p) => (
                <tr key={p.periodo} className="border-t border-slate-100">
                  <td className="px-4 py-3">{p.periodo?.slice(0,7)}</td>
                  <td className="px-4 py-3">{formato(p.atenciones || 0)}</td>
                  <td className="px-4 py-3">{formato(p.metaGestion || 0)}</td>
                  <td className="px-4 py-3 text-amber-700">Sin información SIC</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-semibold text-amber-900">Sin información SIC</p>
        <p className="mt-1 text-sm text-amber-800">El Excel entregado por Blue Prism contiene cálculos BUK, pero no atenciones ejecutadas del SIC. No mostraremos porcentajes de cumplimiento ni desviaciones hasta recibir un reporte SIC verificable.</p>
      </div>
    </section>
  )
}
export default ComparativaSIC
