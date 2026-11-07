import { useEffect, useState } from 'react'
import {
  obtenerAsignaciones,
  obtenerProfesionales,
  obtenerTiposAsignacion,
  obtenerReglasAsignacion,
} from '../../service/asignacionesService'
import { validarAsignacion } from '../../utils/validacionesAsignaciones'

const CASOS = [
  {
    nombre: '137732 (40 h) ya tiene 2 asignaciones → intenta una tercera',
    datos: { personaId: 137732, tipoId: 'COMITE_PARITARIO', horasSemanales: 0.5, vigenciaDesde: '2026-06-01', vigenciaHasta: '2026-12-31', justificacion: 'Prueba' },
  },
  {
    nombre: '137734 (22 h) → no aplica el límite',
    datos: { personaId: 137734, tipoId: 'TUTOR_DOCENTE', horasSemanales: 1, vigenciaDesde: '2026-06-01', vigenciaHasta: '2026-12-31', justificacion: 'Prueba' },
  },
  {
    nombre: 'Formulario vacío',
    datos: {},
  },
]

function Asignaciones() {
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    async function probar() {
      const [profesionales, tipos, asignaciones, reglas] = await Promise.all([
        obtenerProfesionales(),
        obtenerTiposAsignacion(),
        obtenerAsignaciones(),
        obtenerReglasAsignacion(),
      ])

      const salida = CASOS.map((caso) => ({
        nombre: caso.nombre,
        ...validarAsignacion({
          datos: caso.datos,
          profesional: profesionales.find((p) => p.personaId === caso.datos.personaId),
          tipo: tipos.find((t) => t.id === caso.datos.tipoId),
          asignacionesExistentes: asignaciones.filter((a) => a.personaId === caso.datos.personaId),
          reglas,
        }),
      }))
      setResultados(salida)
    }
    probar()
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Prueba de validaciones</h1>
      {resultados.map((r) => (
        <div key={r.nombre} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-semibold">{r.valido ? '✅' : '❌'} {r.nombre}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {Object.values(r.errores).map((msg) => <li key={msg}>{msg}</li>)}
          </ul>
        </div>
      ))}
    </section>
  )
}

export default Asignaciones