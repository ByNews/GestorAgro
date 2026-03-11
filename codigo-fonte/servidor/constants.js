const permissionsByRole = {
  ADMIN: {
    cadastro: ['read', 'create', 'update', 'delete'],
    operacoes: ['read', 'create', 'update', 'delete'],
    estoque: ['read', 'create', 'update', 'delete'],
    financeiro: ['read', 'create', 'update', 'delete'],
    relatorios: ['read']
  },
  GERENTE: {
    cadastro: ['read', 'create', 'update'],
    operacoes: ['read', 'create', 'update'],
    estoque: ['read', 'create', 'update'],
    financeiro: ['read', 'create', 'update'],
    relatorios: ['read']
  },
  OPERADOR: {
    cadastro: ['read'],
    operacoes: ['read', 'create', 'update'],
    estoque: ['read', 'create', 'update'],
    financeiro: ['read'],
    relatorios: ['read']
  },
  FINANCEIRO: {
    cadastro: ['read'],
    operacoes: ['read'],
    estoque: ['read'],
    financeiro: ['read', 'create', 'update'],
    relatorios: ['read']
  },
  VISUALIZADOR: {
    cadastro: ['read'],
    operacoes: ['read'],
    estoque: ['read'],
    financeiro: ['read'],
    relatorios: ['read']
  }
};

const resourceModules = {
  users: 'cadastro',
  farms: 'cadastro',
  plots: 'cadastro',
  paddocks: 'cadastro',
  employees: 'cadastro',
  lots: 'cadastro',
  animals: 'cadastro',
  animal_events: 'operacoes',
  crop_operations: 'operacoes',
  inventory_items: 'estoque',
  inventory_moves: 'estoque',
  purchases: 'financeiro',
  sales: 'financeiro',
  finance_entries: 'financeiro',
  payables: 'financeiro',
  receivables: 'financeiro',
  reports: 'relatorios'
};

const resourceGroups = {
  users: 'settings',
  farms: 'settings',
  employees: 'settings',
  plots: 'farm',
  paddocks: 'farm',
  lots: 'livestock',
  animals: 'livestock',
  animal_events: 'livestock',
  sales: 'livestock',
  inventory_items: 'stock',
  inventory_moves: 'stock',
  purchases: 'stock',
  crop_operations: 'agriculture',
  finance_entries: 'finance',
  reports: 'finance',
  payables: 'finance',
  receivables: 'finance'
};

const defaultAccessGroups = ['farm', 'livestock', 'stock', 'agriculture', 'finance', 'settings'];

module.exports = { permissionsByRole, resourceModules, resourceGroups, defaultAccessGroups };
