require("dotenv").config();

const express = require("express");
const path = require("path");
const { handleChat, handleInventory } = require("./lib/ai");

const app = express();
const puerto = process.env.PORT || 3000;

const CSP = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
].join("; ");

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", CSP);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
});

app.use(express.json({ limit: "32kb" }));

app.post("/api/chat", handleChat);
app.get("/api/inventory", handleInventory);

app.use("/css", express.static(path.join(__dirname, "css"), { dotfiles: "deny", fallthrough: false }));
app.use("/js", express.static(path.join(__dirname, "js"), { dotfiles: "deny", fallthrough: false }));

app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.use((req, res) => {
    res.status(404).json({ error: "No encontrado." });
});

app.use((error, req, res, next) => {
    if (error?.type === "entity.parse.failed") {
        return res.status(400).json({ error: "JSON inválido." });
    }
    console.warn("Error del servidor:", error?.message || error);
    if (!res.headersSent) {
        return res.status(500).json({ error: "Error interno del servidor." });
    }
    return next(error);
});

app.listen(puerto, () => {
    console.log(`Servidor iniciado en http://localhost:${puerto}`);
    console.log("Claves y configuración de IA se leen solo desde variables de entorno.");
});
