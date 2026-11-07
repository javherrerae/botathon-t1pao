import { useEffect, useMemo, useState } from 'react'
import { Eye, History, Search, X } from 'lucide-react'
import { obtenerNovedades } from '../../service/bluePrismService'

const mostrar = (valor) => valor === null || valor === undefined || valor === '' ? '—' : String(valor)
const etiquetas = {
  CAMBIO_JORNADA: 'Cambio de jornada',
  FIN_CONTRATO: 'Fin de contrato',
  NUEVO_CONTRATO: 'Nuevo contrato',
  CAMBIO_INSTITUTO: 'Cambio de instituto',
  CAMBIO_CARGO: 'Cambio de cargo'
}

function Trazabilidad() {
  const [novedades, setNovedades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [instituto, setInstituto] = useState('Todos')
  const [tipo, setTipo] = useState('Todos')
  const [detalleId, setDetalleId] = useState(null)
  const [limite, setLimite] = useState(20)

  useEffect(() => {
    let activo = true
    obtenerNovedades()
      .then((resultado) => {
        if (activo) {
          setNovedades(resultado)
          setErrorCarga('')
        }
      })
      .catch((error) => {
        if (activo) setErrorCarga(error.message || 'No se pudieron cargar las novedades')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => { activo = false }
  }, [intento])

  const institutos = useMemo(() => [...new Set(novedades.map((item) => item.instituto))].sort(), [novedades])
  const tipos = useMemo(() => [...new Set(novedades.map((item) => item.tipoCambio))].sort(), [novedades])

  const filtrados = useMemo(() => novedades.filter((item) => {
    const texto = `${item.personaId ?? ''} ${item.tipoCambio ?? ''} ${item.instituto ?? ''} ${item.estadoValidacion ?? ''}`.toLowerCase()
    return texto.includes(busqueda.trim().toLowerCase()) &&
      (instituto === 'Todos' || item.instituto === instituto) &&
      (tipo === 'Todos' || item.tipoCambio === tipo)
  }).sort((a, b) => String(b.fechaVigencia).localeCompare(String(a.fechaVigencia))), [novedades, busqueda, instituto, tipo])

  const detalle = novedades.find((item) => item.id === detalleId)

  if (cargando) return <p role="status" className="p-6 text-slate-600">Cargando novedades contractuales...</p>

  if (errorCarga) {
    return (
      <section role="alert" className="rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-red-800">No se pudieron cargar las novedades</h1>
        <p className="mt-2 text-sm text-slate-700">{errorCarga}</p>
        <button type="button" className="mt-4 rounded-lg bg-[#003366] px-4 py-2 text-white" onClick={() => {
          setCargando(true)
          setErrorCarga('')
          setIntento((valor) => valor + 1)
        }}>Reintentar</button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-[#003366]">TRAZABILIDAD DE DATOS</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Bitácora de Trazabilidad</h1>
        <p className="mt-1 text-slate-600">Novedades contractuales identificadas en el conjunto de datos de referencia.</p>
        <p className="mt-2 text-sm font-semibold text-amber-800">Modo demostración: datos representativos del Excel, no auditoría real de usuarios.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen de novedades">
        {[
          { titulo: 'Novedades contractuales', valor: novedades.length, Icono: History },
          { titulo: 'Institutos involucrados', valor: institutos.length, Icono: Eye },
          { titulo: 'Resultados filtrados', valor: filtrados.length, Icono: Search }
        ].map(({ titulo, valor, Icono }) => (
          <article key={titulo} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">{titulo}</p>
              <Icono aria-hidden="true" size={22} className="text-[#003366]" />
            </div>
            <p className="mt-3 text-3xl font-bold">{valor.toLocaleString('es-CL')}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Auditoría real: no disponible.</strong> El archivo de referencia no informa usuario, fecha de edición o justificación
        de una acción realizada en el sistema. Las novedades detectadas no deben confundirse con modificaciones aprobadas.
        El registro persistente de auditoría se integrará cuando exista el backend.
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Consultar novedades</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="buscar-traza" className="mb-1 block text-sm font-medium">Buscar</label>
            <input id="buscar-traza" type="search" value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setLimite(20) }} placeholder="Profesional, instituto, estado" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="filtro-instituto-traza" className="mb-1 block text-sm font-medium">Instituto</label>
            <select id="filtro-instituto-traza" value={instituto} onChange={(e) => { setInstituto(e.target.value); setLimite(20) }} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="Todos">Todos</option>
              {institutos.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-tipo-traza" className="mb-1 block text-sm font-medium">Tipo de cambio</label>
            <select id="filtro-tipo-traza" value={tipo} onChange={(e) => { setTipo(e.target.value); setLimite(20) }} className="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="Todos">Todos</option>
              {tipos.map((valor) => <option key={valor} value={valor}>{etiquetas[valor] || valor}</option>)}
            </select>
          </div>
        </div>
        <button type="button" className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100" onClick={() => {
          setBusqueda('')
          setInstituto('Todos')
          setTipo('Todos')
          setLimite(20)
        }}>Limpiar filtros</button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Novedades contractuales ({filtrados.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="p-3">Vigencia</th>
                <th scope="col" className="p-3">Profesional ID</th>
                <th scope="col" className="p-3">Instituto</th>
                <th scope="col" className="p-3">Cambio</th>
                <th scope="col" className="p-3">Validación</th>
                <th scope="col" className="p-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.slice(0, limite).map((item) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="p-3">{mostrar(item.fechaVigencia)}</td>
                  <td className="p-3">{item.personaId}</td>
                  <td className="p-3">{mostrar(item.instituto)}</td>
                  <td className="p-3">{etiquetas[item.tipoCambio] || item.tipoCambio}</td>
                  <td className="p-3">{mostrar(item.estadoValidacion)}</td>
                  <td className="p-3">
                    <button type="button" className="rounded-lg px-3 py-2 font-medium text-[#003366] hover:bg-blue-50" onClick={() => setDetalleId(item.id)} aria-label={`Ver detalle de ${item.id}`}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-600">No hay novedades con esos filtros.</td></tr>}
            </tbody>
          </table>
        </div>
        {limite < filtrados.length && <button type="button" className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm text-[#003366] hover:bg-slate-50" onClick={() => setLimite((valor) => valor + 20)}>Mostrar 20 novedades más</button>}
      </section>

      {detalle && (
        <section aria-label="Detalle de novedad contractual" className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#003366]">Detalle: {etiquetas[detalle.tipoCambio] || detalle.tipoCambio}</h2>
            <button type="button" onClick={() => setDetalleId(null)} aria-label="Cerrar detalle" className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-slate-600">Profesional ID</p><p className="font-medium">{detalle.personaId}</p></div>
            <div><p className="text-sm text-slate-600">Instituto</p><p className="font-medium">{mostrar(detalle.instituto)}</p></div>
            <div><p className="text-sm text-slate-600">Vigencia</p><p className="font-medium">{mostrar(detalle.fechaVigencia)}</p></div>
            <div><p className="text-sm text-slate-600">Estado de validación</p><p className="font-medium">{mostrar(detalle.estadoValidacion)}</p></div>
            <div className="rounded-lg bg-red-50 p-4"><p className="text-sm text-red-800">Valor anterior</p><p className="font-semibold">{mostrar(detalle.valorAnterior)}</p></div>
            <div className="rounded-lg bg-green-50 p-4"><p className="text-sm text-green-800">Valor nuevo</p><p className="font-semibold">{mostrar(detalle.valorNuevo)}</p></div>
          </div>
          <p className="mt-4 text-sm text-slate-600">Esta novedad procede del JSON de referencia. No implica que un usuario haya aprobado el cambio.</p>
        </section>
      )}
    </div>
  )
}

export default Trazabilidad
