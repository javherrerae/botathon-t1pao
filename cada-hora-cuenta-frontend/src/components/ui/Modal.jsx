function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar ventana" className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
        </div>
        {children}
      </section>
    </div>
  )
}
export default Modal
