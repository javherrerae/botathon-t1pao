function Table({ columns = [], data = [], rowKey = 'id', emptyMessage = 'No hay registros para mostrar.' }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{columns.map((column) => <th key={column.key} scope="col" className="px-4 py-3 font-semibold">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length ? data.map((item, index) => (
            <tr key={item[rowKey] ?? index} className="hover:bg-slate-50">
              {columns.map((column) => <td key={column.key} className="px-4 py-3 text-slate-700">{column.render ? column.render(item) : item[column.key]}</td>)}
            </tr>
          )) : <tr><td colSpan={columns.length || 1} className="px-4 py-8 text-center text-slate-500">{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
export default Table
