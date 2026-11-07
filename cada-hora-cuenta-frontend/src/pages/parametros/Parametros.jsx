import { useEffect, useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Table from '../../components/ui/Table'
import Pagination from '../../components/ui/Pagination'
import EditorCargo from './EditorCargo'
import { esDatoSimulado, obtenerParametros, obtenerHistorialParametros, guardarParametros } from '../../service/parametrosService'
import { TRAMOS, calcularNas, validarParametros, compararParametros } from '../../utils/validacionesParametros'

const PAGE_SIZE = 15
const pct = v => v == null ? '—' : `${(v*100).toLocaleString('es-CL',{maximumFractionDigits:1})}%`
const fecha = v => v ? String(v).replace('T',' ').slice(0,19) : '—'

export default function Parametros() {
  const [original,setOriginal]=useState(null), [borrador,setBorrador]=useState(null), [historial,setHistorial]=useState([])
  const [busqueda,setBusqueda]=useState(''), [editando,setEditando]=useState(null), [meta,setMeta]=useState('90')
  const [justificacion,setJustificacion]=useState(''), [errores,setErrores]=useState({}), [guardando,setGuardando]=useState(false), [mensaje,setMensaje]=useState('')
  const [pageCargos,setPageCargos]=useState(1), [pageHist,setPageHist]=useState(1)
  useEffect(()=>{ Promise.all([obtenerParametros(),obtenerHistorialParametros()]).then(([p,h])=>{setOriginal(p);setBorrador(structuredClone(p));setMeta(String(Math.round(p.metaGestionPct*100)));setHistorial(h)}).catch(e=>setErrores({general:e.message})) },[])
  const cambios = useMemo(()=>original&&borrador?compararParametros(original,borrador):[],[original,borrador])
  const filtrados = useMemo(()=> (borrador?.cargos||[]).map((c,indice)=>({...c,indice})).filter(c=>c.cargo.toLocaleLowerCase('es').includes(busqueda.trim().toLocaleLowerCase('es'))),[borrador,busqueda])
  if (errores.general && !borrador) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{errores.general}</p>
  if (!borrador) return <p className="text-slate-500">Cargando parámetros…</p>
  const actualizarCargo=(indice,nuevo)=>setBorrador(p=>({...p,cargos:p.cargos.map((c,i)=>i===indice?nuevo:c)}))
  const guardar=async()=>{
    const draft={...borrador,metaGestionPct:Number(meta)/100}
    const v=validarParametros(draft,{justificacion})
    if(!v.valido){setErrores(v.errores);return}
    setGuardando(true);setErrores({});setMensaje('')
    try { const saved=await guardarParametros(draft,{usuario:'Administrador',justificacion});setOriginal(saved);setBorrador(structuredClone(saved));setMeta(String(Math.round(saved.metaGestionPct*100)));setHistorial(await obtenerHistorialParametros());setJustificacion('');setMensaje(`Cambios guardados. Blue Prism los aplicará en la próxima ejecución (versión ${saved.version}).`) }
    catch(e){setErrores({general:e.message})} finally{setGuardando(false)}
  }
  const descartar=()=>{setBorrador(structuredClone(original));setMeta(String(Math.round(original.metaGestionPct*100)));setJustificacion('');setErrores({});setMensaje('')}
  const columns=[{key:'cargo',label:'Cargo',render:c=><b>{c.cargo}</b>},{key:'mins',label:'Minutos estándar (dir. / ind.)',render:c=>`${c.stdDirMin} / ${c.stdIndMin}`},...TRAMOS.map(t=>({key:t.id,label:`${t.etiqueta} · directa / indirecta / NAS`,render:c=><div>{pct(c[t.dir])} / {pct(c[t.ind])}<div className="text-xs text-slate-500">NAS {pct(calcularNas(c[t.dir],c[t.ind]))}</div></div>})),{key:'action',label:'',render:c=><Button variant="outline" onClick={()=>setEditando(c.indice)}>Editar distribución</Button>}]
  const historyColumns=[{key:'fechaHora',label:'Fecha y hora',render:h=>fecha(h.fechaHora)},{key:'usuario',label:'Usuario',render:h=>h.usuario||h.responsable||'—'},{key:'campo',label:'Parámetro'},{key:'valores',label:'Anterior → nuevo',render:h=>`${typeof h.valorAnterior==='number'&&h.valorAnterior<=1?pct(h.valorAnterior):h.valorAnterior??'—'} → ${typeof h.valorNuevo==='number'&&h.valorNuevo<=1?pct(h.valorNuevo):h.valorNuevo??'—'}`},{key:'justificacion',label:'Justificación'}]
  const pageRows=filtrados.slice((pageCargos-1)*PAGE_SIZE,pageCargos*PAGE_SIZE)
  const historyRows=historial.slice((pageHist-1)*PAGE_SIZE,pageHist*PAGE_SIZE)
  return <section className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#003366]">MÓDULO</p><h1 className="mt-1 text-2xl font-bold">Parámetros del bot</h1><p className="mt-1 text-sm text-slate-500">Reglas editables para Blue Prism · versión {original.version} · {fecha(original.actualizado)}</p></div>{esDatoSimulado()&&<Badge type="warning">Datos simulados / API local</Badge>}</header>
    {mensaje&&<div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{mensaje}</div>}
    <section className="rounded-xl border bg-white p-5 shadow-sm space-y-3"><div><h2 className="font-semibold">¿Qué puede modificar el administrador?</h2><p className="text-sm text-slate-500">Solo las reglas de distribución y la meta. El bot conserva los estándares técnicos y el calendario cargado.</p></div><label className="block max-w-xs text-sm font-medium">Meta de gestión<input type="number" min="1" max="100" step="1" value={meta} onChange={e=>{setMeta(e.target.value);setBorrador(p=>({...p,metaGestionPct:Number(e.target.value)/100}))}} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"/><span className="text-xs text-slate-500">Porcentaje aplicado a las atenciones proyectadas.</span></label>{errores.metaGestionPct&&<p className="text-xs text-red-600">{errores.metaGestionPct}</p>}</section>
    <section className="rounded-xl border bg-white p-5 shadow-sm space-y-3"><div><h2 className="font-semibold">Distribución por cargo</h2><p className="text-sm text-slate-500">Edita únicamente porcentajes directa e indirecta. NAS se calcula automáticamente. Minutos estándar quedan informativos.</p></div><input aria-label="Buscar cargo" type="search" value={busqueda} onChange={e=>{setBusqueda(e.target.value);setPageCargos(1)}} placeholder="Buscar cargo…" className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"/><Table columns={columns} data={pageRows} rowKey="cargo" emptyMessage="No hay cargos para mostrar."/><Pagination page={pageCargos} totalPages={Math.max(1,Math.ceil(filtrados.length/PAGE_SIZE))} totalItems={filtrados.length} pageSize={PAGE_SIZE} onChange={setPageCargos}/></section>
    <section className="rounded-xl border bg-white p-5 shadow-sm space-y-2"><h2 className="font-semibold">Calendario que utilizará el bot</h2><p className="text-sm text-slate-500">Semanas hábiles recibidas desde el archivo de parámetros. Se muestran para revisión; no se editan manualmente en este MVP.</p><div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">{borrador.semanas.map(s=><div key={s.periodo} className="rounded-lg bg-slate-50 p-2 text-center"><span className="block text-xs uppercase text-slate-500">{s.mes}</span><b>{Number(s.semanasHabiles).toLocaleString('es-CL')}</b></div>)}</div></section>
    {cambios.length>0&&<section className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3"><h2 className="font-semibold text-amber-950">Cambios pendientes: {cambios.length}</h2><p className="text-sm text-amber-900">La justificación se solicita una sola vez para todo el guardado.</p><label className="block text-sm font-medium text-amber-950">Motivo del cambio<textarea rows="2" value={justificacion} onChange={e=>setJustificacion(e.target.value)} placeholder="Ej.: actualización validada por Dirección Médica Nacional" className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2"/></label>{errores.justificacion&&<p className="text-xs text-red-700">{errores.justificacion}</p>}{errores.general&&<p role="alert" className="text-sm text-red-700">{errores.general}</p>}<div className="flex gap-2"><Button onClick={guardar} disabled={guardando}>{guardando?'Guardando…':'Guardar cambios'}</Button><Button variant="outline" onClick={descartar} disabled={guardando}>Descartar</Button></div></section>}
    <section className="rounded-xl border bg-white p-5 shadow-sm space-y-3"><h2 className="font-semibold">Historial de parámetros</h2><Table columns={historyColumns} data={historyRows} rowKey="campo" emptyMessage="Aún no hay cambios registrados."/><Pagination page={pageHist} totalPages={Math.max(1,Math.ceil(historial.length/PAGE_SIZE))} totalItems={historial.length} pageSize={PAGE_SIZE} onChange={setPageHist}/></section>
    {editando!==null&&<EditorCargo key={`${editando}-${borrador.cargos[editando].cargo}`} cargo={borrador.cargos[editando]} onAplicar={nuevo=>{actualizarCargo(editando,nuevo);setEditando(null)}} onCerrar={()=>setEditando(null)}/>}
  </section>
}
