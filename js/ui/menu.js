function toggleFormulas() {
    const container = document.getElementById("formulas-container");
    const btn = document.getElementById("toggle-formulas-btn");

    if (container.style.display === "none") {
        container.style.display = "flex";
        if (btn) btn.textContent = "Ocultar fórmulas";
    } else {
        container.style.display = "none";
        if (btn) btn.textContent = "Ver fórmulas";
    }
}

function toggleFormulasDesdeMenu() {
    toggleFormulas();
    document.getElementById("menu-popup").style.display = "none";
}

function toggleMenu() {
    const menu = document.getElementById("menu-popup");
    const burger = document.querySelector(".hamburger-menu");
    burger.classList.toggle("active");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("click", function (e) {
    const menu = document.getElementById("menu-popup");
    const burger = document.querySelector(".hamburger-menu");
    if (!menu.contains(e.target) && !burger.contains(e.target)) {
        menu.style.display = "none";
        burger.classList.remove("active");
    }
});
