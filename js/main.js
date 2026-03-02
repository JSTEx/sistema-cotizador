initDarkMode();

document.addEventListener("DOMContentLoaded", () => {
    cargarHistorialLocal();
    const list = document.getElementById("cotizaciones-list");
    list.innerHTML = crearCotizadorHTML(0);
    inicializarCotizador(0);
    actualizarBotonGuardar(0);
    inicializarDragCalculadora();
    actualizarFormularioCalculadora();
});

document.addEventListener(
    "click",
    function (e) {
        const modal = document.getElementById("modal-editar");

        if (e.target === modal) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    },
    true,
);
