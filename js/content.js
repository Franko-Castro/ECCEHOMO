/* ============================================
   ECCEHOMO - CARGADOR DE CONTENIDO EDITABLE
   Lee contenido.json y lo aplica al HTML.
   Debe cargarse ANTES de js/main.js.
   Si contenido.json no existe o falla, el sitio
   funciona con el contenido escrito en index.html.
   ============================================ */

(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function esc(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setText(sel, valor, ctx) {
    var el = $(sel, ctx);
    if (el && valor !== undefined && valor !== null && valor !== '') el.textContent = valor;
  }

  function setAttr(sel, attr, valor, ctx) {
    var el = $(sel, ctx);
    if (el && valor) el.setAttribute(attr, valor);
  }

  function reconstruir(containerSel, itemSel, html) {
    var cont = $(containerSel);
    if (!cont) return;
    $$(itemSel, cont).forEach(function (el) { el.remove(); });
    cont.insertAdjacentHTML('afterbegin', html);
  }

  // ---------- HERO ----------
  function aplicarHero(h) {
    if (!h) return;
    setText('.hero-content > span', h.etiqueta);
    setText('.hero-content h1', h.titulo);
    setText('.hero-content > p', h.descripcion);
    setText('.hero-buttons .btn-primary', h.botonPrimario);
    setText('.hero-buttons .btn-secondary', h.botonSecundario);

    if (Array.isArray(h.fondo) && h.fondo.length) {
      var html = h.fondo.map(function (s, i) {
        return '<div class="carousel-slide' + (i === 0 ? ' active' : '') + '" ' +
          'style="background-image: url(&quot;' + esc(s.src) + '&quot;)"></div>';
      }).join('');
      reconstruir('#heroCarousel', '.carousel-slide', html);
    }
  }

  // ---------- NOSOTROS ----------
  function aplicarNosotros(n) {
    if (!n) return;
    setText('#nosotros .about-text h2', n.titulo);
    setText('#nosotros .about-text p', n.texto);
    var img = $('#nosotros .about-image img');
    if (img && n.imagen) { img.src = n.imagen; }
    if (img && n.alt) { img.alt = n.alt; }
  }

  // ---------- MENÚ / ESPECIALIDADES ----------
  function platoHTML(p) {
    var badge = '';
    if (p.badge === 'recommended') badge = '<span class="badge recommended">Recomendado</span>';
    else if (p.badge === 'new') badge = '<span class="badge new">Nuevo</span>';
    return '<li class="dish-item">' +
      '<div>' +
        '<span class="dish-name">' + esc(p.nombre) + badge + '</span>' +
        '<span class="dish-desc">' + esc(p.descripcion) + '</span>' +
      '</div>' +
      '<span class="dish-price">' + esc(p.precio) + '</span>' +
    '</li>';
  }

  function categoriaHTML(c) {
    return '<div class="accordion-item" data-accordion>' +
      '<button class="accordion-header" type="button">' +
        '<div class="accordion-title-group">' +
          '<h3>' + esc(c.nombre) + '</h3>' +
          '<p>' + esc(c.descripcion) + '</p>' +
        '</div>' +
        '<div class="accordion-icon">▼</div>' +
      '</button>' +
      '<div class="accordion-body">' +
        '<ul class="dish-list">' +
          (c.platos || []).map(platoHTML).join('') +
        '</ul>' +
      '</div>' +
    '</div>';
  }

  function aplicarMenu(m) {
    if (!m) return;
    setText('#menu-section > h2', m.titulo);
    setText('.menu-note', m.nota);

    if (Array.isArray(m.categorias)) {
      var cont = $('.accordion-container');
      if (cont) {
        $$('[data-accordion]', cont).forEach(function (el) { el.remove(); });
        var html = m.categorias.map(categoriaHTML).join('');
        var ancla = $('.menu-download', cont);
        if (ancla) ancla.insertAdjacentHTML('beforebegin', html);
        else cont.insertAdjacentHTML('afterbegin', html);
      }
    }

    if (m.pdf) {
      setText('.menu-download-text h3', m.pdf.titulo);
      setText('.menu-download-text p', m.pdf.descripcion);
      var a = $('.menu-download .btn-download');
      if (a && m.pdf.archivo) a.setAttribute('href', m.pdf.archivo);
      if (a && m.pdf.textoBoton) {
        var svg = a.querySelector('svg');
        a.innerHTML = '';
        if (svg) a.appendChild(svg);
        a.appendChild(document.createTextNode(' ' + m.pdf.textoBoton));
      }
    }
  }

  // ---------- HOSPEDAJE ----------
  function slideHospedajeHTML(s) {
    return '<div class="lodging-slide" style="background-image: url(&quot;' + esc(s.imagen) + '&quot;)">' +
      '<div class="lodging-caption">' +
        '<h4>' + esc(s.titulo) + '</h4>' +
        '<p>' + esc(s.texto) + '</p>' +
      '</div>' +
    '</div>';
  }

  function aplicarHospedaje(h) {
    if (!h) return;
    setText('#hospedaje .lodging-text h2', h.titulo);
    setText('#hospedaje .lodging-text > p', h.texto);
    setText('#hospedaje .btn-lodging', h.boton);

    if (Array.isArray(h.caracteristicas)) {
      var ul = $('#hospedaje .lodging-features');
      if (ul) {
        ul.innerHTML = h.caracteristicas.map(function (c) {
          return '<li>✓ ' + esc(c) + '</li>';
        }).join('');
      }
    }

    if (Array.isArray(h.carrusel) && h.carrusel.length) {
      reconstruir('#lodgingCarousel', '.lodging-slide', h.carrusel.map(slideHospedajeHTML).join(''));
    }
  }

  // ---------- EVENTOS ----------
  function tarjetaEventoHTML(t) {
    var clase = t.clase ? ' ' + t.clase : '';
    return '<div class="event-card' + clase + '">' +
      '<img src="' + esc(t.imagen) + '" alt="' + esc(t.alt || t.titulo) + '" />' +
      '<div class="event-overlay">' +
        '<span class="event-tag">' + esc(t.tag) + '</span>' +
        '<h3>' + esc(t.titulo) + '</h3>' +
        '<p>' + esc(t.texto) + '</p>' +
      '</div>' +
    '</div>';
  }

  function aplicarEventos(e) {
    if (!e) return;
    setText('#eventos .events-header h2', e.titulo);
    setText('#eventos .events-header p', e.descripcion);
    setText('.event-cta a', e.cta);

    if (Array.isArray(e.tarjetas)) {
      var grid = $('.events-grid');
      if (grid) grid.innerHTML = e.tarjetas.map(tarjetaEventoHTML).join('');
    }

    if (e.pdf) {
      var a = $('.event-packages .btn-download');
      if (a && e.pdf.archivo) a.setAttribute('href', e.pdf.archivo);
      if (a && e.pdf.textoBoton) {
        var svg = a.querySelector('svg');
        a.innerHTML = '';
        if (svg) a.appendChild(svg);
        a.appendChild(document.createTextNode(' ' + e.pdf.textoBoton));
      }
    }
  }

  // ---------- GALERÍA ----------
  function aplicarGaleria(g) {
    if (!g) return;
    setText('#galeria > h2', g.titulo);
    if (Array.isArray(g.imagenes)) {
      var grid = $('.gallery-grid');
      if (grid) {
        grid.innerHTML = g.imagenes.map(function (img, i) {
          return '<img src="' + esc(img.src) + '" alt="' + esc(img.alt) + '" data-index="' + i + '" />';
        }).join('');
      }
    }
  }

  // ---------- TESTIMONIOS / RESERVAS / FOOTER ----------
  function aplicarCierre(d) {
    if (d.testimonios) {
      setText('.testimonials > h2', d.testimonios.titulo);
      if (Array.isArray(d.testimonios.items)) {
        var cards = $('.testimonials .cards');
        if (cards) {
          cards.innerHTML = d.testimonios.items.map(function (t) {
            return '<div class="testimonial">' +
              '<div class="stars"></div>' +
              '<p>"' + esc(t.texto) + '"</p>' +
            '</div>';
          }).join('');
        }
      }
    }

    if (d.reservas) setText('#reservas > h2', d.reservas.titulo);

    if (d.footer) {
      setText('#contacto h3', d.footer.titulo);
      var ps = $$('#contacto p');
      if (ps[0] && d.footer.telefono) ps[0].textContent = '📞 ' + d.footer.telefono;
      if (ps[1] && d.footer.direccion) ps[1].textContent = '📍 ' + d.footer.direccion;
      if (ps[2] && d.footer.copyright) ps[2].textContent = d.footer.copyright;
      var wa = $('.whatsapp');
      if (wa && d.footer.whatsapp) wa.setAttribute('href', d.footer.whatsapp);
    }

    if (d.logo) {
      var logo = $('.logo img');
      if (logo && d.logo.src) logo.src = d.logo.src;
      if (logo && d.logo.alt) logo.alt = d.logo.alt;
    }
  }

  function aplicarTodo(datos) {
    try {
      aplicarHero(datos.hero);
      aplicarNosotros(datos.nosotros);
      aplicarMenu(datos.menu);
      aplicarHospedaje(datos.hospedaje);
      aplicarEventos(datos.eventos);
      aplicarGaleria(datos.galeria);
      aplicarCierre(datos);
    } catch (err) {
      console.warn('Eccehomo: error al aplicar contenido.json:', err);
    }
  }

  // La promesa "listo" SIEMPRE se resuelve (nunca rechaza),
  // para que el sitio arranque aunque falle la carga.
  var listo = fetch('contenido.json?v=' + Date.now(), { cache: 'no-store' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (json) {
      window.EcceContenido = window.EcceContenido || {};
      window.EcceContenido.datos = json;
      aplicarTodo(json);
      return json;
    })
    .catch(function (err) {
      console.warn('Eccehomo: usando el contenido por defecto del HTML (' + err.message + ')');
      return null;
    });

  window.EcceContenido = { datos: null, listo: listo };
})();
