import { useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import { importarArchivoEjecucion, importarUltimaEjecucion } from '../../service/api'

// Trae a PostgreSQL una ejecución del bot: desde la carpeta compartida con la VM
// o, como plan B, subiendo el Resultados_*.xlsx a mano.
function ImportarEjecucion({ onImportado }) {
  const inputRef = useRef(null)
  const [estado, setEstado] = useState({ cargando: false, mensaje: '', error: '' })

  const ejecutar = async (accion) => {
    setEstado({ cargando: true, mensaje: '', error: '' })
    try {
      const r = await accion()
      const mensaje = r.duplicado
        ? `Ese archivo ya estaba importado (${r.ejecucionId}).`
        : `Importado ${r.archivo}: ${r.validos.toLocaleString('es-CL')} válidos, ${r.rechazados.toLocaleString('es-CL')} rechazados.`
      setEstado({ cargando: false, mensaje, error: '' })
      onImportado?.()
    } catch (e) {
      setEstado({ cargando: false, mensaje: '', error: e.message })
    }
  }

  const alElegirArchivo = (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (archivo) ejecutar(() => importarArchivoEjecucion(archivo))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => ejecutar(importarUltimaEjecucion)} disabled={estado.cargando}>
          {estado.cargando ? 'Importando…' : 'Importar última ejecución del bot'}
        </Button>
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={estado.cargando}>
          Subir Resultados.xlsx
        </Button>
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={alElegirArchivo} />
      </div>
      {estado.mensaje && <p className="mt-3 text-sm text-green-700">{estado.mensaje}</p>}
      {estado.error && <p className="mt-3 text-sm text-red-700">{estado.error}</p>}
    </div>
  )
}

export default ImportarEjecucion
