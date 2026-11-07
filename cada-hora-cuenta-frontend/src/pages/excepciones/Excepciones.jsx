import { useState } from 'react'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 20

function Page() {
  const [page, setPage] = useState(1)
  // No hay datos reales aún, pero mantenemos la interfaz para futuro
  const totalItems = 0
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#003366]">MÓDULO</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Excepciones multi-instituto</h1>
        <p className="mt-1 text-slate-500">Revisión de profesionales con distribución de jornada entre sedes.</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Vista inicial preparada. Funcionalidad pendiente de desarrollo en la siguiente fase.</p>
      </div>
      {/* Paginación placeholder */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
    </section>
  )
}
export default Page
