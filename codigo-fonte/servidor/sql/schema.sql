CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(60) UNIQUE NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'VISUALIZADOR',
  full_name VARCHAR(120),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  access_groups TEXT[] NOT NULL DEFAULT ARRAY['farm','livestock','stock','agriculture','finance','settings'],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS access_groups TEXT[] NOT NULL DEFAULT ARRAY['farm','livestock','stock','agriculture','finance','settings'];

INSERT INTO users (username, password_hash, role, full_name, active, access_groups)
VALUES ('DEV', '1ebfc2aea0e77c73ca8f5cbbcb795313e86cab98ce7be0485c895daf716337ac', 'ADMIN', 'Usuario Desenvolvedor', TRUE, ARRAY['farm','livestock','stock','agriculture','finance','settings'])
ON CONFLICT (username) DO NOTHING;

UPDATE users SET access_groups = ARRAY['farm','livestock','stock','agriculture','finance','settings'] WHERE username = 'DEV';

CREATE TABLE IF NOT EXISTS farms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  document VARCHAR(30),
  location VARCHAR(180),
  total_area NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plots (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  area NUMERIC(12,2) DEFAULT 0,
  current_crop VARCHAR(120),
  coordinates TEXT,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paddocks (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  area NUMERIC(12,2) DEFAULT 0,
  grass_type VARCHAR(120),
  status VARCHAR(40) DEFAULT 'ativo',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  role_name VARCHAR(120),
  contact VARCHAR(120),
  status VARCHAR(40) DEFAULT 'ativo',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lots (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  purpose VARCHAR(120),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animals (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  lot_id INTEGER REFERENCES lots(id) ON DELETE SET NULL,
  paddock_id INTEGER REFERENCES paddocks(id) ON DELETE SET NULL,
  ear_tag VARCHAR(80) UNIQUE NOT NULL,
  species VARCHAR(60) DEFAULT 'bovino',
  sex VARCHAR(20),
  breed VARCHAR(80),
  birth_date DATE,
  category VARCHAR(40),
  status VARCHAR(40) DEFAULT 'ativo',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS animal_events (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  event_type VARCHAR(40) NOT NULL,
  event_date DATE NOT NULL,
  weight NUMERIC(10,2),
  vaccine VARCHAR(120),
  notes TEXT,
  lot_id INTEGER REFERENCES lots(id) ON DELETE SET NULL,
  paddock_id INTEGER REFERENCES paddocks(id) ON DELETE SET NULL,
  paddock_future_id INTEGER REFERENCES paddocks(id) ON DELETE SET NULL,
  cost NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_operations (
  id SERIAL PRIMARY KEY,
  plot_id INTEGER REFERENCES plots(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  operation_type VARCHAR(40) NOT NULL,
  operation_date DATE NOT NULL,
  inputs_used TEXT,
  cost NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  minimum_stock NUMERIC(12,2) DEFAULT 0,
  current_stock NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_moves (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
  move_type VARCHAR(20) NOT NULL,
  move_date DATE NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  origin_destiny VARCHAR(160),
  unit_cost NUMERIC(12,2) DEFAULT 0,
  link_type VARCHAR(40),
  link_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_entries (
  id SERIAL PRIMARY KEY,
  entry_type VARCHAR(20) NOT NULL,
  competence_date DATE NOT NULL,
  payment_date DATE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method VARCHAR(60),
  category VARCHAR(120),
  cost_center VARCHAR(60),
  link_type VARCHAR(40),
  link_id INTEGER,
  description TEXT,
  status VARCHAR(20) DEFAULT 'aberto',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payables (
  id SERIAL PRIMARY KEY,
  supplier VARCHAR(120) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'aberto',
  purchase_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receivables (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  due_date DATE NOT NULL,
  receive_date DATE,
  amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'aberto',
  sale_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  supplier VARCHAR(120) NOT NULL,
  purchase_date DATE NOT NULL,
  item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  taxes NUMERIC(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'aberto',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  sale_date DATE NOT NULL,
  sale_type VARCHAR(20) NOT NULL,
  sale_scope VARCHAR(20) DEFAULT 'unidade',
  animal_id INTEGER REFERENCES animals(id) ON DELETE SET NULL,
  lot_id INTEGER REFERENCES lots(id) ON DELETE SET NULL,
  item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
  quantity NUMERIC(12,2),
  unit_price NUMERIC(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'aberto',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animal_events_animal ON animal_events(animal_id);
CREATE INDEX IF NOT EXISTS idx_inventory_moves_item ON inventory_moves(item_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_type ON finance_entries(entry_type);

ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_scope VARCHAR(20) DEFAULT 'unidade';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS lot_id INTEGER REFERENCES lots(id) ON DELETE SET NULL;

UPDATE users SET role = 'ADMIN', active = TRUE, access_groups = ARRAY['farm','livestock','stock','agriculture','finance','settings'] WHERE username = 'DEV';


CREATE TABLE IF NOT EXISTS system_parameters (
  key VARCHAR(80) PRIMARY KEY,
  label VARCHAR(180) NOT NULL,
  value BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO system_parameters (key, label, value, sort_order)
VALUES
  ('works_with_livestock', 'CLIENTE TRABALHA COM PECUÁRIA', TRUE, 1),
  ('works_with_agriculture', 'CLIENTE TRABALHA COM AGRICULTURA', TRUE, 2)
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- MODULO DE MAPA INTERATIVO (KML + Areas + Dados Agronomicos)
-- ============================================================

CREATE TABLE IF NOT EXISTS farm_maps (
  id SERIAL PRIMARY KEY,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  kml_content TEXT,
  image_data TEXT,
  image_type VARCHAR(20) DEFAULT 'kml',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_areas (
  id SERIAL PRIMARY KEY,
  map_id INTEGER NOT NULL REFERENCES farm_maps(id) ON DELETE CASCADE,
  area_key VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  area_type VARCHAR(40) DEFAULT 'pasto',
  polygon_coords TEXT,
  color VARCHAR(20) DEFAULT '#4caf50',
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS map_area_data (
  id SERIAL PRIMARY KEY,
  area_id INTEGER NOT NULL REFERENCES map_areas(id) ON DELETE CASCADE,
  category VARCHAR(40) NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  field_label VARCHAR(180) NOT NULL,
  value TEXT,
  unit VARCHAR(40),
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_areas_map ON map_areas(map_id);
CREATE INDEX IF NOT EXISTS idx_map_area_data_area ON map_area_data(area_id);
CREATE INDEX IF NOT EXISTS idx_map_area_data_category ON map_area_data(category);

-- Migracao v5: paddock_future_id em animal_events
ALTER TABLE animal_events ADD COLUMN IF NOT EXISTS paddock_future_id INTEGER REFERENCES paddocks(id) ON DELETE SET NULL;

-- Migracao v9: vinculo direto entre area do mapa e pasto
ALTER TABLE map_areas ADD COLUMN IF NOT EXISTS paddock_id INTEGER REFERENCES paddocks(id) ON DELETE SET NULL;

-- Migracao v9: validade e preco em itens de estoque
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS expiry_date DATE;
