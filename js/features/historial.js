function abrirHistorial() {
    const sidebar = document.getElementById("historial-sidebar");
    const overlay = document.getElementById("historial-overlay");
    if (!sidebar) return;
    sidebar.classList.add("open");
    if (overlay) overlay.classList.add("active");
    renderHistorial();
}

function cerrarHistorial() {
    const sidebar = document.getElementById("historial-sidebar");
    const overlay = document.getElementById("historial-overlay");
    if (!sidebar) return;
    sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
}

function cargarHistorialLocal() {
    const data = localStorage.getItem("historialCotizaciones");
    if (data) {
        try {
            historialCotizaciones = JSON.parse(data);
        } catch (e) {
            historialCotizaciones = [];
        }
    }
}

function guardarHistorialLocal() {
    localStorage.setItem(
        "historialCotizaciones",
        JSON.stringify(historialCotizaciones),
    );
}

function guardarCotizacion(id) {
    const nombre =
        document.getElementById(`nombre_${id}`).value || "Sin nombre";
    const costo =
        parseFloat(document.getElementById(`costo_${id}`).value) || 0;
    const cantidad =
        parseInt(document.getElementById(`cantidad_${id}`).value) || 0;
    const margen =
        parseFloat(document.getElementById(`margen_${id}`).value) || 0;
    const total =
        parseFloat(document.getElementById(`total_${id}`).value) || 0;
    const iva = parseFloat(document.getElementById(`iva_${id}`).value) || 0;
    const costoSinIVA =
        parseFloat(document.getElementById(`costo_sin_iva_${id}`).value) || 0;

    if (costo > 0.001) {
        historialCotizaciones.push({
            nombre,
            costo,
            cantidad,
            margen,
            total,
            iva,
            costoSinIVA,
            fecha: new Date().toLocaleString(),
        });
        guardarHistorialLocal();
        renderHistorial();
        mostrarAviso("success", "Cotización guardada", "La cotización se ha guardado correctamente.");
    } else {
        mostrarAviso("warning", "Dato requerido", 'Debes ingresar un valor mayor a 0.001 en "Costo Unitario (Sin IVA)" para guardar la cotización.');
    }
}

function borrarCotizacion(idx) {
    confirmar({
        titulo: "¿Eliminar cotización?",
        texto: "¿Estás seguro de que deseas borrar esta cotización? Esta acción no se puede deshacer.",
        textoOk: "Confirmar",
        textoCancelar: "Cancelar",
    }).then((confirmado) => {
        if (confirmado) {
            historialCotizaciones.splice(idx, 1);
            guardarHistorialLocal();
            renderHistorial();
            mostrarAviso("success", "Eliminada", "La cotización ha sido eliminada correctamente.");
        }
    });
}

function abrirModalEditar(idx) {
    indiceEnEdicion = idx;
    const cotizacion = historialCotizaciones[idx];

    document.getElementById("modal-nombre").value = cotizacion.nombre;
    document.getElementById("modal-cantidad").value = cotizacion.cantidad;
    document.getElementById("modal-costo").value = cotizacion.costo;
    document.getElementById("modal-margen").value = cotizacion.margen;
    document.getElementById("modal-total").value = cotizacion.total;
    document.getElementById("modal-iva").value = cotizacion.iva.toFixed(2);
    document.getElementById("modal-costo-sin-iva").value =
        cotizacion.costoSinIVA.toFixed(2);

    document.getElementById("modal-editar").classList.add("active");
}

function cerrarModal() {
    document.getElementById("modal-editar").classList.remove("active");
    indiceEnEdicion = -1;
}

function recalcularModalEdicion() {
    const costo =
        parseFloat(document.getElementById("modal-costo").value) || 0;
    const cantidad =
        parseInt(document.getElementById("modal-cantidad").value) || 1;
    const margen =
        parseFloat(document.getElementById("modal-margen").value) || 0;
    const total =
        parseFloat(document.getElementById("modal-total").value) || 0;

    const margenDecimal = margen / 100;

    if (costo > 0) {
        const costoSinIVA = costo / IVA_FACTOR;
        document.getElementById("modal-costo-sin-iva").value =
            costoSinIVA.toFixed(2);
    } else {
        document.getElementById("modal-costo-sin-iva").value = "0.00";
    }

    if (margen > 0 && margen < 100 && costo > 0 && cantidad > 0) {
        const pvUnitarioBase = costo / (1 - margenDecimal);
        const pvTotalSinIVA = pvUnitarioBase * cantidad;
        const iva = pvTotalSinIVA * 0.13;
        const pvTotal = pvTotalSinIVA + iva;

        document.getElementById("modal-total").value = pvTotal.toFixed(2);
        document.getElementById("modal-iva").value = iva.toFixed(2);
    }
    else if (total > 0 && costo > 0 && cantidad > 0) {
        const pvUnitarioBase = total / IVA_FACTOR / cantidad;
        const margenDecimal2 = 1 - costo / pvUnitarioBase;
        const margenPorcentaje = margenDecimal2 * 100;

        const pvTotalSinIVA = pvUnitarioBase * cantidad;
        const iva = pvTotalSinIVA * 0.13;

        document.getElementById("modal-margen").value =
            margenPorcentaje.toFixed(2);
        document.getElementById("modal-iva").value = iva.toFixed(2);
    }
    else if (costo > 0 && cantidad > 0) {
        if (margen > 0 && margen < 100) {
            const pvUnitarioBase = costo / (1 - margenDecimal);
            const pvTotalSinIVA = pvUnitarioBase * cantidad;
            const iva = pvTotalSinIVA * 0.13;
            const pvTotal = pvTotalSinIVA + iva;

            document.getElementById("modal-total").value = pvTotal.toFixed(2);
            document.getElementById("modal-iva").value = iva.toFixed(2);
        }
    }
}

function guardarCambiosEdicion() {
    if (indiceEnEdicion < 0) return;

    const nombre =
        document.getElementById("modal-nombre").value || "Sin nombre";
    const cantidad =
        parseInt(document.getElementById("modal-cantidad").value) || 0;
    const costo =
        parseFloat(document.getElementById("modal-costo").value) || 0;
    const margen =
        parseFloat(document.getElementById("modal-margen").value) || 0;
    const total =
        parseFloat(document.getElementById("modal-total").value) || 0;
    const iva = parseFloat(document.getElementById("modal-iva").value) || 0;
    const costoSinIVA =
        parseFloat(document.getElementById("modal-costo-sin-iva").value) || 0;

    if (costo > 0.001) {
        historialCotizaciones[indiceEnEdicion] = {
            nombre,
            costo,
            cantidad,
            margen,
            total,
            iva,
            costoSinIVA,
            fecha: historialCotizaciones[indiceEnEdicion].fecha,
        };

        guardarHistorialLocal();
        renderHistorial();
        cerrarModal();
        mostrarAviso("success", "Cotización actualizada", "Los cambios se han guardado correctamente.");
    } else {
        mostrarAviso("warning", "Dato requerido", "El costo debe ser mayor a 0.001");
    }
}

function renderHistorial() {
    const list = document.getElementById("historial-list");
    const count = document.getElementById("historial-count");
    if (!list) return;
    list.innerHTML = "";

    if (count) {
        count.textContent = historialCotizaciones.length === 1
            ? "1 cotización guardada"
            : `${historialCotizaciones.length} cotizaciones guardadas`;
    }

    if (historialCotizaciones.length === 0) {
        list.innerHTML =
            '<div class="historial-empty">No hay cotizaciones guardadas todavía.<br>Completa una cotización y presiona <b>Guardar</b>.</div>';
        return;
    }

    historialCotizaciones.forEach((c, idx) => {
        const div = document.createElement("div");
        div.className = "historial-cotizacion";
        div.innerHTML = `
        <div class="hist-top">
            <span class="hist-nombre">${c.nombre}</span>
            <span class="hist-fecha">${c.fecha}</span>
        </div>
        <div class="hist-total">$${c.total.toFixed(2)}</div>
        <div class="hist-meta">
            <div><span class="hl">Cantidad</span><span class="hv">${c.cantidad}</span></div>
            <div><span class="hl">Margen</span><span class="hv">${c.margen.toFixed(2)}%</span></div>
            <div><span class="hl">Costo</span><span class="hv">$${c.costo.toFixed(2)}</span></div>
            <div><span class="hl">Costo s/IVA</span><span class="hv">$${c.costoSinIVA.toFixed(2)}</span></div>
            <div><span class="hl">IVA</span><span class="hv">$${c.iva.toFixed(2)}</span></div>
        </div>
        <div class="hist-actions">
            <button class="edit-btn-historial" onclick="abrirModalEditar(${idx})">✎ Editar</button>
            <button class="del-btn-historial" onclick="borrarCotizacion(${idx})">🗑 Eliminar</button>
        </div>
    `;
        list.appendChild(div);
    });
}
