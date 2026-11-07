import { useState, useRef, useEffect } from 'react'
import { Bell, UserCircle, Bot, ChevronDown } from 'lucide-react'
import Sidebar from './Sidebar'

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="relative z-50 flex min-h-20 flex-wrap items-center justify-between gap-4 bg-[#AB0C02]/95 px-8 py-4 text-white shadow-lg backdrop-blur-md md:px-10">
      
      {/* Botón único para desplegar el menú */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3.5 rounded-xl p-1.5 transition hover:bg-white/10 focus:outline-none"
          aria-expanded={isOpen}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white p-1 shadow-md">
            <img
              src="/teleton-logo.png"
              alt="Logo Teletón"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold tracking-wide text-white leading-tight">
                CADA HORA CUENTA
              </h2>
              <ChevronDown
                size={18}
                className={`text-white/80 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </div>
            <p className="text-xs text-white/85">
              Sistema de planificación asistencial
            </p>
          </div>
        </button>

        {/* Solo la lista desplegable sin contenido repetido */}
        {isOpen && <Sidebar onClose={() => setIsOpen(false)} />}
      </div>

      {/* Derecha del Header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-medium text-white">
          <Bot size={15} aria-hidden="true" />
          Blue Prism: entorno demo
        </span>

        <button
          type="button"
          aria-label="Notificaciones"
          className="text-white transition hover:text-white/70"
        >
          <Bell size={21} />
        </button>

        <div className="flex items-center gap-2 border-l border-white/20 pl-4">
          <UserCircle size={28} className="text-white" />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">
              Administrador
            </p>
            <p className="text-xs text-white/85">
              Planificación central
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header