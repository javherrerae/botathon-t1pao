# Cada Hora Cuenta – Botathon 2026

## Arquitectura actual (sin base de datos)

```text
mockDataActualizado.json ──> FastAPI (backend, memoria) ──> API REST ──> React/Vite
Parametros_Bot.xlsx <────── FastAPI (GET/PUT parámetros)
Blue Prism lee Parametros_Bot.xlsx al iniciar cada ejecución
```

El frontend no accede al Excel ni a Blue Prism directamente. Los datos de planificación, ejecuciones, novedades y resúmenes se sirven desde `mockDataActualizado.json` a través del backend. No se ha incorporado una BD: las modificaciones operativas de los módulos existentes siguen siendo de demostración/en memoria. Los parámetros se guardan en el Excel; la configuración adicional de meta e historial se conserva en archivos JSON locales, no en una BD.

## Requisitos
- Node.js 20.19+ o 22.12+ (recomendado para Vite 8).
- Python 3.10+.

## Iniciar backend (terminal 1)
Desde la raíz del repositorio:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API: http://localhost:8000 · documentación: http://localhost:8000/docs · salud: http://localhost:8000/health

## Iniciar frontend (terminal 2)

```bash
cd cada-hora-cuenta-frontend
npm install
npm run dev
```

Abrir la URL que informa Vite (normalmente http://localhost:5173). La variable `VITE_API_URL` está configurada en `.env` como `http://localhost:8000`. Si el backend no está disponible, la página Parámetros usa el mock local y muestra el estado simulado.

## Parámetros del bot
- Por defecto, el backend lee y escribe `Parametros_Bot.xlsx` en la raíz del repositorio. Para la carpeta compartida de Blue Prism, definir `PARAMETROS_BOT_PATH` en el entorno del backend con la ruta compartida. El frontend nunca accede a esa ruta.
- Hojas y encabezados reservados: `Cargos`, `Semanas` y `Fuente`; las dos primeras mantienen exactamente sus encabezados requeridos.
- Máximo 99 cargos, tres tramos de jornada y 12 periodos `AAAAMM` de 2026.
- Porcentajes se guardan como fracciones (0.65 = 65 %); NAS se calcula, no se almacena.
- Minutos estándar y semanas hábiles deben ser mayores que cero; directo + indirecto no puede superar 1.
- Cada guardado exige justificación y registra los cambios en `parametros_historial.json`. Meta y versión se guardan en `parametros_config.json`. Son archivos locales auxiliares para el MVP, no sustituyen una futura BD.
- Blue Prism debe volver a leer el Excel en su próxima ejecución; los cambios no alteran una corrida ya iniciada.

## Comprobaciones
Frontend: `npm run lint` y `npm run build`. Backend: `python -m py_compile backend/main.py backend/routers/*.py`.

Los datos de `mockDataActualizado.json` son simulados. El kit no contiene reporte SIC independiente; en ese caso la interfaz debe indicar “Sin información SIC” y no inventar valores.
