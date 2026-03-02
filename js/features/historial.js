function abrirHistorial() {
    const sidebar = document.getElementById("historial-sidebar");
    const toggleBtn = document.querySelector(".dark-mode-toggle");
    if (sidebar.style.display === "flex") {
        sidebar.style.display = "none";
        toggleBtn.classList.remove("historial-open");
    } else {
        sidebar.style.display = "flex";
        toggleBtn.classList.add("historial-open");
        renderHistorial();
    }
}

function cerrarHistorial() {
    const sidebar = document.getElementById("historial-sidebar");
    const toggleBtn = document.querySelector(".dark-mode-toggle");
    sidebar.style.display = "none";
    toggleBtn.classList.remove("historial-open");
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
        Swal.fire({
            icon: "success",
            title: "Cotización guardada",
            text: "La cotización se ha guardado correctamente.",
            confirmButtonText: "Aceptar",
        });
    } else {
        Swal.fire({
            icon: "warning",
            title: "Dato requerido",
            text: 'Debes ingresar un valor mayor a 0.001 en "Costo Unitario (Sin IVA)" para guardar la cotización.',
            confirmButtonText: "Aceptar",
        });
    }
}

function borrarCotizacion(idx) {
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
            historialCotizaciones.splice(idx, 1);
            guardarHistorialLocal();
            renderHistorial();
            Swal.fire({
                icon: "success",
                title: "Eliminada",
                text: "La cotización ha sido eliminada correctamente.",
                confirmButtonText: "Aceptar",
            });
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
        Swal.fire({
            icon: "success",
            title: "Cotización actualizada",
            text: "Los cambios se han guardado correctamente.",
            confirmButtonText: "Aceptar",
        });
    } else {
        Swal.fire({
            icon: "warning",
            title: "Dato requerido",
            text: "El costo debe ser mayor a 0.001",
            confirmButtonText: "Aceptar",
        });
    }
}

function renderHistorial() {
    const list = document.getElementById("historial-list");
    list.innerHTML = "";
    if (historialCotizaciones.length === 0) {
        list.innerHTML =
            '<div style="color:#6b7280;">No hay cotizaciones guardadas.</div>';
        return;
    }
    historialCotizaciones.forEach((c, idx) => {
        list.innerHTML += `
    <div class="historial-cotizacion">
        <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button class="edit-btn-historial" onclick="abrirModalEditar(${idx})">✎ Editar</button>
            <button style="background:#f87171;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:0.9em;cursor:pointer;" title="Eliminar" onclick="borrarCotizacion(${idx})">🗑 Eliminar</button>
        </div>
        <b>Nombre:</b> ${c.nombre}<br>
        <b>Fecha:</b> ${c.fecha}<br>
        <b>Cantidad:</b> ${c.cantidad}<br>
        <b>Costo Unitario:</b> $${c.costo.toFixed(2)}<br>
        <b>Costo sin IVA:</b> $${c.costoSinIVA.toFixed(2)}<br>
        <b>Margen:</b> ${c.margen.toFixed(2)}%<br>
        <b>Total:</b> $${c.total.toFixed(2)}<br>
        <b>IVA:</b> $${c.iva.toFixed(2)}<br>
    </div>
`;
    });
}
