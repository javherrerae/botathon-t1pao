import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/dashboard/Dashboard'
import Planificacion from './pages/planificacion/Planificacion'
import Asignaciones from './pages/asignaciones/Asignaciones'
import Parametros from './pages/parametros/Parametros'
import Excepciones from './pages/excepciones/Excepciones'
import MonitoreoRPA from './pages/monitoreoRpa/MonitoreoRPA'
import ComparativaSIC from './pages/comparativaSic/ComparativaSIC'
import Trazabilidad from './pages/trazabilidad/Trazabilidad'
function App() {
  return <Routes><Route element={<AppShell />}><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/planificacion" element={<Planificacion />} /><Route path="/asignaciones" element={<Asignaciones />} /><Route path="/parametros" element={<Parametros />} /><Route path="/excepciones" element={<Excepciones />} /><Route path="/monitoreo" element={<MonitoreoRPA />} /><Route path="/comparativa" element={<ComparativaSIC />} /><Route path="/trazabilidad" element={<Trazabilidad />} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Route></Routes>
}
export default App
