# Cada Hora Cuenta – Botathon 2026

MVP React/Vite + FastAPI. Ver `cada-hora-cuenta-frontend/README.md` para los pasos completos de instalación y ejecución.

- Datos simulados operativos: `mockDataActualizado.json`.
- Parámetros Blue Prism: `Parametros_Bot.xlsx`.
- Backend: `backend/` con PostgreSQL (datos reales del bot) o mock como plan B. Ver `backend/POSTGRES.md`.
- Frontend: `cada-hora-cuenta-frontend/`.

El backend sirve los datos mock al frontend y gestiona la lectura/escritura del Excel de parámetros. Blue Prism debe leer el archivo actualizado al comienzo de la siguiente ejecución.

## Iteración: Parámetros, excepciones y trazabilidad (07-11-2026)

- Parámetros: el administrador edita meta de gestión y porcentajes directa/indirecta por cargo y tramo. NAS se calcula automáticamente. Minutos estándar y semanas hábiles se muestran como referencia de solo lectura.
- Excepciones multi-instituto: alta de distribución por persona y periodo, con validación de horas y persistencia temporal en `backend/excepciones_multi_instituto.json` (sin base de datos).
- Historial de parámetros y novedades: tablas paginadas de 15 registros.
- La API devuelve parámetros anidados por tramo; el servicio frontend convierte ese contrato al formato plano que consumen los componentes.

### Pruebas

Ver `Informe_avance_y_plan_de_pruebas_Cada_Hora_Cuenta.docx` para el detalle de pruebas manuales de frontend y backend, criterios de aceptación y pendientes.

Comandos:

```bash
# backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# frontend, en otra terminal
cd cada-hora-cuenta-frontend
npm ci
npm run lint
npm run build
npm run dev
```
