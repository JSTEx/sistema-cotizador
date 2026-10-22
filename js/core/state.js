const IVA_FACTOR = 1.13;

let cotizacionId = 0;
let indiceEnEdicion = -1;
let historialCotizaciones = [];

let calculadoraUltimoResultado = null;
let calculadoraDragActiva = false;
let calculadoraDragOffsetX = 0;
let calculadoraDragOffsetY = 0;

const calculadoraOperaciones = {
    suma: {
        grupo: "Básicas",
        descripcion: "Suma",
        formula: "A + B",
        campos: [
            { label: "Valor A", placeholder: "Ej: 25" },
            { label: "Valor B", placeholder: "Ej: 10" },
        ],
    },
    resta: {
        grupo: "Básicas",
        descripcion: "Resta",
        formula: "A − B",
        campos: [
            { label: "Valor A (minuendo)", placeholder: "Ej: 25" },
            { label: "Valor B (sustraendo)", placeholder: "Ej: 10" },
        ],
    },
    multiplicacion: {
        grupo: "Básicas",
        descripcion: "Multiplicación",
        formula: "A × B",
        campos: [
            { label: "Valor A", placeholder: "Ej: 25" },
            { label: "Valor B", placeholder: "Ej: 10" },
        ],
    },
    division: {
        grupo: "Básicas",
        descripcion: "División",
        formula: "A ÷ B",
        campos: [
            { label: "Dividendo (A)", placeholder: "Ej: 25" },
            { label: "Divisor (B)", placeholder: "Ej: 5" },
        ],
    },
    porcentaje_de: {
        grupo: "Porcentajes",
        descripcion: "Porcentaje de un valor",
        formula: "A × (B ÷ 100)",
        ayuda: "¿Cuánto es el B% de A?",
        campos: [
            { label: "Valor total (A)", placeholder: "Ej: 100" },
            { label: "Porcentaje % (B)", placeholder: "Ej: 13" },
        ],
    },
    sumar_porcentaje: {
        grupo: "Porcentajes",
        descripcion: "Sumar porcentaje",
        formula: "A + (A × B ÷ 100)",
        ayuda: "Aumenta A en un B%.",
        campos: [
            { label: "Valor base (A)", placeholder: "Ej: 100" },
            { label: "Porcentaje a sumar % (B)", placeholder: "Ej: 13" },
        ],
    },
    restar_porcentaje: {
        grupo: "Porcentajes",
        descripcion: "Restar porcentaje",
        formula: "A − (A × B ÷ 100)",
        ayuda: "Aplica un descuento del B% a A.",
        campos: [
            { label: "Valor base (A)", placeholder: "Ej: 100" },
            { label: "Porcentaje a restar % (B)", placeholder: "Ej: 13" },
        ],
    },
    total_con_iva: {
        grupo: "Cotización",
        descripcion: "Subtotal + IVA",
        formula: "A × (1 + B ÷ 100)",
        ayuda: "Agrega el IVA a un subtotal.",
        campos: [
            { label: "Subtotal (A)", placeholder: "Ej: 250" },
            { label: "IVA % (B)", placeholder: "Ej: 13", defaultValue: "13" },
        ],
    },
    total_cotizacion: {
        grupo: "Cotización",
        descripcion: "Precio de venta con margen",
        formula: "A ÷ (1 − B ÷ 100) × C × (1 + D ÷ 100)",
        ayuda: "Calcula el total a cobrar: costo + margen + cantidad + IVA.",
        campos: [
            { label: "Costo unitario (A)", placeholder: "Ej: 45" },
            { label: "Margen % (B)", placeholder: "Ej: 25" },
            { label: "Cantidad (C)", placeholder: "Ej: 2", defaultValue: "1" },
            { label: "IVA % (D)", placeholder: "Ej: 13", defaultValue: "13" },
        ],
    },
    margen_negativo: {
        grupo: "Cotización",
        descripcion: "Costo menos % (descuento)",
        formula: "A × (1 − B ÷ 100)",
        ayuda: "Resta un porcentaje al costo, tal como en el cotizador.",
        campos: [
            { label: "Costo (A)", placeholder: "Ej: 20" },
            { label: "Porcentaje a restar % (B)", placeholder: "Ej: 34" },
        ],
    },
};
