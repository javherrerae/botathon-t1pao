function Footer() {
  return (
    <footer className="mt-auto border-t border-blue-100 bg-[#AB0C02]/95 px-5 py-5 text-white md:px-8">

      <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">

        <div>
          <h3 className="text-sm font-bold tracking-wide">
            CADA HORA CUENTA
          </h3>

          <p className="mt-1 text-xs text-blue-200">
            Desafío Botathon 2026
          </p>
        </div>

        <div className="text-xs leading-6 text-blue-100">
          <p>
            <span className="font-semibold text-white">Integrantes:</span>{' '}
            Fabián Cornejo, Jeannette Figueroa, Javier Herrera, Misael Rojas
          </p>

          <p>
            <span className="font-semibold text-white">Sede:</span>{' '}
            Padre Alonso de Ovalle
          </p>

          <p>
            <span className="font-semibold text-white">Equipo:</span>{' '}
             T1 PAO
          </p>
        </div>

      </div>

      <div className="mt-4 border-t border-white/20 pt-3 text-center text-xs text-blue-200">
        © 2026 · Proyecto académico · Frontend
      </div>

    </footer>
  )
}

export default Footer