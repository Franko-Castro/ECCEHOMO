/* ============================================
   ECCEHOMO - PANEL DE ADMINISTRACIÓN
   Edita contenido.json sin base de datos.
   ============================================ */

(function () {
  'use strict';

  // ---------- Utilidades ----------
  const $ = (s, c) => (c || document).querySelector(s);

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getPath(obj, path) {
    return String(path)
      .split('.')
      .reduce((o, k) => (o === null || o === undefined ? o : o[k]), obj);
  }

  function setPath(obj, path, valor) {
    const p = String(path).split('.');
    let o = obj;
    for (let i = 0; i < p.length - 1; i++) o = o[p[i]];
    o[p[p.length - 1]] = valor;
  }

  function nombreSeguro(nombre) {
    const punto = nombre.lastIndexOf('.');
    let base = punto > 0 ? nombre.slice(0, punto) : nombre;
    const ext = punto > 0 ? nombre.slice(punto).toLowerCase() : '';
    base = base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return (base || 'archivo') + ext;
  }

  let toastTimer = null;
  function toast(msg, esError) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('error', !!esError);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 4500);
  }

  function descargar(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ---------- Estado ----------
  let datos = null;
  let cfg = null;
  let sucio = false;
  let seccionActual = 'inicio';
  let publicando = false;
  let publicarMensaje = '';
  const archivosPendientes = new Map(); // nombre -> { blob, carpeta, url }

  const CREDENCIALES_INICIALES = { correo: 'admin@eccehomo.com', pass: 'Ecce2026!' };
  const CLAVE_SESION = 'eccehomo_admin_sesion';
  const CLAVE_SESION_CORREO = 'eccehomo_admin_correo';
  const CLAVE_SESION_CLAVE = 'eccehomo_admin_clave';
  const DURACION_SESION = 12 * 60 * 60 * 1000; // 12 horas
  const puedeEscribir = typeof window.showDirectoryPicker === 'function';

  function marcarSucio() {
    sucio = true;
    const el = $('#estadoSucio');
    if (el) el.hidden = false;
  }

  // ---------- Seguridad (hash de credenciales) ----------
  async function sha256Hex(texto) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function generarSal() {
    const a = new Uint8Array(16);
    crypto.getRandomValues(a);
    return Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function hashCredenciales(sal, correo, pass) {
    return sha256Hex(sal + String(correo).trim().toLowerCase() + '|' + pass);
  }

  // Credenciales del panel guardadas en la sesión: se usan para autenticar
  // la publicación en publicar.php (el servidor las valida contra admin-config.json).
  function guardarCredencialesSesion(correo, clave) {
    sessionStorage.setItem(CLAVE_SESION_CORREO, String(correo).trim());
    sessionStorage.setItem(CLAVE_SESION_CLAVE, String(clave));
  }

  function borrarCredencialesSesion() {
    sessionStorage.removeItem(CLAVE_SESION_CORREO);
    sessionStorage.removeItem(CLAVE_SESION_CLAVE);
  }

  function obtenerCredencialesPublicacion() {
    const correo = sessionStorage.getItem(CLAVE_SESION_CORREO) || cfg.correo || '';
    let clave = sessionStorage.getItem(CLAVE_SESION_CLAVE) || '';
    if (!clave) {
      clave = window.prompt('Contraseña del panel para publicar (se guarda solo en esta sesión):') || '';
      if (clave) sessionStorage.setItem(CLAVE_SESION_CLAVE, clave);
    }
    return { correo: correo, clave: clave };
  }

  async function cargarJSON(url) {
    const sep = url.indexOf('?') >= 0 ? '&' : '?';
    const r = await fetch(url + sep + 'v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(url + ' (HTTP ' + r.status + ')');
    return r.json();
  }

  // ---------- Ayudas de render ----------
  function campo(path, etiqueta, opciones) {
    const o = opciones || {};
    const tipo = o.tipo || 'text';
    const valor = esc(getPath(datos, path));
    let control;
    if (tipo === 'textarea') {
      control = '<textarea data-path="' + path + '" rows="' + (o.filas || 3) + '">' + valor + '</textarea>';
    } else if (tipo === 'select') {
      const actual = String(getPath(datos, path) === undefined || getPath(datos, path) === null ? '' : getPath(datos, path));
      control =
        '<select data-path="' + path + '">' +
        o.opcionesSelect
          .map((x) => '<option value="' + esc(x.v) + '"' + (actual === x.v ? ' selected' : '') + '>' + esc(x.t) + '</option>')
          .join('') +
        '</select>';
    } else {
      control = '<input type="text" data-path="' + path + '" value="' + valor + '" />';
    }
    return (
      '<div class="campo"><span>' + esc(etiqueta) + '</span>' + control +
      (o.ayuda ? '<small>' + esc(o.ayuda) + '</small>' : '') +
      '</div>'
    );
  }

  function campoImagen(path, etiqueta, carpeta) {
    const carp = carpeta || 'imagenes';
    const src = String(getPath(datos, path) || '');
    const preview = src
      ? '<img src="' + esc(src) + '" alt="" onerror="this.parentNode.classList.add(\'roto\');this.remove();" />'
      : '';
    return (
      '<div class="campo"><span>' + esc(etiqueta) + '</span>' +
      '<div class="img-fila">' +
        '<div class="img-preview ' + (src ? '' : 'vacio') + '">' + preview + '</div>' +
        '<div class="img-acciones">' +
          '<input type="text" data-path="' + path + '" value="' + esc(src) + '" placeholder="' + carp + '/nombre-de-la-imagen.jpg" />' +
          '<div class="file-fila" style="margin-top:8px">' +
            '<label class="btn btn-secundario btn-mini">Subir imagen<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-file-path="' + path + '" data-carpeta="' + carp + '" hidden /></label>' +
            (src ? '<a class="btn btn-secundario btn-mini" href="' + esc(src) + '" target="_blank" rel="noopener">Ver</a>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>'
    );
  }

  function campoPDF(path, etiqueta) {
    const src = String(getPath(datos, path) || '');
    return (
      '<div class="campo"><span>' + esc(etiqueta) + '</span>' +
      '<div class="file-fila">' +
        '<label class="btn btn-secundario btn-mini">Subir PDF<input type="file" accept="application/pdf,.pdf" data-file-path="' + path + '" data-carpeta="documentos" hidden /></label>' +
        (src ? '<a class="btn btn-secundario btn-mini" href="' + esc(src) + '" target="_blank" rel="noopener">Abrir PDF</a>' : '') +
      '</div>' +
      '<input type="text" data-path="' + path + '" value="' + esc(src) + '" placeholder="documentos/archivo.pdf" style="margin-top:8px" />' +
      '<small>Archivo actual: ' + (src ? '<b>' + esc(src) + '</b>' : 'ninguno') + '</small>' +
      '</div>'
    );
  }

  function controlesOrden(list, i, total) {
    return (
      '<div class="orden">' +
        '<button type="button" data-action="up" data-list="' + list + '" data-index="' + i + '" title="Subir"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" data-action="down" data-list="' + list + '" data-index="' + i + '" title="Bajar"' + (i === total - 1 ? ' disabled' : '') + '>↓</button>' +
        '<button type="button" class="btn-peligro" data-action="del" data-list="' + list + '" data-index="' + i + '" title="Eliminar">✕</button>' +
      '</div>'
    );
  }

  function itemCab(numero, list, i, total) {
    return (
      '<div class="item-cab">' +
        '<span class="item-num">' + esc(numero) + '</span>' +
        controlesOrden(list, i, total) +
      '</div>'
    );
  }

  const PLANTILLAS = {
    'hero.fondo': () => ({ src: '' }),
    'menu.categorias': () => ({ nombre: 'Nueva categoría', descripcion: '', platos: [] }),
    'hospedaje.caracteristicas': () => 'Nuevo punto',
    'hospedaje.carrusel': () => ({ imagen: '', titulo: 'Nueva imagen', texto: '' }),
    'eventos.tarjetas': () => ({ tag: 'Evento', titulo: 'Nuevo evento', texto: '', imagen: '', alt: '', clase: '' }),
    'galeria.imagenes': () => ({ src: '', alt: '' }),
    'testimonios.items': () => ({ texto: 'Nuevo testimonio' })
  };

  function plantillaPara(path) {
    if (/^menu\.categorias\.\d+\.platos$/.test(path)) {
      return { nombre: 'Nuevo plato', descripcion: '', precio: '', badge: '' };
    }
    const f = PLANTILLAS[path];
    return f ? f() : {};
  }

  // ---------- Secciones ----------
  function seccionInicio() {
    const f = datos.hero.fondo || [];
    return (
      '<h2>Inicio y Nosotros</h2>' +
      '<p class="seccion-ayuda">Textos del banner principal y de la sección "Nuestra Historia".</p>' +

      '<h3 class="subtitulo">Banner principal (Inicio)</h3>' +
      campo('hero.etiqueta', 'Texto pequeño sobre el título') +
      campo('hero.titulo', 'Título grande') +
      campo('hero.descripcion', 'Descripción', { tipo: 'textarea', filas: 3 }) +
      '<div class="campos-fila">' +
        campo('hero.botonPrimario', 'Botón principal (ej. Reservar Mesa)') +
        campo('hero.botonSecundario', 'Botón secundario (ej. Ver Menú)') +
      '</div>' +

      '<h4 class="subtitulo">Imágenes de fondo (carrusel)</h4>' +
      '<div class="lista">' +
        f.map((s, i) =>
          '<div class="lista-item">' +
            itemCab('Imagen ' + (i + 1) + ' de ' + f.length, 'hero.fondo', i, f.length) +
            campoImagen('hero.fondo.' + i + '.src', 'Imagen de fondo') +
          '</div>'
        ).join('') +
      '</div>' +
      '<button type="button" class="btn btn-secundario" data-action="add" data-list="hero.fondo">+ Agregar imagen de fondo</button>' +

      '<h3 class="subtitulo">Nuestra Historia</h3>' +
      campo('nosotros.titulo', 'Título') +
      campo('nosotros.texto', 'Texto', { tipo: 'textarea', filas: 7 }) +
      campoImagen('nosotros.imagen', 'Imagen de la sección') +
      campo('nosotros.alt', 'Descripción de la imagen (accesibilidad y SEO)')
    );
  }

  function seccionMenu() {
    const cats = datos.menu.categorias || [];
    let html =
      '<h2>Menú / Especialidades</h2>' +
      '<p class="seccion-ayuda">Administra las categorías (Carnes, Mariscos, Bebidas...) y sus platos con precios.</p>' +
      campo('menu.titulo', 'Título de la sección') +

      '<h3 class="subtitulo">Categorías y platos</h3>' +
      '<div class="lista">' +
      cats.map((cat, i) => {
        const listPlatos = 'menu.categorias.' + i + '.platos';
        const platos = cat.platos || [];
        return (
          '<div class="lista-item">' +
            itemCab('Categoría ' + (i + 1), 'menu.categorias', i, cats.length) +
            campo('menu.categorias.' + i + '.nombre', 'Nombre de la categoría') +
            campo('menu.categorias.' + i + '.descripcion', 'Descripción corta') +
            '<div class="sublista">' +
              '<h4>Platos (' + platos.length + ')</h4>' +
              platos.map((p, j) =>
                '<div class="sublista-item">' +
                  itemCab('Plato ' + (i + 1) + '.' + (j + 1), listPlatos, j, platos.length) +
                  campo(listPlatos + '.' + j + '.nombre', 'Nombre del plato') +
                  campo(listPlatos + '.' + j + '.descripcion', 'Descripción', { tipo: 'textarea', filas: 2 }) +
                  '<div class="campos-fila">' +
                    campo(listPlatos + '.' + j + '.precio', 'Precio (ej. $30.000)') +
                    campo(listPlatos + '.' + j + '.badge', 'Etiqueta', {
                      tipo: 'select',
                      opcionesSelect: [
                        { v: '', t: '— Sin etiqueta —' },
                        { v: 'recommended', t: 'Recomendado' },
                        { v: 'new', t: 'Nuevo' }
                      ]
                    }) +
                  '</div>' +
                '</div>'
              ).join('') +
              '<button type="button" class="btn btn-secundario btn-mini" data-action="add" data-list="' + listPlatos + '">+ Agregar plato</button>' +
            '</div>' +
          '</div>'
        );
      }).join('') +
      '</div>' +
      '<button type="button" class="btn btn-primario" data-action="add" data-list="menu.categorias">+ Agregar categoría</button>' +

      '<h3 class="subtitulo">Menú en PDF</h3>' +
      campo('menu.pdf.titulo', 'Título del bloque') +
      campo('menu.pdf.descripcion', 'Texto del bloque', { tipo: 'textarea', filas: 2 }) +
      campo('menu.pdf.textoBoton', 'Texto del botón de descarga') +
      campoPDF('menu.pdf.archivo', 'Archivo PDF del menú') +

      '<h3 class="subtitulo">Nota al pie</h3>' +
      campo('menu.nota', 'Nota (ej. "Los precios pueden variar")', { tipo: 'textarea', filas: 2 });
    return html;
  }

  function seccionHospedaje() {
    const h = datos.hospedaje;
    const cars = h.carrusel || [];
    const feats = h.caracteristicas || [];
    return (
      '<h2>Hospedaje</h2>' +
      '<p class="seccion-ayuda">Textos, características y el carrusel de imágenes del hospedaje.</p>' +
      campo('hospedaje.titulo', 'Título') +
      campo('hospedaje.texto', 'Texto', { tipo: 'textarea', filas: 7 }) +

      '<h3 class="subtitulo">Características (lista con palomita)</h3>' +
      '<div class="lista">' +
        feats.map((c, i) =>
          '<div class="lista-item">' +
            itemCab('Punto ' + (i + 1), 'hospedaje.caracteristicas', i, feats.length) +
            '<div class="campo"><span>Texto</span><input type="text" data-path="hospedaje.caracteristicas.' + i + '" value="' + esc(c) + '" /></div>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<button type="button" class="btn btn-secundario" data-action="add" data-list="hospedaje.caracteristicas">+ Agregar característica</button>' +

      campo('hospedaje.boton', 'Texto del botón (ej. Reservar Hospedaje)') +

      '<h3 class="subtitulo">Carrusel de imágenes</h3>' +
      '<div class="lista">' +
        cars.map((s, i) =>
          '<div class="lista-item">' +
            itemCab('Imagen ' + (i + 1) + ' de ' + cars.length, 'hospedaje.carrusel', i, cars.length) +
            campoImagen('hospedaje.carrusel.' + i + '.imagen', 'Imagen') +
            campo('hospedaje.carrusel.' + i + '.titulo', 'Título de la foto') +
            campo('hospedaje.carrusel.' + i + '.texto', 'Descripción de la foto') +
          '</div>'
        ).join('') +
      '</div>' +
      '<button type="button" class="btn btn-secundario" data-action="add" data-list="hospedaje.carrusel">+ Agregar imagen al carrusel</button>'
    );
  }

  function seccionEventos() {
    const e = datos.eventos;
    const tarjetas = e.tarjetas || [];
    return (
      '<h2>Eventos</h2>' +
      '<p class="seccion-ayuda">Tarjetas de bodas, quinceañeras, cenas, etc., y el PDF de paquetes.</p>' +
      campo('eventos.titulo', 'Título de la sección') +
      campo('eventos.descripcion', 'Descripción', { tipo: 'textarea', filas: 3 }) +

      '<h3 class="subtitulo">Tarjetas de eventos</h3>' +
      '<div class="lista">' +
        tarjetas.map((t, i) =>
          '<div class="lista-item">' +
            itemCab('Tarjeta ' + (i + 1) + ' de ' + tarjetas.length, 'eventos.tarjetas', i, tarjetas.length) +
            '<div class="campos-fila">' +
              campo('eventos.tarjetas.' + i + '.tag', 'Etiqueta (ej. Bodas)') +
              campo('eventos.tarjetas.' + i + '.clase', 'Tamaño en la cuadrícula', {
                tipo: 'select',
                opcionesSelect: [
                  { v: '', t: 'Normal' },
                  { v: 'large', t: 'Grande' },
                  { v: 'tall', t: 'Alta' }
                ]
              }) +
            '</div>' +
            campo('eventos.tarjetas.' + i + '.titulo', 'Título') +
            campo('eventos.tarjetas.' + i + '.texto', 'Descripción', { tipo: 'textarea', filas: 2 }) +
            campoImagen('eventos.tarjetas.' + i + '.imagen', 'Imagen') +
            campo('eventos.tarjetas.' + i + '.alt', 'Descripción de la imagen (SEO)') +
          '</div>'
        ).join('') +
      '</div>' +
      '<button type="button" class="btn btn-primario" data-action="add" data-list="eventos.tarjetas">+ Agregar tarjeta</button>' +

      '<h3 class="subtitulo">PDF de paquetes</h3>' +
      campo('eventos.pdf.textoBoton', 'Texto del botón de descarga') +
      campoPDF('eventos.pdf.archivo', 'Archivo PDF de paquetes') +

      '<h3 class="subtitulo">Botón final</h3>' +
      campo('eventos.cta', 'Texto (ej. Cotizar mi Evento)')
    );
  }

  function seccionGaleria() {
    const imgs = datos.galeria.imagenes || [];
    return (
      '<h2>Galería</h2>' +
      '<p class="seccion-ayuda">Las 6 primeras fotos se muestran siempre; el resto aparece al pulsar "Ver más".</p>' +
      campo('galeria.titulo', 'Título de la sección') +
      '<div class="lista">' +
        imgs.map((img, i) =>
          '<div class="lista-item">' +
            itemCab('Foto ' + (i + 1) + ' de ' + imgs.length, 'galeria.imagenes', i, imgs.length) +
            campoImagen('galeria.imagenes.' + i + '.src', 'Imagen') +
            campo('galeria.imagenes.' + i + '.alt', 'Descripción (aparece al ampliar la foto)') +
          '</div>'
        ).join('') +
      '</div>' +
      '<button type="button" class="btn btn-primario" data-action="add" data-list="galeria.imagenes">+ Agregar foto</button>'
    );
  }

  function seccionCierre() {
    const items = datos.testimonios.items || [];
    return (
      '<h2>Testimonios y Pie de página</h2>' +
      '<p class="seccion-ayuda">Opiniones de visitantes, título de reservas y datos de contacto.</p>' +

      '<h3 class="subtitulo">Testimonios</h3>' +
      campo('testimonios.titulo', 'Título de la sección') +
      '<div class="lista">' +
        items.map((t, i) =>
          '<div class="lista-item">' +
            itemCab('Testimonio ' + (i + 1), 'testimonios.items', i, items.length) +
            campo('testimonios.items.' + i + '.texto', 'Texto de la opinión', { tipo: 'textarea', filas: 2 }) +
          '</div>'
        ).join('') +
      '</div>' +
      '<button type="button" class="btn btn-secundario" data-action="add" data-list="testimonios.items">+ Agregar testimonio</button>' +

      '<h3 class="subtitulo">Reservas</h3>' +
      campo('reservas.titulo', 'Título de la sección de reservas') +

      '<h3 class="subtitulo">Pie de página y WhatsApp</h3>' +
      campo('footer.titulo', 'Nombre del negocio') +
      '<div class="campos-fila">' +
        campo('footer.telefono', 'Teléfono (ej. +57 3107404575)') +
        campo('footer.direccion', 'Dirección') +
      '</div>' +
      campo('footer.copyright', 'Texto de derechos de autor') +
      campo('footer.whatsapp', 'Enlace de WhatsApp', { ayuda: 'Ejemplo: https://wa.me/573107404575' }) +
      campo('footer.whatsappNumero', 'Número para reservas (solo dígitos)', { ayuda: 'Ejemplo: 573107404575 (con código de país, sin +)' })
    );
  }

  function seccionCuenta() {
    return (
      '<h2>Cuenta de administrador</h2>' +
      '<p class="seccion-ayuda">Cambia el correo y la contraseña que usas para entrar a este panel.</p>' +
      '<div class="campo"><span>Correo actual registrado</span><input type="text" value="' + esc(cfg.correo || '') + '" disabled /></div>' +
      '<div class="campo"><span>Nuevo correo</span><input type="email" id="cuentaCorreo" value="' + esc(cfg.correo || '') + '" /></div>' +
      '<div class="campo"><span>Nueva contraseña</span><input type="password" id="cuentaPass" autocomplete="new-password" placeholder="Mínimo 8 caracteres" /></div>' +
      '<div class="campo"><span>Repetir contraseña</span><input type="password" id="cuentaPass2" autocomplete="new-password" /></div>' +
      '<button type="button" class="btn btn-primario" data-action="guardar-credenciales">Guardar credenciales</button>' +
      '<div class="aviso">La contraseña no se guarda en texto plano: se almacena como un código cifrado (hash) en admin-config.json. Aun así, como el sitio es estático, usa una contraseña fuerte y no la compartas.</div>' +
      '<div class="pasos"><h3>Después de cambiar las credenciales</h3><ol>' +
        (modoPublicacion() === 'php'
          ? '<li>Se publica <b>admin-config.json</b> automáticamente en el servidor: no tienes que hacer nada más.</li>' +
            '<li>Si el servidor falla, se descargará el archivo para subirlo con el gestor de archivos de cPanel.</li>'
          : '<li>Se descargará un archivo <b>admin-config.json</b> nuevo.</li>' +
            '<li>Súbelo a la raíz de tu hosting (reemplazando el anterior) con el gestor de archivos de cPanel.</li>') +
      '</ol></div>'
    );
  }

  function seccionGuardar() {
    const pend = Array.from(archivosPendientes.entries());
    const esGithub = modoPublicacion() === 'github';
    return (
      '<h2>Guardar y Publicar</h2>' +
      '<p class="seccion-ayuda">Última edición del contenido: <b>' + esc(datos.actualizado || 'sin fecha') + '</b></p>' +

      '<h3 class="subtitulo">Archivos nuevos pendientes de subir (' + pend.length + ')</h3>' +
      (pend.length
        ? '<ul class="archivos-pendientes">' +
            pend.map(([nombre, info]) =>
              '<li>' +
                '<span><span class="carpeta">' + esc(info.carpeta) + '/</span><b>' + esc(nombre) + '</b></span>' +
                '<button type="button" class="btn btn-peligro btn-mini" data-action="quitar-archivo" data-nombre="' + esc(nombre) + '">Quitar</button>' +
              '</li>'
            ).join('') +
          '</ul>'
        : '<p class="seccion-ayuda">No has subido imágenes ni PDFs nuevos en esta sesión. Si solo cambiaste textos o precios, no hay archivos pendientes.</p>') +

      (esGithub
        ? '<h3 class="subtitulo">Publicación directa en la web (GitHub Pages)</h3>' +
            '<div class="campo"><span>Token de GitHub</span>' +
              '<input type="password" id="ghToken" placeholder="ghp_... o github_pat_..." autocomplete="off" value="' + esc(obtenerToken()) + '" />' +
              '<small>Se guarda solo en este navegador. Nunca se sube al repositorio.</small>' +
            '</div>' +
            '<label class="recordar-token"><input type="checkbox" id="ghRecordar"' + (tokenEnLocal() ? ' checked' : '') + ' /> Recordar el token en este navegador</label>'
        : '<h3 class="subtitulo">Publicación directa en la web</h3>' +
            '<div class="aviso">Al pulsar <b>🚀 Publicar en la web</b>, los cambios (textos, precios, imágenes y PDF) se suben directo a tu dominio y la página queda actualizada al instante. Se usa tu correo y contraseña del panel: sin tokens ni descargas.</div>' +
            '<div class="campo"><span>Servidor de publicación</span>' +
              '<input type="text" value="' + esc(urlPublicacion()) + '" disabled />' +
              '<small>publicar.php en la raíz de tu hosting (configurable en admin-config.json).</small>' +
            '</div>') +
      '<div class="guardar-acciones">' +
        '<button type="button" class="btn btn-primario" data-action="publicar"' + (publicando ? ' disabled' : '') + '>' +
          (publicando ? '⏳ Publicando…' : '🚀 Publicar en la web') +
        '</button>' +
      '</div>' +
      '<div class="publicar-estado' + (publicarMensaje ? '' : ' vacio') + '" id="publicarEstado">' +
        esc(publicarMensaje || (esGithub ? 'Al publicar, GitHub Pages actualizará la web automáticamente en ~1 minuto.' : 'Al publicar, los cambios aparecerán en tu web al instante.')) +
      '</div>' +
      (esGithub
        ? '<div class="pasos"><h3>Crear el token de GitHub (solo una vez)</h3><ol>' +
            '<li>Con tu cuenta, abre <b>github.com/settings/tokens</b> y pulsa <b>Generate new token (Fine-grained)</b>.</li>' +
            '<li>En <b>Repository access</b> elige <b>Only select repositories</b> y selecciona <b>ECCEHOMO</b>.</li>' +
            '<li>En <b>Account permissions</b> pon <b>Contents</b> → <b>Read and write</b> y genera el token.</li>' +
            '<li>Copia el token y pégalo arriba (opcionalmente márcalo como recordado).</li>' +
          '</ol></div>'
        : '') +

      '<h3 class="subtitulo">Alternativa: descarga manual</h3>' +
      '<div class="guardar-acciones">' +
        '<button type="button" class="btn btn-primario" data-action="descargar-todo">Descargar todo (JSON + archivos)</button>' +
        '<button type="button" class="btn btn-secundario" data-action="descargar-json">Descargar solo contenido.json</button>' +
        (puedeEscribir
          ? '<button type="button" class="btn btn-secundario" data-action="guardar-directo">Guardar directo en una carpeta de mi equipo</button>'
          : '') +
        '<button type="button" class="btn btn-secundario" data-action="descartar">Descartar cambios y recargar</button>' +
      '</div>' +

      '<div class="pasos"><h3>Publicar en tu hosting (cPanel o manual)</h3><ol>' +
        '<li>Pulsa <b>Descargar todo</b>. Se descargarán contenido.json y (si los hay) las imágenes/PDF nuevos.</li>' +
        '<li>Entra al <b>gestor de archivos</b> de cPanel y ve a la carpeta raíz de tu sitio.</li>' +
        '<li>Sube <b>contenido.json</b> reemplazando el anterior.</li>' +
        '<li>Sube las imágenes nuevas a la carpeta <b>imagenes/</b> y los PDF a <b>documentos/</b>.</li>' +
        '<li>Abre tu web y recarga con <b>Ctrl + F5</b> para ver los cambios.</li>' +
      '</ol></div>' +

      '<div class="aviso">Consejo: si trabajas con una copia del sitio en tu equipo (por ejemplo con Live Server), el botón "Guardar directo en una carpeta" escribe los archivos automáticamente en la carpeta que elijas, sin descargas manuales.</div>'
    );
  }

  const SECCIONES = [
    { id: 'inicio', titulo: 'Inicio y Nosotros', render: seccionInicio },
    { id: 'menu', titulo: 'Menú', render: seccionMenu },
    { id: 'hospedaje', titulo: 'Hospedaje', render: seccionHospedaje },
    { id: 'eventos', titulo: 'Eventos', render: seccionEventos },
    { id: 'galeria', titulo: 'Galería', render: seccionGaleria },
    { id: 'cierre', titulo: 'Testimonios y Pie', render: seccionCierre },
    { id: 'cuenta', titulo: 'Cuenta', render: seccionCuenta },
    { id: 'guardar', titulo: 'Guardar y Publicar', render: seccionGuardar }
  ];

  function renderNav() {
    $('#appNav').innerHTML = SECCIONES.map(
      (s) =>
        '<button type="button" data-seccion="' + s.id + '"' +
        (s.id === seccionActual ? ' class="activo"' : '') +
        '>' + esc(s.titulo) + '</button>'
    ).join('');
    const btnActivo = $('#appNav button.activo');
    if (btnActivo && typeof btnActivo.scrollIntoView === 'function') {
      btnActivo.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function render(mantenerScroll) {
    const scrollPrevio = mantenerScroll ? window.scrollY : 0;
    renderNav();
    const s = SECCIONES.find((x) => x.id === seccionActual) || SECCIONES[0];
    $('#panelContenido').innerHTML = s.render();
    if (mantenerScroll) {
      window.scrollTo({ top: scrollPrevio });
    } else {
      window.scrollTo({ top: 0 });
    }
  }

  // ---------- Manejo de archivos nuevos ----------
  const EXT_IMAGEN = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

  function manejarArchivo(inp) {
    const archivo = inp.files && inp.files[0];
    if (!archivo) return;
    const carpeta = inp.dataset.carpeta || 'imagenes';
    const ext = (archivo.name.split('.').pop() || '').toLowerCase();
    const permitidas = carpeta === 'documentos' ? ['pdf'] : EXT_IMAGEN;
    if (permitidas.indexOf(ext) < 0) {
      toast('Formato no permitido (.' + ext + '). Formatos válidos: ' + permitidas.join(', '), true);
      return;
    }
    const nombre = nombreSeguro(archivo.name);
    if (archivosPendientes.has(nombre)) {
      URL.revokeObjectURL(archivosPendientes.get(nombre).url);
    }
    archivosPendientes.set(nombre, {
      blob: archivo,
      carpeta: carpeta,
      url: URL.createObjectURL(archivo)
    });
    setPath(datos, inp.dataset.filePath, carpeta + '/' + nombre);
    marcarSucio();
    render(true);
    toast('Archivo "' + nombre + '" listo. Recuerda subirlo junto con contenido.json.');
  }

  // ---------- Guardar / descargar ----------
  function blobContenido() {
    datos.actualizado = new Date().toISOString().slice(0, 10);
    return new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  }

  async function descargarTodo() {
    descargar(blobContenido(), 'contenido.json');
    for (const [nombre, info] of archivosPendientes) {
      await new Promise((r) => setTimeout(r, 450));
      descargar(info.blob, nombre);
    }
    toast(
      'Descarga iniciada: contenido.json' +
        (archivosPendientes.size ? ' + ' + archivosPendientes.size + ' archivo(s)' : '') +
        '. Ahora súbelos a tu hosting (ver pasos).'
    );
  }

  async function escribirEn(dirHandle, nombre, blob) {
    const fh = await dirHandle.getFileHandle(nombre, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
  }

  async function guardarDirecto() {
    try {
      const dir = await window.showDirectoryPicker({ mode: 'readwrite', id: 'eccehomo' });
      await escribirEn(dir, 'contenido.json', blobContenido());
      for (const [nombre, info] of archivosPendientes) {
        const sub = await dir.getDirectoryHandle(info.carpeta, { create: true });
        await escribirEn(sub, nombre, info.blob);
      }
      toast('Guardado en la carpeta seleccionada (contenido.json' +
        (archivosPendientes.size ? ' y ' + archivosPendientes.size + ' archivo(s)' : '') + ').');
    } catch (e) {
      if (e.name !== 'AbortError') toast('No se pudo guardar: ' + e.message, true);
    }
  }

  // ---------- Publicación directa vía GitHub (GitHub Pages) ----------
  const CLAVE_TOKEN = 'eccehomo_gh_token';

  function tokenEnLocal() {
    return !!localStorage.getItem(CLAVE_TOKEN);
  }

  function obtenerToken() {
    const campo = document.getElementById('ghToken');
    if (campo && campo.value.trim()) return campo.value.trim();
    return sessionStorage.getItem(CLAVE_TOKEN) || localStorage.getItem(CLAVE_TOKEN) || '';
  }

  function guardarToken(token, recordar) {
    if (token) sessionStorage.setItem(CLAVE_TOKEN, token);
    else sessionStorage.removeItem(CLAVE_TOKEN);
    if (recordar && token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  }

  function cabecerasGitHub() {
    return {
      'Authorization': 'Bearer ' + obtenerToken(),
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  function apiContenido(ruta) {
    const g = cfg.github;
    const rutaCodificada = ruta.split('/').map(encodeURIComponent).join('/');
    return 'https://api.github.com/repos/' + encodeURIComponent(g.owner) + '/' + encodeURIComponent(g.repo) + '/contents/' + rutaCodificada;
  }

  function bytesABase64(bytes) {
    let bin = '';
    const TAM = 0x8000;
    for (let i = 0; i < bytes.length; i += TAM) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + TAM));
    }
    return btoa(bin);
  }

  function textoABase64(texto) {
    return bytesABase64(new TextEncoder().encode(texto));
  }

  async function mensajeErrorGitHub(r) {
    let j = {};
    try { j = await r.json(); } catch (e) { /* respuesta sin cuerpo */ }
    if (r.status === 401) return 'El token no es válido o expiró (401).';
    if (r.status === 403) return 'El token no tiene permisos de escritura (necesita Contents: Read and write) o se superó el límite de peticiones (403).';
    if (r.status === 404) return 'No se encontró el repositorio. Revisa la sección "github" de admin-config.json (404).';
    return j.message ? j.message : 'Error HTTP ' + r.status;
  }

  async function obtenerSha(ruta) {
    const r = await fetch(apiContenido(ruta) + '?ref=' + encodeURIComponent(cfg.github.rama || 'main'), { headers: cabecerasGitHub() });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(await mensajeErrorGitHub(r));
    const j = await r.json();
    return j.sha || null;
  }

  async function subirRuta(ruta, bytesBase64, mensaje) {
    const sha = await obtenerSha(ruta);
    const cuerpo = { message: mensaje, content: bytesBase64, branch: cfg.github.rama || 'main' };
    if (sha) cuerpo.sha = sha;
    let r = await fetch(apiContenido(ruta), { method: 'PUT', headers: cabecerasGitHub(), body: JSON.stringify(cuerpo) });
    if (r.status === 409) {
      // Conflicto de versión: otro cambio subió el archivo; reintentar una vez con el sha actual
      cuerpo.sha = await obtenerSha(ruta);
      r = await fetch(apiContenido(ruta), { method: 'PUT', headers: cabecerasGitHub(), body: JSON.stringify(cuerpo) });
    }
    if (!r.ok) throw new Error(await mensajeErrorGitHub(r));
    return r.json();
  }

  function setEstadoPublicar(txt) {
    publicarMensaje = txt;
    const el = document.getElementById('publicarEstado');
    if (el) el.textContent = txt;
  }

  function modoPublicacion() {
    return 'php';
  }

  function urlPublicacion() {
    return (cfg && cfg.publicacion && cfg.publicacion.url) || 'https://restauranteeccehomo.xo.je/publicar.php';
  }

  async function publicar() {
    if (publicando) return;
    const modo = modoPublicacion();

    if (modo === 'github') {
      if (!obtenerToken()) {
        toast('Pega tu token de GitHub en el campo de arriba para poder publicar.', true);
        const c = document.getElementById('ghToken');
        if (c) c.focus();
        return;
      }
      if (!cfg.github || !cfg.github.owner || !cfg.github.repo) {
        toast('Falta configurar "github" (owner/repo) en admin-config.json.', true);
        return;
      }
    }

    publicando = true;
    render();

    try {
      const mensajeOk = modo === 'github' ? await publicarGithub() : await publicarPhp();

      publicando = false;
      sucio = false;
      const sucioEl = document.getElementById('estadoSucio');
      if (sucioEl) sucioEl.hidden = true;
      setEstadoPublicar(mensajeOk);
      toast('✓ Publicado en la web.');
      render();
    } catch (e) {
      publicando = false;
      setEstadoPublicar('✗ Error al publicar: ' + e.message);
      toast('Error al publicar: ' + e.message, true);
      render();
    }
  }

  async function publicarGithub() {
    const fecha = new Date().toISOString().slice(0, 10);

    setEstadoPublicar('Subiendo contenido.json…');
    await subirRuta('contenido.json', textoABase64(JSON.stringify(datos, null, 2)), 'panel: actualizar contenido (' + fecha + ')');
    setEstadoPublicar('contenido.json publicado ✓');

    const total = archivosPendientes.size;
    let n = 0;
    for (const [nombre, info] of archivosPendientes) {
      n++;
      setEstadoPublicar('Subiendo archivo ' + n + ' de ' + total + ': ' + nombre + '…');
      const bytes = new Uint8Array(await info.blob.arrayBuffer());
      await subirRuta(info.carpeta + '/' + nombre, bytesABase64(bytes), 'panel: subir ' + nombre + ' (' + fecha + ')');
      URL.revokeObjectURL(info.url);
      archivosPendientes.delete(nombre);
    }

    return '✓ Publicado correctamente. GitHub Pages actualizará la web en ~1 minuto (recarga con Ctrl+F5).';
  }

  async function publicarPhp() {
    const creds = obtenerCredencialesPublicacion();
    if (!creds.correo || !creds.clave) {
      throw new Error('Faltan correo o contraseña del panel para publicar.');
    }

    const archivos = [];
    for (const [nombre, info] of archivosPendientes) {
      const bytes = new Uint8Array(await info.blob.arrayBuffer());
      archivos.push({ ruta: info.carpeta + '/' + nombre, datos: bytesABase64(bytes) });
    }

    setEstadoPublicar(
      archivos.length ? 'Subiendo contenido y ' + archivos.length + ' archivo(s) al servidor…' : 'Subiendo contenido al servidor…'
    );

    let r;
    try {
      r = await fetch(urlPublicacion(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: creds.correo,
          clave: creds.clave,
          contenido: JSON.stringify(datos, null, 2),
          archivos: archivos
        })
      });
    } catch (e) {
      throw new Error(
        'No se pudo contactar con el servidor de publicación (' + e.message + '). Revisa "publicacion.url" en admin-config.json.'
      );
    }

    const texto = await r.text();
    let j = null;
    try { j = JSON.parse(texto); } catch (e) { j = null; }

    if (!j) {
      if (texto.indexOf('__test') >= 0 || texto.indexOf('cookies.html') >= 0 || texto.indexOf('aes.js') >= 0) {
        throw new Error(
          'El servidor respondió con la verificación de cookies del hosting. Abre tu web una vez en el navegador (supera el aviso) y vuelve a publicar.'
        );
      }
      throw new Error('El servidor no devolvió JSON (HTTP ' + r.status + '). ¿Se subió publicar.php a la raíz del sitio?');
    }

    if (!j.ok) {
      if (r.status === 401) {
        borrarCredencialesSesion();
        throw new Error((j.error || 'Correo o contraseña incorrectos.') + ' Se pidió la contraseña de nuevo al próximo intento.');
      }
      throw new Error(j.error || 'Error HTTP ' + r.status);
    }

    for (const [nombre, info] of archivosPendientes) URL.revokeObjectURL(info.url);
    archivosPendientes.clear();

    return '✓ Publicado en tu dominio. Los cambios ya están en línea (recarga con Ctrl+F5).';
  }

  // ---------- Eventos ----------
  function onClickAccion(btn) {
    const accion = btn.dataset.action;

    if (accion === 'add' || accion === 'del' || accion === 'up' || accion === 'down') {
      const lista = getPath(datos, btn.dataset.list);
      if (!Array.isArray(lista)) return;
      const idx = Number(btn.dataset.index);
      if (accion === 'add') {
        lista.push(plantillaPara(btn.dataset.list));
      } else if (accion === 'del') {
        if (!confirm('¿Eliminar este elemento?')) return;
        lista.splice(idx, 1);
      } else if (accion === 'up' && idx > 0) {
        [lista[idx - 1], lista[idx]] = [lista[idx], lista[idx - 1]];
      } else if (accion === 'down' && idx < lista.length - 1) {
        [lista[idx + 1], lista[idx]] = [lista[idx], lista[idx + 1]];
      }
      marcarSucio();
      render(true);
      return;
    }

    if (accion === 'quitar-archivo') {
      const info = archivosPendientes.get(btn.dataset.nombre);
      if (info) URL.revokeObjectURL(info.url);
      archivosPendientes.delete(btn.dataset.nombre);
      render(true);
      return;
    }

    if (accion === 'descargar-todo') { descargarTodo(); return; }

    if (accion === 'descargar-json') {
      descargar(blobContenido(), 'contenido.json');
      toast('contenido.json descargado. Súbelo a la raíz de tu hosting.');
      return;
    }

    if (accion === 'guardar-directo') { guardarDirecto(); return; }

    if (accion === 'publicar') { publicar(); return; }

    if (accion === 'descartar') {
      if (confirm('Se descartarán todos los cambios no guardados. ¿Continuar?')) location.reload();
      return;
    }

    if (accion === 'guardar-credenciales') {
      guardarCredenciales();
      return;
    }
  }

  async function guardarCredenciales() {
    const correo = $('#cuentaCorreo').value.trim();
    const pass1 = $('#cuentaPass').value;
    const pass2 = $('#cuentaPass2').value;
    if (!correo || !pass1) {
      toast('El correo y la contraseña no pueden quedar vacíos.', true);
      return;
    }
    if (pass1 !== pass2) {
      toast('Las contraseñas no coinciden.', true);
      return;
    }
    if (pass1.length < 8) {
      toast('Usa una contraseña de al menos 8 caracteres.', true);
      return;
    }
    cfg.correo = correo;
    cfg.sal = generarSal();
    cfg.correoHash = await hashCredenciales(cfg.sal, correo, pass1);

    const configTexto = JSON.stringify(cfg, null, 2);
    const configBlob = () => new Blob([configTexto], { type: 'application/json' });

    if (modoPublicacion() === 'php') {
      try {
        await publicarConfigPhp(configTexto);
        guardarCredencialesSesion(correo, pass1);
        toast('✓ Credenciales actualizadas y publicadas en el servidor.');
      } catch (e) {
        descargar(configBlob(), 'admin-config.json');
        toast('Credenciales actualizadas, pero no se pudo publicar admin-config.json (' + e.message + '). Se descargó para subirlo manualmente.', true);
      }
      return;
    }

    if (obtenerToken() && cfg.github && cfg.github.owner) {
      try {
        await subirRuta('admin-config.json', textoABase64(configTexto), 'panel: actualizar credenciales del panel');
        toast('✓ Credenciales actualizadas y admin-config.json publicado en GitHub.');
        return;
      } catch (e) {
        descargar(configBlob(), 'admin-config.json');
        toast('Credenciales actualizadas, pero no se pudo publicar admin-config.json (' + e.message + '). Se descargó para subirlo manualmente.', true);
        return;
      }
    }
    descargar(configBlob(), 'admin-config.json');
    toast('Credenciales actualizadas. Sube admin-config.json a la raíz del hosting (o añade un token de GitHub para publicarlo automático).');
  }

  async function publicarConfigPhp(configTexto) {
    const creds = obtenerCredencialesPublicacion();
    if (!creds.correo || !creds.clave) {
      throw new Error('Faltan credenciales del panel para publicar.');
    }
    let r;
    try {
      r = await fetch(urlPublicacion(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: creds.correo, clave: creds.clave, config: configTexto })
      });
    } catch (e) {
      throw new Error('No se pudo contactar con el servidor (' + e.message + ').');
    }
    let j = null;
    try { j = await r.json(); } catch (e) { j = null; }
    if (!j || !j.ok) {
      if (r.status === 401) borrarCredencialesSesion();
      throw new Error((j && j.error) || 'HTTP ' + r.status);
    }
  }

  function bindEventos() {
    // Navegación
    $('#appNav').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-seccion]');
      if (!btn) return;
      seccionActual = btn.dataset.seccion;
      render();
    });

    // Acciones dentro del panel
    $('#panelContenido').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.preventDefault();
      onClickAccion(btn);
    });

    // Campos de texto: actualizar datos en vivo
    $('#panelContenido').addEventListener('input', (e) => {
      const inp = e.target.closest('[data-path]');
      if (inp) {
        setPath(datos, inp.dataset.path, inp.value);
        marcarSucio();
        return;
      }
      if (e.target.id === 'ghToken') {
        const chk = document.getElementById('ghRecordar');
        guardarToken(e.target.value.trim(), !!(chk && chk.checked));
      }
    });

    // Selects y casillas
    $('#panelContenido').addEventListener('change', (e) => {
      if (e.target.id === 'ghRecordar') {
        guardarToken(obtenerToken(), e.target.checked);
        toast(e.target.checked ? 'Token recordado en este navegador.' : 'Token solo para esta sesión.');
        return;
      }
      const sel = e.target.closest('select[data-path]');
      if (!sel) return;
      setPath(datos, sel.dataset.path, sel.value);
      marcarSucio();
    });

    // Evitar que presionar Enter dentro de un input recargue la página
    $('#panelContenido').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file') {
        e.preventDefault();
        e.target.blur();
      }
    });

    // Subida de archivos (imágenes / PDF)
    $('#panelContenido').addEventListener('change', (e) => {
      const inp = e.target.closest('input[type="file"][data-file-path]');
      if (!inp) return;
      manejarArchivo(inp);
    });

    // Salir
    $('#btnSalir').addEventListener('click', () => {
      sessionStorage.removeItem(CLAVE_SESION);
      borrarCredencialesSesion();
      location.reload();
    });
  }

  // ---------- Login ----------
  async function mostrarApp() {
    try {
      datos = await cargarJSON('contenido.json');
    } catch (e) {
      alert(
        'No se pudo leer contenido.json.\n' +
          e.message +
          '\nAsegúrate de que el archivo exista en la raíz del sitio y vuelve a intentarlo.'
      );
      sessionStorage.removeItem(CLAVE_SESION);
      return;
    }
    $('#vistaLogin').hidden = true;
    $('#vistaApp').hidden = false;
    render();
    if (sucio) $('#estadoSucio').hidden = false;
  }

  function bindLogin() {
    $('#formLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = $('#loginCorreo').value;
      const pass = $('#loginPass').value;
      const h = await hashCredenciales(cfg.sal, correo, pass);
      if (h === cfg.correoHash) {
        sessionStorage.setItem(CLAVE_SESION, String(Date.now() + DURACION_SESION));
        guardarCredencialesSesion(correo, pass);
        $('#loginError').hidden = true;
        mostrarApp();
      } else {
        $('#loginError').hidden = false;
        $('#loginPass').value = '';
        $('#loginPass').focus();
      }
    });
  }

  // ---------- Inicio ----------
  async function init() {
    try {
      cfg = await cargarJSON('admin-config.json');
    } catch (e) {
      document.body.innerHTML =
        '<div class="login-wrap"><div class="login-card">' +
        '<h1>No se pudo leer admin-config.json</h1>' +
        '<p class="login-sub">' + esc(e.message) + '</p>' +
        '<a class="login-volver" href="index.html">← Volver al sitio</a>' +
        '</div></div>';
      return;
    }

    bindLogin();
    bindEventos();

    const exp = Number(sessionStorage.getItem(CLAVE_SESION)) || 0;
    if (exp > Date.now()) {
      mostrarApp();
    } else {
      borrarCredencialesSesion();
      try {
        const hDefecto = await hashCredenciales(cfg.sal, CREDENCIALES_INICIALES.correo, CREDENCIALES_INICIALES.pass);
        if (hDefecto === cfg.correoHash) $('#loginHint').hidden = false;
      } catch (e) { /* sin crypto, sin pista */ }
    }
  }

  init();
})();
