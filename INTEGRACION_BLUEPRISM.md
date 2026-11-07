# Integración Blue Prism → FastAPI → React (Cada Hora Cuenta)

Este cambio **no instala ni ejecuta Blue Prism**. Lee el Excel real que produce el Performer del compañero:
`Resultados_AAAAMMDD_HHMM.xlsx` (hoja `Resultados`, 17 columnas).

## Qué se implementó

- `backend/blueprism_excel.py`: valida el Excel, convierte fechas serializadas, no recalcula atenciones, convierte a `null` las cifras de las excepciones, calcula los agregados y anonimiza personaId/clave mediante HMAC estable. El secreto se guarda fuera de Git, en `%LOCALAPPDATA%/CadaHoraCuenta/anon_secret.key` (Windows), o se puede configurar `BLUEPRISM_ANON_SECRET`.
- `backend/data_loader.py`: importa automáticamente la salida **más reciente** de `backend/entrada_blueprism/`, o de la carpeta definida en `BLUEPRISM_RESULTADOS_DIR`; recarga si cambia el archivo. Ante un XLSX incompleto conserva el último snapshot válido y expone `errorImportacion` por `/health`. Sin Excel, mantiene el mock.
- `backend/routers/resumen_instituto.py`: FOJA calculada desde `pctDirecto` y horas contratadas para profesionales completados en el último período, nunca como atenciones/meta. Los KPI acumulados suman los períodos presentes; **no se extrapolan artificialmente a 12 meses**.
- React: Dashboard informa períodos acumulados y origen, Monitoreo marca la ejecución del Excel y ofrece manejo de errores, Comparativa SIC presenta planificado y deja ejecutado como «Sin información SIC», y Trazabilidad identifica las novedades de demostración.
- `.gitignore`: evita subir los Excel originales y archivos locales de excepciones.

## Cómo ejecutar en Windows (PowerShell)

Desde la raíz del repositorio (tu rama `feature/integracion-datos-blueprism`):

```powershell
# Ubica un Excel generado por el bot en esta carpeta LOCAL, fuera de public/
New-Item -ItemType Directory -Force backend\entrada_blueprism | Out-Null
Copy-Item "$env:USERPROFILE\Downloads\Resultados_20261107_0843.xlsx" backend\entrada_blueprism\

# Terminal 1: backend
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: frontend (abrir otra terminal)
cd cada-hora-cuenta-frontend
npm.cmd run dev
```

Si el Excel se encuentra en otra ruta, ajusta la ruta de `Copy-Item`. No es necesario acceder al PC de tu compañero mientras tengas una copia de su salida. Si más adelante comparten una carpeta de red, configura `BLUEPRISM_RESULTADOS_DIR` en el entorno del backend apuntando a esa carpeta.

Revisa `http://127.0.0.1:8000/health`; con archivo válido debe decir `datosSimulados: false` y `conteos.resultados: 3123` en el caso de muestra. Vuelve a cargar el navegador para refrescar los datos cuando llegue una nueva corrida.

## Pruebas

En la raíz:

```powershell
$env:BLUEPRISM_ARCHIVO_PRUEBA = (Resolve-Path "backend\entrada_blueprism\Resultados_20261107_0843.xlsx").Path
backend\.venv\Scripts\python.exe -m unittest discover -s backend\tests -v
cd cada-hora-cuenta-frontend
npm.cmd run lint
npm.cmd run build
```

El ejemplo real validado debe entregar 3.123 resultados, 2.891 completados, 232 excepciones, 511.769 atenciones totales y 405.698 directas.

## Alcances que siguen pendientes

- Blue Prism **no** entrega aún novedades contractuales ni validación multi-instituto; se conservan datos de muestra en estas rutas, marcados como simulados. IDs ficticios de novedades no deben cruzarse con resultados importados reales.
- El kit no incluye reportes SIC ejecutados; no se inventan valores para `Comparativa SIC`.
- Los parámetros editados en la pantalla **no recalculan un archivo ya generado**: Blue Prism debe leer el Excel de parámetros en su siguiente corrida.
- La instalación en el PC/VM de tu compañero y el disparo remoto del bot deben coordinarse con él. Esta integración recibe su Excel, no opera el bot.
- Para un sistema productivo faltan autenticación, permisos, control de acceso a datos, historial persistente, sincronización transaccional y pruebas con nuevas corridas.

## Privacidad y GitHub

**NO** subir `Resultados_*.xlsx` ni `anon_secret.key` a GitHub. El backend lee la salida original localmente, la API solo entrega identificadores seudónimos. El Excel de origen puede contener IDs personales de los datos de ejemplo.
