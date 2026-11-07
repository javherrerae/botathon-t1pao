// src/services/planificacionService.js

export const obtenerResumenNacional = async () => {
  return {
    horasSemanales: 21586,
    atencionesAnuales: 1042866,
    metaGestion: 938578,
    institutosTotales: 17
  };
};

export const obtenerInstitutos = async () => {
  return [
    { nombre: "Santiago", atenciones: 335000 },
    { nombre: "Concepción", atenciones: 96000 },
    { nombre: "Valparaíso", atenciones: 95500 },
    { nombre: "Talca", atenciones: 68000 },
    { nombre: "Puerto Montt", atenciones: 64000 }
  ];
};