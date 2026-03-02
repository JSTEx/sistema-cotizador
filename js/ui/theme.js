function initDarkMode() {
    const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
    ).matches;
    const savedMode = localStorage.getItem("darkMode");

    if (savedMode !== null) {
        if (savedMode === "true") {
            document.documentElement.classList.add("dark-mode");
        }
    } else if (prefersDark) {
        document.documentElement.classList.add("dark-mode");
        localStorage.setItem("darkMode", "true");
    }
}

function toggleDarkMode() {
    const html = document.documentElement;
    const isDarkMode = html.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", isDarkMode);
}
