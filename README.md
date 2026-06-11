# Sistema Cotizador

Proyecto de cotización con un chat de inventario que integra IA.

## Qué se agregó

- `server.js`: servidor Express que sirve la app y expone `/api/chat`.
- `js/features/chat.js`: chat del frontend que usa el backend IA y cae a una búsqueda local si el servidor no está disponible.
- `css/features/chat.css`: estilos del chat.
- `package.json`: dependencias necesarias (`express`, `openai`).
- `.env.example`: ejemplo de variable de entorno para `OPENAI_API_KEY`.
- `.gitignore`: ignora `node_modules` y `.env`.

## Cómo usar

1. Copia `.env.example` a `.env`:

```bash
copy .env.example .env
```

1. Abre `c:\Users\ghost\OneDrive\Escritorio\sistema-cotizador` en tu terminal.

1. Instala dependencias (necesitas Node.js instalado):

```bash
npm install
```

1. Agrega tu clave de OpenAI en `.env`:

```text
OPENAI_API_KEY=sk-...
```

1. Si haces cambios en los archivos `data/inventario_*.json`, regenera el inventario unificado:

```powershell
.\scripts\merge_inventory.ps1
```

1. Inicia el servidor:

```bash
npm start
```

1. Abre en el navegador:

```text
http://localhost:3000
```

## Importante

- El chat IA utiliza la información de `data/inventario.json`.
- Si `data/inventario.json` está vacío, el chat mostrará un mensaje pidiendo datos.
- Para obtener respuestas útiles, llena el inventario con objetos JSON como:

```json
[
  {
    "nombre": "Fuente de poder 650W",
    "categoria": "FUENTES DE PODER",
    "marca": "Corsair",
    "modelo": "RM650",
    "precio": 159.99,
    "descripcion": "Fuente modular 80+ Gold para PCs gaming."
  }
]
```

## Notas

- El chat ahora incluye un selector de modo: `IA / Local`, `Solo IA` o `Solo local`.
- `IA / Local` intentará usar OpenAI y, si no está disponible, usará la búsqueda local sobre `data/inventario.json`.
- `Solo IA` forzará la respuesta desde el backend OpenAI.
- `Solo local` usará exclusivamente los datos cargados desde `data/inventario.json`.
- El backend IA está pensado para responder con mayor calidad usando OpenAI, pero la búsqueda local siempre puede devolver resultados útiles cuando no hay conexión.
