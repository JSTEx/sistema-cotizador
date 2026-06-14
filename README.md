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

1. Agrega tu clave de OpenAI en `.env` si deseas usar OpenAI, o configura Hugging Face para IA gratuita. Si deseas usar búsqueda web, también configura tu motor de búsqueda:

```text
# OpenAI es opcional cuando usas Hugging Face
OPENAI_API_KEY=sk-...
# Hugging Face gratis
HUGGINGFACE_API_KEY=hf_xxxYOUR_HF_KEY_xxx
HUGGINGFACE_MODEL=google/flan-t5-large
# Opcional: búsqueda web
SEARCH_API_KEY=YOUR_GOOGLE_CUSTOM_SEARCH_API_KEY
SEARCH_ENGINE_ID=YOUR_GOOGLE_CUSTOM_SEARCH_ENGINE_ID
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
- Si configuras `SEARCH_API_KEY` y `SEARCH_ENGINE_ID`, el backend también buscará información relacionada en la web para complementar la respuesta.
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
- `IA / Local` intentará usar Hugging Face gratis si `HUGGINGFACE_API_KEY` está configurado. Si no, usará OpenAI si está disponible, y si no, caerá a respuesta local basada en el inventario.
- `Solo IA` forzará la respuesta desde Hugging Face o OpenAI si alguno está configurado.
- `Solo local` usará exclusivamente los datos cargados desde `data/inventario.json`.
- El backend IA está pensado para responder con mayor calidad usando OpenAI, pero la búsqueda local siempre puede devolver resultados útiles cuando no hay conexión.
