import { useEffect, useState } from 'react'
import { obtenerAsignaciones, obtenerProfesionales } from '../../service/asignacionesService'

function Asignaciones() {
  const [asignaciones, setAsignaciones] = useState([])
  const [profesionales, setProfesionales] = useState([])

  useEffect(() => {
    obtenerAsignaciones().then(setAsignaciones)
    obtenerProfesionales().then(setProfesionales)
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Asignaciones especiales (prueba)</h1>
      <p>Profesionales cargados: {profesionales.length}</p>
      <p>Asignaciones cargadas: {asignaciones.length}</p>
    </section>
  )
}

export default Asignaciones