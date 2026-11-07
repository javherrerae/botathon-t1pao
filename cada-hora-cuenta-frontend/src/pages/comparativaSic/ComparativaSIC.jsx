function ComparativaSIC() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Comparativa planificado vs. ejecutado</h1>
        <p className="mt-1 text-slate-500">Contraste de planificación con atenciones registradas en SIC.</p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-semibold text-amber-900">Sin información SIC</p>
        <p className="mt-1 text-sm text-amber-800">
          El kit disponible no incluye un reporte SIC independiente. No se mostrarán cifras ejecutadas ni porcentajes de cumplimiento hasta incorporar ese archivo.
        </p>
      </div>
    </section>
  )
}
export default ComparativaSIC
