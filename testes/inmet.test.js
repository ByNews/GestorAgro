const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createInmetService,
  normalizeForecastPeriods,
  buildAgroAlerts,
  normalizeInmetPayload,
  resolveMunicipioByCityUf
} = require('../src/server/inmet');

const SAMPLE_FORECAST = {
  '1702109': {
    '07/03/2026': {
      manha: {
        uf: 'TO',
        entidade: 'Araguaina',
        resumo: 'Ceu com poucas nuvens',
        temp_min: '22',
        temp_max: '35',
        umidade_min: '28',
        umidade_max: '90',
        prob_chuva: '20%'
      },
      tarde: {
        uf: 'TO',
        entidade: 'Araguaina',
        resumo: 'Calor e pancadas isoladas',
        temp_min: '24',
        temp_max: '38',
        umidade_min: '25',
        umidade_max: '76',
        prob_chuva: '80%'
      },
      noite: {
        uf: 'TO',
        entidade: 'Araguaina',
        resumo: 'Trovoadas',
        temp_min: '23',
        temp_max: '30',
        umidade_min: '44',
        umidade_max: '95',
        prob_chuva: '75%'
      }
    },
    '08/03/2026': {
      manha: {
        uf: 'TO',
        entidade: 'Araguaina',
        resumo: 'Nublado',
        temp_min: '21',
        temp_max: '33',
        umidade_min: '40',
        umidade_max: '88',
        prob_chuva: '45%'
      }
    }
  }
};

const SAMPLE_MUNICIPIOS = [
  { geocode: 1702109, nome: 'Araguaina', sigla: 'TO' },
  { geocode: 1702208, nome: 'Araguatins', sigla: 'TO' }
];

test('normalizeForecastPeriods converte estrutura por dia/periodo', () => {
  const periods = normalizeForecastPeriods(SAMPLE_FORECAST['1702109']);

  assert.equal(periods.length, 4);
  assert.equal(periods[0].period, 'manha');
  assert.equal(periods[1].tempMax, 38);
  assert.equal(periods[1].humidityMin, 25);
  assert.equal(periods[2].rainProbability, 75);
  assert.equal(periods[3].date, '2026-03-08');
});

test('buildAgroAlerts sinaliza calor, baixa umidade e chuva relevante', () => {
  const periods = normalizeForecastPeriods(SAMPLE_FORECAST['1702109']);
  const alerts = buildAgroAlerts(periods);

  const ids = alerts.map((item) => item.id);
  assert.ok(ids.includes('heat-critical'));
  assert.ok(ids.includes('humidity-warning'));
  assert.ok(ids.includes('rain-warning'));
});

test('normalizeInmetPayload gera cards e relatorios padronizados', () => {
  const report = normalizeInmetPayload(SAMPLE_FORECAST, { uf: 'TO', city: 'Araguaina', geocode: 1702109 }, 'https://apiprevmet3.inmet.gov.br/previsao/1702109');

  assert.equal(report.source, 'INMET');
  assert.equal(report.location.label, 'Araguaina/TO');
  assert.equal(report.location.geocode, 1702109);
  assert.equal(report.cards.length, 4);
  assert.ok(Array.isArray(report.reports.periodos));
  assert.ok(Array.isArray(report.reports.alertas));
});

test('resolveMunicipioByCityUf encontra municipio por nome e UF', () => {
  const found = resolveMunicipioByCityUf(SAMPLE_MUNICIPIOS, 'TO', 'Araguaína');
  assert.equal(found.geocode, 1702109);
});

test('createInmetService valida parametros de entrada', async () => {
  const service = createInmetService({
    fetchImpl: async (url) => {
      if (String(url).includes('/municipios')) {
        return { ok: true, status: 200, json: async () => SAMPLE_MUNICIPIOS };
      }
      return { ok: true, status: 200, json: async () => SAMPLE_FORECAST };
    }
  });

  await assert.rejects(() => service.getForecast({ uf: 'T', city: 'Araguaina' }), /UF invalida/i);
  await assert.rejects(() => service.getForecast({ uf: 'TO', city: '   ' }), /Cidade invalida/i);
});

test('createInmetService busca municipios, usa geocode e cache em memoria', async () => {
  const calls = [];
  const service = createInmetService({
    baseUrl: 'https://apiprevmet3.inmet.gov.br',
    cacheTtlMs: 60000,
    fetchImpl: async (url) => {
      calls.push(url);
      if (String(url).includes('/municipios')) {
        return { ok: true, status: 200, json: async () => SAMPLE_MUNICIPIOS };
      }
      if (String(url).includes('/previsao/1702109')) {
        return { ok: true, status: 200, json: async () => SAMPLE_FORECAST };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }
  });

  const first = await service.getForecast({ uf: 'TO', city: 'Araguaina' });
  const second = await service.getForecast({ uf: 'TO', city: 'Araguaina' });

  assert.equal(first.location.uf, 'TO');
  assert.equal(second.location.city, 'Araguaina');
  assert.equal(calls.length, 2);
});

test('createInmetService retorna erro quando cidade nao existe no INMET', async () => {
  const service = createInmetService({
    fetchImpl: async (url) => {
      if (String(url).includes('/municipios')) {
        return { ok: true, status: 200, json: async () => SAMPLE_MUNICIPIOS };
      }
      return { ok: true, status: 200, json: async () => SAMPLE_FORECAST };
    }
  });

  await assert.rejects(() => service.getForecast({ uf: 'TO', city: 'Cidade Inexistente' }), /nao encontrada/i);
});
