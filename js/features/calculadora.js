function abrirCalculadoraDesdeMenu() {
    const panel = document.getElementById("calculadora-panel");
    panel.style.display = "block";
    const menu = document.getElementById("menu-popup");
    const burger = document.querySelector(".hamburger-menu");
    menu.style.display = "none";
    burger.classList.remove("active");
    actualizarFormularioCalculadora();
    ajustarPanelCalculadoraAlViewport();
}

function cerrarCalculadora() {
    const panel = document.getElementById("calculadora-panel");
    panel.style.display = "none";
}

function redondearResultado(valor) {
    return Number(valor.toFixed(4));
}

function mostrarResultadoCalculadora(valor, descripcion) {
    calculadoraUltimoResultado = Number(valor);
    const resultado = document.getElementById("calc-result");
    resultado.value = `${descripcion}: ${redondearResultado(Number(valor)).toLocaleString("es-SV", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
    })}`;
}

function obtenerValorCalculadora(indice) {
    return parseFloat(document.getElementById(`calc-input-${indice}`).value) || 0;
}

function actualizarFormularioCalculadora() {
    const operacion = document.getElementById("calc-op")?.value || "suma";
    const config = calculadoraOperaciones[operacion] || calculadoraOperaciones.suma;

    for (let i = 1; i <= 4; i++) {
        const field = document.getElementById(`calc-field-${i}`);
        const label = document.getElementById(`calc-label-${i}`);
        const input = document.getElementById(`calc-input-${i}`);
        const campo = config.campos[i - 1];

        if (!field || !label || !input) continue;

        if (campo) {
            field.style.display = "flex";
            label.textContent = campo.label;
            input.placeholder = campo.placeholder;
            input.value = campo.defaultValue || "";
        } else {
            field.style.display = "none";
            input.value = "";
        }
    }

    document.getElementById("calc-result").value = "";
    calculadoraUltimoResultado = null;
}

function calcularCalculadoraSimple() {
    const operacion = document.getElementById("calc-op")?.value || "suma";
    const a = obtenerValorCalculadora(1);
    const b = obtenerValorCalculadora(2);
    const c = obtenerValorCalculadora(3);
    const d = obtenerValorCalculadora(4);

    let resultado = 0;
    let texto = "Resultado";

    if (operacion === "suma") {
        resultado = a + b;
        texto = "Suma";
    } else if (operacion === "resta") {
        resultado = a - b;
        texto = "Resta";
    } else if (operacion === "multiplicacion") {
        resultado = a * b;
        texto = "Multiplicación";
    } else if (operacion === "division") {
        if (b === 0) {
            mostrarResultadoCalculadora(0, "No se puede dividir entre 0");
            return;
        }
        resultado = a / b;
        texto = "División";
    } else if (operacion === "porcentaje_de") {
        resultado = a * (b / 100);
        texto = `${b}% de ${a}`;
    } else if (operacion === "sumar_porcentaje") {
        resultado = a + a * (b / 100);
        texto = `${a} + ${b}%`;
    } else if (operacion === "restar_porcentaje") {
        resultado = a - a * (b / 100);
        texto = `${a} - ${b}%`;
    } else if (operacion === "total_con_iva") {
        resultado = a * (1 + b / 100);
        texto = "Subtotal con IVA";
    } else if (operacion === "total_cotizacion") {
        const margenDecimal = b / 100;
        const cantidad = Math.max(1, Math.round(c || 1));
        const ivaPorcentaje = d || 13;

        if (a <= 0 || margenDecimal < 0 || margenDecimal >= 1) {
            mostrarResultadoCalculadora(0, "Verifica costo y margen (0% a 99.99%)");
            return;
        }

        const precioUnitario = a / (1 - margenDecimal);
        const subtotal = precioUnitario * cantidad;
        resultado = subtotal * (1 + ivaPorcentaje / 100);
        texto = `Total cotización (${cantidad} und)`;
    }

    mostrarResultadoCalculadora(resultado, texto);
}

function limpiarCalculadora() {
    const selectorOperacion = document.getElementById("calc-op");
    if (selectorOperacion) selectorOperacion.value = "suma";

    for (let i = 1; i <= 4; i++) {
        const input = document.getElementById(`calc-input-${i}`);
        if (input) input.value = "";
    }

    document.getElementById("calc-result").value = "";
    calculadoraUltimoResultado = null;
    actualizarFormularioCalculadora();
}

function obtenerCotizadorObjetivo() {
    const activo = document.activeElement;
    if (activo && activo.id) {
        const coincidencia = activo.id.match(/_(\d+)$/);
        if (coincidencia) {
            const id = Number(coincidencia[1]);
            if (document.getElementById(`total_${id}`)) {
                return id;
            }
        }
    }

    if (document.getElementById("total_0")) {
        return 0;
    }

    return null;
}

function usarResultadoEnTotal() {
    if (calculadoraUltimoResultado === null || Number.isNaN(calculadoraUltimoResultado)) {
        Swal.fire({
            icon: "warning",
            title: "Sin resultado",
            text: "Primero realiza una operación en la calculadora.",
            confirmButtonText: "Aceptar",
        });
        return;
    }

    const id = obtenerCotizadorObjetivo();
    if (id === null) {
        Swal.fire({
            icon: "warning",
            title: "Sin cotizador",
            text: "No se encontró un cotizador disponible para pegar el resultado.",
            confirmButtonText: "Aceptar",
        });
        return;
    }

    const totalInput = document.getElementById(`total_${id}`);
    totalInput.value = redondearResultado(calculadoraUltimoResultado).toFixed(2);
    calcularMargenDesdeTotal(id);
    actualizarBotonGuardar(id);
}

function ajustarPanelCalculadoraAlViewport() {
    const panel = document.getElementById("calculadora-panel");
    if (!panel || panel.style.display === "none") return;

    const margen = 8;
    const maxX = Math.max(margen, window.innerWidth - panel.offsetWidth - margen);
    const maxY = Math.max(margen, window.innerHeight - panel.offsetHeight - margen);

    const left = parseFloat(panel.style.left || "80");
    const top = parseFloat(panel.style.top || "110");

    panel.style.left = `${Math.min(Math.max(left, margen), maxX)}px`;
    panel.style.top = `${Math.min(Math.max(top, margen), maxY)}px`;
}

function iniciarDragCalculadora(event) {
    const panel = document.getElementById("calculadora-panel");
    if (!panel || panel.style.display === "none") return;
    if (event.target.closest("button")) return;

    calculadoraDragActiva = true;
    const rect = panel.getBoundingClientRect();
    calculadoraDragOffsetX = event.clientX - rect.left;
    calculadoraDragOffsetY = event.clientY - rect.top;
    panel.classList.add("dragging");
    event.preventDefault();
}

function moverCalculadora(event) {
    if (!calculadoraDragActiva) return;

    const panel = document.getElementById("calculadora-panel");
    const margen = 8;
    const maxX = Math.max(margen, window.innerWidth - panel.offsetWidth - margen);
    const maxY = Math.max(margen, window.innerHeight - panel.offsetHeight - margen);

    let nuevoLeft = event.clientX - calculadoraDragOffsetX;
    let nuevoTop = event.clientY - calculadoraDragOffsetY;

    nuevoLeft = Math.min(Math.max(nuevoLeft, margen), maxX);
    nuevoTop = Math.min(Math.max(nuevoTop, margen), maxY);

    panel.style.left = `${nuevoLeft}px`;
    panel.style.top = `${nuevoTop}px`;
}

function terminarDragCalculadora() {
    if (!calculadoraDragActiva) return;
    const panel = document.getElementById("calculadora-panel");
    panel.classList.remove("dragging");
    calculadoraDragActiva = false;
}

function inicializarDragCalculadora() {
    const handle = document.querySelector(".calc-drag-handle");
    if (!handle) return;

    handle.addEventListener("mousedown", iniciarDragCalculadora);
    document.addEventListener("mousemove", moverCalculadora);
    document.addEventListener("mouseup", terminarDragCalculadora);
    window.addEventListener("resize", ajustarPanelCalculadoraAlViewport);
}
