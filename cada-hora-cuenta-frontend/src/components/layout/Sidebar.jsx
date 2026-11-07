import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CalendarDays, 
  ClipboardList, 
  Settings, 
  Users, 
  Bot, 
  BarChart3, 
  History 
} from 'lucide-react'

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

function Sidebar({ onClose }) {
    return (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-[#780C04] p-3 shadow-2xl border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <nav aria-label="Navegación principal" className="space-y-1">
                {menuItems.map(({ name, path, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                                isActive 
                                    ? 'bg-white text-[#AD1005] font-semibold shadow-md' 
                                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                            }`
                        }
                    >
                        <Icon size={18} aria-hidden="true" />
                        <span>{name}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    )
}

export default Sidebar