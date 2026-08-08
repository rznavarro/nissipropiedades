// Módulo compartido: listado de propiedades (portada "destacadas" y /propiedades).
// Sin build step, sin dependencias — pensado para cargarse con <script defer>.
(function () {
  'use strict';

  var PLACEHOLDER_IMG = 'logo-negro.png';

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

  // Cada stat se omite por completo si el valor es null/undefined (campo vacío en Airtable).
  function statItem(label, value, suffix) {
    if (value === null || value === undefined) return '';
    var texto = suffix ? value + ' ' + suffix : String(value);
    return (
      '<div class="data-item property-card_stat">' +
      '<h4 class="l1 reg">' + escapeHtml(label) + '</h4>' +
      '<div class="u-8"></div>' +
      '<h5 class="h5">' + escapeHtml(texto) + '</h5>' +
      '</div>'
    );
  }

  function renderPropertyCard(p, opts) {
    opts = opts || {};
    var imagen = pickImagen(p.imagenes);
    var nombre = p.nombre || 'Propiedad disponible';
    var stats = [
      statItem('Dormitorios', p.dormitorios),
      statItem('Baños', p.banos),
      statItem('Estacionamientos', p.estacionamientos),
      statItem('Bodega', p.bodega),
      statItem('Superficie', p.superficieTotal, 'm²'),
    ].join('');

    var badge = '';
    if (opts.mostrarEstado && p.estadoNormalizado !== 'disponible') {
      badge = '<div class="property-card_badge">' + escapeHtml(p.estadoEtiqueta) + '</div>';
    }

    var descripcion = p.descripcion
      ? '<p class="p1 property-card_desc">' + escapeHtml(p.descripcion) + '</p>'
      : '';

    return (
      '<div hover-apart-card class="property-card">' +
      '<div hover="shadow" class="property-card_shadow"></div>' +
      '<div hover-img-card class="property-card_img img-w">' +
      '<img hover="img" class="img" src="' + escapeHtml(imagen.src) + '" alt="' + escapeHtml(nombre) + '" loading="lazy" decoding="async"/>' +
      badge +
      '</div>' +
      '<div class="u-24"></div>' +
      '<div class="property-card_body">' +
      '<h4 class="h5">' + escapeHtml(nombre) + '</h4>' +
      '<div class="u-8"></div>' +
      '<h5 class="h5 property-card_price">' + escapeHtml(formatPrecio(p.precio)) + '</h5>' +
      (stats ? '<div class="u-16"></div><div class="property-card_data-list">' + stats + '</div>' : '') +
      descripcion +
      '</div>' +
      '</div>'
    );
  }

  function fetchPropiedades(opts) {
    opts = opts || {};
    var params = new URLSearchParams();
    if (opts.incluirNoDisponibles) params.set('incluirNoDisponibles', '1');
    if (opts.destacadas) params.set('destacadas', '1');
    var qs = params.toString();
    return fetch('/api/propiedades' + (qs ? '?' + qs : ''))
      .then(function (res) { return res.json(); })
      .catch(function () { return { propiedades: [], error: true }; });
  }

  function renderEstado(container, estado) {
    var mensajes = {
      cargando: 'Cargando propiedades…',
      vacio: 'No hay propiedades disponibles por el momento.',
      error: 'No pudimos cargar las propiedades. Intenta recargar la página.',
    };
    container.innerHTML = '<div class="property-list_state p1">' + escapeHtml(mensajes[estado] || '') + '</div>';
  }

  function renderLista(container, propiedades, opts) {
    if (!propiedades.length) {
      renderEstado(container, 'vacio');
      return;
    }
    container.innerHTML = propiedades.map(function (p) { return renderPropertyCard(p, opts); }).join('');
  }

  // Monta el listado principal de /propiedades.html, con toggle opcional de disponibilidad.
  function mountListado(container, toggleEl) {
    if (!container) return;

    function cargar(incluirNoDisponibles) {
      renderEstado(container, 'cargando');
      fetchPropiedades({ incluirNoDisponibles: incluirNoDisponibles }).then(function (data) {
        if (data.error) {
          renderEstado(container, 'error');
          return;
        }
        renderLista(container, data.propiedades, { mostrarEstado: incluirNoDisponibles });
      });
    }

    cargar(false);

    if (toggleEl) {
      toggleEl.addEventListener('change', function () {
        cargar(toggleEl.checked);
      });
    }
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
