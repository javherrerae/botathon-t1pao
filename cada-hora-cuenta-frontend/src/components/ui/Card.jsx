function Card({ title, value, description, icon: Icon, accent = 'red' }) {
  const accentClass = accent === 'blue' ? 'bg-blue-50 text-[#003366]' : 'bg-red-50 text-[#E30613]'
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{value}</h3>
          {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
        </div>
        {Icon && <div className={`rounded-lg p-3 ${accentClass}`} aria-hidden="true"><Icon size={22} /></div>}
      </div>
    </article>
  )
}
export default Card
