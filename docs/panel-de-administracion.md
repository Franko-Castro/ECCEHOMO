# Panel de Administración de Eccehomo

Este sitio no usa base de datos. Todo el contenido editable (textos, platos,
precios, imágenes y PDFs) vive en el archivo **`contenido.json`**, y el panel
**`admin.html`** sirve para editarlo sin tocar código.

---

## Cómo entrar

1. Abre `https://tu-sitio.com/admin.html` (la URL de tu página + `/admin.html`).
2. Inicia sesión con las credenciales iniciales:
   - **Correo:** admin@eccehomo.com
   - **Contraseña:** Ecce2026!
3. Entra a la pestaña **Cuenta** y cambia el correo y la contraseña
   inmediatamente. Se descargará un archivo `admin-config.json` nuevo: súbelo a
   la raíz del hosting reemplazando el anterior.

> La sesión dura 12 horas; después vuelves a iniciar sesión.

---

## Qué puedes editar

| Pestaña | Contenido |
|---|---|
| **Inicio y Nosotros** | Título y textos del banner, botones, imágenes del carrusel de fondo y la sección "Nuestra Historia" |
| **Menú** | Categorías (Carnes, Mariscos, Bebidas...), platos con nombre, descripción, precio y etiqueta (Recomendado/Nuevo), más el PDF del menú |
| **Hospedaje** | Textos, lista de características y el carrusel de fotos |
| **Eventos** | Tarjetas de bodas, quinceañeras, etc. (texto, imagen y tamaño) y el PDF de paquetes |
| **Galería** | Fotos de la galería (agregar, quitar, reordenar) y sus descripciones |
| **Testimonios y Pie** | Opiniones, teléfono, dirección, copyright y número de WhatsApp |
| **Cuenta** | Correo y contraseña del panel |
| **Guardar y Publicar** | Descargar los cambios para subirlos al hosting |

Las flechas ↑ ↓ reordenan los elementos, y la ✕ elimina. El texto
"**● Cambios sin guardar**" avisa que tienes ediciones pendientes.

---

## Cómo publicar los cambios

### Opción A — Botón "Publicar en la web" (la más fácil)

En la pestaña **Guardar y Publicar**:

1. Pega tu **token de GitHub** en el campo indicado (opcionalmente márcalo como
   recordado para no pegarlo cada vez).
2. Pulsa **🚀 Publicar en la web**.
3. El panel sube `contenido.json` (y las imágenes/PDFs nuevos) directamente al
   repositorio, y **GitHub Pages actualiza la web automáticamente en ~1 minuto**.

No hay que descargar ni subir nada a mano. En la misma pestaña aparece el
estado de cada publicación.

### Crear el token de GitHub (solo una vez)

1. Con tu cuenta, abre **github.com/settings/tokens** y pulsa
   **Generate new token (Fine-grained)**.
2. En **Repository access** elige **Only select repositories** → **ECCEHOMO**.
3. En **Account permissions** pon **Contents** → **Read and write** y genera el
   token. Cópialo (solo se muestra una vez).
4. Pégalo en el panel. El token se guarda **solo en tu navegador**, nunca en el
   repositorio. Si se filtra, puedes revocarlo en la misma página de GitHub.

> Sin token, el panel sigue funcionando para editar, pero no podrá publicar.

### Opción B — Descarga manual (alternativa)

Si prefieres subir los archivos tú (por ejemplo en cPanel), en la misma
pestaña usa **Descargar todo (JSON + archivos)** y sube `contenido.json` a la
raíz, las imágenes a `imagenes/` y los PDF a `documentos/`.

### Truco para quien trabaja en local

Si abres `admin.html` desde una copia del sitio en tu equipo (por ejemplo con
Live Server) usando Chrome o Edge, el botón
**"Guardar directo en una carpeta de mi equipo"** escribe `contenido.json` y los
archivos nuevos directamente en la carpeta que elijas, sin descargas manuales.

---

## Cómo se suben las imágenes y PDFs

1. En cualquier campo de imagen, pulsa **Subir imagen** y elige el archivo.
2. El panel le pone un nombre limpio (sin espacios ni acentos) y lo muestra en
   la lista de **archivos pendientes** en la pestaña **Guardar y Publicar**.
3. Los archivos quedan en la lista de **archivos pendientes** (pestaña
   **Guardar y Publicar**). Con el botón **🚀 Publicar en la web** se suben
   solos; si usas la descarga manual, súbelos junto con `contenido.json` a la
   carpeta correspondiente (`imagenes/` o `documentos/`).

---

## Seguridad (léelo)

- El login protege contra accesos casuales, pero **no es seguridad de servidor**:
  al ser un sitio estático, el código del panel es visible para cualquiera.
- Usa una **contraseña fuerte** y cámbiala desde la pestaña **Cuenta**.
- El **token de GitHub** da poder real sobre el repositorio: usa uno
  *fine-grained* limitado a ECCEHOMO con permiso solo de *Contents: Read and
  write*, guárdalo en tu navegador personal y revócalo si crees que se filtró.
- Si quieres protección real, usa la **Privacidad de directorios (.htaccess)**
  de cPanel sobre la carpeta del sitio o sobre `admin.html` (requiere
  contraseña del servidor, distinta a la del panel).
- No publiques el panel en plataformas gratuitas sin esta protección.

---

## Archivos del sistema

| Archivo | Función |
|---|---|
| `contenido.json` | Todos los textos, platos, precios, imágenes y PDFs que se muestran en la web |
| `js/content.js` | Aplica `contenido.json` al HTML al cargar la página |
| `admin.html` + `js/admin.js` + `css/admin.css` | El panel de administración |
| `admin-config.json` | Correo y hash de la contraseña del panel |

**No borres `contenido.json`:** si falta, el sitio mostrará el contenido original
embebido en `index.html` (funciona, pero pierdes los cambios publicados).

---

## Problemas detectados en el sitio

- `documentos/Paquetes de eventos.pdf` **no existe** (el botón de eventos ya lo
  enlazaba antes): súbelo desde la pestaña **Eventos** del panel.
- `imagenes/hospedaje2.jpg` e `imagenes/hospedaje3.jpg` **no existen** (dos fotos
  del carrusel de hospedaje): reemplázalas desde la pestaña **Hospedaje**.
