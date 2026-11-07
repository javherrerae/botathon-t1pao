/**
 * Pagination.jsx
 * Componente reutilizable de paginación.
 * Props:
 *   - page: número de página actual (1-based)
 *   - totalPages: total de páginas
 *   - totalItems: total de filas
 *   - pageSize: filas por página
 *   - onChange: (newPage) => void
 */
function Pagination({ page, totalPages, totalItems, pageSize, onChange }) {
  if (totalPages <= 1) return null

  const desde = (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, totalItems)

  // Genera el rango de páginas a mostrar (máx 7 botones)
  const getRange = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages]
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', page - 1, page, page + 1, '...', totalPages]
  }

  const btnBase =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors'
  const btnActive = 'bg-[#003366] text-white shadow-sm'
  const btnInactive = 'border border-slate-200 text-slate-700 hover:bg-slate-50'
  const btnDisabled = 'border border-slate-100 text-slate-300 cursor-not-allowed'

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {/* Contador */}
      <p className="text-sm text-slate-500">
        Mostrando <span className="font-semibold text-slate-700">{desde}–{hasta}</span> de{' '}
        <span className="font-semibold text-slate-700">{totalItems.toLocaleString('es-CL')}</span> registros
      </p>

      {/* Botones */}
      <div className="flex items-center gap-1">
        {/* Anterior */}
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={`${btnBase} ${page === 1 ? btnDisabled : btnInactive}`}
          aria-label="Página anterior"
        >
          ‹
        </button>

        {getRange().map((item, idx) =>
          item === '...' ? (
            <span key={`ellipsis-${idx}`} className="inline-flex h-9 w-9 items-center justify-center text-slate-400">
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onChange(item)}
              className={`${btnBase} ${item === page ? btnActive : btnInactive}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </button>
          )
        )}

        {/* Siguiente */}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={`${btnBase} ${page === totalPages ? btnDisabled : btnInactive}`}
          aria-label="Página siguiente"
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default Pagination
