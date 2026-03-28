const sections = Array.from(document.querySelectorAll('.snap-section'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const homeBtn = document.getElementById('home-btn');
const viewGalleryBtn = document.getElementById('view-gallery');
const contactForm = document.getElementById('contact-form');
const feedback = document.getElementById('feedback');

const modal = document.getElementById('modal');
const modalServiceText = document.querySelector('#modal-service strong');
const modalClose = document.getElementById('modal-close');
const modalForm = document.getElementById('modal-form');
const modalFeedback = document.getElementById('modal-feedback');

const stateKey = 'dashnshine-spa';

function getAppState() {
  try {
    return JSON.parse(localStorage.getItem(stateKey)) || {};
  } catch (err) {
    return {};
  }
}

function setAppState(partial) {
  const state = { ...getAppState(), ...partial };
  localStorage.setItem(stateKey, JSON.stringify(state));
}

function applySection(sectionName) {
  const target = document.getElementById(sectionName);
  if (!target) return;

  sections.forEach(section => {
    section.classList.toggle('active', section.id === sectionName);
  });

  scrollToSection(target);
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.target === sectionName);
  });
  document.title = `DashNShine — ${sectionName[0].toUpperCase() + sectionName.slice(1)}`;
  setAppState({ currentPage: sectionName });
}

function scrollToSection(el) {
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetApp() {
  localStorage.removeItem(stateKey);
  if (contactForm) contactForm.reset();
  if (modalForm) modalForm.reset();
  feedback.textContent = '';
  modalFeedback.textContent = '';
  window.location.hash = '#home';
  applySection('home');
}

function routeFromHash() {
  const hashPage = window.location.hash.replace('#', '');
  const state = getAppState();
  const targetSection = hashPage || state.currentPage || 'home';
  window.location.hash = `#${targetSection}`;
  applySection(targetSection);
}

function showModal(service) {
  if (!modal) return;
  modalServiceText.textContent = service;
  modal.classList.remove('hidden');
  modalFeedback.textContent = '';
  trapFocus(modal);
}

function hideModal() {
  if (!modal) return;
  modal.classList.add('hidden');
  releaseFocus();
}

function trapFocus(container) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    } else if (e.key === 'Escape') {
      hideModal();
    }
  }

  container.addEventListener('keydown', handleKeyDown);
  if (firstElement) firstElement.focus();

  modal._trapHandler = handleKeyDown;
}

function releaseFocus() {
  if (modal && modal._trapHandler) {
    modal.removeEventListener('keydown', modal._trapHandler);
    delete modal._trapHandler;
  }
}

navLinks.forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.target;
    window.location.hash = `#${target}`;
    applySection(target);
  });
});

homeBtn.addEventListener('click', resetApp);
viewGalleryBtn.addEventListener('click', () => {
  window.location.hash = '#gallery';
  applySection('gallery');
});

const bookButtons = Array.from(document.querySelectorAll('.book-now'));
bookButtons.forEach(btn => {
  btn.addEventListener('click', () => showModal(btn.dataset.service));
});

if (modalClose) {
  modalClose.addEventListener('click', hideModal);
}

if (modal) {
  modal.addEventListener('click', event => {
    if (event.target.matches('[data-close]')) hideModal();
  });
}

if (modalForm) {
  modalForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(modalForm);
    const payload = {
      service: modalServiceText.textContent,
      details: Object.fromEntries(data.entries()),
      submittedAt: new Date().toISOString(),
    };

    const state = getAppState();
    const history = Array.isArray(state.bookingHistory) ? state.bookingHistory : [];
    setAppState({ bookingHistory: [...history, payload] });

    modalFeedback.textContent = 'Booking request sent! We will follow up soon.';
    modalForm.reset();

    setTimeout(hideModal, 1500);
  });
}

if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(contactForm);
    setAppState({ savedForm: Object.fromEntries(data.entries()) });
    feedback.textContent = 'Message sent! Our team will contact you shortly.';
    contactForm.reset();
  });

  contactForm.addEventListener('input', () => {
    const data = new FormData(contactForm);
    setAppState({ savedForm: Object.fromEntries(data.entries()) });
  });
}

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.target === sectionId);
        });
      }
    });
  },
  { threshold: 0.5, rootMargin: '-76px 0px -50% 0px' }
);

sections.forEach(section => observer.observe(section));

window.addEventListener('hashchange', routeFromHash);
window.addEventListener('load', () => {
  const state = getAppState();

  if (state.savedForm && contactForm) {
    Object.entries(state.savedForm).forEach(([key, value]) => {
      const input = contactForm.elements.namedItem(key);
      if (input) input.value = value;
    });
  }

  routeFromHash();
});
