# Cada Hora Cuenta – Frontend Botathon 2026

## Ejecutar localmente
1. Instalar Node.js compatible con Vite 8.
2. Abrir esta carpeta en VS Code.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.
5. Para validar producción: `npm run build`.

## Primera fase incluida
- React + Vite + Tailwind CSS 4.
- AppShell con navegación lateral y encabezado.
- Dashboard nacional con cuatro KPI y gráfico de 17 institutos (datos demostrativos).
- Página inicial de planificación con búsqueda y filtros por instituto/cargo.
- Datos compartidos en `src/data/mockData.json`.
- Componentes UI reutilizables: Button, Card, Badge, Table, Select y Modal.
- Vistas placeholder para los módulos restantes.

## Importante sobre los datos
Los registros y valores del JSON son simulados para construir y demostrar la interfaz. No representan información oficial de Teletón ni datos reales de profesionales. Los nombres de institutos del gráfico son etiquetas de demostración; reemplazar por el catálogo validado por el equipo cuando esté disponible.

## Correcciones aplicadas respecto del ZIP recibido
- Se corrigieron rutas e importaciones que apuntaban a carpetas con mayúsculas distintas a las existentes.
- Se eliminó la importación de un servicio inexistente en `services/` y se conectó el Dashboard al JSON local.
- Se corrigió el uso de funciones asíncronas que el Dashboard trataba como objetos sincrónicos.
- Se alinearon los nombres de las métricas del Dashboard con la estructura del plan de trabajo.
- Se completaron módulos que estaban vacíos y provocaban fallos de importación.
- Se añadió la tabla reutilizable y se construyó una primera vista de planificación.
- Se actualizó idioma, título y metadatos del documento HTML.
