(function () {
  'use strict';

  /* ── Elementos globales ── */
  const hamburgerBtn  = document.getElementById('hamburger-btn');
  const mobileMenu    = document.getElementById('mobile-menu');

  /* ─────────────────────────────────────────
     LÓGICA DEL MENÚ MÓVIL (Corre en todas las páginas)
  ───────────────────────────────────────── */
  function toggleMobileMenu() {
    if (!mobileMenu || !hamburgerBtn) return;
    const isOpen = mobileMenu.classList.contains('nav__mobile-menu--open');
    if (isOpen) {
      closeMobileMenu();
    } else {
      mobileMenu.classList.add('nav__mobile-menu--open');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
    }
  }

  function closeMobileMenu() {
    if (!mobileMenu || !hamburgerBtn) return;
    mobileMenu.classList.remove('nav__mobile-menu--open');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
  }

  // Cerrar menú al hacer clic afuera
  document.addEventListener('click', function (e) {
    if (
      mobileMenu && 
      hamburgerBtn && 
      !mobileMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target) &&
      mobileMenu.classList.contains('nav__mobile-menu--open')
    ) {
      closeMobileMenu();
    }
  });

  // Cerrar menú con la tecla Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
    }
  });

  /* ─────────────────────────────────────────
     LÓGICA SPA (Solo corre en el index.html)
  ───────────────────────────────────────── */
  
  const pageHome = document.getElementById('page-home');
  
  // Si no existe 'page-home', estamos en una página de proyecto. 
  // Detenemos la ejecución aquí para evitar errores.
  if (!pageHome) return; 

  const pageMap = {
    home:     pageHome,
    about:    document.getElementById('page-about'),
    projects: document.getElementById('page-projects'),
    certs:    document.getElementById('page-certs'),
    contact:  document.getElementById('page-contact'),
  };

  const navItems      = document.querySelectorAll('.nav__item');
  const navLinks      = document.querySelectorAll('.nav__link[data-target]');
  const mobileItems   = document.querySelectorAll('.nav__mobile-item');
  const contactBtns   = document.querySelectorAll('.contact-bar__btn');
  const logoBtn       = document.querySelector('.nav__logo');

  let currentPage = 'home';

  function navigateTo(target) {
    if (!pageMap[target]) return;

    // Ocultar actual, mostrar nuevo
    Object.values(pageMap).forEach(el => {
      if(el) el.classList.remove('page--active');
    });
    pageMap[target].classList.add('page--active');

    // Actualizar estados del menú desktop
    navItems.forEach(item => item.classList.remove('nav__item--active'));
    navLinks.forEach(link => {
      if (link.dataset.target === target) {
        link.closest('.nav__item').classList.add('nav__item--active');
      }
    });

    // Actualizar estados del menú móvil
    mobileItems.forEach(item => {
      item.classList.toggle('nav__mobile-item--active', item.dataset.target === target);
    });

    closeMobileMenu();
    currentPage = target;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Event Listeners para el index.html
  navLinks.forEach(link => {
    link.addEventListener('click', () => navigateTo(link.dataset.target));
    link.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo(link.dataset.target);
      }
    });
  });

  if (logoBtn) {
    logoBtn.addEventListener('click', () => navigateTo('home'));
    logoBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo('home');
      }
    });
  }

  mobileItems.forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.target));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateTo(item.dataset.target);
      }
    });
  });

contactBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // Evita que la página brinque
      navigateTo('contact');
    });
  });

  /* ── Leer la URL al cargar ── */
  // Si la URL tiene un # (ej. index.html#contact), abre esa pestaña automáticamente
  const initialHash = window.location.hash.replace('#', '');
  if (pageMap[initialHash]) {
    navigateTo(initialHash);
  }

})();