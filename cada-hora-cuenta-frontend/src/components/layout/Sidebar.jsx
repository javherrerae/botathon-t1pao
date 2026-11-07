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
  {
    name: 'Dashboard nacional',
    path: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Planificación',
    path: '/planificacion',
    icon: CalendarDays
  },
  {
    name: 'Asignaciones especiales',
    path: '/asignaciones',
    icon: ClipboardList
  },
  {
    name: 'Parámetros',
    path: '/parametros',
    icon: Settings
  },
  {
    name: 'Excepciones',
    path: '/excepciones',
    icon: Users
  },
  {
    name: 'Monitoreo Blue Prism',
    path: '/monitoreo',
    icon: Bot
  },
  {
    name: 'Comparativa SIC',
    path: '/comparativa',
    icon: BarChart3
  },
  {
    name: 'Trazabilidad',
    path: '/trazabilidad',
    icon: History
  }
]

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#003366] text-white p-4">
      <div className="mb-8 border-b border-white/20 pb-5">
        <h1 className="text-xl font-bold">
          CADA HORA CUENTA
        </h1>

        <p className="text-sm text-blue-200 mt-1">
          Sistema de planificación
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-[#E30613] text-white'
                    : 'text-blue-100 hover:bg-white/10'
                }`
              }
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar