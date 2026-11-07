# Cada Hora Cuenta – Botathon 2026

MVP React/Vite + FastAPI. Ver `cada-hora-cuenta-frontend/README.md` para los pasos completos de instalación y ejecución.

- Datos simulados operativos: `mockDataActualizado.json`.
- Parámetros Blue Prism: `Parametros_Bot.xlsx`.
- Backend: `backend/` (sin base de datos por ahora).
- Frontend: `cada-hora-cuenta-frontend/`.

El backend sirve los datos mock al frontend y gestiona la lectura/escritura del Excel de parámetros. Blue Prism debe leer el archivo actualizado al comienzo de la siguiente ejecución.
