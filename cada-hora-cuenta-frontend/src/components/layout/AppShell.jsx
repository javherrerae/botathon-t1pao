import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

function AppShell() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC]">
      {/* Header que contiene el botón del logo y el Sidebar flotante */}
      <Header />

      {/* El contenido principal toma el 100% del ancho de la pantalla */}
      <main className="w-full flex-1 p-5 md:p-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default AppShell