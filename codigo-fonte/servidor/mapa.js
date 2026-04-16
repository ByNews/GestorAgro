/**
 * mapa.js — Rotas do modulo de Mapa Interativo
 * Gerencia: mapas KML, areas (pastos/talhoes) e dados agronomicos por area
 */

const AREA_TYPES = ['pasto', 'talhao', 'reserva', 'represa', 'curral', 'sede', 'outro'];

const FIELD_TEMPLATES = {
  gado: [
    { key: 'qtd_animais',     label: 'Quantidade de animais',   unit: 'cab' },
    { key: 'raca_predominante', label: 'Raca predominante',     unit: '' },
    { key: 'categoria',       label: 'Categoria (bezerros, novilhas...)', unit: '' },
    { key: 'lotacao',         label: 'Lotacao',                 unit: 'UA/ha' },
    { key: 'peso_medio',      label: 'Peso medio',              unit: 'kg' },
    { key: 'ganho_diario',    label: 'Ganho medio diario',      unit: 'kg/dia' },
    { key: 'escore_corporal', label: 'Escore corporal (1-5)',   unit: '' },
    { key: 'vacinacao',       label: 'Status de vacinacao',     unit: '' },
    { key: 'vermifugacao',    label: 'Ultima vermifugacao',     unit: '' },
    { key: 'obs_manejo',      label: 'Observacoes de manejo',   unit: '' }
  ],
  solo: [
    { key: 'ph',              label: 'pH do solo',              unit: '' },
    { key: 'fosforo',         label: 'Fosforo (P)',             unit: 'mg/dm3' },
    { key: 'potassio',        label: 'Potassio (K)',            unit: 'cmolc/dm3' },
    { key: 'calcio',          label: 'Calcio (Ca)',             unit: 'cmolc/dm3' },
    { key: 'magnesio',        label: 'Magnesio (Mg)',           unit: 'cmolc/dm3' },
    { key: 'aluminio',        label: 'Aluminio (Al)',           unit: 'cmolc/dm3' },
    { key: 'saturacao_bases', label: 'Saturacao de bases (V%)', unit: '%' },
    { key: 'materia_organica', label: 'Materia organica',       unit: 'g/dm3' },
    { key: 'argila',          label: 'Teor de argila',          unit: '%' },
    { key: 'necessidade_calc', label: 'Necessidade de calcario', unit: 't/ha' },
    { key: 'data_analise',    label: 'Data da analise',         unit: '' }
  ],
  pastagem: [
    { key: 'especie_forrageira', label: 'Especie forrageira',   unit: '' },
    { key: 'area_ha',         label: 'Area total',              unit: 'ha' },
    { key: 'producao_ms',     label: 'Producao de massa seca',  unit: 'kg MS/ha' },
    { key: 'estado_pastagem', label: 'Estado da pastagem',      unit: '' },
    { key: 'degradacao',      label: 'Nivel de degradacao',     unit: '' },
    { key: 'dias_descanso',   label: 'Dias de descanso',        unit: 'dias' },
    { key: 'dias_ocupacao',   label: 'Dias de ocupacao',        unit: 'dias' },
    { key: 'ultima_adubacao', label: 'Ultima adubacao',         unit: '' },
    { key: 'cultura_plantada', label: 'Cultura plantada',       unit: '' },
    { key: 'producao_sacas',  label: 'Producao estimada',       unit: 'sc/ha' }
  ],
  agua: [
    { key: 'fonte_agua',      label: 'Fonte de agua',           unit: '' },
    { key: 'ph_agua',         label: 'pH da agua',              unit: '' },
    { key: 'turbidez',        label: 'Turbidez',                unit: 'NTU' },
    { key: 'coliformes',      label: 'Coliformes totais',       unit: 'UFC/100mL' },
    { key: 'disponibilidade', label: 'Disponibilidade hidrica', unit: '' },
    { key: 'vazao',           label: 'Vazao estimada',          unit: 'L/h' },
    { key: 'qualidade_geral', label: 'Qualidade geral',         unit: '' },
    { key: 'data_analise',    label: 'Data da analise',         unit: '' },
    { key: 'obs_agua',        label: 'Observacoes',             unit: '' }
  ]
};

function registerMapRoutes(app, pool, authorize) {
  function normalizeAreaAlias(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  async function resolveAreaLivestock(areaId) {
    const areaResult = await pool.query(
      `SELECT ma.name, ma.area_key, ma.paddock_id, fm.farm_id
       FROM map_areas ma
       JOIN farm_maps fm ON fm.id = ma.map_id
       WHERE ma.id = $1`,
      [areaId]
    );
    if (!areaResult.rows.length) return { paddockIds: [], farmId: null };

    const { name: areaName, area_key: areaKey, paddock_id: directPaddockId, farm_id: farmId } = areaResult.rows[0];

    const areaAliases = new Set(
      [areaName, areaKey]
        .map((value) => normalizeAreaAlias(value))
        .filter(Boolean)
    );
    const paddockRows = await pool.query(
      `SELECT id, name
       FROM paddocks
       WHERE ($1::int IS NULL OR farm_id = $1)
         AND (status IS NULL OR LOWER(status) = 'ativo')`,
      [farmId || null]
    );
    const matchedPaddocks = paddockRows.rows.filter((row) => {
      const paddockAlias = normalizeAreaAlias(row.name);
      return paddockAlias && areaAliases.has(paddockAlias);
    });

    if (directPaddockId) {
      const directPaddock = paddockRows.rows.find((row) => Number(row.id) === Number(directPaddockId));
      const directAlias = directPaddock ? normalizeAreaAlias(directPaddock.name) : '';
      if (matchedPaddocks.length && (!directAlias || !areaAliases.has(directAlias))) {
        return { paddockIds: matchedPaddocks.map((r) => Number(r.id)).filter((id) => Number.isFinite(id)), farmId };
      }
      return {
        paddockIds: [Number(directPaddockId), ...matchedPaddocks.map((r) => Number(r.id))]
          .filter((id) => Number.isFinite(id))
          .filter((id, index, list) => list.indexOf(id) === index),
        farmId
      };
    }

    if (matchedPaddocks.length) {
      return { paddockIds: matchedPaddocks.map((r) => Number(r.id)).filter((id) => Number.isFinite(id)), farmId };
    }

    return { paddockIds: [], farmId };
  }

  // ── Listar mapas da fazenda ────────────────────────────────────
  app.get('/api/farm-maps', authorize('reports', 'read'), async (req, res) => {
    try {
      const farmId = req.query.farm_id;
      let query = 'SELECT id, farm_id, name, image_type, created_at, updated_at FROM farm_maps';
      const params = [];
      if (farmId) { query += ' WHERE farm_id = $1'; params.push(farmId); }
      query += ' ORDER BY id DESC';
      const { rows } = await pool.query(query, params);
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Buscar mapa completo (com KML/imagem) ─────────────────────
  app.get('/api/farm-maps/:id', authorize('reports', 'read'), async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT * FROM farm_maps WHERE id = $1', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Mapa nao encontrado' });
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Criar mapa ────────────────────────────────────────────────
  app.post('/api/farm-maps', authorize('reports', 'read'), async (req, res) => {
    try {
      const { farm_id, name, kml_content, image_data, image_type } = req.body;
      if (!name) return res.status(400).json({ error: 'Nome obrigatorio' });
      const { rows } = await pool.query(
        `INSERT INTO farm_maps (farm_id, name, kml_content, image_data, image_type)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [farm_id || null, name, kml_content || null, image_data || null, image_type || 'kml']
      );
      res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Atualizar mapa ────────────────────────────────────────────
  app.put('/api/farm-maps/:id', authorize('reports', 'read'), async (req, res) => {
    try {
      const { name, kml_content, image_data, image_type } = req.body;
      const { rows } = await pool.query(
        `UPDATE farm_maps SET name=$1, kml_content=$2, image_data=$3, image_type=$4, updated_at=NOW()
         WHERE id=$5 RETURNING *`,
        [name, kml_content || null, image_data || null, image_type || 'kml', req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Mapa nao encontrado' });
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Excluir mapa ──────────────────────────────────────────────
  app.delete('/api/farm-maps/:id', authorize('reports', 'read'), async (req, res) => {
    try {
      await pool.query('DELETE FROM farm_maps WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Areas de um mapa ──────────────────────────────────────────
  app.get('/api/farm-maps/:mapId/areas', authorize('reports', 'read'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT ma.*, EXISTS(SELECT 1 FROM map_area_data mad WHERE mad.area_id = ma.id) AS has_data FROM map_areas ma WHERE ma.map_id = $1 ORDER BY ma.id ASC`,
        [req.params.mapId]
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Criar area ────────────────────────────────────────────────
  app.post('/api/farm-maps/:mapId/areas', authorize('reports', 'read'), async (req, res) => {
    try {
      const { area_key, name, area_type, polygon_coords, color, notes, paddock_id } = req.body;
      if (!name) return res.status(400).json({ error: 'Nome obrigatorio' });
      const { rows } = await pool.query(
        `INSERT INTO map_areas (map_id, area_key, name, area_type, polygon_coords, color, notes, paddock_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [req.params.mapId, area_key || name.toLowerCase().replace(/\s+/g, '_'),
         name, area_type || 'pasto', polygon_coords || null,
         color || '#4caf50', notes || null, paddock_id || null]
      );
      res.status(201).json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Atualizar area ────────────────────────────────────────────
  app.put('/api/map-areas/:id', authorize('reports', 'read'), async (req, res) => {
    try {
      const { name, area_type, polygon_coords, color, notes, paddock_id } = req.body;
      const { rows } = await pool.query(
        `UPDATE map_areas SET name=$1, area_type=$2, polygon_coords=$3, color=$4, notes=$5, paddock_id=$6, updated_at=NOW()
         WHERE id=$7 RETURNING *`,
        [name, area_type || 'pasto', polygon_coords || null, color || '#4caf50', notes || null, paddock_id || null, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Area nao encontrada' });
      res.json(rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Excluir area ──────────────────────────────────────────────
  app.delete('/api/map-areas/:id', authorize('reports', 'read'), async (req, res) => {
    try {
      await pool.query('DELETE FROM map_areas WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Dados agronomicos de uma area ─────────────────────────────
  app.get('/api/map-areas/:areaId/data', authorize('reports', 'read'), async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM map_area_data WHERE area_id = $1 ORDER BY category, field_key',
        [req.params.areaId]
      );
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Salvar dados agronomicos (upsert em lote) ─────────────────
  app.post('/api/map-areas/:areaId/data', authorize('reports', 'read'), async (req, res) => {
    try {
      const { category, fields, recorded_at } = req.body;
      if (!category || !Array.isArray(fields)) {
        return res.status(400).json({ error: 'category e fields[] obrigatorios' });
      }
      const date = recorded_at || new Date().toISOString().slice(0, 10);
      for (const f of fields) {
        // Upsert correto: chave única é (area_id, category, field_key)
        await pool.query(
          `INSERT INTO map_area_data (area_id, category, field_key, field_label, value, unit, recorded_at, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (area_id, category, field_key)
           DO UPDATE SET value=$5, field_label=$4, unit=$6, recorded_at=$7, notes=$8, updated_at=NOW()`,
          [req.params.areaId, category, f.key, f.label, f.value ?? '', f.unit ?? '', date, f.notes ?? '']
        );
      }
      // Retornar todos os dados desta area+categoria (independente da data)
      const { rows } = await pool.query(
        'SELECT * FROM map_area_data WHERE area_id=$1 AND category=$2 ORDER BY field_key',
        [req.params.areaId, category]
      );
      res.json(rows);
    } catch (err) {
      // Fallback: se não houver constraint única, usar UPDATE + INSERT separados
      try {
        const { category, fields, recorded_at: recorded_at_fb } = req.body;
        const date = recorded_at_fb || new Date().toISOString().slice(0, 10);
        for (const f of fields) {
          const existing = await pool.query(
            'SELECT id FROM map_area_data WHERE area_id=$1 AND category=$2 AND field_key=$3',
            [req.params.areaId, category, f.key]
          );
          if (existing.rows.length) {
            await pool.query(
              'UPDATE map_area_data SET value=$1, field_label=$2, unit=$3, recorded_at=$4, notes=$5, updated_at=NOW() WHERE area_id=$6 AND category=$7 AND field_key=$8',
              [f.value ?? '', f.label, f.unit ?? '', date, f.notes ?? '', req.params.areaId, category, f.key]
            );
          } else {
            await pool.query(
              'INSERT INTO map_area_data (area_id, category, field_key, field_label, value, unit, recorded_at, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
              [req.params.areaId, category, f.key, f.label, f.value ?? '', f.unit ?? '', date, f.notes ?? '']
            );
          }
        }
        const { rows } = await pool.query(
          'SELECT * FROM map_area_data WHERE area_id=$1 AND category=$2 ORDER BY field_key',
          [req.params.areaId, category]
        );
        res.json(rows);
      } catch (err2) { res.status(500).json({ error: err2.message }); }
    }
  });

  // ── Excluir dado especifico ───────────────────────────────────
  app.delete('/api/map-area-data/:id', authorize('reports', 'read'), async (req, res) => {
    try {
      await pool.query('DELETE FROM map_area_data WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // ── Templates de campos por categoria ────────────────────────
  app.get('/api/map-field-templates', authorize('reports', 'read'), (_req, res) => {
    res.json(FIELD_TEMPLATES);
  });


  // ── Tipos de area disponiveis ────────────────────────────────
  app.get('/api/map-area-types', authorize('reports', 'read'), (_req, res) => {
    res.json(AREA_TYPES);
  });

    // Contagem real de animais ativos por area de mapa
  // Quando nao houver pasto correspondente ao nome da area, retorna null
  // para o frontend manter o valor manual de Inserir Dados.
  app.get('/api/map-areas/:areaId/animal-count', authorize('reports', 'read'), async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId, 10);
      const { paddockIds } = await resolveAreaLivestock(areaId);
      if (!paddockIds.length) return res.json({ count: 0 });
      const countResult = await pool.query(
        `SELECT COUNT(id)::int AS count FROM animals
         WHERE paddock_id = ANY($1::int[]) AND (status IS NULL OR LOWER(status) = 'ativo')`,
        [paddockIds]
      );
      res.json({ count: Number(countResult.rows[0].count || 0) });
    } catch (_err) {
      res.json({ count: 0 });
    }
  });

  app.get('/api/map-areas/:areaId/livestock-summary', authorize('reports', 'read'), async (req, res) => {
    try {
      const areaId = parseInt(req.params.areaId, 10);
      const { paddockIds } = await resolveAreaLivestock(areaId);
      if (!paddockIds.length) {
        return res.json({ count: 0, lots: [], predominant_breed: '', categories: '' });
      }

      const animalsResult = await pool.query(
        `SELECT a.id, a.breed, a.category, a.lot_id, l.name AS lot_name
         FROM animals a
         LEFT JOIN lots l ON l.id = a.lot_id
         WHERE a.paddock_id = ANY($1::int[])
           AND (a.status IS NULL OR LOWER(a.status) = 'ativo')`,
        [paddockIds]
      );

      const animals = animalsResult.rows || [];
      const breedCount = new Map();
      const categoryCount = new Map();
      const lotCount = new Map();

      for (const animal of animals) {
        const breed = String(animal.breed || '').trim();
        const category = String(animal.category || '').trim();
        const lotName = String(animal.lot_name || '').trim();
        if (breed) breedCount.set(breed, (breedCount.get(breed) || 0) + 1);
        if (category) categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        if (lotName) lotCount.set(lotName, (lotCount.get(lotName) || 0) + 1);
      }

      const topBreed = [...breedCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
      const categorySummary = [...categoryCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, qty]) => `${name} (${qty})`)
        .join(', ');
      const lots = [...lotCount.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name, qty]) => ({ name, quantity: qty }));

      res.json({
        count: animals.length,
        lots,
        predominant_breed: topBreed,
        categories: categorySummary
      });
    } catch (_err) {
      res.json({ count: 0, lots: [], predominant_breed: '', categories: '' });
    }
  });
  // ── Listar pastos para vinculo com area do mapa ───────────────
  app.get('/api/paddocks-list', authorize('reports', 'read'), async (req, res) => {
    try {
      const { rows } = await pool.query('SELECT id, name FROM paddocks WHERE LOWER(status) = \'ativo\' ORDER BY name');
      res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

}

module.exports = { registerMapRoutes };

// ── Listar pastos para vinculo com area do mapa ───────────────
