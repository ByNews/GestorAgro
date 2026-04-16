const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { Pool } = require('pg');
const { permissionsByRole, resourceModules, resourceGroups, defaultAccessGroups } = require('./constants');
const { createInmetService, buildAgroAlerts, buildCards } = require('./inmet');
const { registerMapRoutes } = require('./mapa');

const TABLES = {
  users: {
    table: 'users',
    order: 'id desc',
    fields: ['username', 'password_hash', 'role', 'full_name', 'active', 'access_groups'],
    searchable: ['username', 'full_name', 'role'],
    defaults: { active: true, access_groups: defaultAccessGroups }
  },
  farms: { table: 'farms', order: 'id desc', fields: ['name', 'document', 'location', 'total_area'], searchable: ['name', 'document', 'location'] },
  plots: { table: 'plots', order: 'id desc', fields: ['farm_id', 'name', 'area', 'current_crop', 'coordinates', 'description'], searchable: ['name', 'current_crop', 'description'] },
  paddocks: { table: 'paddocks', order: 'id desc', fields: ['farm_id', 'name', 'area', 'grass_type', 'status'], searchable: ['name', 'grass_type', 'status'] },
  employees: { table: 'employees', order: 'id desc', fields: ['farm_id', 'name', 'role_name', 'contact', 'status'], searchable: ['name', 'role_name', 'contact', 'status'] },
  lots: { table: 'lots', order: 'id desc', fields: ['farm_id', 'name', 'purpose', 'notes'], searchable: ['name', 'purpose', 'notes'] },
  animals: { table: 'animals', order: 'id desc', fields: ['farm_id', 'lot_id', 'paddock_id', 'ear_tag', 'species', 'sex', 'breed', 'birth_date', 'category', 'status'], searchable: ['ear_tag', 'species', 'sex', 'breed', 'category', 'status'] },
  animal_events: { table: 'animal_events', order: 'id desc', fields: ['animal_id', 'event_type', 'event_date', 'weight', 'vaccine', 'notes', 'lot_id', 'paddock_id', 'paddock_future_id', 'cost'], searchable: ['event_type', 'vaccine', 'notes'] },
  crop_operations: { table: 'crop_operations', order: 'id desc', fields: ['plot_id', 'employee_id', 'operation_type', 'operation_date', 'inputs_used', 'cost', 'notes'], searchable: ['operation_type', 'inputs_used', 'notes'] },
  inventory_items: { table: 'inventory_items', order: 'id desc', fields: ['name', 'category', 'unit', 'minimum_stock', 'current_stock'], searchable: ['name', 'category', 'unit'] },
  inventory_moves: { table: 'inventory_moves', order: 'id desc', fields: ['item_id', 'move_type', 'move_date', 'quantity', 'origin_destiny', 'unit_cost', 'link_type', 'link_id', 'notes'], searchable: ['move_type', 'origin_destiny', 'link_type', 'notes'] },
  finance_entries: { table: 'finance_entries', order: 'id desc', fields: ['entry_type', 'competence_date', 'payment_date', 'amount', 'payment_method', 'category', 'cost_center', 'link_type', 'link_id', 'description', 'status'], searchable: ['entry_type', 'payment_method', 'category', 'cost_center', 'description', 'status'] },
  payables: { table: 'payables', order: 'id desc', fields: ['supplier', 'due_date', 'payment_date', 'amount', 'status', 'purchase_id', 'notes'], searchable: ['supplier', 'status', 'notes'] },
  receivables: { table: 'receivables', order: 'id desc', fields: ['customer_name', 'due_date', 'receive_date', 'amount', 'status', 'sale_id', 'notes'], searchable: ['customer_name', 'status', 'notes'] },
  purchases: { table: 'purchases', order: 'id desc', fields: ['supplier', 'purchase_date', 'item_id', 'quantity', 'unit_price', 'taxes', 'status', 'notes'], searchable: ['supplier', 'status', 'notes'] },
  sales: { table: 'sales', order: 'id desc', fields: ['customer_name', 'sale_date', 'sale_type', 'sale_scope', 'animal_id', 'lot_id', 'item_id', 'quantity', 'unit_price', 'status', 'notes'], searchable: ['customer_name', 'sale_type', 'sale_scope', 'status', 'notes'] }
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password || '')).digest('hex');
}
function createToken() { return crypto.randomBytes(24).toString('hex'); }
function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function normalizeIsoDateInput(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const dt = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(dt.getTime()) ? null : text;
}

function applyInmetDateRange(report, startDate, endDate) {
  if (!startDate && !endDate) return report;
  const minDate = startDate || '0000-01-01';
  const maxDate = endDate || '9999-12-31';
  const periods = (report?.periods || []).filter((item) => item && item.date && item.date >= minDate && item.date <= maxDate);
  const alerts = periods.length ? buildAgroAlerts(periods) : [];
  const cards = periods.length ? buildCards(periods, alerts) : [];
  return {
    ...report,
    cards,
    alerts,
    periods,
    reports: {
      resumo: cards,
      alertas: alerts,
      periodos: periods
    },
    dateRange: {
      start: startDate || null,
      end: endDate || null
    }
  };
}
function normalizeGroups(groups) {
  if (Array.isArray(groups)) return groups.filter(Boolean);
  if (!groups) return [];
  return [String(groups)];
}
function can(role, moduleName, action) {
  const perms = permissionsByRole[role] || {};
  return (perms[moduleName] || []).includes(action);
}
function userHasGroup(user, group) {
  if (user?.role === 'ADMIN') return true;
  return Array.isArray(user?.access_groups) && user.access_groups.includes(group);
}
function settingsAccess(user) {
  if (user?.role === 'ADMIN') return true;
  return ['GERENTE'].includes(user?.role) && userHasGroup(user, 'settings');
}

async function getSystemParameters(pool) {
  const result = await pool.query('SELECT key, label, value, sort_order FROM system_parameters ORDER BY sort_order, key');
  const rows = result.rows || [];
  if (!rows.length) {
    return [
      { key: 'works_with_livestock', label: 'CLIENTE TRABALHA COM PECUÁRIA', value: true, sort_order: 1 },
      { key: 'works_with_agriculture', label: 'CLIENTE TRABALHA COM AGRICULTURA', value: true, sort_order: 2 }
    ];
  }
  return rows;
}

function parameterMap(rows) {
  return (rows || []).reduce((acc, row) => {
    acc[row.key] = !!row.value;
    return acc;
  }, {});
}


async function runSchema(pool) {
  const sql = fs.readFileSync(path.join(__dirname, 'sql', 'schema.sql'), 'utf8');
  await pool.query(sql);

  const farmCount = await pool.query('select count(*)::int as total from farms');
  if (farmCount.rows[0].total === 0) {
    await pool.query(`
      INSERT INTO farms (name, document, location, total_area)
      VALUES ('Fazenda Modelo', '00.000.000/0001-00', 'Zona Rural', 150.50);
      INSERT INTO plots (farm_id, name, area, current_crop, coordinates, description)
      VALUES (1, 'Talhão A', 40, 'Milho', 'Lat -15 / Long -48', 'Área principal de lavoura'),
             (1, 'Talhão B', 24, 'Soja', 'Lat -15 / Long -47', 'Área de apoio da lavoura');
      INSERT INTO paddocks (farm_id, name, area, grass_type, status)
      VALUES (1, 'Pasto Norte', 18, 'Braquiária', 'ativo'),
             (1, 'Pasto Sul', 16, 'Mombaça', 'descanso');
      INSERT INTO employees (farm_id, name, role_name, contact, status)
      VALUES (1, 'João Silva', 'Capataz', '(00) 90000-0000', 'ativo');
      INSERT INTO lots (farm_id, name, purpose, notes)
      VALUES (1, 'Lote 1', 'Engorda', 'Lote inicial');
      INSERT INTO animals (farm_id, lot_id, paddock_id, ear_tag, species, sex, breed, birth_date, category, status)
      VALUES (1, 1, 1, 'BR-001', 'bovino', 'M', 'Nelore', '2023-03-10', 'boi', 'ativo'),
             (1, 1, 2, 'BR-002', 'bovino', 'F', 'Girolando', '2023-05-11', 'vaca', 'ativo');
      INSERT INTO inventory_items (name, category, unit, minimum_stock, current_stock)
      VALUES ('Ração Premium', 'racao', 'kg', 150, 420),
             ('Vacina A', 'medicamento', 'un', 15, 8),
             ('Adubo NPK', 'insumo', 'kg', 200, 350);
      INSERT INTO finance_entries (entry_type, competence_date, payment_date, amount, payment_method, category, cost_center, description, status)
      VALUES ('despesa', CURRENT_DATE, CURRENT_DATE, 1200, 'PIX', 'Ração', 'pecuaria', 'Compra inicial de ração', 'pago'),
             ('receita', CURRENT_DATE, CURRENT_DATE, 3500, 'Transferência', 'Venda', 'pecuaria', 'Venda inicial de gado', 'pago');
    `);
  }
}

async function listRows(pool, resource, query) {
  const config = TABLES[resource];
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';

  if (query.search) {
    const clauses = config.searchable.map((field) => {
      params.push(`%${query.search}%`);
      return `CAST(${field} AS TEXT) ILIKE $${params.length}`;
    });
    where = `WHERE (${clauses.join(' OR ')})`;
  }

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM ${config.table} ${where}`, params);
  params.push(limit, offset);
  const rows = await pool.query(`SELECT * FROM ${config.table} ${where} ORDER BY ${config.order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return { data: rows.rows, meta: { page, limit, total: countResult.rows[0].total } };
}

async function createRow(pool, resource, body) {
  const config = TABLES[resource];
  const data = { ...(config.defaults || {}), ...body };
  if (resource === 'users') {
    data.access_groups = normalizeGroups(body.access_groups || config.defaults.access_groups);
    if (body.password) data.password_hash = hashPassword(body.password);
  }
  const fields = config.fields.filter((field) => data[field] !== undefined);
  if (!fields.length) throw new Error('Nenhum campo informado.');
  const values = fields.map((field) => data[field]);
  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
  const result = await pool.query(`INSERT INTO ${config.table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
  return result.rows[0];
}

async function updateRow(pool, resource, id, body) {
  const config = TABLES[resource];
  const data = { ...body };
  if (resource === 'users') {
    if (body.password) data.password_hash = hashPassword(body.password);
    if (body.access_groups !== undefined) data.access_groups = normalizeGroups(body.access_groups);
  }
  const fields = config.fields.filter((field) => data[field] !== undefined);
  if (!fields.length) throw new Error('Nenhum campo para atualizar.');
  const sets = fields.map((field, index) => `${field} = $${index + 1}`);
  const values = fields.map((field) => data[field]);
  sets.push('updated_at = NOW()');
  values.push(id);
  const result = await pool.query(`UPDATE ${config.table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`, values);
  return result.rows[0];
}

async function removeRow(pool, resource, id) {
  const config = TABLES[resource];
  await pool.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
  return { ok: true };
}

module.exports = async function startServer(config) {
  const app = express();
  const port = config.appPort || 4312;
  const pool = new Pool({ host: config.host, port: config.port, user: config.user, password: config.password, database: config.database });
  const sessions = new Map();
  const inmetService = createInmetService();
  const interfaceDir = path.resolve(__dirname, '../interface');

  await pool.query('SELECT 1');
  await runSchema(pool);
  app.use(express.json());
  app.use(express.static(interfaceDir));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.post('/api/auth/login', async (req, res) => {
    try {
      const username = String(req.body.username || '').trim();
      const passwordHash = hashPassword(req.body.password || '');
      const result = await pool.query('SELECT id, username, role, full_name, active, access_groups FROM users WHERE username = $1 AND password_hash = $2', [username, passwordHash]);
      const user = result.rows[0];
      if (!user || !user.active) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
      const token = createToken();
      sessions.set(token, user);
      if (user.role === 'ADMIN') user.access_groups = defaultAccessGroups;
      const params = await getSystemParameters(pool);
      res.json({ token, user, permissions: permissionsByRole[user.role] || {}, systemParameters: parameterMap(params) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/settings-verify', async (req, res) => {
    try {
      const username = String(req.body.username || '').trim();
      const passwordHash = hashPassword(req.body.password || '');
      const result = await pool.query('SELECT id, username, role, full_name, active, access_groups FROM users WHERE username = $1 AND password_hash = $2', [username, passwordHash]);
      const user = result.rows[0];
      if (!user || !user.active) {
        return res.status(403).json({ error: 'VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESSA ÁREA' });
      }
      if (user.role === 'ADMIN') user.access_groups = defaultAccessGroups;
      if (!settingsAccess(user)) {
        return res.status(403).json({ error: 'VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESSA ÁREA' });
      }
      res.json({ ok: true, user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.use('/api', (req, res, next) => {
    if (req.path === '/auth/login' || req.path === '/auth/settings-verify') return next();
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    const user = sessions.get(token);
    if (!user) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    req.user = user;
    next();
  });

  app.get('/api/me', async (req, res) => { const user = { ...req.user }; if (user.role === 'ADMIN') user.access_groups = defaultAccessGroups; const params = await getSystemParameters(pool); res.json({ user, permissions: permissionsByRole[user.role] || {}, systemParameters: parameterMap(params) }); });
  app.get('/api/permissions', (_req, res) => res.json(permissionsByRole));

  app.get('/api/system-parameters', async (req, res) => {
    if (!settingsAccess(req.user)) return res.status(403).json({ error: 'VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESSA ÁREA' });
    const rows = await getSystemParameters(pool);
    res.json({ data: rows });
  });

  app.post('/api/system-parameters', async (req, res) => {
    if (!settingsAccess(req.user)) return res.status(403).json({ error: 'VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESSA ÁREA' });
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(`
          INSERT INTO system_parameters (key, label, value, sort_order, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, value = EXCLUDED.value, sort_order = EXCLUDED.sort_order, updated_at = NOW()
        `, [String(item.key || ''), String(item.label || ''), !!item.value, Number(item.sort_order || 0)]);
      }
      await client.query('COMMIT');
      const rows = await getSystemParameters(pool);
      res.json({ ok: true, data: rows });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: error.message });
    } finally {
      client.release();
    }
  });

  app.get('/api/lookups', async (_req, res) => {
    const [farms, plots, paddocks, employees, lots, animals, items] = await Promise.all([
      pool.query('SELECT id, name, location, total_area FROM farms ORDER BY name'),
      pool.query('SELECT id, farm_id, name, area, current_crop, coordinates FROM plots ORDER BY name'),
      pool.query('SELECT id, farm_id, name, area, grass_type, status FROM paddocks ORDER BY name'),
      pool.query('SELECT id, farm_id, name, role_name, contact, status FROM employees ORDER BY name'),
      pool.query('SELECT id, name FROM lots ORDER BY name'),
      pool.query('SELECT id, ear_tag AS name, paddock_id, lot_id, status FROM animals ORDER BY ear_tag'),
      pool.query('SELECT id, name FROM inventory_items ORDER BY name')
    ]);
    res.json({ farms: farms.rows, plots: plots.rows, paddocks: paddocks.rows, employees: employees.rows, lots: lots.rows, animals: animals.rows, inventory_items: items.rows });
  });

  function authorize(resource, action) {
    return (req, res, next) => {
      const moduleName = resourceModules[resource];
      const groupName = resourceGroups[resource];
      if (groupName && !userHasGroup(req.user, groupName)) {
        return res.status(403).json({ error: 'VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESSA ÁREA' });
      }
      if (!can(req.user.role, moduleName, action)) {
        return res.status(403).json({ error: 'Sem permissão para esta ação.' });
      }
      next();
    };
  }

  for (const resource of Object.keys(TABLES)) {
    app.get(`/api/${resource}`, authorize(resource, 'read'), async (req, res) => {
      try { res.json(await listRows(pool, resource, req.query)); } catch (error) { res.status(500).json({ error: error.message }); }
    });
    app.post(`/api/${resource}`, authorize(resource, 'create'), async (req, res) => {
      try {
        const data = await createRow(pool, resource, req.body);
        // Alt 14/15: sincronizacao automatica Pecuaria->Mapas
        if (resource === 'animal_events') {
          const { event_type, animal_id, paddock_future_id } = req.body;
          if (animal_id) {
            if (event_type === 'movimentação' && paddock_future_id) {
              // Mover animal para pasto futuro
              await pool.query('UPDATE animals SET paddock_id = $1 WHERE id = $2', [paddock_future_id, animal_id]);
            } else if (event_type === 'venda' || event_type === 'morte') {
              // Remover animal do pasto e marcar status
              const newStatus = event_type === 'venda' ? 'vendido' : 'morto';
              await pool.query('UPDATE animals SET paddock_id = NULL, status = $1 WHERE id = $2', [newStatus, animal_id]);
            }
          }
        }
        res.json({ data });
      } catch (error) { res.status(400).json({ error: error.message }); }
    });
    app.put(`/api/${resource}/:id`, authorize(resource, 'update'), async (req, res) => {
      try { res.json({ data: await updateRow(pool, resource, Number(req.params.id), req.body) }); } catch (error) { res.status(400).json({ error: error.message }); }
    });
    app.delete(`/api/${resource}/:id`, authorize(resource, 'delete'), async (req, res) => {
      try { res.json(await removeRow(pool, resource, Number(req.params.id))); } catch (error) { res.status(400).json({ error: error.message }); }
    });
  }

  app.post('/api/purchases/register', authorize('purchases', 'create'), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { supplier, purchase_date, item_id, quantity, unit_price, taxes = 0, status = 'aberto', notes = '', due_date } = req.body;
      const total = toNumber(quantity) * toNumber(unit_price) + toNumber(taxes);
      const purchase = await client.query('INSERT INTO purchases (supplier, purchase_date, item_id, quantity, unit_price, taxes, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [supplier, purchase_date, item_id || null, quantity, unit_price, taxes, status, notes]);
      if (item_id) {
        await client.query('UPDATE inventory_items SET current_stock = COALESCE(current_stock,0) + $1, updated_at = NOW() WHERE id = $2', [quantity, item_id]);
        await client.query('INSERT INTO inventory_moves (item_id, move_type, move_date, quantity, origin_destiny, unit_cost, link_type, link_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [item_id, 'entrada', purchase_date, quantity, supplier, unit_price, 'purchase', purchase.rows[0].id, notes]);
      }
      await client.query('INSERT INTO payables (supplier, due_date, amount, status, purchase_id, notes) VALUES ($1,$2,$3,$4,$5,$6)', [supplier, due_date || purchase_date, total, status === 'pago' ? 'pago' : 'aberto', purchase.rows[0].id, notes]);
      await client.query('INSERT INTO finance_entries (entry_type, competence_date, payment_date, amount, payment_method, category, cost_center, link_type, link_id, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', ['despesa', purchase_date, status === 'pago' ? purchase_date : null, total, null, 'Compra', 'administrativo', 'purchase', purchase.rows[0].id, `Compra de ${supplier}`, status === 'pago' ? 'pago' : 'aberto']);
      await client.query('COMMIT');
      res.json({ data: purchase.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: error.message });
    } finally { client.release(); }
  });

  app.post('/api/animals/register', authorize('animals', 'create'), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const {
        entry_mode = 'unidade',
        farm_id,
        lot_id,
        paddock_id,
        ear_tag,
        ear_tag_prefix,
        quantity = 1,
        species = 'bovino',
        sex,
        breed,
        birth_date,
        category,
        status = 'ativo'
      } = req.body;

      let createdRows = [];

      if (entry_mode === 'lote') {
        const total = Math.max(1, toNumber(quantity, 1));
        const prefix = String(ear_tag_prefix || '').trim();
        if (!prefix) throw new Error('Informe o prefixo do brinco para o lançamento por lote.');
        const existingTags = await client.query('SELECT ear_tag FROM animals WHERE ear_tag ILIKE $1', [`${prefix}-%`]);
        const usedNumbers = new Set(
          (existingTags.rows || [])
            .map((row) => {
              const match = String(row.ear_tag || '').match(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`));
              return match ? Number(match[1]) : null;
            })
            .filter((num) => Number.isFinite(num))
        );
        const tags = [];
        let sequence = 1;
        while (tags.length < total) {
          if (!usedNumbers.has(sequence)) {
            tags.push(`${prefix}-${String(sequence).padStart(3, '0')}`);
          }
          sequence += 1;
        }
        for (const tag of tags) {
          const inserted = await client.query(
            'INSERT INTO animals (farm_id, lot_id, paddock_id, ear_tag, species, sex, breed, birth_date, category, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [farm_id || null, lot_id || null, paddock_id || null, tag, species, sex || null, breed || null, birth_date || null, category || null, status]
          );
          createdRows.push(inserted.rows[0]);
        }
      } else {
        if (!ear_tag) throw new Error('Informe o brinco para o lançamento por unidade.');
        const inserted = await client.query(
          'INSERT INTO animals (farm_id, lot_id, paddock_id, ear_tag, species, sex, breed, birth_date, category, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
          [farm_id || null, lot_id || null, paddock_id || null, ear_tag, species, sex || null, breed || null, birth_date || null, category || null, status]
        );
        createdRows = [inserted.rows[0]];
      }

      await client.query('COMMIT');
      res.json({ data: createdRows[0], items: createdRows, createdCount: createdRows.length });
    } catch (error) {
      await client.query('ROLLBACK');
      if (String(error.message || '').toLowerCase().includes('duplicate key')) {
        return res.status(400).json({ error: 'Já existe animal cadastrado com esse brinco ou prefixo informado.' });
      }
      res.status(400).json({ error: error.message });
    } finally { client.release(); }
  });

  app.post('/api/sales/register', authorize('sales', 'create'), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { customer_name, sale_date, sale_type, sale_scope = 'unidade', animal_id, lot_id, item_id, quantity = 1, unit_price, status = 'aberto', notes = '', due_date } = req.body;
      let effectiveAnimalId = animal_id || null;
      let effectiveLotId = lot_id || null;
      let effectiveQuantity = toNumber(quantity, 1);

      if (sale_type === 'animal') {
        if (sale_scope === 'lote') {
          if (!lot_id) throw new Error('Selecione o lote para lançamento por lote.');
          if (effectiveQuantity <= 0) throw new Error('Informe uma quantidade válida para o lote.');
          const availableAnimals = await client.query(
            `SELECT id FROM animals WHERE lot_id = $1 AND status = 'ativo' ORDER BY id LIMIT $2`,
            [lot_id, effectiveQuantity]
          );
          if (availableAnimals.rows.length < effectiveQuantity) {
            throw new Error(`O lote selecionado possui apenas ${availableAnimals.rows.length} animal(is) ativo(s).`);
          }
          const ids = availableAnimals.rows.map((row) => row.id);
          await client.query('UPDATE animals SET status = $1, paddock_id = NULL, updated_at = NOW() WHERE id = ANY($2::int[])', ['vendido', ids]);
          effectiveAnimalId = null;
        } else {
          if (!animal_id) throw new Error('Selecione o animal para lançamento por unidade.');
          const animalRow = await client.query('SELECT lot_id FROM animals WHERE id = $1', [animal_id]);
          effectiveLotId = animalRow.rows[0]?.lot_id || null;
          effectiveQuantity = 1;
          await client.query('UPDATE animals SET status = $1, paddock_id = NULL, updated_at = NOW() WHERE id = $2', ['vendido', animal_id]);
        }
      }

      const total = effectiveQuantity * toNumber(unit_price);
      const sale = await client.query(
        'INSERT INTO sales (customer_name, sale_date, sale_type, sale_scope, animal_id, lot_id, item_id, quantity, unit_price, status, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
        [customer_name, sale_date, sale_type, sale_scope, effectiveAnimalId, effectiveLotId, item_id || null, effectiveQuantity, unit_price, status, notes]
      );
      if (sale_type === 'produto' && item_id) {
        await client.query('UPDATE inventory_items SET current_stock = COALESCE(current_stock,0) - $1, updated_at = NOW() WHERE id = $2', [effectiveQuantity, item_id]);
        await client.query('INSERT INTO inventory_moves (item_id, move_type, move_date, quantity, origin_destiny, unit_cost, link_type, link_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [item_id, 'saida', sale_date, effectiveQuantity, customer_name, unit_price, 'sale', sale.rows[0].id, notes]);
      }
      await client.query('INSERT INTO receivables (customer_name, due_date, amount, status, sale_id, notes) VALUES ($1,$2,$3,$4,$5,$6)', [customer_name, due_date || sale_date, total, status === 'pago' ? 'pago' : 'aberto', sale.rows[0].id, notes]);
      await client.query('INSERT INTO finance_entries (entry_type, competence_date, payment_date, amount, payment_method, category, cost_center, link_type, link_id, description, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)', ['receita', sale_date, status === 'pago' ? sale_date : null, total, null, 'Venda', sale_type === 'animal' ? 'pecuaria' : 'agricultura', 'sale', sale.rows[0].id, `Venda para ${customer_name}`, status === 'pago' ? 'pago' : 'aberto']);
      await client.query('COMMIT');
      res.json({ data: sale.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: error.message });
    } finally { client.release(); }
  });

  app.post('/api/inventory_moves/register', authorize('inventory_moves', 'create'), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { item_id, move_type, move_date, quantity, origin_destiny, unit_cost = 0, link_type = null, link_id = null, notes = '' } = req.body;
      const sign = move_type === 'saida' ? -1 : 1;
      await client.query('UPDATE inventory_items SET current_stock = COALESCE(current_stock,0) + ($1 * $2), updated_at = NOW() WHERE id = $3', [sign, quantity, item_id]);
      const move = await client.query('INSERT INTO inventory_moves (item_id, move_type, move_date, quantity, origin_destiny, unit_cost, link_type, link_id, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [item_id, move_type, move_date, quantity, origin_destiny, unit_cost, link_type, link_id, notes]);
      await client.query('COMMIT');
      res.json({ data: move.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: error.message });
    } finally { client.release(); }
  });

  app.get('/api/reports/dashboard', authorize('reports', 'read'), async (_req, res) => {
    try {
      const [animals, stockLow, revenue, expense, openPayables, openReceivables, totalItems] = await Promise.all([
        pool.query("SELECT COUNT(*)::int AS total FROM animals WHERE status = 'ativo'"),
        pool.query('SELECT COUNT(*)::int AS total FROM inventory_items WHERE current_stock <= minimum_stock'),
        pool.query("SELECT COALESCE(SUM(amount),0)::numeric AS total FROM finance_entries WHERE entry_type = 'receita'"),
        pool.query("SELECT COALESCE(SUM(amount),0)::numeric AS total FROM finance_entries WHERE entry_type = 'despesa'"),
        pool.query("SELECT COALESCE(SUM(amount),0)::numeric AS total FROM payables WHERE status <> 'pago'"),
        pool.query("SELECT COALESCE(SUM(amount),0)::numeric AS total FROM receivables WHERE status <> 'pago'"),
        pool.query('SELECT COUNT(*)::int AS total FROM inventory_items'),
      ]);
      res.json({ animals: animals.rows[0].total, lowStockItems: Number(stockLow.rows[0].total), totalItems: Number(totalItems.rows[0].total), totalRevenue: Number(revenue.rows[0].total), totalExpense: Number(expense.rows[0].total), openPayables: Number(openPayables.rows[0].total), openReceivables: Number(openReceivables.rows[0].total) });
    } catch (error) { res.status(500).json({ error: error.message }); }
  });

  app.get('/api/reports/low-stock', authorize('reports', 'read'), async (_req, res) => {
    const result = await pool.query('SELECT * FROM inventory_items WHERE current_stock <= minimum_stock ORDER BY current_stock ASC');
    res.json({ data: result.rows });
  });

  app.get('/api/reports/critical-items', authorize('reports', 'read'), async (_req, res) => {
    try {
      // Busca itens com estoque <= 200% do mínimo (inclui perto do mínimo) OU com validade próxima
      const result = await pool.query(
        `SELECT id, name, unit_price, expiry_date, current_stock, minimum_stock
         FROM inventory_items
         WHERE minimum_stock > 0 AND current_stock <= minimum_stock * 2
            OR expiry_date IS NOT NULL
         ORDER BY current_stock ASC, expiry_date ASC NULLS LAST`
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const items = result.rows.map((row) => {
        // Nível de validade
        let daysToExpiry = null;
        let expiryLevel = 'otimo';
        if (row.expiry_date) {
          const exp = new Date(row.expiry_date);
          exp.setHours(0, 0, 0, 0);
          daysToExpiry = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 5)       expiryLevel = 'critico';
          else if (daysToExpiry <= 15) expiryLevel = 'uti';
          else if (daysToExpiry <= 30) expiryLevel = 'enfermaria';
          else                         expiryLevel = 'otimo';
        }
        // Nível de estoque
        const min = Number(row.minimum_stock) || 0;
        const cur = Number(row.current_stock) || 0;
        let stockLevel = 'otimo';
        if (min > 0) {
          if (cur <= min)              stockLevel = 'critico';
          else if (cur <= min * 1.5)   stockLevel = 'uti';
          else if (cur <= min * 2)     stockLevel = 'enfermaria';
          else                         stockLevel = 'otimo';
        }
        // Nível geral = o pior dos dois
        const order = ['otimo', 'enfermaria', 'uti', 'critico'];
        const overallLevel = order[Math.max(order.indexOf(expiryLevel), order.indexOf(stockLevel))];
        // Só inclui se há algum alerta
        if (overallLevel === 'otimo') return null;
        return { ...row, days_to_expiry: daysToExpiry, expiry_level: expiryLevel, stock_level: stockLevel, overall_level: overallLevel };
      }).filter(Boolean);
      // Ordena pelo nível geral mais grave primeiro
      const levelOrder = { critico: 0, uti: 1, enfermaria: 2, otimo: 3 };
      items.sort((a, b) => levelOrder[a.overall_level] - levelOrder[b.overall_level]);
      res.json({ data: items });
    } catch (error) { res.status(500).json({ error: error.message }); }
  });

  app.get('/api/reports/finance', authorize('reports', 'read'), async (req, res) => {
    const start = req.query.start || '2000-01-01';
    const end = req.query.end || '2999-12-31';
    const dre = await pool.query(`SELECT entry_type, COALESCE(SUM(amount),0)::numeric AS total FROM finance_entries WHERE competence_date BETWEEN $1 AND $2 GROUP BY entry_type`, [start, end]);
    const cashFlow = await pool.query(`SELECT TO_CHAR(competence_date, 'YYYY-MM') AS month, entry_type, COALESCE(SUM(amount),0)::numeric AS total FROM finance_entries WHERE competence_date BETWEEN $1 AND $2 GROUP BY month, entry_type ORDER BY month`, [start, end]);
    const costCenter = await pool.query(`SELECT cost_center, COALESCE(SUM(amount),0)::numeric AS total FROM finance_entries WHERE entry_type = 'despesa' AND competence_date BETWEEN $1 AND $2 GROUP BY cost_center ORDER BY total DESC`, [start, end]);
    const hectare = await pool.query(`SELECT CASE WHEN COALESCE(SUM(area),0) = 0 THEN 0 ELSE COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type='despesa' AND cost_center='agricultura' AND competence_date BETWEEN $1 AND $2),0) / SUM(area) END AS cost_per_hectare FROM plots`, [start, end]);
    const head = await pool.query(`SELECT CASE WHEN COUNT(*) = 0 THEN 0 ELSE COALESCE((SELECT SUM(amount) FROM finance_entries WHERE entry_type='despesa' AND cost_center='pecuaria' AND competence_date BETWEEN $1 AND $2),0) / COUNT(*) END AS cost_per_head FROM animals WHERE status = 'ativo'`, [start, end]);
    const totalReceita = Number((dre.rows.find((r) => r.entry_type === 'receita') || { total: 0 }).total);
    const totalDespesa = Number((dre.rows.find((r) => r.entry_type === 'despesa') || { total: 0 }).total);
    res.json({
      dre: { receita: totalReceita, despesa: totalDespesa, resultado: totalReceita - totalDespesa },
      cashFlow: cashFlow.rows,
      costCenter: costCenter.rows.map((row) => ({ ...row, total: Number(row.total) })),
      heuristicCosts: { costPerHectare: Number(hectare.rows[0].cost_per_hectare || 0), costPerHead: Number(head.rows[0].cost_per_head || 0) }
    });
  });
  app.get('/api/reports/inmet', authorize('reports', 'read'), async (req, res) => {
    try {
      const startText = req.query.start;
      const endText = req.query.end;
      const hasStart = startText !== undefined && String(startText).trim() !== '';
      const hasEnd = endText !== undefined && String(endText).trim() !== '';
      const parsedStart = normalizeIsoDateInput(startText);
      const parsedEnd = normalizeIsoDateInput(endText);
      if (hasStart && !parsedStart) return res.status(400).json({ error: 'Data inicial invalida. Use AAAA-MM-DD.' });
      if (hasEnd && !parsedEnd) return res.status(400).json({ error: 'Data final invalida. Use AAAA-MM-DD.' });

      let rangeStart = parsedStart;
      let rangeEnd = parsedEnd;
      if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
        const tmp = rangeStart;
        rangeStart = rangeEnd;
        rangeEnd = tmp;
      }

      const report = await inmetService.getForecast({
        uf: req.query.uf,
        city: req.query.city,
        force: String(req.query.force || '').toLowerCase() === 'true'
      });

      res.json(applyInmetDateRange(report, rangeStart, rangeEnd));
    } catch (error) {
      res.status(Number(error.status) || 502).json({ error: error.message || 'Falha ao consultar INMET.' });
    }
  });
  registerMapRoutes(app, pool, authorize);

  app.get('/', (_req, res) => {
    res.sendFile(path.join(interfaceDir, 'index.html'));
  });

  const server = app.listen(port);
  server.on('close', async () => { await pool.end(); });
  return server;
};
