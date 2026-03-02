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
        descripcion: "Suma",
        campos: [
            { label: "Valor A", placeholder: "Ej: 25" },
            { label: "Valor B", placeholder: "Ej: 10" },
        ],
    },
    resta: {
        descripcion: "Resta",
        campos: [
            { label: "Valor A", placeholder: "Ej: 25" },
            { label: "Valor B", placeholder: "Ej: 10" },
        ],
    },
    multiplicacion: {
        descripcion: "Multiplicación",
        campos: [
            { label: "Valor A", placeholder: "Ej: 25" },
            { label: "Valor B", placeholder: "Ej: 10" },
        ],
    },
    division: {
        descripcion: "División",
        campos: [
            { label: "Valor A", placeholder: "Ej: 25" },
            { label: "Valor B", placeholder: "Ej: 5" },
        ],
    },
    porcentaje_de: {
        descripcion: "Porcentaje de un valor",
        campos: [
            { label: "Base", placeholder: "Ej: 100" },
            { label: "Porcentaje %", placeholder: "Ej: 13" },
        ],
    },
    sumar_porcentaje: {
        descripcion: "Sumar porcentaje",
        campos: [
            { label: "Base", placeholder: "Ej: 100" },
            { label: "Porcentaje %", placeholder: "Ej: 13" },
        ],
    },
    restar_porcentaje: {
        descripcion: "Restar porcentaje",
        campos: [
            { label: "Base", placeholder: "Ej: 100" },
            { label: "Porcentaje %", placeholder: "Ej: 13" },
        ],
    },
    total_con_iva: {
        descripcion: "Total con IVA",
        campos: [
            { label: "Subtotal", placeholder: "Ej: 250" },
            { label: "IVA %", placeholder: "Ej: 13", defaultValue: "13" },
        ],
    },
    total_cotizacion: {
        descripcion: "Total de cotización",
        campos: [
            { label: "Costo unitario", placeholder: "Ej: 45" },
            { label: "Margen %", placeholder: "Ej: 25" },
            { label: "Cantidad", placeholder: "Ej: 2", defaultValue: "1" },
            { label: "IVA %", placeholder: "Ej: 13", defaultValue: "13" },
        ],
    },
};
