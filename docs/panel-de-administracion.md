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

## Cómo publicar los cambios (hosting cPanel)

1. En la pestaña **Guardar y Publicar** pulsa **Descargar todo (JSON + archivos)**.
   Se descarga `contenido.json` y, si subiste imágenes o PDFs nuevos, también
   esos archivos.
2. Entra al **gestor de archivos** de cPanel y ve a la carpeta raíz del sitio.
3. Sube `contenido.json` **reemplazando** el anterior.
4. Sube las imágenes nuevas a la carpeta `imagenes/` y los PDF a `documentos/`.
5. Abre tu web y recarga con **Ctrl + F5**.

Si solo cambiaste textos o precios (sin archivos nuevos), el paso 4 no hace
falta: solo sube `contenido.json`.

### Si publicas con GitHub Pages (este repositorio)

Este proyecto tiene un workflow de GitHub Pages (`.github/workflows/static.yml`):
cada vez que se sube un cambio a la rama `main`, la web se publica sola. En ese
caso, el flujo del panel es el mismo, pero en el paso 3 subes los archivos al
repositorio (por el gestor de archivos de GitHub o con Git) en vez de a cPanel:
al hacer commit en `main`, la web se actualiza automáticamente.

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
3. Recuerda subir esos archivos junto con `contenido.json` a la carpeta
   correspondiente (`imagenes/` o `documentos/`).

---

## Seguridad (léelo)

- El login protege contra accesos casuales, pero **no es seguridad de servidor**:
  al ser un sitio estático, el código del panel es visible para cualquiera.
- Usa una **contraseña fuerte** y cámbiala desde la pestaña **Cuenta**.
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
