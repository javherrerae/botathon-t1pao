import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TRAMOS, calcularNas, validarCargo } from '../../utils/validacionesParametros'

const toText = (v) => v == null ? '' : String(Math.round(v * 10000) / 100)
const toFraction = (v) => v === '' ? null : Number((Number(v) / 100).toFixed(4))

export default function EditorCargo({ cargo, onAplicar, onCerrar }) {
  const [form, setForm] = useState(() => Object.fromEntries(TRAMOS.flatMap(t => [[t.dir, toText(cargo[t.dir])], [t.ind, toText(cargo[t.ind])]])))
  const [errores, setErrores] = useState({})
  const cambiar = (key, value) => { setForm(prev => ({ ...prev, [key]: value })); setErrores({}) }
  const aplicar = () => {
    const nuevo = { ...cargo, ...Object.fromEntries(TRAMOS.flatMap(t => [[t.dir, toFraction(form[t.dir])], [t.ind, toFraction(form[t.ind])]])) }
    const validacion = validarCargo(nuevo)
    if (Object.keys(validacion).length) return setErrores(validacion)
    onAplicar(nuevo)
  }
  return <Modal open title={`Distribución asistencial · ${cargo.cargo}`} onClose={onCerrar}>
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p><b>Minutos estándar:</b> directa {cargo.stdDirMin} min · indirecta {cargo.stdIndMin} min</p>
        <p className="mt-1 text-xs">Estos valores provienen de la parametrización técnica y no se modifican desde esta pantalla.</p>
      </div>
      <p className="text-sm text-slate-600">Solo define cómo se distribuye la jornada. NAS se calcula automáticamente; no necesitas ingresarlo.</p>
      {TRAMOS.map(t => {
        const nas = calcularNas(toFraction(form[t.dir]), toFraction(form[t.ind]))
        return <fieldset key={t.id} className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold">Jornada {t.etiqueta}</legend>
          <div className="grid grid-cols-3 gap-3 items-end">
            {[['Directa',t.dir],['Indirecta',t.ind]].map(([label,key]) => <label key={key} className="text-xs text-slate-600">{label} (%)
              <input type="number" min="0" max="100" step="0.1" value={form[key]} onChange={e=>cambiar(key,e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
              {errores[key] && <span className="text-red-600">{errores[key]}</span>}
            </label>)}
            <div className="rounded-lg bg-blue-50 p-2 text-center"><span className="block text-xs text-slate-500">NAS calculado</span><b className="text-sm">{nas == null ? '—' : `${(nas*100).toFixed(1)}%`}</b></div>
          </div>
          {errores[t.id] && <p className="mt-2 text-xs text-red-600">{errores[t.id]}</p>}
        </fieldset>
      })}
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onCerrar}>Cancelar</Button><Button onClick={aplicar}>Aplicar cambios</Button></div>
    </div>
  </Modal>
}
