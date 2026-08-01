/* ============================================
   ECCEHOMO ASADERO Y RESTAURANTE - JS
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ---------- 1. Carrusel del Hero ----------
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsContainer = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');

  let currentSlide = 0;
  let slideInterval;
  const intervalTime = 5000; // 5 segundos entre slides

  // Crear dots dinámicamente
  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    if (index === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Ir a la imagen ${index + 1}`);
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.carousel-dot');

  function goToSlide(index) {
    // Remover clase active del slide y dot actual
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    // Calcular el nuevo índice
    currentSlide = index;

    // Si el índice es menor que 0, ir al último
    if (currentSlide < 0) {
      currentSlide = slides.length - 1;
    }
    // Si el índice es mayor que el último, ir al primero
    if (currentSlide >= slides.length) {
      currentSlide = 0;
    }

    // Agregar clase active al nuevo slide y dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');

    // Reiniciar el intervalo automático
    resetInterval();
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startInterval() {
    slideInterval = setInterval(nextSlide, intervalTime);
  }

  function resetInterval() {
    clearInterval(slideInterval);
    startInterval();
  }

  // Event listeners para los controles
  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
  }

  // Iniciar carrusel automático
  startInterval();

  // Pausar carrusel cuando el usuario no está viendo la página
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(slideInterval);
    } else {
      startInterval();
    }
  });


  // ---------- 2. Scroll Reveal ----------
  const reveals = document.querySelectorAll('.reveal');

  function checkReveal() {
    reveals.forEach(item => {
      const top = item.getBoundingClientRect().top;
      if (top < window.innerHeight - 100) {
        item.classList.add('active');
      }
    });
  }

  // Ejecutar al cargar
  checkReveal();

  // Ejecutar al hacer scroll
  window.addEventListener('scroll', checkReveal);


  // ---------- 3. Menú Hamburguesa (Móvil) ----------
  const menuToggle = document.getElementById('menuToggle');
  const menu = document.getElementById('menu');

  if (menuToggle && menu) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      menu.classList.toggle('active');

      // Bloquear scroll del body cuando el menú está abierto
      document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    // Cerrar menú al hacer clic en un enlace
    const menuLinks = menu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        menu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }


  // ---------- 4. Navbar: cambiar estilo al hacer scroll ----------
  const navbar = document.querySelector('.navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.style.padding = '8px 8%';
      navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
      navbar.style.padding = '12px 8%';
      navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
    }
  }

  window.addEventListener('scroll', handleNavbarScroll);


  // ---------- 5. Smooth Scroll para anclajes ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();
        const offsetTop = targetElement.offsetTop - 80; // Compensar navbar fijo

        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });


  // ---------- 
  // . Botón de reserva ----------
  const reservaForm = document.querySelector('.reservation form');
  if (reservaForm) {
    reservaForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nombre = this.querySelector('input[name="nombre"]').value;
      const telefono = this.querySelector('input[name="telefono"]').value;
      const fecha = this.querySelector('input[name="fecha"]').value;
      const personas = this.querySelector('input[name="personas"]').value;
      const evento = this.querySelector('input[name="evento"]').value;

      if (nombre && telefono && fecha && personas) {
        // Formatear el mensaje para WhatsApp
        let mensaje = `*Nueva Reserva - Eccehomo*\n\n`;
        mensaje += `*Nombre:* ${nombre}\n`;
        mensaje += `*Teléfono:* ${telefono}\n`;
        mensaje += `*Fecha:* ${fecha}\n`;
        mensaje += `*Personas:* ${personas}`;

        if (evento && evento.trim() !== '') {
          mensaje += `\n*Tipo de evento:* ${evento}`;
        }

        // Construir enlace de WhatsApp 

        const urlWhatsApp = `https://wa.me/573107404575?text=${encodeURIComponent(mensaje)}`;

        // Abrir WhatsApp en una nueva pestaña
        window.open(urlWhatsApp, '_blank');

        // Resetear el formulario
        this.reset();
      }
    });
  }

});
//  Acordeón de Especialidades
const accordionItems = document.querySelectorAll('[data-accordion]');

accordionItems.forEach(item => {
  const header = item.querySelector('.accordion-header');

  header.addEventListener('click', () => {
    const isActive = item.classList.contains('active');



    if (isActive) {
      item.classList.remove('active');
    } else {
      item.classList.add('active');
    }
  });
});
// ---------- . Carrusel de Hospedaje ----------
const lodgingSlides = document.querySelectorAll('.lodging-slide');
const lodgingDotsContainer = document.getElementById('lodgingDots');
const lodgingThumbsContainer = document.getElementById('lodgingThumbs');
const lodgingPrevBtn = document.getElementById('lodgingPrev');
const lodgingNextBtn = document.getElementById('lodgingNext');

if (lodgingSlides.length > 0) {
  let currentLodging = 0;
  let lodgingInterval;
  const lodgingDelay = 6000; // 6 segundos

  // Crear dots dinámicamente
  lodgingSlides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.classList.add('lodging-dot');
    if (index === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Ver imagen ${index + 1}`);
    dot.addEventListener('click', () => goToLodging(index));
    lodgingDotsContainer.appendChild(dot);
  });

  // Crear miniaturas dinámicamente
  lodgingSlides.forEach((slide, index) => {
    const thumb = document.createElement('div');
    thumb.classList.add('lodging-thumb');
    if (index === 0) thumb.classList.add('active');
    thumb.style.backgroundImage = slide.style.backgroundImage;
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('aria-label', `Ver imagen ${index + 1}`);
    thumb.addEventListener('click', () => goToLodging(index));
    lodgingThumbsContainer.appendChild(thumb);
  });

  const lodgingDots = document.querySelectorAll('.lodging-dot');
  const lodgingThumbs = document.querySelectorAll('.lodging-thumb');

  function goToLodging(index) {
    lodgingSlides[currentLodging].classList.remove('active');
    lodgingDots[currentLodging].classList.remove('active');
    lodgingThumbs[currentLodging].classList.remove('active');

    currentLodging = index;

    if (currentLodging < 0) {
      currentLodging = lodgingSlides.length - 1;
    }
    if (currentLodging >= lodgingSlides.length) {
      currentLodging = 0;
    }

    lodgingSlides[currentLodging].classList.add('active');
    lodgingDots[currentLodging].classList.add('active');
    lodgingThumbs[currentLodging].classList.add('active');

    resetLodgingInterval();
  }

  function nextLodging() {
    goToLodging(currentLodging + 1);
  }

  function prevLodging() {
    goToLodging(currentLodging - 1);
  }

  function startLodgingInterval() {
    lodgingInterval = setInterval(nextLodging, lodgingDelay);
  }

  function resetLodgingInterval() {
    clearInterval(lodgingInterval);
    startLodgingInterval();
  }

  // Event listeners
  if (lodgingNextBtn) {
    lodgingNextBtn.addEventListener('click', nextLodging);
  }
  if (lodgingPrevBtn) {
    lodgingPrevBtn.addEventListener('click', prevLodging);
  }

  // Pausar al pasar el mouse sobre el carrusel
  const lodgingWrap = document.querySelector('.lodging-carousel-wrap');
  if (lodgingWrap) {
    lodgingWrap.addEventListener('mouseenter', () => clearInterval(lodgingInterval));
    lodgingWrap.addEventListener('mouseleave', startLodgingInterval);
  }

  // Iniciar automático
  startLodgingInterval();
}
// ---------- 9. Lightbox Galería ----------
const galleryImages = document.querySelectorAll('.gallery-grid img');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

if (galleryImages.length > 0 && lightbox) {
  let currentLightboxIndex = 0;
  const totalImages = galleryImages.length;

  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Bloquear scroll
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Restaurar scroll
  }

  function updateLightbox() {
    const img = galleryImages[currentLightboxIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.alt;
    lightboxCounter.textContent = (currentLightboxIndex + 1) + ' / ' + totalImages;
  }

  function nextLightbox() {
    currentLightboxIndex = (currentLightboxIndex + 1) % totalImages;
    updateLightbox();
  }

  function prevLightbox() {
    currentLightboxIndex = (currentLightboxIndex - 1 + totalImages) % totalImages;
    updateLightbox();
  }

  // Abrir al hacer clic en imagen de la galería
  galleryImages.forEach((img, i) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openLightbox(i));
  });

  // Controles
  lightboxClose.addEventListener('click', closeLightbox);
  lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextLightbox(); });
  lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevLightbox(); });

  // Cerrar al hacer clic fuera de la imagen
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Teclado: ESC, flechas
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
  });
}