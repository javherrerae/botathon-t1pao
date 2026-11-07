import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, ClipboardList, Settings, Users, Bot, BarChart3, History } from 'lucide-react'
const menuItems = [
  { name: 'Dashboard nacional', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Planificación', path: '/planificacion', icon: CalendarDays },
  { name: 'Asignaciones especiales', path: '/asignaciones', icon: ClipboardList },
  { name: 'Parámetros', path: '/parametros', icon: Settings },
  { name: 'Excepciones', path: '/excepciones', icon: Users },
  { name: 'Monitoreo Blue Prism', path: '/monitoreo', icon: Bot },
  { name: 'Comparativa SIC', path: '/comparativa', icon: BarChart3 },
  { name: 'Trazabilidad', path: '/trazabilidad', icon: History }
]
function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-[#003366] p-4 text-white">
      <div className="mb-8 border-b border-white/20 pb-5">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-xl font-black text-[#003366]" aria-label="Identificador del sistema">T</div>
        <h1 className="text-lg font-bold tracking-wide">CADA HORA CUENTA</h1>
        <p className="mt-1 text-sm text-blue-200">Planificación asistencial</p>
      </div>
      <nav aria-label="Navegación principal" className="space-y-1">
        {menuItems.map(({ name, path, icon: Icon }) => <NavLink key={path} to={path} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${isActive ? 'bg-[#E30613] text-white' : 'text-blue-100 hover:bg-white/10'}`}><Icon size={18} aria-hidden="true" /><span>{name}</span></NavLink>)}
      </nav>
    </aside>
  )
}
export default Sidebar
