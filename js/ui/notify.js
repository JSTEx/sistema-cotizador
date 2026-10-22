function _toastStack() {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.id = "toast-stack";
        stack.className = "toast-stack";
        stack.setAttribute("aria-live", "polite");
        document.body.appendChild(stack);
    }
    return stack;
}

function mostrarAviso(icono, titulo, texto, duracion = 3200) {
    const iconos = {
        success: "✓",
        warning: "!",
        error: "×",
        info: "i",
    };
    const stack = _toastStack();
    const toast = document.createElement("div");
    toast.className = `toast toast-${icono || "info"}`;
    toast.innerHTML = `
        <span class="toast-icon">${iconos[icono] || "i"}</span>
        <div class="toast-body">${titulo ? `<b>${titulo}</b>` : ""}${texto ? `<div>${texto}</div>` : ""}</div>
        <button class="toast-close" type="button" aria-label="Cerrar">×</button>
    `;

    const cerrar = () => {
        toast.classList.add("toast-out");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    };

    toast.querySelector(".toast-close").addEventListener("click", cerrar);
    stack.appendChild(toast);

    if (duracion > 0) {
        setTimeout(cerrar, duracion);
    }
}

function confirmar({ titulo, texto, textoOk = "Confirmar", textoCancelar = "Cancelar" } = {}) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "confirm-overlay active";
        overlay.innerHTML = `
            <div class="confirm-box" role="dialog" aria-modal="true">
                <h2>${titulo || "¿Estás seguro?"}</h2>
                ${texto ? `<p>${texto}</p>` : ""}
                <div class="confirm-actions">
                    <button class="confirm-cancel" type="button">${textoCancelar}</button>
                    <button class="confirm-ok" type="button">${textoOk}</button>
                </div>
            </div>
        `;

        const finalizar = (valor) => {
            overlay.remove();
            document.removeEventListener("keydown", onKey);
            resolve(valor);
        };

        const onKey = (e) => {
            if (e.key === "Escape") finalizar(false);
        };

        overlay.querySelector(".confirm-ok").addEventListener("click", () => finalizar(true));
        overlay.querySelector(".confirm-cancel").addEventListener("click", () => finalizar(false));
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) finalizar(false);
        });
        document.addEventListener("keydown", onKey);

        document.body.appendChild(overlay);
    });
}
