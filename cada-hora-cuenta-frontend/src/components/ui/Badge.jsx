function Badge({ children, type = 'default' }) {
  const styles = { success: 'bg-green-100 text-green-800', warning: 'bg-yellow-100 text-yellow-800', danger: 'bg-red-100 text-red-800', default: 'bg-slate-100 text-slate-700' }
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${styles[type] || styles.default}`}>{children}</span>
}
export default Badge
