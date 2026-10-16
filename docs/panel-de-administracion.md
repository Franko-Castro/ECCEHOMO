# Panel de Administración de Eccehomo

Este sitio no usa base de datos. Todo el contenido editable (textos, platos,
precios, imágenes y PDFs) vive en el archivo **`contenido.json`**, y el panel
**`admin.html`** sirve para editarlo sin tocar código.

---

## Cómo entrar

1. Abre `https://restauranteeccehomo.xo.je/admin.html`.
2. Inicia sesión con el correo y la contraseña actuales del panel.
3. Entra a la pestaña **Cuenta** y cambia el correo y la contraseña
   inmediatamente. Si `publicar.php` está instalado, las credenciales se
   actualizan **solitas** en el servidor; si no, se descarga un
   `admin-config.json` nuevo que deberás subir a la raíz del hosting.

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
| **Guardar y Publicar** | Publicar los cambios en la web con un botón (o descargarlos) |

Las flechas ↑ ↓ reordenan los elementos, y la ✕ elimina. El texto
"**● Cambios sin guardar**" avisa que tienes ediciones pendientes.

---

## Cómo publicar los cambios

El panel tiene **publicación directa**: terminas de editar, pulsas un botón y la
web queda actualizada al instante. Sin descargas ni subidas manuales.

### Opción A — Botón "Publicar en la web" (la estándar aquí)

Tu sitio vive en tu hosting (iFastNet), así que la publicación va directa al
servidor mediante **`publicar.php`**:

1. Entra al panel desde tu dominio
   (`https://restauranteeccehomo.xo.je/admin.html`).
2. Edita lo que quieras.
3. En **Guardar y Publicar** pulsa **🚀 Publicar en la web**.
4. En segundos, `contenido.json` (y las imágenes/PDFs nuevos) quedan escritos en
   el servidor y la web muestra los cambios (recarga con Ctrl+F5).

La publicación se autentica con **tu correo y contraseña del panel**: no hay
tokens que crear ni guardar. Si cambias las credenciales en la pestaña
**Cuenta**, el propio botón las actualiza en el servidor.

#### Instalación única en el hosting

La primera vez hay que subir el sistema al hosting (una sola vez), con el
**gestor de archivos de cPanel** o por FTP, a la raíz del sitio:

- `admin.html`, `js/admin.js`, `js/content.js`, `js/main.js`, `css/admin.css`
- `contenido.json`, `admin-config.json`
- **`publicar.php`** ← es el que hace la magia

> ¿Error "El servidor no devolvió JSON"? Es casi seguro que `publicar.php` no
> está en la raíz o tu plan de hosting no tiene PHP activado (actívalo desde
> cPanel → "Select PHP Version").

> ¿Error "verificación de cookies"? Abre primero la página del dominio en el
> mismo navegador y completa la verificación del hosting. Después vuelve al
> panel e intenta publicar de nuevo.

### Descarga manual (último recurso)

En la misma pestaña usa **Descargar todo (JSON + archivos)** y sube
`contenido.json` a la raíz, las imágenes a `imagenes/` y los PDF a
`documentos/`.

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
- `publicar.php` **sí valida en el servidor** correo y contraseña (hash con sal)
  antes de escribir nada, y solo permite escribir `contenido.json`,
  `admin-config.json` y archivos dentro de `imagenes/` o `documentos/` con
  formatos seguros (jpg, png, webp, gif, pdf) y límite de tamaño. Aun así,
  quien conozca la contraseña del panel puede publicar: es el mismo nivel de
  acceso que el login.
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
| `admin-config.json` | Correo y hash de la contraseña del panel, y modo de publicación (`publicacion`) |
| `publicar.php` | Endpoint que escribe los cambios del panel directamente en el hosting (sin base de datos) |

**No borres `contenido.json`:** si falta, el sitio mostrará el contenido original
embebido en `index.html` (funciona, pero pierdes los cambios publicados).

---

## Problemas detectados en el sitio

- `documentos/Paquetes de eventos.pdf` **no existe** (el botón de eventos ya lo
  enlazaba antes): súbelo desde la pestaña **Eventos** del panel.
- `imagenes/hospedaje2.jpg` e `imagenes/hospedaje3.jpg` **no existen** (dos fotos
  del carrusel de hospedaje): reemplázalas desde la pestaña **Hospedaje**.
