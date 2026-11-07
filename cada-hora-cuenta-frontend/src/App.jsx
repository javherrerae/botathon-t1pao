import { Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/layout/AppShell'

import Dashboard from './pages/Dashboard/Dashboard'
import Planificacion from './pages/Planificacion/Planificacion'
import Asignaciones from './pages/Asignaciones/Asignaciones'
import Parametros from './pages/Parametros/Parametros'
import Excepciones from './pages/Excepciones/Excepciones'
import MonitoreoRPA from './pages/MonitoreoRPA/MonitoreoRPA'
import ComparativaSIC from './pages/ComparativaSIC/ComparativaSIC'
import Trazabilidad from './pages/Trazabilidad/Trazabilidad'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planificacion" element={<Planificacion />} />
        <Route path="/asignaciones" element={<Asignaciones />} />
        <Route path="/parametros" element={<Parametros />} />
        <Route path="/excepciones" element={<Excepciones />} />
        <Route path="/monitoreo" element={<MonitoreoRPA />} />
        <Route path="/comparativa" element={<ComparativaSIC />} />
        <Route path="/trazabilidad" element={<Trazabilidad />} />
      </Route>
    </Routes>
  )
}

export default App