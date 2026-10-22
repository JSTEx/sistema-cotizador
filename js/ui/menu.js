function abrirFormulas() {
    const container = document.getElementById("formulas-container");
    const overlay = document.getElementById("formulas-overlay");
    if (!container) return;
    container.classList.add("open");
    if (overlay) overlay.classList.add("active");
}

function cerrarFormulas() {
    const container = document.getElementById("formulas-container");
    const overlay = document.getElementById("formulas-overlay");
    if (!container) return;
    container.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
}

document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    cerrarFormulas();
    if (typeof cerrarHistorial === "function") cerrarHistorial();
    if (typeof cerrarCalculadora === "function") cerrarCalculadora();
});
