function Select({ label, id, value, onChange, options = [], className = '' }) {
  return (
    <label htmlFor={id} className={`block text-sm font-medium text-slate-700 ${className}`}>
      {label}
      <select id={id} value={value} onChange={(event) => onChange?.(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#003366] focus:outline-none focus:ring-2 focus:ring-blue-100">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}
export default Select
