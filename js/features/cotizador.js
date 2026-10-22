function crearCotizadorHTML(id) {
    return `
<div class="cotizador-container" data-id="${id}">
    <div class="cotizador-header">
        <div class="ch-title">
            <h2>Cotización de producto</h2>
            <span class="ch-sub">IVA aplicado: 13%</span>
        </div>
        <button class="remove-cotizacion-btn" onclick="eliminarCotizacion(${id})" title="Eliminar cotización" style="display:${id === 0 ? "none" : "flex"};">×</button>
    </div>
    <div class="cotizador-body">
        <div class="field">
            <label for="nombre_${id}">Nombre del Cliente/Producto</label>
            <textarea id="nombre_${id}" placeholder="Nombre del producto"
                    oninput="actualizarBotonGuardar(${id}); autoAjustarAltura(this)"
                    rows="1"></textarea>
        </div>

        <div class="field-grid">
            <div class="field">
                <label for="cantidad_${id}">Cantidad</label>
                <input type="number" id="cantidad_${id}" value="1" min="1" step="1"
                        oninput="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                        placeholder="Cantidad">
            </div>
            <div class="field">
                <label for="costo_${id}">Costo o precio base</label>
                <input type="number" id="costo_${id}" value="" min="0.01" step="0.01"
                        oninput="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                        placeholder="Costo unitario">
            </div>
        </div>

        <div class="field">
            <label for="margen_${id}">Margen Deseado (%)</label>
            <input type="number" id="margen_${id}" value="" min="1" max="99" step="0.01"
                    oninput="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                    placeholder="Margen deseado">
        </div>

        <div class="results">
            <div class="result-row iva">
                <span class="rl"><span class="dot"></span>IVA aplicado</span>
                <input type="number" id="iva_${id}" value="" readonly tabindex="-1" placeholder="0.00">
            </div>
            <div class="result-row siva">
                <span class="rl"><span class="dot"></span>Costo sin IVA (÷1.13)</span>
                <input type="number" id="costo_sin_iva_${id}" value="0.00" readonly tabindex="-1" placeholder="0.00">
            </div>
            <div class="result-row mneg">
                <span class="rl"><span class="dot"></span>Costo restando el margen</span>
                <input type="number" id="margen_negativo_${id}" value="0.00" readonly tabindex="-1" placeholder="0.00">
            </div>
            <div class="result-row total">
                <span class="rl"><span class="dot"></span>Total de Venta (con IVA)</span>
                <input type="number" id="total_${id}" value="" min="0.01" step="0.01"
                        onchange="calcularMargenDesdeTotal(${id}); actualizarBotonGuardar(${id})"
                        oninput="actualizarBotonGuardar(${id})"
                        placeholder="Total calculado">
            </div>
        </div>
        <button id="guardar_cotizacion_btn_${id}" class="guardar-cotizacion-btn visible" onclick="guardarCotizacion(${id})">Guardar cotización</button>
    </div>
</div>
`;
}

function agregarCotizacion() {
    cotizacionId++;
    const list = document.getElementById("cotizaciones-list");
    const div = document.createElement("div");
    div.innerHTML = crearCotizadorHTML(cotizacionId);
    list.appendChild(div.firstElementChild);
    inicializarCotizador(cotizacionId);
}

function eliminarCotizacion(id) {
    confirmar({
        titulo: "¿Eliminar cotización?",
        texto: "¿Estás seguro de que deseas borrar esta cotización? Esta acción no se puede deshacer.",
        textoOk: "Confirmar",
        textoCancelar: "Cancelar",
    }).then((confirmado) => {
        if (confirmado) {
            const cotizador = document.querySelector(
                `.cotizador-container[data-id="${id}"]`,
            );
            if (cotizador) cotizador.remove();
            mostrarAviso("success", "Eliminada", "La cotización ha sido eliminada correctamente.");
        }
    });
}

function inicializarCotizador(id) {
    calcularTotalDesdeCosto(id);
}

function calcularTotalDesdeCosto(id) {
    const costoInput = document.getElementById(`costo_${id}`);
    const cantidadInput = document.getElementById(`cantidad_${id}`);
    const margenInput = document.getElementById(`margen_${id}`);
    const totalInput = document.getElementById(`total_${id}`);
    const ivaInput = document.getElementById(`iva_${id}`);
    const costoSinIVAInput = document.getElementById(`costo_sin_iva_${id}`);
    const margenNegativoInput = document.getElementById(`margen_negativo_${id}`);

    const costo = parseFloat(costoInput.value) || 0;
    const cantidad = parseInt(cantidadInput.value) || 1;
    const margenPorcentaje = parseFloat(margenInput.value) || 0;
    const margenDecimal = margenPorcentaje / 100;

    if (costo > 0) {
        const costoSinIVA = costo / IVA_FACTOR;
        costoSinIVAInput.value = costoSinIVA.toFixed(2);
    } else {
        costoSinIVAInput.value = "0.00";
    }

    if (margenNegativoInput) {
        margenNegativoInput.value = (costo * (1 - margenDecimal)).toFixed(2);
    }

    if (margenDecimal >= 1 || margenDecimal < 0) {
        totalInput.value = "ERROR";
        ivaInput.value = "";
        return;
    }

    const pvUnitarioBase = costo / (1 - margenDecimal);
    const pvTotalSinIVA = pvUnitarioBase * cantidad;
    const iva = pvTotalSinIVA * 0.13;
    const pvTotal = pvTotalSinIVA + iva;

    ivaInput.value = iva.toFixed(2);
    totalInput.value = pvTotal.toFixed(2);
}

function calcularMargenDesdeTotal(id) {
    const costoInput = document.getElementById(`costo_${id}`);
    const cantidadInput = document.getElementById(`cantidad_${id}`);
    const totalInput = document.getElementById(`total_${id}`);
    const margenInput = document.getElementById(`margen_${id}`);
    const ivaInput = document.getElementById(`iva_${id}`);
    const costoSinIVAInput = document.getElementById(`costo_sin_iva_${id}`);
    const margenNegativoInput = document.getElementById(`margen_negativo_${id}`);

    const costo = parseFloat(costoInput.value) || 0;
    const cantidad = parseInt(cantidadInput.value) || 1;
    const totalDeseado = parseFloat(totalInput.value) || 0;

    if (costo > 0) {
        const costoSinIVA = costo / IVA_FACTOR;
        costoSinIVAInput.value = costoSinIVA.toFixed(2);
    } else {
        costoSinIVAInput.value = "0.00";
    }

    if (cantidad <= 0 || costo <= 0) {
        margenInput.value = 0;
        ivaInput.value = "";
        if (margenNegativoInput) margenNegativoInput.value = "0.00";
        return;
    }

    const pvUnitarioBase = totalDeseado / IVA_FACTOR / cantidad;
    if (pvUnitarioBase <= 0) {
        margenInput.value = "ERROR";
        ivaInput.value = "";
        return;
    }

    const margenDecimal = 1 - costo / pvUnitarioBase;
    const margenPorcentaje = margenDecimal * 100;

    const pvTotalSinIVA = pvUnitarioBase * cantidad;
    const iva = pvTotalSinIVA * 0.13;
    ivaInput.value = iva.toFixed(2);

    if (margenNegativoInput) {
        margenNegativoInput.value = (costo * (1 - margenDecimal)).toFixed(2);
    }

    margenInput.value = margenPorcentaje.toFixed(2);
}

function actualizarBotonGuardar(id) {
    const btn = document.getElementById(`guardar_cotizacion_btn_${id}`);
    if (btn) btn.classList.add("visible");
}

function autoAjustarAltura(textarea) {
    if (!textarea || textarea.tagName !== "TEXTAREA") return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
}
