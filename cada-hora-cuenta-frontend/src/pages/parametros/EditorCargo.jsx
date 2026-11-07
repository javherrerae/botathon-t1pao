import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TRAMOS, calcularNas, validarCargo } from '../../utils/validacionesParametros'

// Mientras se edita, se trabaja en TEXTO y en %; al aplicar se convierte a fracción
const aTexto = (fraccion) => (fraccion === null ? '' : String(Math.round(fraccion * 10000) / 100))
const aFraccion = (texto) => (texto === '' ? null : Number((Number(texto) / 100).toFixed(4)))

function CampoNumero({ id, label, value, onChange, error, sufijo }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600">{label}</label>
      <div className="mt-1 flex items-center gap-1">
        <input
          id={id}
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={`block w-24 rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${
            error ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {sufijo && <span className="text-xs text-slate-500">{sufijo}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  )
}

function EditorCargo({ cargo, onAplicar, onCerrar }) {
  // Estado inicial: los valores del cargo convertidos a texto
  const [form, setForm] = useState(() => ({
    stdDirMin: String(cargo.stdDirMin),
    stdIndMin: cargo.stdIndMin === null ? '' : String(cargo.stdIndMin),
    ...Object.fromEntries(TRAMOS.flatMap((t) => [[t.dir, aTexto(cargo[t.dir])], [t.ind, aTexto(cargo[t.ind])]])),
  }))
  const [errores, setErrores] = useState({})

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores({})
  }

  // Convierte el formulario (texto, %) al formato del bot (número, fracción)
  const convertir = () => ({
    cargo: cargo.cargo,
    stdDirMin: Number(form.stdDirMin),
    stdIndMin: form.stdIndMin === '' ? null : Number(form.stdIndMin),
    ...Object.fromEntries(TRAMOS.flatMap((t) => [[t.dir, aFraccion(form[t.dir])], [t.ind, aFraccion(form[t.ind])]])),
  })

  const aplicar = () => {
    const nuevo = convertir()
    const e = validarCargo(nuevo)
    if (Object.keys(e).length > 0) {
      setErrores(e)
      return
    }
    onAplicar(nuevo)
  }

  return (
    <Modal open title={`Editar: ${cargo.cargo}`} onClose={onCerrar}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <CampoNumero id="stdDirMin" label="Minutos atención directa" value={form.stdDirMin}
            onChange={(v) => cambiar('stdDirMin', v)} error={errores.stdDirMin} sufijo="min" />
          <CampoNumero id="stdIndMin" label="Minutos atención indirecta" value={form.stdIndMin}
            onChange={(v) => cambiar('stdIndMin', v)} error={errores.stdIndMin} sufijo="min" />
        </div>

        {TRAMOS.map((t) => {
          const nas = calcularNas(aFraccion(form[t.dir]), aFraccion(form[t.ind]))
          return (
            <fieldset key={t.id} className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-slate-700">Tramo {t.etiqueta}</legend>
              <div className="flex flex-wrap items-end gap-4">
                <CampoNumero id={t.dir} label="% Directo" value={form[t.dir]}
                  onChange={(v) => cambiar(t.dir, v)} error={errores[t.dir]} sufijo="%" />
                <CampoNumero id={t.ind} label="% Indirecto" value={form[t.ind]}
                  onChange={(v) => cambiar(t.ind, v)} error={errores[t.ind]} sufijo="%" />
                <p className={`pb-2 text-sm ${nas !== null && nas < 0 ? 'font-semibold text-red-700' : 'text-slate-600'}`}>
                  NAS: {nas === null ? '—' : `${Math.round(nas * 1000) / 10} %`}
                </p>
              </div>
              {errores[t.id] && <p role="alert" className="mt-2 text-xs text-red-700">{errores[t.id]}</p>}
            </fieldset>
          )
        })}

        <p className="text-xs text-slate-500">Deja vacío un campo si no aplica al cargo.</p>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button variant="secondary" onClick={aplicar}>Aplicar al borrador</Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditorCargo