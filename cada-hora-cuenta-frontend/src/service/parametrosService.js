// Contrato de pantalla (campos planos) <-> contrato API/Excel (tramos anidados).
import { PARAMETROS } from '../data/mockParametros'
import { compararParametros } from '../utils/validacionesParametros'
const BASE=import.meta.env.VITE_API_URL||'http://localhost:8000'
let parametros=structuredClone(PARAMETROS),historial=[],conectado=false
const esperar=(ms=150)=>new Promise(r=>setTimeout(r,ms))
const keys=[['>= 40h','dir40mas','ind40mas'],['22-39h','dir22a40','ind22a40'],['< 22h','dirMenos22','indMenos22']]
function normalizar(data){return {...data,cargos:(data.cargos||[]).map(c=>({cargo:c.cargo,stdDirMin:c.stdDirMin,stdIndMin:c.stdIndMin,...Object.fromEntries(keys.flatMap(([t,d,i])=>[[d,c.tramos?.[t]?.pctDirecto??null],[i,c.tramos?.[t]?.pctIndirecto??null]]))}))}}
function serializar(data){return {...data,cargos:data.cargos.map(c=>({cargo:c.cargo,stdDirMin:c.stdDirMin,stdIndMin:c.stdIndMin,tramos:Object.fromEntries(keys.map(([t,d,i])=>[t,{pctDirecto:c[d],pctIndirecto:c[i]}]))}))}}
async function request(path,options={}){const res=await fetch(`${BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.detail||`Error API ${res.status}`);return body}
export const esDatoSimulado=()=>!conectado
export async function obtenerParametros(){try{const data=normalizar(await request('/api/parametros'));parametros=data;conectado=true;return structuredClone(data)}catch{await esperar();conectado=false;return structuredClone(parametros)}}
export async function obtenerHistorialParametros(){try{const data=await request('/api/parametros/historial');historial=data.historial||[];conectado=true}catch{await esperar()}return structuredClone(historial)}
export async function guardarParametros(nuevos,{usuario='Administrador',justificacion}){const cambios=compararParametros(parametros,nuevos);if(!cambios.length)throw new Error('No hay cambios para guardar.');try{const body=serializar(nuevos);const saved=normalizar(await request(`/api/parametros?usuario=${encodeURIComponent(usuario)}&justificacion=${encodeURIComponent(justificacion)}`,{method:'PUT',body:JSON.stringify(body)}));conectado=true;parametros=structuredClone(saved);return structuredClone(saved)}catch(error){if(conectado)throw error;await esperar();const fechaHora=new Date().toISOString().slice(0,19);historial=cambios.map(c=>({...c,usuario,fechaHora,modulo:'Parámetros',accion:'MODIFICAR_PARAMETRO',justificacion:justificacion.trim()})).concat(historial);parametros={...structuredClone(nuevos),version:(parametros.version||0)+1,actualizado:fechaHora};return structuredClone(parametros)}}
