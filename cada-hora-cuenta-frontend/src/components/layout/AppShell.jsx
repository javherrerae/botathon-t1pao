import { Outlet } from 'react-router-dom'

import Sidebar from './Sidebar'
import Header from './Header'

function AppShell() {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Header />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppShell