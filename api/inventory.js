const { cargarInventario } = require("./helpers");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed. Use GET." });
    }

    const inventario = cargarInventario();
    return res.status(200).json(inventario);
};
