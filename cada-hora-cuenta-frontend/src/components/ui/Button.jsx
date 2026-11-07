function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button', className = '' }) {
  const variants = {
    primary: 'bg-[#E30613] text-white hover:bg-red-700 focus-visible:ring-red-300',
    secondary: 'bg-[#003366] text-white hover:bg-blue-900 focus-visible:ring-blue-300',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-300'
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant] || variants.primary} ${className}`}>{children}</button>
}
export default Button
