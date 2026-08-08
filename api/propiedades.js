// Proxy serverless hacia Airtable. El token nunca se expone al navegador.
// Variables de entorno requeridas (configuradas en Vercel, nunca en el repo):
//   AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME

const CAMPOS = {
  nombre: 'Nombre',
  precio: 'Precio',
  estado: 'Estado',
  dormitorios: 'Dormitorios',
  banos: 'Baños',
  estacionamientos: 'Estacionamientos',
  superficieTotal: 'Superficie Total',
  bodega: 'Bodega',
  descripcion: 'Descripción Propiedad',
  imagenes: 'Imagenes',
  destacada: 'Destacada',
};

const ETIQUETAS_ESTADO = {
  disponible: 'Disponible',
  vendida: 'Vendida',
  vendido: 'Vendida',
  arrendada: 'Arrendada',
  'en arriendo': 'Arrendada',
};

function esDisponible(estado) {
  return normalizarEstado(estado) === 'disponible';
}

function normalizarEstado(estado) {
  return typeof estado === 'string' ? estado.trim().toLowerCase() : '';
}

function etiquetaEstado(estado) {
  const clave = normalizarEstado(estado);
  return ETIQUETAS_ESTADO[clave] || (estado ? String(estado) : 'No disponible');
}

function mapearImagenes(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.map((adjunto) => ({
    url: adjunto.url,
    thumbSmall: adjunto.thumbnails && adjunto.thumbnails.small ? adjunto.thumbnails.small.url : adjunto.url,
    thumbLarge: adjunto.thumbnails && adjunto.thumbnails.large ? adjunto.thumbnails.large.url : adjunto.url,
  }));
}

function normalizarRegistro(record) {
  const f = record.fields || {};
  const estadoCrudo = f[CAMPOS.estado];
  return {
    id: record.id,
    nombre: typeof f[CAMPOS.nombre] === 'string' && f[CAMPOS.nombre].trim() ? f[CAMPOS.nombre].trim() : null,
    precio: typeof f[CAMPOS.precio] === 'number' ? f[CAMPOS.precio] : null,
    estado: estadoCrudo || null,
    estadoNormalizado: esDisponible(estadoCrudo) ? 'disponible' : 'no-disponible',
    estadoEtiqueta: etiquetaEstado(estadoCrudo),
    dormitorios: typeof f[CAMPOS.dormitorios] === 'number' ? f[CAMPOS.dormitorios] : null,
    banos: typeof f[CAMPOS.banos] === 'number' ? f[CAMPOS.banos] : null,
    estacionamientos: typeof f[CAMPOS.estacionamientos] === 'number' ? f[CAMPOS.estacionamientos] : null,
    superficieTotal: typeof f[CAMPOS.superficieTotal] === 'number' ? f[CAMPOS.superficieTotal] : null,
    bodega: typeof f[CAMPOS.bodega] === 'number' ? f[CAMPOS.bodega] : null,
    descripcion: typeof f[CAMPOS.descripcion] === 'string' && f[CAMPOS.descripcion].trim() ? f[CAMPOS.descripcion].trim() : null,
    destacada: f[CAMPOS.destacada] === true,
    imagenes: mapearImagenes(f[CAMPOS.imagenes]),
  };
}

async function obtenerTodosLosRegistros({ token, baseId, tableName }) {
  const registros = [];
  let offset;

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!respuesta.ok) {
      throw new Error(`Airtable respondió ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    registros.push(...(datos.records || []));
    offset = datos.offset;
  } while (offset);

  return registros;
}

module.exports = async function handler(req, res) {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  res.setHeader('Cache-Control', 's-maxage=45, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!token || !baseId || !tableName) {
    res.status(200).send(JSON.stringify({ propiedades: [], error: true }));
    return;
  }

  const incluirNoDisponibles = req.query.incluirNoDisponibles === '1';
  const soloDestacadas = req.query.destacadas === '1';

  try {
    const registros = await obtenerTodosLosRegistros({ token, baseId, tableName });
    let propiedades = registros.map(normalizarRegistro);

    if (soloDestacadas) {
      propiedades = propiedades.filter((p) => p.destacada && p.estadoNormalizado === 'disponible');
    } else if (!incluirNoDisponibles) {
      propiedades = propiedades.filter((p) => p.estadoNormalizado === 'disponible');
    }

    res.status(200).send(JSON.stringify({ propiedades, error: false }));
  } catch (err) {
    res.status(200).send(JSON.stringify({ propiedades: [], error: true }));
  }
};
