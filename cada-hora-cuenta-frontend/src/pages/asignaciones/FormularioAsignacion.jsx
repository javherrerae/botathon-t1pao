import { useState } from 'react'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { validarAsignacion, aplicaLimite } from '../../utils/validacionesAsignaciones'
import { registrarAsignacion } from '../../service/asignacionesService'

const FORMULARIO_VACIO = {
  personaId: '',
  tipoId: '',
  horasSemanales: '',
  vigenciaDesde: '',
  vigenciaHasta: '',
  justificacion: '',
}

// Borde rojo si el campo tiene error
const claseInput = (hayError) =>
  `mt-1 block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
    hayError ? 'border-red-500' : 'border-slate-300'
  }`

function MensajeError({ id, texto }) {
  if (!texto) return null
  return <p id={id} className="mt-1 text-xs text-red-700">{texto}</p>
}

function FormularioAsignacion({ profesionales, tipos, asignaciones, reglas, onRegistrada }) {
  const [form, setForm] = useState(FORMULARIO_VACIO)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  // Datos derivados de lo que está seleccionado
  const profesional = profesionales.find((p) => p.personaId === Number(form.personaId))
  const tipo = tipos.find((t) => t.id === form.tipoId)
  const asignacionesProfesional = asignaciones.filter((a) => a.personaId === Number(form.personaId))
  const cantidadActivas = asignacionesProfesional.filter((a) => a.estado !== 'RECHAZADA').length
  const horasFijas = tipo && tipo.horasSemanales !== null

  // Cambia un campo y limpia su error
  const actualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: undefined, general: undefined }))
    setMensajeExito('')
  }

  // Al elegir tipo: si tiene horas fijas, se completan solas
  const cambiarTipo = (tipoId) => {
    const nuevoTipo = tipos.find((t) => t.id === tipoId)
    actualizar('tipoId', tipoId)
    actualizar('horasSemanales', nuevoTipo?.horasSemanales ?? '')
  }

  const enviar = async (event) => {
    event.preventDefault() // evita que el navegador recargue la página

    const resultado = validarAsignacion({
      datos: form,
      profesional,
      tipo,
      asignacionesExistentes: asignacionesProfesional,
      reglas,
    })
    if (!resultado.valido) {
      setErrores(resultado.errores)
      return
    }

    setGuardando(true)
    try {
      const nueva = await registrarAsignacion(form)
      setMensajeExito(
        nueva.estado === 'PENDIENTE'
          ? `Asignación ${nueva.id} registrada. Queda pendiente de aprobación DMN.`
          : `Asignación ${nueva.id} registrada correctamente.`
      )
      setForm(FORMULARIO_VACIO)
      setErrores({})
      onRegistrada?.() // avisa a la página para recargar la lista
    } catch (error) {
      setErrores({ general: error.message })
    } finally {
      setGuardando(false)
    }
  }

  const opcionesProfesionales = [
    { value: '', label: 'Selecciona un profesional...' },
    ...profesionales.map((p) => ({ value: String(p.personaId), label: `${p.personaId} · ${p.cargo} · ${p.instituto}` })),
  ]

  const opcionesTipos = [
    { value: '', label: 'Selecciona un tipo...' },
    ...tipos.map((t) => ({
      value: t.id,
      label: t.horasSemanales !== null ? `${t.nombre} (${t.horasSemanales} H/S)` : `${t.nombre} (horas variables)`,
    })),
  ]

  return (
    <form onSubmit={enviar} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Registrar asignación especial</h2>

      {/* Mensajes generales */}
      {errores.general && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errores.general}
        </div>
      )}
      {mensajeExito && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {mensajeExito}
        </div>
      )}

      {/* Profesional */}
      <div>
        <Select
          id="personaId"
          label="Profesional"
          value={form.personaId}
          onChange={(valor) => actualizar('personaId', valor)}
          options={opcionesProfesionales}
        />
        <MensajeError id="error-personaId" texto={errores.personaId} />

        {profesional && (
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <p><strong>{profesional.horasContrato} H/S</strong> contratadas</p>
            <p>
              Asignaciones activas: {cantidadActivas}
              {aplicaLimite(profesional, reglas)
                ? ` · máximo ${reglas.maxAsignacionesSobreUmbral} por periodo (más de ${reglas.umbralHorasSemanales} H/S)`
                : ` · sin límite (${reglas.umbralHorasSemanales} H/S o menos)`}
            </p>
          </div>
        )}
      </div>

      {/* Tipo de asignación */}
      <div>
        <Select
          id="tipoId"
          label="Tipo de asignación"
          value={form.tipoId}
          onChange={cambiarTipo}
          options={opcionesTipos}
        />
        <MensajeError id="error-tipoId" texto={errores.tipoId} />
        {tipo?.requiereAutorizacion && (
          <div className="mt-2"><Badge type="warning">Requiere autorización DMN: quedará Pendiente</Badge></div>
        )}
      </div>

      {/* Horas */}
      <div>
        <label htmlFor="horasSemanales" className="block text-sm font-medium text-slate-700">
          Horas semanales
        </label>
        <input
          id="horasSemanales"
          type="number"
          min="0"
          step="0.25"
          value={form.horasSemanales}
          onChange={(e) => actualizar('horasSemanales', e.target.value)}
          readOnly={horasFijas}
          aria-invalid={Boolean(errores.horasSemanales)}
          aria-describedby="ayuda-horas error-horasSemanales"
          className={`${claseInput(errores.horasSemanales)} ${horasFijas ? 'bg-slate-100' : ''}`}
        />
        <p id="ayuda-horas" className="mt-1 text-xs text-slate-500">
          {horasFijas ? 'Horas fijas según el catálogo oficial.' : 'Ingresa las horas definidas por DMN o GP.'}
        </p>
        <MensajeError id="error-horasSemanales" texto={errores.horasSemanales} />
      </div>

      {/* Vigencia */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="vigenciaDesde" className="block text-sm font-medium text-slate-700">Vigente desde</label>
          <input
            id="vigenciaDesde"
            type="date"
            value={form.vigenciaDesde}
            onChange={(e) => actualizar('vigenciaDesde', e.target.value)}
            aria-invalid={Boolean(errores.vigenciaDesde)}
            aria-describedby="error-vigenciaDesde"
            className={claseInput(errores.vigenciaDesde)}
          />
          <MensajeError id="error-vigenciaDesde" texto={errores.vigenciaDesde} />
        </div>
        <div>
          <label htmlFor="vigenciaHasta" className="block text-sm font-medium text-slate-700">Vigente hasta</label>
          <input
            id="vigenciaHasta"
            type="date"
            value={form.vigenciaHasta}
            onChange={(e) => actualizar('vigenciaHasta', e.target.value)}
            aria-invalid={Boolean(errores.vigenciaHasta)}
            aria-describedby="error-vigenciaHasta"
            className={claseInput(errores.vigenciaHasta)}
          />
          <MensajeError id="error-vigenciaHasta" texto={errores.vigenciaHasta} />
        </div>
      </div>

      {/* Justificación */}
      <div>
        <label htmlFor="justificacion" className="block text-sm font-medium text-slate-700">Justificación</label>
        <textarea
          id="justificacion"
          rows={3}
          value={form.justificacion}
          onChange={(e) => actualizar('justificacion', e.target.value)}
          aria-invalid={Boolean(errores.justificacion)}
          aria-describedby="error-justificacion"
          className={claseInput(errores.justificacion)}
        />
        <MensajeError id="error-justificacion" texto={errores.justificacion} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Registrar asignación'}
        </Button>
        <Button
          variant="outline"
          onClick={() => { setForm(FORMULARIO_VACIO); setErrores({}); setMensajeExito('') }}
        >
          Limpiar
        </Button>
      </div>
    </form>
  )
}

export default FormularioAsignacion