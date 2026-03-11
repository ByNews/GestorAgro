const DEFAULT_BASE_URL = 'https://apiprevmet3.inmet.gov.br';
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const PERIOD_ORDER = ['madrugada', 'manha', 'tarde', 'noite', 'dia'];
const PERIOD_LABELS = {
  madrugada: 'Madrugada',
  manha: 'Manha',
  tarde: 'Tarde',
  noite: 'Noite',
  dia: 'Dia'
};

function httpError(message, status = 500, cause) {
  const error = new Error(message);
  error.status = status;
  if (cause) error.cause = cause;
  return error;
}

function normalizeUf(value) {
  const uf = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) {
    throw httpError('UF invalida. Informe 2 letras, ex: TO.', 400);
  }
  return uf;
}

function normalizeCity(value) {
  const city = String(value || '').trim();
  if (!city) {
    throw httpError('Cidade invalida. Informe o nome da cidade.', 400);
  }
  return city;
}

function slugifyCity(city) {
  return String(city || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function normalizeComparableText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(',', '.');
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickNumber(source, keys) {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const parsed = parseNumber(source[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function pickText(source, keys) {
  if (!source || typeof source !== 'object') return '';
  for (const key of keys) {
    const raw = source[key];
    if (raw === undefined || raw === null) continue;
    const text = String(raw).trim();
    if (text) return text;
  }
  return '';
}

function normalizePeriodKey(rawKey) {
  return String(rawKey || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeDateKey(rawKey) {
  const key = String(rawKey || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  const br = key.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return null;
}

function hasDateBuckets(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value).some((key) => !!normalizeDateKey(key));
}

function extractForecastContainer(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw httpError('Resposta do INMET invalida.', 502);
  }

  if (hasDateBuckets(payload)) {
    return { cityKey: null, forecastByDate: payload };
  }

  for (const [key, value] of Object.entries(payload)) {
    if (hasDateBuckets(value)) return { cityKey: key, forecastByDate: value };
  }

  for (const [, value] of Object.entries(payload)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    for (const [innerKey, innerValue] of Object.entries(value)) {
      if (hasDateBuckets(innerValue)) return { cityKey: innerKey, forecastByDate: innerValue };
    }
  }

  throw httpError('Formato de previsao INMET nao reconhecido.', 502);
}

function normalizeForecastPeriods(forecastByDate) {
  const dateEntries = Object.keys(forecastByDate || {})
    .map((key) => ({ key, isoDate: normalizeDateKey(key) }))
    .filter((item) => !!item.isoDate)
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate));

  const periods = [];

  for (const { key, isoDate } of dateEntries) {
    const rawDay = forecastByDate[key];
    if (!rawDay || typeof rawDay !== 'object' || Array.isArray(rawDay)) continue;

    const day = {};
    for (const [rawPeriodKey, value] of Object.entries(rawDay)) {
      day[normalizePeriodKey(rawPeriodKey)] = value;
    }

    const periodBuckets = PERIOD_ORDER.filter((period) => day[period] && typeof day[period] === 'object' && !Array.isArray(day[period]));
    const buckets = periodBuckets.length ? periodBuckets : ['dia'];

    for (const period of buckets) {
      const bucket = periodBuckets.length ? day[period] : rawDay;
      if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) continue;

      const tempMin = pickNumber(bucket, ['temp_min', 'tempmin', 'temp_minima', 'min']);
      const tempMax = pickNumber(bucket, ['temp_max', 'tempmax', 'temp_maxima', 'max']);
      const humidityMin = pickNumber(bucket, ['umidade_min', 'umid_min', 'humidity_min', 'umidademin']);
      const humidityMax = pickNumber(bucket, ['umidade_max', 'umid_max', 'humidity_max', 'umidademax']);
      const rainProbability = pickNumber(bucket, ['prob_chuva', 'probabilidade_chuva', 'probabilidade', 'chuva', 'precip_prob', 'precipitacao_prob', 'chuva_prob', 'chance_chuva', 'pcp_mm', 'precip']);
      const summary = pickText(bucket, ['resumo', 'descricao', 'tempo']) || pickText(rawDay, ['resumo', 'descricao', 'tempo']);
      const wind = pickText(bucket, ['vento_intensidade', 'vento', 'int_vento']);
      const icon = pickText(bucket, ['icone', 'id_icone']);
      const dateLabel = isoDate.split('-').reverse().join('/');

      periods.push({
        id: `${isoDate}-${period}`,
        date: isoDate,
        period,
        periodLabel: PERIOD_LABELS[period] || period,
        label: `${dateLabel} ${PERIOD_LABELS[period] || period}`,
        summary,
        tempMin,
        tempMax,
        humidityMin,
        humidityMax,
        rainProbability,
        wind,
        icon
      });
    }
  }

  return periods;
}

function maxOf(items, key) {
  const values = items.map((item) => item[key]).filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) : null;
}

function minOf(items, key) {
  const values = items.map((item) => item[key]).filter((value) => Number.isFinite(value));
  return values.length ? Math.min(...values) : null;
}

function buildAgroAlerts(periods) {
  const alerts = [];
  const maxTemp = maxOf(periods, 'tempMax');
  const minHumidity = minOf(periods, 'humidityMin');
  const maxRainProbability = maxOf(periods, 'rainProbability');
  const hasStormText = periods.some((item) => /tempest|trovoad|granizo|chuva forte/i.test(String(item.summary || '')));

  if (maxTemp !== null && maxTemp >= 38) {
    alerts.push({
      id: 'heat-critical',
      severity: 'critical',
      title: 'Calor extremo',
      description: `Temperatura maxima prevista em ${maxTemp.toFixed(0)}C. Reforce sombra, agua e manejo do gado.`
    });
  } else if (maxTemp !== null && maxTemp >= 34) {
    alerts.push({
      id: 'heat-warning',
      severity: 'warning',
      title: 'Estresse termico',
      description: `Picos de ${maxTemp.toFixed(0)}C nas proximas janelas. Evite manejo pesado nas horas quentes.`
    });
  }

  if (minHumidity !== null && minHumidity <= 30) {
    alerts.push({
      id: 'humidity-warning',
      severity: 'warning',
      title: 'Umidade baixa',
      description: `Umidade minima prevista em ${minHumidity.toFixed(0)}%. Avalie irrigacao e risco de estresse hidrico.`
    });
  }

  if ((maxRainProbability !== null && maxRainProbability >= 70) || hasStormText) {
    alerts.push({
      id: 'rain-warning',
      severity: 'warning',
      title: 'Chuva relevante',
      description: 'Alta chance de chuva/instabilidade. Planeje aplicacoes e deslocamentos com janela curta.'
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'stable',
      severity: 'info',
      title: 'Cenario estavel',
      description: 'Sem alertas criticos nas proximas janelas da previsao INMET.'
    });
  }

  return alerts;
}

function formatMetric(value, suffix = '') {
  if (!Number.isFinite(value)) return '-';
  return `${value.toFixed(0)}${suffix}`;
}

function buildCards(periods, alerts) {
  const windowPeriods = periods.slice(0, 6);
  const maxTemp = maxOf(windowPeriods, 'tempMax');
  const minHumidity = minOf(windowPeriods, 'humidityMin');
  let maxRainProbability = maxOf(windowPeriods, 'rainProbability');
  const firstSummary = windowPeriods.map((item) => item.summary).find((text) => !!text) || 'Sem resumo textual do INMET.';
  const warningCount = alerts.filter((item) => item.severity !== 'info').length;

  // Fallback: infer rain chance from summary text when API doesn't return numeric value
  if (maxRainProbability === null) {
    const allSummaries = windowPeriods.map((item) => String(item.summary || '').toLowerCase()).join(' ');
    if (/chuva forte|tempestade|temporal|granizo/.test(allSummaries)) maxRainProbability = 90;
    else if (/chuva|pancada|chuvisco|instabilidade|nublado com chuva/.test(allSummaries)) maxRainProbability = 70;
    else if (/possibilidade de chuva|nublado/.test(allSummaries)) maxRainProbability = 40;
    else if (/poucas nuvens|sol|céu claro|ensolarado/.test(allSummaries)) maxRainProbability = 10;
  }

  return [
    {
      id: 'temp-max',
      title: 'Temperatura maxima',
      value: formatMetric(maxTemp, 'C'),
      detail: 'Janela das proximas horas',
      severity: maxTemp !== null && maxTemp >= 34 ? 'warning' : 'info'
    },
    {
      id: 'humidity-min',
      title: 'Umidade minima',
      value: formatMetric(minHumidity, '%'),
      detail: 'Minima prevista',
      severity: minHumidity !== null && minHumidity <= 30 ? 'warning' : 'info'
    },
    {
      id: 'rain-probability',
      title: 'Chance de chuva',
      value: formatMetric(maxRainProbability, '%'),
      detail: 'Maior probabilidade prevista',
      severity: maxRainProbability !== null && maxRainProbability >= 70 ? 'warning' : 'info'
    },
    {
      id: 'agro-attention',
      title: 'Atencoes agro',
      value: String(warningCount),
      detail: warningCount ? alerts[0].title : firstSummary,
      severity: warningCount ? 'warning' : 'info'
    }
  ];
}

function normalizeInmetPayload(payload, location, sourceUrl) {
  const container = extractForecastContainer(payload);
  const periods = normalizeForecastPeriods(container.forecastByDate);
  if (!periods.length) {
    throw httpError('INMET nao retornou periodos validos para esta localidade.', 502);
  }

  const inferredGeocode = Number(container.cityKey);
  const geocode = Number.isFinite(location.geocode) ? Number(location.geocode) : (Number.isFinite(inferredGeocode) ? inferredGeocode : null);
  const alerts = buildAgroAlerts(periods);
  const cards = buildCards(periods, alerts);

  return {
    source: 'INMET',
    generatedAt: new Date().toISOString(),
    location: {
      uf: location.uf,
      city: location.city,
      label: `${location.city}/${location.uf}`,
      geocode
    },
    cards,
    alerts,
    periods,
    reports: {
      resumo: cards,
      alertas: alerts,
      periodos: periods
    },
    meta: {
      sourceUrl,
      cityKey: container.cityKey
    }
  };
}

function buildCandidateUrls(baseUrl, uf, citySlug, geocode) {
  const root = String(baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const urls = [];
  if (Number.isFinite(Number(geocode))) urls.push(`${root}/previsao/${Number(geocode)}`);
  if (uf && citySlug) {
    urls.push(`${root}/previsao/${uf}/${encodeURIComponent(citySlug)}`);
    urls.push(`${root}/previsao/${encodeURIComponent(citySlug)}/${uf}`);
  }
  if (citySlug) urls.push(`${root}/previsao/${encodeURIComponent(citySlug)}`);
  return [...new Set(urls)];
}

function resolveMunicipioByCityUf(municipios, uf, city) {
  const cityNorm = normalizeComparableText(city);
  const inUf = (municipios || []).filter((item) => String(item.sigla || '').toUpperCase() === uf);
  if (!inUf.length) return null;

  const exact = inUf.find((item) => normalizeComparableText(item.nome) === cityNorm);
  if (exact) return exact;

  const partial = inUf
    .filter((item) => {
      const normalized = normalizeComparableText(item.nome);
      return normalized.includes(cityNorm) || cityNorm.includes(normalized);
    })
    .sort((a, b) => String(a.nome || '').length - String(b.nome || '').length);

  return partial[0] || null;
}

async function fetchJsonWithTimeout(fetchImpl, url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GestorAgro-INMET/1.0'
      },
      signal: controller.signal
    });
    if (!response.ok) {
      return { ok: false, error: httpError(`INMET respondeu HTTP ${response.status}.`, response.status) };
    }
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== 'object') {
      return { ok: false, error: httpError('Resposta JSON invalida do INMET.', 502) };
    }
    return { ok: true, data };
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.code === 'ABORT_ERR')) {
      return { ok: false, error: httpError('Timeout ao consultar o INMET.', 504, error) };
    }
    return { ok: false, error: httpError('Falha de comunicacao com o INMET.', 502, error) };
  } finally {
    clearTimeout(timeout);
  }
}

function createInmetService(options = {}) {
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new Error('Fetch nao disponivel para consultar INMET.');
  }

  const baseUrl = options.baseUrl || process.env.INMET_BASE_URL || DEFAULT_BASE_URL;
  const timeoutMs = Number(options.timeoutMs || process.env.INMET_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const cacheTtlMs = Number(options.cacheTtlMs || process.env.INMET_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS);
  const forecastCache = new Map();
  let municipiosCache = { data: null, expiresAt: 0 };

  async function getMunicipios(force = false) {
    const now = Date.now();
    if (!force && Array.isArray(municipiosCache.data) && municipiosCache.expiresAt > now) {
      return municipiosCache.data;
    }

    const url = `${String(baseUrl).replace(/\/+$/, '')}/municipios`;
    const response = await fetchJsonWithTimeout(fetchImpl, url, timeoutMs);
    if (!response.ok) {
      throw httpError('Falha ao consultar lista de municipios INMET.', 502, response.error);
    }

    if (!Array.isArray(response.data)) {
      throw httpError('Formato invalido da lista de municipios INMET.', 502);
    }

    municipiosCache = {
      data: response.data,
      expiresAt: now + cacheTtlMs
    };
    return municipiosCache.data;
  }

  async function getForecast(params = {}) {
    const ufSource = params.uf !== undefined ? params.uf : (process.env.INMET_DEFAULT_UF || 'TO');
    const citySource = params.city !== undefined ? params.city : (process.env.INMET_DEFAULT_CITY || 'Araguaina');
    const uf = normalizeUf(ufSource);
    const city = normalizeCity(citySource);
    const force = params.force === true;

    let geocode = Number(params.geocode);
    if (!Number.isFinite(geocode)) geocode = null;

    let municipio = null;
    if (!geocode) {
      const municipios = await getMunicipios(force);
      municipio = resolveMunicipioByCityUf(municipios, uf, city);
      if (!municipio) {
        throw httpError(`Cidade ${city}/${uf} nao encontrada na base INMET.`, 404);
      }
      geocode = Number(municipio.geocode);
      if (!Number.isFinite(geocode)) {
        throw httpError(`Geocode invalido para ${city}/${uf} na base INMET.`, 502);
      }
    }

    const cacheKey = `${uf}|${(municipio?.nome || city).toUpperCase()}|${geocode}`;
    const now = Date.now();
    if (!force) {
      const cached = forecastCache.get(cacheKey);
      if (cached && cached.expiresAt > now) return cached.payload;
    }

    const citySlug = slugifyCity(municipio?.nome || city);
    const urls = buildCandidateUrls(baseUrl, uf, citySlug, geocode);
    let lastError = null;

    for (const url of urls) {
      const response = await fetchJsonWithTimeout(fetchImpl, url, timeoutMs);
      if (!response.ok) {
        lastError = response.error;
        continue;
      }

      try {
        const payload = normalizeInmetPayload(
          response.data,
          {
            uf,
            city: municipio?.nome || city,
            geocode
          },
          url
        );
        forecastCache.set(cacheKey, { payload, expiresAt: now + cacheTtlMs });
        return payload;
      } catch (error) {
        lastError = error;
      }
    }

    const causeMessage = lastError?.message ? ` Detalhe: ${lastError.message}` : '';
    throw httpError(`Falha ao consultar INMET para ${(municipio?.nome || city)}/${uf}.${causeMessage}`, 502, lastError);
  }

  return { getForecast };
}

module.exports = {
  createInmetService,
  normalizeUf,
  normalizeCity,
  slugifyCity,
  normalizeComparableText,
  extractForecastContainer,
  normalizeForecastPeriods,
  buildAgroAlerts,
  buildCards,
  normalizeInmetPayload,
  buildCandidateUrls,
  resolveMunicipioByCityUf
};
