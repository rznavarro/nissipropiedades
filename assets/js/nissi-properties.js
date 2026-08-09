// Módulo compartido: listado de propiedades (portada "destacadas", /propiedades y
// el buscador del Hero). Sin build step, sin dependencias.
(function () {
  'use strict';

  var PLACEHOLDER_IMG = 'logo-negro.png';
  var FILTER_KEYS = ['comuna', 'tipo', 'contrato', 'dormitorios', 'banos'];
  var PAGE_SIZE = 16;

  function formatPrecio(precio) {
    if (typeof precio !== 'number' || Number.isNaN(precio)) return 'Precio a consultar';
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(precio);
    } catch (e) {
      return '$' + precio;
    }
  }

  function pickImagen(imagenes) {
    if (Array.isArray(imagenes) && imagenes.length && imagenes[0].thumbLarge) {
      return { src: imagenes[0].thumbLarge, isPlaceholder: false };
    }
    return { src: PLACEHOLDER_IMG, isPlaceholder: true };
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var ICO_RULER =
    '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 6V2H6M14 6V2H10M2 10V14H6M14 10V14H10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICO_CAR =
    '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5V12a1 1 0 001 1h1a1 1 0 001-1v-.5h4v.5a1 1 0 001 1h1a1 1 0 001-1v-1.5M3 10.5l1-4a1.5 1.5 0 011.4-1h5.2a1.5 1.5 0 011.4 1l1 4M3 10.5h10" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="10.5" r="1" fill="currentColor"/><circle cx="11" cy="10.5" r="1" fill="currentColor"/></svg>';
  var ICO_PIN =
    '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 14.5s5-4.2 5-8.2A5 5 0 003 6.3c0 4 5 8.2 5 8.2z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="8" cy="6.3" r="1.6" stroke="currentColor" stroke-width="1.1"/></svg>';
  var ICO_TAG =
    '<svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.6 2.4H13a.6.6 0 01.6.6v4.4a1 1 0 01-.3.7l-6 6a1 1 0 01-1.4 0l-4.6-4.6a1 1 0 010-1.4l6-6a1 1 0 01.7-.3z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="10.5" cy="5.5" r="1" fill="currentColor"/></svg>';

  function metaLine(icon, parts) {
    var texto = parts.filter(function (t) { return t !== null && t !== undefined; }).join(' · ');
    if (!texto) return '';
    return (
      '<div class="featured-card_meta-item">' +
      '<div class="ico-16">' + icon + '</div>' +
      '<div class="l1">' + escapeHtml(texto) + '</div>' +
      '</div>'
    );
  }

  function tituloPropiedad(p) {
    if (p.nombre) return p.nombre;
    var respaldo = [p.tipo, p.comuna ? 'en ' + p.comuna : null].filter(Boolean).join(' ');
    return respaldo || 'Propiedad disponible';
  }

  // Card horizontal (texto + foto) usada tanto en "Destacadas" como en el listado.
  function renderPropertyCard(p, opts) {
    opts = opts || {};
    var imagen = pickImagen(p.imagenes);
    var nombre = tituloPropiedad(p);

    var badge = '';
    if (opts.mostrarEstado && p.estadoNormalizado !== 'disponible') {
      badge = '<div class="property-card_badge">' + escapeHtml(p.estadoEtiqueta) + '</div>';
    }

    var comuna = metaLine(ICO_PIN, [p.comuna]);
    var superficieDorm = metaLine(ICO_RULER, [
      p.superficieTotal !== null && p.superficieTotal !== undefined ? p.superficieTotal + ' m²' : null,
      p.dormitorios !== null && p.dormitorios !== undefined ? p.dormitorios + ' dormitorios' : null,
      p.banos !== null && p.banos !== undefined ? p.banos + ' baños' : null,
    ]);
    var contrato = metaLine(ICO_TAG, [p.contrato]);
    var estacionamientoBodega = metaLine(ICO_CAR, [
      p.estacionamientos !== null && p.estacionamientos !== undefined ? p.estacionamientos + ' estacionamientos' : null,
      p.bodega !== null && p.bodega !== undefined ? p.bodega + ' bodega' : null,
    ]);

    return (
      '<div class="featured-card" role="listitem">' +
      '<div class="featured-card_text">' +
      '<h3 class="h4 featured-card_title">' + escapeHtml(nombre) + '</h3>' +
      '<div class="u-16"></div>' +
      '<div class="p1 featured-card_price">' + escapeHtml(formatPrecio(p.precio)) + '</div>' +
      '<div class="u-24"></div>' +
      '<div class="featured-card_hr"></div>' +
      '<div class="u-24"></div>' +
      '<div class="featured-card_meta">' + comuna + superficieDorm + contrato + estacionamientoBodega + '</div>' +
      '<div class="u-32"></div>' +
      '<a aria-label="Ver propiedad" hover-btn="" hover-nav-item="" data-wf--btn--variant="sec" href="/propiedades" class="btn w-inline-block">' +
      '<div class="btn_label"><div class="btn_label_text"><div hover="text" class="l1">Ver Propiedad</div></div><div class="btn_label_text is-2"><div hover="text" class="l1">Ver Propiedad</div></div></div>' +
      '<div class="btn_bg"><div hover="bg" class="btn_bg_fill"></div></div>' +
      '</a>' +
      '</div>' +
      '<div hover-img-card class="featured-card_img img-w">' +
      '<img hover="img" class="img" src="' + escapeHtml(imagen.src) + '" alt="' + escapeHtml(nombre) + '" loading="lazy" decoding="async"/>' +
      badge +
      '</div>' +
      '</div>'
    );
  }

  function fetchPropiedades(filtros) {
    filtros = filtros || {};
    var params = new URLSearchParams();
    FILTER_KEYS.forEach(function (k) {
      if (filtros[k]) params.set(k, filtros[k]);
    });
    if (filtros.incluirNoDisponibles) params.set('incluirNoDisponibles', '1');
    if (filtros.destacadas) params.set('destacadas', '1');
    var qs = params.toString();
    return fetch('/api/propiedades' + (qs ? '?' + qs : ''))
      .then(function (res) { return res.json(); })
      .catch(function () { return { propiedades: [], error: true }; });
  }

  function renderEstado(container, estado) {
    var mensajes = {
      cargando: 'Cargando propiedades…',
      vacio: 'No hay propiedades disponibles por el momento.',
      sinResultadosFiltro: 'No encontramos propiedades con estos filtros, prueba ajustando tu búsqueda.',
      error: 'No pudimos cargar las propiedades. Intenta recargar la página.',
    };
    container.innerHTML = '<div class="property-list_state p1">' + escapeHtml(mensajes[estado] || '') + '</div>';
  }

  function hayFiltrosActivos(filtros) {
    return FILTER_KEYS.some(function (k) { return !!filtros[k]; });
  }

  // Precarga los <select> del formulario de filtros con los valores de la URL
  // actual (permite llegar desde el buscador del Hero ya filtrado).
  function aplicarFiltrosDesdeQuery(form) {
    var params = new URLSearchParams(window.location.search);
    FILTER_KEYS.forEach(function (k) {
      var valor = params.get(k);
      var campo = form.elements.namedItem(k);
      if (valor && campo) campo.value = valor;
    });
  }

  function leerFiltrosDeFormulario(form) {
    var filtros = {};
    if (!form) return filtros;
    var data = new FormData(form);
    data.forEach(function (valor, clave) {
      if (valor) filtros[clave] = valor;
    });
    return filtros;
  }

  // Pager numerado (1, 2, 3…) de PAGE_SIZE propiedades por página. Se oculta solo
  // si todo entra en una página.
  function renderPager(pagerEl, total, paginaActual, onCambiar) {
    if (!pagerEl) return;
    var totalPaginas = Math.ceil(total / PAGE_SIZE);
    if (totalPaginas <= 1) {
      pagerEl.innerHTML = '';
      return;
    }
    var botones = [];
    for (var i = 1; i <= totalPaginas; i++) {
      botones.push(
        '<button type="button" class="property-pager_btn' +
        (i === paginaActual ? ' is-active' : '') +
        '" data-pagina="' + i + '" aria-current="' + (i === paginaActual ? 'page' : 'false') + '">' +
        i + '</button>'
      );
    }
    pagerEl.innerHTML = botones.join('');
    Array.prototype.forEach.call(pagerEl.querySelectorAll('[data-pagina]'), function (btn) {
      btn.addEventListener('click', function () {
        onCambiar(Number(btn.getAttribute('data-pagina')));
      });
    });
  }

  // Monta el listado de /propiedades.html. `filtrosForm` es el <form> que envuelve
  // los <select> de comuna/tipo/contrato/dormitorios/baños y el checkbox de
  // no-disponibles; re-consulta la API en cada cambio, sin recargar la página.
  // `pagerEl` (opcional) es el contenedor donde se dibujan los botones de página.
  function mountListado(container, filtrosForm, pagerEl) {
    if (!container) return;

    var propiedadesActuales = [];
    var filtrosActuales = {};
    var paginaActual = 1;

    function renderPagina() {
      var inicio = (paginaActual - 1) * PAGE_SIZE;
      var pagina = propiedadesActuales.slice(inicio, inicio + PAGE_SIZE);
      container.innerHTML = pagina
        .map(function (p) { return renderPropertyCard(p, { mostrarEstado: !!filtrosActuales.incluirNoDisponibles }); })
        .join('');
      renderPager(pagerEl, propiedadesActuales.length, paginaActual, function (nuevaPagina) {
        paginaActual = nuevaPagina;
        renderPagina();
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    function cargar() {
      filtrosActuales = leerFiltrosDeFormulario(filtrosForm);
      paginaActual = 1;
      renderEstado(container, 'cargando');
      if (pagerEl) pagerEl.innerHTML = '';
      fetchPropiedades(filtrosActuales).then(function (data) {
        if (data.error) {
          renderEstado(container, 'error');
          return;
        }
        if (!data.propiedades.length) {
          renderEstado(container, hayFiltrosActivos(filtrosActuales) ? 'sinResultadosFiltro' : 'vacio');
          return;
        }
        propiedadesActuales = data.propiedades;
        renderPagina();
      });
    }

    if (filtrosForm) {
      aplicarFiltrosDesdeQuery(filtrosForm);
      filtrosForm.addEventListener('change', cargar);
    }

    cargar();
  }

  // Monta la sección "destacadas" de la portada; se oculta si no hay resultados.
  function mountDestacadas(sectionEl, container) {
    if (!sectionEl || !container) return;
    fetchPropiedades({ destacadas: true }).then(function (data) {
      if (data.error || !data.propiedades.length) {
        sectionEl.style.display = 'none';
        return;
      }
      container.innerHTML = data.propiedades.map(function (p) { return renderPropertyCard(p, {}); }).join('');
      sectionEl.style.display = '';
    });
  }

  window.NissiProperties = {
    fetchPropiedades: fetchPropiedades,
    renderPropertyCard: renderPropertyCard,
    mountListado: mountListado,
    mountDestacadas: mountDestacadas,
    formatPrecio: formatPrecio,
  };
})();
