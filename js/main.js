/* ============================================
   ECCEHOMO ASADERO Y RESTAURANTE - JS
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

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
    anchor.addEventListener('click', function(e) {
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


  // ---------- 6. Botón de reserva (alerta temporal) ----------
  const reservaForm = document.querySelector('.reservation form');
  if (reservaForm) {
    reservaForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const nombre = this.querySelector('input[type="text"]').value;
      const telefono = this.querySelector('input[type="tel"]').value;
      const fecha = this.querySelector('input[type="date"]').value;
      const personas = this.querySelector('input[type="number"]').value;

      if (nombre && telefono && fecha && personas) {
        alert('¡Gracias ' + nombre + '! Tu reserva para ' + personas + ' persona(s) el ' + fecha + ' ha sido recibida. Te contactaremos al ' + telefono + ' para confirmar.');
        this.reset();
      }
    });
  }

});