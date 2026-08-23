export function initCertificates(certificates) {
  const section = document.querySelector('.certificaciones');
  if (!section || section.dataset.initialized === 'true') return () => {};

  section.dataset.initialized = 'true';
  const allCertificates = Array.isArray(certificates) ? certificates : [];
  const isSpanish = document.documentElement.lang === 'es';
  const text = isSpanish
    ? {
        empty: 'No hay certificados',
        selectedEmpty: 'No hay certificado seleccionado',
        unnamed: 'Sin nombre',
        certificate: 'Certificado',
        open: 'Ver certificado',
        noLink: 'Sin enlace',
        unavailable: 'No disponible',
        allSubcategories: 'Todas las subcategorías',
      }
    : {
        empty: 'No certificates available',
        selectedEmpty: 'No certificate selected',
        unnamed: 'Untitled',
        certificate: 'Certificate',
        open: 'View certificate',
        noLink: 'No link',
        unavailable: 'Unavailable',
        allSubcategories: 'All subcategories',
      };

  const elements = {
    image: document.getElementById('certDetalleImagen'),
    name: document.getElementById('certDetalleNombre'),
    academy: document.getElementById('certDetalleAcademia'),
    category: document.getElementById('certDetalleCategoria'),
    subcategory: document.getElementById('certDetalleSubcategoria'),
    link: document.getElementById('certDetalleLink'),
    id: document.getElementById('certDetalleId'),
    carousel: document.getElementById('certCarouselVertical'),
    viewport: document.getElementById('certCarouselViewport'),
    up: document.getElementById('carousel-up-vertical'),
    down: document.getElementById('carousel-down-vertical'),
    search: document.getElementById('cert-search'),
    categoryFilter: document.getElementById('cert-filter-categoria'),
    subcategoryFilter: document.getElementById('cert-filter-subcategoria'),
    academyFilter: document.getElementById('cert-filter-academia'),
    clear: document.getElementById('cert-clear-filters'),
  };

  if (Object.values(elements).some((element) => !element)) {
    delete section.dataset.initialized;
    return () => {};
  }

  const controller = new AbortController();
  const { signal } = controller;
  const thumbsPerPage = 4;
  const itemHeight = 70 + (0.8 * 16);
  let displayedCertificates = [];
  let currentIndex = 0;
  let autoScrollTimer;
  let pauseTimer;
  let debounceTimer;
  let isPaused = false;

  const sample = (items, limit = 20) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy.slice(0, Math.min(limit, copy.length));
  };

  const updatePosition = () => {
    elements.carousel.style.transform = `translateY(-${currentIndex * itemHeight}px)`;
  };

  const showDetails = (certificate) => {
    if (!certificate) {
      elements.image.src = '/images/placeholder.webp';
      elements.image.alt = text.certificate;
      elements.name.textContent = text.selectedEmpty;
      elements.academy.textContent = '';
      elements.category.textContent = '';
      elements.subcategory.textContent = '';
      elements.link.href = '#';
      elements.link.textContent = text.noLink;
      elements.id.textContent = '';
      return;
    }

    elements.image.src = certificate.imagen || '/images/placeholder.webp';
    elements.image.alt = certificate.nombre || text.certificate;
    elements.name.textContent = certificate.nombre || text.unnamed;
    elements.academy.textContent = `🏛️ ${certificate.academia || ''}`;
    elements.category.textContent = `📂 ${certificate.categoria || ''}`;
    elements.subcategory.textContent = `🏷️ ${certificate.subcategoria || ''}`;
    elements.link.href = certificate.link || '#';
    elements.link.textContent = certificate.link ? text.open : text.noLink;
    elements.id.textContent = `ID: ${certificate.id || text.unavailable}`;
  };

  const selectThumb = (index, pause = true) => {
    if (index < 0 || index >= displayedCertificates.length) return;
    currentIndex = index;
    elements.carousel.querySelectorAll('.cert-thumb').forEach((thumb, thumbIndex) => {
      thumb.classList.toggle('active', thumbIndex === currentIndex);
      thumb.setAttribute('aria-selected', String(thumbIndex === currentIndex));
    });
    showDetails(displayedCertificates[currentIndex]);
    updatePosition();
    if (pause) pauseAutoScroll();
  };

  const renderThumbs = () => {
    const fragment = document.createDocumentFragment();

    displayedCertificates.forEach((certificate, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'cert-thumb';
      thumb.dataset.index = String(index);
      thumb.setAttribute('role', 'option');
      thumb.tabIndex = 0;

      const image = document.createElement('img');
      image.src = certificate.imagen || '/images/placeholder.webp';
      image.alt = certificate.nombre || text.certificate;
      image.loading = 'lazy';
      image.width = 50;
      image.height = 50;

      const info = document.createElement('div');
      info.className = 'thumb-info';
      const name = document.createElement('span');
      name.className = 'thumb-nombre';
      name.textContent = certificate.nombre || text.unnamed;
      const academy = document.createElement('span');
      academy.className = 'thumb-meta';
      academy.textContent = certificate.academia || '';
      info.append(name, academy);
      thumb.append(image, info);

      thumb.addEventListener('click', () => selectThumb(index), { signal });
      thumb.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        selectThumb(index);
      }, { signal });

      fragment.appendChild(thumb);
    });

    elements.carousel.replaceChildren(fragment);
    elements.carousel.setAttribute('role', 'listbox');
    currentIndex = 0;
    updatePosition();
    selectThumb(0, false);
  };

  const resetAutoScroll = () => {
    clearInterval(autoScrollTimer);
    if (!isPaused && displayedCertificates.length > thumbsPerPage) {
      autoScrollTimer = window.setInterval(() => {
        const maximum = Math.max(0, displayedCertificates.length - thumbsPerPage);
        const next = currentIndex + thumbsPerPage > maximum ? 0 : currentIndex + thumbsPerPage;
        selectThumb(next, false);
      }, 4000);
    }
  };

  function pauseAutoScroll(duration = 30000) {
    isPaused = true;
    clearTimeout(pauseTimer);
    clearInterval(autoScrollTimer);
    pauseTimer = window.setTimeout(() => {
      isPaused = false;
      resetAutoScroll();
    }, duration);
  }

  const updateSubcategories = () => {
    const selectedCategory = elements.categoryFilter.value;
    const subcategories = new Set();

    allCertificates.forEach((certificate) => {
      if (
        (selectedCategory === 'all' || certificate.categoria === selectedCategory) &&
        certificate.subcategoria
      ) {
        subcategories.add(certificate.subcategoria);
      }
    });

    const defaultOption = document.createElement('option');
    defaultOption.value = 'all';
    defaultOption.textContent = text.allSubcategories;
    const options = [...subcategories].sort().map((subcategory) => {
      const option = document.createElement('option');
      option.value = subcategory;
      option.textContent = subcategory;
      return option;
    });
    elements.subcategoryFilter.replaceChildren(defaultOption, ...options);
  };

  const applyFilters = () => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      const query = elements.search.value.trim().toLocaleLowerCase();
      const filtered = allCertificates.filter((certificate) => {
        const name = String(certificate.nombre ?? '').toLocaleLowerCase();
        return (
          name.includes(query) &&
          (elements.categoryFilter.value === 'all' || certificate.categoria === elements.categoryFilter.value) &&
          (elements.subcategoryFilter.value === 'all' || (certificate.subcategoria || '') === elements.subcategoryFilter.value) &&
          (elements.academyFilter.value === 'all' || certificate.academia === elements.academyFilter.value)
        );
      });

      displayedCertificates = sample(filtered);
      renderThumbs();
      if (displayedCertificates.length === 0) showDetails(null);
      pauseAutoScroll();
    }, 300);
  };

  elements.search.addEventListener('input', applyFilters, { signal });
  elements.categoryFilter.addEventListener('change', () => {
    updateSubcategories();
    applyFilters();
  }, { signal });
  elements.subcategoryFilter.addEventListener('change', applyFilters, { signal });
  elements.academyFilter.addEventListener('change', applyFilters, { signal });
  elements.clear.addEventListener('click', () => {
    elements.search.value = '';
    elements.categoryFilter.value = 'all';
    elements.academyFilter.value = 'all';
    updateSubcategories();
    elements.subcategoryFilter.value = 'all';
    applyFilters();
  }, { signal });
  elements.up.addEventListener('click', () => {
    const maximum = Math.max(0, displayedCertificates.length - thumbsPerPage);
    selectThumb(currentIndex - thumbsPerPage < 0 ? maximum : currentIndex - thumbsPerPage);
  }, { signal });
  elements.down.addEventListener('click', () => {
    const maximum = Math.max(0, displayedCertificates.length - thumbsPerPage);
    selectThumb(currentIndex + thumbsPerPage > maximum ? 0 : currentIndex + thumbsPerPage);
  }, { signal });
  elements.viewport.addEventListener('mouseenter', () => {
    isPaused = true;
    clearInterval(autoScrollTimer);
  }, { signal });
  elements.viewport.addEventListener('mouseleave', () => {
    isPaused = false;
    clearTimeout(pauseTimer);
    resetAutoScroll();
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(autoScrollTimer);
    else resetAutoScroll();
  }, { signal });

  if (allCertificates.length === 0) {
    elements.name.textContent = text.empty;
    showDetails(null);
  } else {
    updateSubcategories();
    displayedCertificates = sample(allCertificates);
    renderThumbs();
    resetAutoScroll();
  }

  return () => {
    controller.abort();
    clearInterval(autoScrollTimer);
    clearTimeout(pauseTimer);
    clearTimeout(debounceTimer);
    delete section.dataset.initialized;
  };
}