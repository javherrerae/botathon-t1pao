import { useEffect, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import EditorCargo from './EditorCargo'
import {
  esDatoSimulado,
  obtenerParametros,
  obtenerHistorialParametros,
  guardarParametros,
} from '../../service/parametrosService'
import {
  TRAMOS,
  CAMPOS_CARGO,
  calcularNas,
  validarParametros,
  compararParametros,
} from '../../utils/validacionesParametros'

// 0.35 → '35 %'
const aPorcentaje = (v) => (v === null || v === undefined ? '—' : `${Math.round(v * 1000) / 10} %`)

// Muestra un valor del historial con su unidad
const formatearValor = (campo, valor) => {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor !== 'number') return valor
  return /Meta|· (dir|ind)/.test(campo) ? aPorcentaje(valor) : valor.toLocaleString('es-CL')
}

function Parametros() {
  const [original, setOriginal] = useState(null) // lo guardado
  const [borrador, setBorrador] = useState(null) // lo que se está editando
  const [historial, setHistorial] = useState([])
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(null) // índice del cargo abierto en el modal
  const [justificacion, setJustificacion] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')

  useEffect(() => {
    Promise.all([obtenerParametros(), obtenerHistorialParametros()])
      .then(([parametros, cambiosGuardados]) => {
        setOriginal(parametros)
        setBorrador(structuredClone(parametros))
        setHistorial(cambiosGuardados)
      })
      .catch(() => setError('No se pudieron cargar los parámetros.'))
  }, [])

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error}</p>
  if (!borrador) return <p className="text-slate-500">Cargando parámetros...</p>

  // --- Datos derivados ---
  const cambios = compararParametros(original, borrador)
  const cargosModificados = new Set(
    borrador.cargos
      .filter((c, i) => CAMPOS_CARGO.some((k) => c[k] !== original.cargos[i][k]))
      .map((c) => c.cargo)
  )
  const cargosFiltrados = borrador.cargos
    .map((c, indice) => ({ ...c, indice }))
    .filter((c) => c.cargo.includes(busqueda.trim().toUpperCase()))

  // --- Acciones sobre el borrador ---
  const actualizarBorrador = (cambio) => {
    setBorrador((prev) => ({ ...prev, ...cambio }))
    setErrores({})
    setMensajeExito('')
  }

  const cambiarMeta = (texto) =>
    actualizarBorrador({ metaGestionPct: texto === '' ? null : Number((Number(texto) / 100).toFixed(4)) })

  const cambiarSemana = (indice, texto) =>
    actualizarBorrador({
      semanas: borrador.semanas.map((s, i) =>
        i === indice ? { ...s, semanasHabiles: texto === '' ? null : Number(texto) } : s
      ),
    })

  const aplicarCargo = (indice, nuevo) => {
    actualizarBorrador({ cargos: borrador.cargos.map((c, i) => (i === indice ? nuevo : c)) })
    setEditando(null)
  }

  const descartar = () => {
    setBorrador(structuredClone(original))
    setJustificacion('')
    setErrores({})
    setMensajeExito('')
  }

  const guardar = async () => {
    const resultado = validarParametros(borrador, { justificacion })
    if (!resultado.valido) {
      setErrores(resultado.errores)
      return
    }
    setGuardando(true)
    try {
      const guardado = await guardarParametros(borrador, { usuario: 'Administrador', justificacion })
      setOriginal(guardado)
      setBorrador(structuredClone(guardado))
      setJustificacion('')
      setHistorial(await obtenerHistorialParametros())
      setMensajeExito(`Parámetros guardados (versión ${guardado.version}). El bot los usará en su próxima ejecución.`)
    } catch (e) {
      setErrores({ general: e.message })
    } finally {
      setGuardando(false)
    }
  }

  // --- Columnas de las tablas ---
  const columnasCargos = [
    {
      key: 'cargo',
      label: 'Cargo',
      render: (c) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">{c.cargo}</p>
          {cargosModificados.has(c.cargo) && <Badge type="warning">Modificado</Badge>}
        </div>
      ),
    },
    { key: 'std', label: 'Min. dir / ind', render: (c) => `${c.stdDirMin} / ${c.stdIndMin ?? '—'}` },
    ...TRAMOS.map((t) => ({
      key: t.id,
      label: `${t.etiqueta} (dir / ind)`,
      render: (c) => (
        <div>
          <p>{aPorcentaje(c[t.dir])} / {aPorcentaje(c[t.ind])}</p>
          <p className="text-xs text-slate-500">NAS {aPorcentaje(calcularNas(c[t.dir], c[t.ind]))}</p>
        </div>
      ),
    })),
    {
      key: 'acciones',
      label: 'Acciones',
      render: (c) => (
        <Button variant="outline" onClick={() => setEditando(c.indice)} className="px-3 py-1 text-xs">
          Editar
        </Button>
      ),
    },
  ]

  const columnasHistorial = [
    { key: 'fechaHora', label: 'Fecha y hora', render: (h) => h.fechaHora.replace('T', ' ') },
    { key: 'usuario', label: 'Usuario' },
    { key: 'campo', label: 'Parámetro' },
    {
      key: 'valores',
      label: 'Anterior → Nuevo',
      render: (h) => `${formatearValor(h.campo, h.valorAnterior)} → ${formatearValor(h.campo, h.valorNuevo)}`,
    },
    { key: 'justificacion', label: 'Justificación' },
  ]

  return (
    <section className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Parámetros del bot</h1>
          <p className="mt-1 text-slate-500">
            Reglas que usa Blue Prism para calcular atenciones. Versión {original.version} · actualizada{' '}
            {original.actualizado.replace('T', ' ')}
          </p>
        </div>
        {esDatoSimulado() && <Badge type="warning">Datos simulados</Badge>}
      </div>

      {mensajeExito && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {mensajeExito}
        </div>
      )}

      {/* Panel de cambios pendientes */}
      {cambios.length > 0 && (
        <section className="space-y-3 rounded-xl border border-yellow-300 bg-yellow-50 p-5">
          <h2 className="font-semibold text-yellow-900">Cambios pendientes ({cambios.length})</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-900">
            {cambios.slice(0, 8).map((c) => (
              <li key={c.campo}>
                {c.campo}: {formatearValor(c.campo, c.valorAnterior)} → <strong>{formatearValor(c.campo, c.valorNuevo)}</strong>
              </li>
            ))}
            {cambios.length > 8 && <li>… y {cambios.length - 8} más</li>}
          </ul>

          {errores.general && <p role="alert" className="text-sm text-red-700">{errores.general}</p>}
          {Object.keys(errores).length > 0 && !errores.general && (
            <p role="alert" className="text-sm text-red-700">Revisa los campos marcados antes de guardar.</p>
          )}

          <div>
            <label htmlFor="justificacionParametros" className="block text-sm font-medium text-yellow-900">
              Justificación del cambio
            </label>
            <textarea
              id="justificacionParametros"
              rows={2}
              value={justificacion}
              onChange={(e) => { setJustificacion(e.target.value); setErrores({}) }}
              aria-invalid={Boolean(errores.justificacion)}
              className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm ${
                errores.justificacion ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errores.justificacion && <p className="mt-1 text-xs text-red-700">{errores.justificacion}</p>}
          </div>

          <div className="flex gap-3">
            <Button onClick={guardar} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar parámetros'}</Button>
            <Button variant="outline" onClick={descartar} disabled={guardando}>Descartar cambios</Button>
          </div>
        </section>
      )}

      {/* Meta de gestión */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Meta de gestión</h2>
        <label htmlFor="metaGestion" className="mt-3 block text-sm text-slate-600">
          Porcentaje de las atenciones proyectadas que se fija como meta
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="metaGestion"
            type="number"
            min="1"
            max="100"
            step="0.5"
            value={borrador.metaGestionPct === null ? '' : Math.round(borrador.metaGestionPct * 10000) / 100}
            onChange={(e) => cambiarMeta(e.target.value)}
            aria-invalid={Boolean(errores.metaGestionPct)}
            className={`w-28 rounded-lg border px-3 py-2 text-sm ${errores.metaGestionPct ? 'border-red-500' : 'border-slate-300'}`}
          />
          <span className="text-sm text-slate-600">%</span>
        </div>
        {errores.metaGestionPct && <p className="mt-1 text-xs text-red-700">{errores.metaGestionPct}</p>}
      </section>

      {/* Semanas hábiles */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Semanas hábiles por mes</h2>
        <p className="mt-1 text-sm text-slate-500">Días hábiles del mes ÷ 5. El bot multiplica por este valor.</p>
        <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {borrador.semanas.map((s, i) => (
            <div key={s.periodo}>
              <label htmlFor={`semana-${i}`} className="block text-xs font-medium uppercase text-slate-600">{s.mes}</label>
              <input
                id={`semana-${i}`}
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={s.semanasHabiles ?? ''}
                onChange={(e) => cambiarSemana(i, e.target.value)}
                aria-invalid={Boolean(errores[`semana-${i}`])}
                className={`mt-1 block w-full rounded-lg border px-2 py-1.5 text-sm ${
                  errores[`semana-${i}`] ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errores[`semana-${i}`] && <p className="mt-1 text-xs text-red-700">{errores[`semana-${i}`]}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Cargos */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Distribución por cargo y tramo</h2>
            <p className="text-sm text-slate-500">{borrador.cargos.length} cargos · el % NAS se calcula solo.</p>
          </div>
          <label htmlFor="buscarCargo" className="block text-sm font-medium text-slate-700">
            Buscar cargo
            <input
              id="buscarCargo"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: ENFERMERA"
              className="mt-1 block w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <Table columns={columnasCargos} data={cargosFiltrados} rowKey="cargo" emptyMessage="Ningún cargo coincide con la búsqueda." />
      </section>

      {/* Historial */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Historial de cambios</h2>
        <Table
          columns={columnasHistorial}
          data={historial.slice(0, 10)}
          rowKey="campo"
          emptyMessage="Aún no hay cambios guardados en esta sesión."
        />
      </section>

      {/* Modal de edición */}
      {editando !== null && (
        <EditorCargo
          key={editando}
          cargo={borrador.cargos[editando]}
          onAplicar={(nuevo) => aplicarCargo(editando, nuevo)}
          onCerrar={() => setEditando(null)}
        />
      )}
    </section>
  )
}

export default Parametros