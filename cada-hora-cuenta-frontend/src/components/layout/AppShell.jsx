import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
function AppShell() {
  return <div className="flex min-h-screen bg-[#F8FAFC]"><Sidebar /><div className="min-w-0 flex-1"><Header /><main className="p-5 md:p-8"><Outlet /></main></div></div>
}
export default AppShell
