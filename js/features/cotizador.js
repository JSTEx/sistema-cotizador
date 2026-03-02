function crearCotizadorHTML(id) {
    return `
<div class="cotizador-container" data-id="${id}">
    <button class="remove-cotizacion-btn" onclick="eliminarCotizacion(${id})" title="Eliminar cotización" style="display:${id === 0 ? "none" : "flex"};">×</button>
    <h2>Cotizador de Producto</h2>
    <p>IVA aplicado: <b>13%</b></p>

    <div class="input-group">
        <label for="nombre_${id}">Nombre del Cliente/Producto:</label>
        <textarea id="nombre_${id}" placeholder="Nombre del producto"
                oninput="actualizarBotonGuardar(${id}); autoAjustarAltura(this)"
                rows="1"></textarea>
    </div>

    <div class="input-group">
        <label for="cantidad_${id}">Cantidad:</label>
        <input type="number" id="cantidad_${id}" value="1" min="1" step="1"
                onchange="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                oninput="actualizarBotonGuardar(${id})"
                placeholder="Ingrese la cantidad">
    </div>

    <div class="input-group">
        <label for="costo_${id}">Costo o precio Base:</label>
        <input type="number" id="costo_${id}" value="" min="0.01" step="0.01"
                oninput="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                onchange="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                placeholder="Ingrese el costo unitario">
    </div>

    <div class="input-group">
        <label for="margen_${id}">Margen Deseado (%):</label>
        <input type="number" id="margen_${id}" value="" min="1" max="99" step="0.01"
                onchange="calcularTotalDesdeCosto(${id}); actualizarBotonGuardar(${id})"
                oninput="actualizarBotonGuardar(${id})"
                placeholder="Ingrese el margen deseado">
    </div>

    <hr>

    <div class="input-group iva-field">
        <label for="iva_${id}">IVA aplicado y restado:</label>
        <input type="number" id="iva_${id}" value="" readonly tabindex="-1" placeholder="IVA calculado">
    </div>

    <div class="input-group costo-sin-iva-field">
        <label for="costo_sin_iva_${id}">Costo Unitario sin IVA (dividido 1.13):</label>
        <input type="number" id="costo_sin_iva_${id}" value="0.00" readonly tabindex="-1" placeholder="0.00">
    </div>

    <div class="input-group total-field">
        <label for="total_${id}">Total de Venta (Con IVA):</label>
        <input type="number" id="total_${id}" value="" min="0.01" step="0.01"
                onchange="calcularMargenDesdeTotal(${id}); actualizarBotonGuardar(${id})"
                oninput="actualizarBotonGuardar(${id})"
                placeholder="Total calculado">
    </div>
    <button id="guardar_cotizacion_btn_${id}" class="guardar-cotizacion-btn visible" onclick="guardarCotizacion(${id})">Guardar cotización</button>
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
    Swal.fire({
        icon: "warning",
        title: "¿Eliminar cotización?",
        text: "¿Estás seguro de que deseas borrar esta cotización? Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#f87171",
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            const cotizador = document.querySelector(
                `.cotizador-container[data-id="${id}"]`,
            );
            if (cotizador) cotizador.remove();
            Swal.fire({
                icon: "success",
                title: "Eliminada",
                text: "La cotización ha sido eliminada correctamente.",
                confirmButtonText: "Aceptar",
            });
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

    margenInput.value = margenPorcentaje.toFixed(2);
}

function actualizarBotonGuardar(id) {
    const btn = document.getElementById(`guardar_cotizacion_btn_${id}`);
    if (btn) btn.classList.add("visible");
}
