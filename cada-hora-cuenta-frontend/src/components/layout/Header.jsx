import { Bell, UserCircle, Bot } from 'lucide-react'
function Header() {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-8">
      <div>
        <h2 className="font-semibold text-slate-800">Sistema de planificación asistencial</h2>
        <p className="text-sm text-slate-500">Gestión nacional</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-medium text-green-800"><Bot size={15} aria-hidden="true" /> Blue Prism: entorno demo</span>
        <button type="button" aria-label="Notificaciones" className="text-slate-500 hover:text-slate-800"><Bell size={21} /></button>
        <div className="flex items-center gap-2"><UserCircle size={28} className="text-[#003366]" /><div><p className="text-sm font-semibold">Administrador</p><p className="text-xs text-slate-500">Planificación central</p></div></div>
      </div>
    </header>
  )
}
export default Header
