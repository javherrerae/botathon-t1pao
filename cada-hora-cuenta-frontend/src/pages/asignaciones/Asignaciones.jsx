import { useEffect, useState } from 'react'
import Badge from '../../components/ui/Badge'
import FormularioAsignacion from './FormularioAsignacion'
import TablaAsignaciones from './TablaAsigaciones'
import {
  esDatoSimulado,
  obtenerAsignaciones,
  obtenerProfesionales,
  obtenerTiposAsignacion,
  obtenerReglasAsignacion,
} from '../../service/asignacionesService'

function Asignaciones() {
  const [datos, setDatos] = useState(null) // { profesionales, tipos, asignaciones, reglas }
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      obtenerProfesionales(),
      obtenerTiposAsignacion(),
      obtenerAsignaciones(),
      obtenerReglasAsignacion(),
    ])
      .then(([profesionales, tipos, asignaciones, reglas]) =>
        setDatos({ profesionales, tipos, asignaciones, reglas })
      )
      .catch(() => setError('No se pudieron cargar los datos de asignaciones.'))
  }, [])

  // Después de registrar, vuelve a pedir solo las asignaciones
  const recargarAsignaciones = async () => {
    const asignaciones = await obtenerAsignaciones()
    setDatos((prev) => ({ ...prev, asignaciones }))
  }

  if (error) {
    return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>
  }
  if (!datos) {
    return <p className="text-slate-500">Cargando asignaciones...</p>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Asignaciones especiales</h1>
          <p className="mt-1 text-slate-500">Registro de actividades que descuentan horas de la jornada asistencial.</p>
        </div>
        {esDatoSimulado() && <Badge type="warning">Datos de Blue Prism</Badge>}
      </div>

      <FormularioAsignacion
        profesionales={datos.profesionales}
        tipos={datos.tipos}
        asignaciones={datos.asignaciones}
        reglas={datos.reglas}
        onRegistrada={recargarAsignaciones}
      />

      <TablaAsignaciones
        asignaciones={datos.asignaciones}
        tipos={datos.tipos}
        onCambioEstado={recargarAsignaciones}
      />
    </section>
  )
}

export default Asignaciones