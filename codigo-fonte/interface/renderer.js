const API_BASE = `${window.location.origin}/api`;
const PAGE_SIZE = 8;
const urlParams = new URLSearchParams(window.location.search);
let currentGroup = 'home';
const ACCESS_GROUPS = [
  { key: 'farm', label: 'Fazenda' },
  { key: 'livestock', label: 'Pecuária' },
  { key: 'stock', label: 'Estoque' },
  { key: 'agriculture', label: 'Agricultura' },
  { key: 'finance', label: 'Financeiro' },
  { key: 'map', label: 'Mapas'},
  { key: 'reports', label: 'Relatórios'}
];

const GROUPS = {
  home: { title: 'Painel', modules: ['home_dashboard'] },
  farm: { title: 'Fazenda', modules: ['farm_livestock', 'plots', 'paddocks'] },
  livestock: { title: 'Pecuária', modules: ['animals', 'lots', 'animal_events', 'sales'] },
  stock: { title: 'Estoque', modules: ['inventory_items', 'inventory_moves', 'purchases'] },
  agriculture: { title: 'Agricultura', modules: ['crop_operations'] },
  finance: { title: 'Financeiro', modules: ['finance_entries', 'payables', 'receivables'] },
  map: { title: 'Mapas', modules: ['mapa_interativo'] },
  reports: { title: 'Relatórios', modules: ['reports'] },
  settings: { title: 'Configurações', modules: ['system_parameters', 'users', 'farms', 'employees'] }
};

const SHORTCUTS = [
  { key: 'home', title: 'Painel', subtitle: 'Visão geral do sistema', iconKey: 'home' },
  { key: 'farm', title: 'Fazenda', subtitle: 'Mapa geral, talhões e pastos', iconKey: 'farm' },
  { key: 'livestock', title: 'Pecuária', subtitle: 'Gado, qualidade do pasto e manejo', iconKey: 'livestock' },
  { key: 'stock', title: 'Estoque', subtitle: 'Itens, movimentações e compras', iconKey: 'stock' },
  { key: 'agriculture', title: 'Agricultura', subtitle: 'Plantio, qualidade da área e lavoura', iconKey: 'agriculture' },
  { key: 'finance', title: 'Financeiro', subtitle: 'Lançamentos e contas', iconKey: 'finance' },
  { key: 'map', title: 'Mapas', subtitle: 'Visualizações integradas dos mapas', iconKey: 'map' },
  { key: 'reports', title: 'Relatórios', subtitle: 'Indicadores separados por área', iconKey: 'reports' }
];

const MODULES = [
  { key: 'home_dashboard', title: 'Atalhos principais', subtitle: 'áreas estratégicas do sistema', view: 'home', group: 'home' },
  { key: 'farm_overview', title: 'Visão geral da Fazenda', subtitle: 'Resumo visual da propriedade', view: 'map', mapType: 'farm', group: 'farm' },
  { key: 'farm_livestock', title: 'Geral', subtitle: 'Resumo geral da fazenda com foco na pecuária', view: 'map', mapType: 'farm_livestock', group: 'farm' },
  { key: 'plots', title: 'Talhões', subtitle: 'áreas agrícolas da fazenda', view: 'crud', module: 'cadastro', group: 'farm' },
  { key: 'paddocks', title: 'Pastos', subtitle: 'Manejo e situação das pastagens', view: 'crud', module: 'cadastro', group: 'farm' },
  { key: 'livestock_map', title: 'Qualidade da Pecuária', subtitle: 'Mapa e legenda da criação', view: 'map', mapType: 'livestock', group: 'livestock' },
  { key: 'animals', title: 'Gado', subtitle: 'Cadastro completo do rebanho', view: 'crud', module: 'cadastro', group: 'livestock' },
  { key: 'lots', title: 'Lotes', subtitle: 'Agrupamentos do rebanho', view: 'crud', module: 'cadastro', group: 'livestock' },
  { key: 'animal_events', title: 'Eventos do gado', subtitle: 'Sanidade, pesagem e movimentações', view: 'crud', module: 'operacoes', group: 'livestock' },
  { key: 'sales', title: 'Vendas', subtitle: 'Saídas de gado e recebimentos', view: 'crud', module: 'financeiro', group: 'livestock' },
  { key: 'inventory_items', title: 'Itens de estoque', subtitle: 'Cadastros e saldos atuais', view: 'crud', module: 'estoque', group: 'stock' },
  { key: 'inventory_moves', title: 'Movimentações de estoque', subtitle: 'Entradas, saídas e ajustes', view: 'crud', module: 'estoque', group: 'stock' },
  { key: 'purchases', title: 'Compras', subtitle: 'Entradas em estoque e contas a pagar', view: 'crud', module: 'financeiro', group: 'stock' },
  { key: 'agriculture_map', title: 'Mapa da Agricultura', subtitle: 'Qualidade das áreas de plantio', view: 'map', mapType: 'agriculture', group: 'agriculture' },
  { key: 'crop_operations', title: 'Plantio e manejo', subtitle: 'Operações agrícolas registradas', view: 'crud', module: 'operacoes', group: 'agriculture' },
  { key: 'finance_entries', title: 'Lançamentos financeiros', subtitle: 'Receitas e despesas da operação', view: 'crud', module: 'financeiro', group: 'finance' },
  { key: 'payables', title: 'Contas a pagar', subtitle: 'Obrigações e vencimentos', view: 'crud', module: 'financeiro', group: 'finance' },
  { key: 'receivables', title: 'Contas a receber', subtitle: 'Recebimentos e clientes', view: 'crud', module: 'financeiro', group: 'finance' },
  { key: 'map_hub', title: 'Mapa', subtitle: 'Escolha o mapa desejado', view: 'maphub', group: 'map' },
  { key: 'mapa_interativo', title: 'Mapa Interativo', subtitle: 'Importe seu mapa do Google Earth e gerencie cada área', view: 'mapa_interativo', group: 'map' },
  { key: 'reports', title: 'Relatórios', subtitle: 'Categorias por área', view: 'reports', module: 'relatorios', group: 'reports' },
  { key: 'system_parameters', title: 'Parâmetros do Sistema', subtitle: 'Ative ou desative módulos do cliente', view: 'settings', module: 'cadastro', group: 'settings' },
  { key: 'users', title: 'Usuários', subtitle: 'Controle de acesso e permissões', view: 'crud', module: 'cadastro', group: 'settings' },
  { key: 'farms', title: 'Fazendas', subtitle: 'Cadastro base da propriedade', view: 'crud', module: 'cadastro', group: 'settings' },
  { key: 'employees', title: 'Funcionários', subtitle: 'Equipe e responsáveis', view: 'crud', module: 'cadastro', group: 'settings' }
];

const LABELS = {
  id: 'ID', username: 'Usuário', role: 'Perfil', full_name: 'Nome completo', active: 'Ativo', access_groups: 'Acessos',
  name: 'Nome', document: 'CPF/CNPJ', location: 'Localização', total_area: 'área total',
  farm_id: 'Fazenda', current_crop: 'Cultura atual', area: 'área', coordinates: 'Coordenadas', description: 'Descrição',
  grass_type: 'Tipo de capim', role_name: 'Função', contact: 'Contato', status: 'Status',
  purpose: 'Finalidade', notes: 'Observações', lot_id: 'Lote', paddock_id: 'Pasto Atual', paddock_future_id: 'Pasto Futuro (movimentação)', ear_tag: 'Brinco', species: 'Espécie',
  sex: 'Sexo', breed: 'Raça', birth_date: 'Nascimento', category: 'Categoria', animal_id: 'Animal',
  entry_mode: 'Tipo de lançamento', ear_tag_prefix: 'Prefixo do brinco',
  event_type: 'Evento', event_date: 'Data', weight: 'Peso', vaccine: 'Vacina', cost: 'Custo', plot_id: 'Talhão', employee_id: 'Responsável',
  operation_type: 'Operação', operation_date: 'Data', inputs_used: 'Insumos usados', item_id: 'Item', unit: 'Unidade',
  minimum_stock: 'Estoque mínimo', current_stock: 'Estoque atual', move_type: 'Movimento', move_date: 'Data', quantity: 'Quantidade',
  origin_destiny: 'Origem/Destino', unit_cost: 'Custo unitário', entry_type: 'Tipo', competence_date: 'Competência', payment_date: 'Pagamento',
  amount: 'Valor', payment_method: 'Forma de pagamento', cost_center: 'Centro de custo', supplier: 'Fornecedor', due_date: 'Vencimento',
  customer_name: 'Cliente', receive_date: 'Recebimento', purchase_date: 'Data da compra', unit_price: 'Valor unitário', taxes: 'Impostos',
  sale_date: 'Data da venda', sale_type: 'Tipo de venda', sale_scope: 'Lançamento', actions: 'Ações'
};

const FORMS = {
  users: [
    { name: 'username', label: 'Usuário', required: true },
    { name: 'password_hash', label: 'Senha (digite a senha simples)' },
    { name: 'role', label: 'Perfil', type: 'select', options: ['ADMIN', 'GERENTE', 'OPERADOR', 'FINANCEIRO', 'VISUALIZADOR'] },
    { name: 'full_name', label: 'Nome completo' },
    { name: 'active', label: 'Ativo', type: 'select', options: [{ value: 'true', label: 'Sim' }, { value: 'false', label: 'Não' }] },
    { name: 'access_groups', label: 'Atalhos liberados', type: 'checkboxlist', options: ACCESS_GROUPS }
  ],
  farms: [
    { name: 'name', label: 'Nome', required: true },
    { name: 'document', label: 'CPF/CNPJ' },
    { name: 'location', label: 'Localização' },
    { name: 'total_area', label: 'área total (ha)', type: 'number' }
  ],
  plots: [
    { name: 'farm_id', label: 'Fazenda', type: 'lookup', source: 'farms' },
    { name: 'name', label: 'Nome', required: true },
    { name: 'area', label: 'área (ha)', type: 'number' },
    { name: 'current_crop', label: 'Cultura atual' },
    { name: 'coordinates', label: 'Coordenadas' },
    { name: 'description', label: 'Descrição', type: 'textarea' }
  ],
  paddocks: [
    { name: 'farm_id', label: 'Fazenda', type: 'lookup', source: 'farms' },
    { name: 'name', label: 'Nome', required: true },
    { name: 'area', label: 'área (ha)', type: 'number' },
    { name: 'grass_type', label: 'Tipo de capim' },
    { name: 'status', label: 'Status', type: 'select', options: ['ativo', 'descanso', 'manutenção'] }
  ],
  employees: [
    { name: 'farm_id', label: 'Fazenda', type: 'lookup', source: 'farms' },
    { name: 'name', label: 'Nome', required: true },
    { name: 'role_name', label: 'Função' },
    { name: 'contact', label: 'Contato' },
    { name: 'status', label: 'Status', type: 'select', options: ['ativo', 'inativo'] }
  ],
  lots: [
    { name: 'farm_id', label: 'Fazenda', type: 'lookup', source: 'farms' },
    { name: 'name', label: 'Nome', required: true },
    { name: 'purpose', label: 'Finalidade' },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  animals: [
    { name: 'entry_mode', label: 'Tipo de lançamento', type: 'select', options: [{ value: 'unidade', label: 'Por unidade' }, { value: 'lote', label: 'Por lote' }], defaultValue: 'unidade' },
    { name: 'farm_id', label: 'Fazenda', type: 'lookup', source: 'farms' },
    { name: 'lot_id', label: 'Lote', type: 'lookup', source: 'lots' },
    { name: 'paddock_id', label: 'Pasto', type: 'lookup', source: 'paddocks' },
    { name: 'ear_tag', label: 'Brinco', required: true },
    { name: 'ear_tag_prefix', label: 'Prefixo do brinco' },
    { name: 'quantity', label: 'Quantidade', type: 'number', defaultValue: 1 },
    { name: 'species', label: 'Espécie', defaultValue: 'bovino' },
    { name: 'sex', label: 'Sexo', type: 'select', options: ['M', 'F'] },
    { name: 'breed', label: 'Raça' },
    { name: 'birth_date', label: 'Nascimento', type: 'date' },
    { name: 'category', label: 'Categoria', type: 'select', options: ['bezerro', 'novilha', 'vaca', 'boi'] },
    { name: 'status', label: 'Status', type: 'select', options: ['ativo', 'vendido', 'morto'] }
  ],
  animal_events: [
    { name: 'animal_id', label: 'Animal', type: 'lookup', source: 'animals', required: true },
    { name: 'event_type', label: 'Evento', type: 'select', options: ['pesagem', 'vacinação', 'vermifugação', 'compra', 'venda', 'morte', 'movimentação'] },
    { name: 'event_date', label: 'Data', type: 'date', required: true },
    { name: 'weight', label: 'Peso', type: 'number' },
    { name: 'vaccine', label: 'Vacina' },
    { name: 'lot_id', label: 'Lote', type: 'lookup', source: 'lots' },
    { name: 'paddock_id', label: 'Pasto Atual', type: 'lookup', source: 'paddocks' },
    { name: 'paddock_future_id', label: 'Pasto Futuro (movimentação)', type: 'lookup', source: 'paddocks' },
    { name: 'cost', label: 'Custo', type: 'number' },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  crop_operations: [
    { name: 'plot_id', label: 'Talhão', type: 'lookup', source: 'plots', required: true },
    { name: 'employee_id', label: 'Responsável', type: 'lookup', source: 'employees' },
    { name: 'operation_type', label: 'Operação', type: 'select', options: ['plantio', 'adubação', 'pulverização', 'colheita'] },
    { name: 'operation_date', label: 'Data', type: 'date', required: true },
    { name: 'inputs_used', label: 'Insumos usados' },
    { name: 'cost', label: 'Custo', type: 'number' },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  inventory_items: [
    { name: 'name', label: 'Nome', required: true },
    { name: 'category', label: 'Categoria', type: 'select', options: ['insumo', 'ração', 'medicamento', 'peça'] },
    { name: 'unit', label: 'Unidade', type: 'select', options: ['kg', 'L', 'un'] },
    { name: 'minimum_stock', label: 'Estoque mínimo', type: 'number' },
    { name: 'current_stock', label: 'Estoque atual', type: 'number' }
  ],
  inventory_moves: [
    { name: 'item_id', label: 'Item', type: 'lookup', source: 'inventory_items', required: true },
    { name: 'move_type', label: 'Movimento', type: 'select', options: ['entrada', 'saida', 'ajuste'] },
    { name: 'move_date', label: 'Data', type: 'date', required: true },
    { name: 'quantity', label: 'Quantidade', type: 'number', required: true },
    { name: 'origin_destiny', label: 'Origem/Destino' },
    { name: 'unit_cost', label: 'Custo unitário', type: 'number' },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  finance_entries: [
    { name: 'entry_type', label: 'Tipo', type: 'select', options: ['receita', 'despesa'] },
    { name: 'competence_date', label: 'Competência', type: 'date', required: true },
    { name: 'payment_date', label: 'Pagamento', type: 'date' },
    { name: 'amount', label: 'Valor', type: 'number', required: true },
    { name: 'payment_method', label: 'Forma de pagamento' },
    { name: 'category', label: 'Categoria' },
    { name: 'cost_center', label: 'Centro de custo', type: 'select', options: ['pecuaria', 'agricultura', 'manutenção', 'administrativo'] },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'status', label: 'Status', type: 'select', options: ['aberto', 'pago', 'atrasado'] }
  ],
  payables: [
    { name: 'supplier', label: 'Fornecedor', required: true },
    { name: 'due_date', label: 'Vencimento', type: 'date', required: true },
    { name: 'payment_date', label: 'Pagamento', type: 'date' },
    { name: 'amount', label: 'Valor', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['aberto', 'pago', 'atrasado'] },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  receivables: [
    { name: 'customer_name', label: 'Cliente', required: true },
    { name: 'due_date', label: 'Vencimento', type: 'date', required: true },
    { name: 'receive_date', label: 'Recebimento', type: 'date' },
    { name: 'amount', label: 'Valor', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['aberto', 'pago', 'atrasado'] },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  purchases: [
    { name: 'supplier', label: 'Fornecedor', required: true },
    { name: 'purchase_date', label: 'Data da compra', type: 'date', required: true },
    { name: 'item_id', label: 'Item', type: 'lookup', source: 'inventory_items' },
    { name: 'quantity', label: 'Quantidade', type: 'number', required: true },
    { name: 'unit_price', label: 'Valor unitário', type: 'number', required: true },
    { name: 'taxes', label: 'Impostos', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: ['aberto', 'pago'] },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ],
  sales: [
    { name: 'customer_name', label: 'Cliente', required: true },
    { name: 'sale_date', label: 'Data da venda', type: 'date', required: true },
    { name: 'sale_type', label: 'Tipo de venda', type: 'select', options: [{ value: 'animal', label: 'Animal' }, { value: 'produto', label: 'Produto' }] },
    { name: 'sale_scope', label: 'Tipo de lançamento', type: 'select', options: [{ value: 'unidade', label: 'Por unidade' }, { value: 'lote', label: 'Por lote' }], defaultValue: 'unidade' },
    { name: 'animal_id', label: 'Animal', type: 'lookup', source: 'animals' },
    { name: 'lot_id', label: 'Lote', type: 'lookup', source: 'lots' },
    { name: 'item_id', label: 'Item', type: 'lookup', source: 'inventory_items' },
    { name: 'quantity', label: 'Quantidade', type: 'number' },
    { name: 'unit_price', label: 'Valor unitário', type: 'number', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['aberto', 'pago'] },
    { name: 'notes', label: 'Observações', type: 'textarea' }
  ]
};

const COLUMNS = {
  users: ['username', 'full_name', 'role', 'active', 'access_groups'],
  farms: ['name', 'document', 'location', 'total_area'],
  plots: ['name', 'farm_id', 'area', 'current_crop', 'coordinates'],
  paddocks: ['name', 'farm_id', 'area', 'grass_type', 'status'],
  employees: ['name', 'farm_id', 'role_name', 'contact', 'status'],
  lots: ['name', 'farm_id', 'purpose'],
  animals: ['ear_tag', 'farm_id', 'lot_id', 'paddock_id', 'breed', 'category', 'status'],
  animal_events: ['animal_id', 'event_type', 'event_date', 'weight', 'cost'],
  crop_operations: ['plot_id', 'employee_id', 'operation_type', 'operation_date', 'cost'],
  inventory_items: ['name', 'category', 'unit', 'minimum_stock', 'current_stock'],
  inventory_moves: ['item_id', 'move_type', 'move_date', 'quantity', 'origin_destiny'],
  finance_entries: ['entry_type', 'competence_date', 'amount', 'payment_method', 'cost_center', 'status'],
  payables: ['supplier', 'due_date', 'amount', 'status'],
  receivables: ['customer_name', 'due_date', 'amount', 'status'],
  purchases: ['supplier', 'purchase_date', 'item_id', 'quantity', 'unit_price', 'status'],
  sales: ['customer_name', 'sale_date', 'sale_type', 'sale_scope', 'animal_id', 'lot_id', 'quantity', 'unit_price', 'status']
};

const SPECIAL_ENDPOINTS = { purchases: '/purchases/register', sales: '/sales/register', inventory_moves: '/inventory_moves/register' };
const QUALITY_OPTIONS = ['ruim', 'moderado', 'bom'];
const INMET_REPORT_MODES = ['resumo', 'alertas', 'periodos'];

const state = {
  token: localStorage.getItem('farm_token') || '',
  user: JSON.parse(localStorage.getItem('farm_user') || 'null'),
  permissions: JSON.parse(localStorage.getItem('farm_permissions') || '{}'),
  currentModule: GROUPS[currentGroup]?.modules[0] || 'home_dashboard',
  currentRows: [],
  lookups: {},
  quality: JSON.parse(localStorage.getItem('gestor_quality') || '{}'),
  systemParameters: JSON.parse(localStorage.getItem('gestor_system_parameters') || '{"works_with_livestock":true,"works_with_agriculture":true}'),
  lastUsername: localStorage.getItem('gestor_last_username') || '',
  mapViewport: JSON.parse(localStorage.getItem('gestor_map_viewport') || '{}'),
  mapMetricSelection: JSON.parse(localStorage.getItem('gestor_map_metric') || '{}'),
  currentMapType: localStorage.getItem('gestor_current_map_type') || 'farm',
  currentReportTab: localStorage.getItem('gestor_current_report_tab') || 'financeiro',
  inmetUf: (localStorage.getItem('gestor_inmet_uf') || 'TO').toUpperCase(),
  inmetCity: localStorage.getItem('gestor_inmet_city') || 'Araguaina',
  inmetReportMode: localStorage.getItem('gestor_inmet_report_mode') || 'resumo',
  inmetPeriodStart: localStorage.getItem('gestor_inmet_period_start') || today(),
  inmetPeriodEnd: localStorage.getItem('gestor_inmet_period_end') || today()
};

const el = {
  loginScreen: document.getElementById('login-screen'),
  appScreen: document.getElementById('app-screen'),
  loginForm: document.getElementById('login-form'),
  loginError: document.getElementById('login-error'),
  shortcutBar: document.getElementById('shortcut-bar'),
  homeCharts: document.getElementById('home-charts'),
  quickLinks: document.getElementById('quick-links'),
  groupTitle: { textContent: '' }, // elemento removido do HTML (Alt 16)
  userBadge: document.getElementById('user-badge'),
  userMenuBtn: document.getElementById('user-menu-btn'),
  userDropdown: document.getElementById('user-dropdown'),
  brandBtn: document.getElementById('brand-btn'),
  homeBtn: document.getElementById('home-btn'),
  navList: document.getElementById('nav-list'),
  dashboardCards: document.getElementById('dashboard-cards'),
  homeSection: document.getElementById('home-section'),
  homeAlerts: document.getElementById('home-alerts'),
  homeHero: document.getElementById('home-hero'),
  crudSection: document.getElementById('crud-section'),
  reportsSection: document.getElementById('reports-section'),
  settingsSection: document.getElementById('settings-section'),
  mapSection: document.getElementById('map-section'),
  pageTitle: document.getElementById('page-title'),
  pageSubtitle: document.getElementById('page-subtitle'),
  crudHighlight: document.getElementById('crud-highlight'),
  mapTitle: document.getElementById('map-title'),
  mapSubtitle: document.getElementById('map-subtitle'),
  mapContent: document.getElementById('map-content'),
  settingsContent: document.getElementById('settings-content'),
  tableHead: document.getElementById('table-head'),
  tableBody: document.getElementById('table-body'),
  tableTitle: document.getElementById('table-title'),
  tableMeta: document.getElementById('table-meta'),
  newRecordBtn: document.getElementById('new-record-btn'),
  searchInput: document.getElementById('search-input'),
  refreshBtn: document.getElementById('refresh-btn'),
  switchUserBtn: document.getElementById('switch-user-btn'),
  manageUsersBtn: document.getElementById('manage-users-btn'),
  settingsBtn: document.getElementById('settings-btn'),
  appFarmName: document.getElementById('app-farm-name'),
  mapaRoot: document.getElementById('mapa-interativo-root'),
  mainWorkspace: document.getElementById('main-workspace'),
  mainContent: document.getElementById('main-content'),
  reportCards: document.getElementById('report-cards'),
  cashflowList: document.getElementById('cashflow-list'),
  costCenterList: document.getElementById('cost-center-list'),
  reportStartLabel: document.getElementById('report-start-label'),
  reportEndLabel: document.getElementById('report-end-label'),
  reportStart: document.getElementById('report-start'),
  reportEnd: document.getElementById('report-end'),
  inmetUfLabel: document.getElementById('inmet-uf-label'),
  inmetCityLabel: document.getElementById('inmet-city-label'),
  inmetReportModeLabel: document.getElementById('inmet-report-mode-label'),
  inmetUf: document.getElementById('inmet-uf'),
  inmetCity: document.getElementById('inmet-city'),
  inmetReportMode: document.getElementById('inmet-report-mode'),
  inmetPeriodStartLabel: document.getElementById('inmet-period-start-label'),
  inmetPeriodEndLabel: document.getElementById('inmet-period-end-label'),
  inmetPeriodStart: document.getElementById('inmet-period-start'),
  inmetPeriodEnd: document.getElementById('inmet-period-end'),
  inmetPeriodQuick: document.getElementById('inmet-period-quick'),
  inmetQuick7: document.getElementById('inmet-quick-7'),
  inmetQuick15: document.getElementById('inmet-quick-15'),
  loadReportsBtn: document.getElementById('load-reports-btn'),
  reportsLeftTitle: document.getElementById('reports-left-title'),
  reportsRightTitle: document.getElementById('reports-right-title'),
  modalOverlay: document.getElementById('modal-overlay'),
  workspace: document.querySelector('.workspace')
};

// Scroll horizontal nos atalhos com a roda do mouse (quando o cursor estiver sobre a barra)

function escapeHtml(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
function today() { return new Date().toISOString().slice(0, 10); }
function money(value) { return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function fmt(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.map((k) => ACCESS_GROUPS.find((g) => g.key === k)?.label || k).join(', ');
  if (typeof value === 'number') return value.toLocaleString('pt-BR');
  return String(value);
}
function dateValue(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
function formatShortDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}
function currentModuleConfig() { return MODULES.find((m) => m.key === state.currentModule) || MODULES[0]; }
function groupEnabled(group) {
  if (group === 'livestock') return state.systemParameters.works_with_livestock !== false;
  if (group === 'agriculture') return state.systemParameters.works_with_agriculture !== false;
  return true;
}
function modulesForCurrentGroup() { return MODULES.filter((m) => (GROUPS[currentGroup]?.modules || []).includes(m.key)).filter((m) => groupEnabled(m.group)); }
function visibleShortcuts() { return SHORTCUTS.filter((item) => groupEnabled(item.key)).filter((item) => item.key === 'home' || !state.user || hasGroupAccess(item.key)); }
function labelOf(column) { return LABELS[column] || column; }
function hasModuleAccess(moduleName) { return !moduleName || !!state.permissions[moduleName]; }
function canAction(moduleName, action) { return (state.permissions[moduleName] || []).includes(action); }
function hasGroupAccess(group) {
  if (state.user?.role === 'ADMIN') return true;
  const userGroups = Array.isArray(state.user?.access_groups) ? state.user.access_groups : [];
  if (group === 'map') return ['farm', 'livestock', 'agriculture'].some((key) => userGroups.includes(key));
  if (group === 'reports') return ['finance', 'livestock', 'agriculture', 'stock'].some((key) => userGroups.includes(key));
  if (group === 'map') return userGroups.includes('map');
  if (group === 'reports') return userGroups.includes('reports');
  return userGroups.includes(group);
}
function updateShellTitle() {
  el.groupTitle.textContent = GROUPS[currentGroup]?.title || 'Painel';
  document.title = `${GROUPS[currentGroup]?.title || 'Gestor Agro'} · Gestor Agro`;
}
async function setGroup(group) {
  if (!GROUPS[group]) group = 'home';
  currentGroup = group;
  state.currentModule = GROUPS[currentGroup]?.modules?.[0] || 'home_dashboard';
  updateShellTitle();
  renderShortcutBar();
  renderNav();
  await switchModule(state.currentModule);
}
function setSession(token, user, permissions, systemParameters) {
  state.token = token; state.user = user; state.permissions = permissions || {};
  if (systemParameters) state.systemParameters = { ...state.systemParameters, ...systemParameters };
  localStorage.setItem('farm_token', token);
  localStorage.setItem('farm_user', JSON.stringify(user));
  localStorage.setItem('farm_permissions', JSON.stringify(permissions || {}));
  localStorage.setItem('gestor_system_parameters', JSON.stringify(state.systemParameters));
  if (user?.username) localStorage.setItem('gestor_last_username', user.username);
}
function clearSession() {
  state.token = ''; state.user = null; state.permissions = {};
  localStorage.removeItem('farm_token'); localStorage.removeItem('farm_user'); localStorage.removeItem('farm_permissions');
}
function storeQuality() { localStorage.setItem('gestor_quality', JSON.stringify(state.quality)); }
function storeMapViewport() { localStorage.setItem('gestor_map_viewport', JSON.stringify(state.mapViewport)); }
function storeMapMetricSelection() { localStorage.setItem('gestor_map_metric', JSON.stringify(state.mapMetricSelection)); }
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Falha nas requisições.');
  return data;
}
async function loadLookups() { state.lookups = await api('/lookups'); updateFarmName(); }

async function loadLookups() { state.lookups = await api('/lookups'); updateFarmName(); }

function updateFarmName() {
  if (!el.appFarmName) return;
  const farms = state.lookups?.farms || [];
  if (farms.length > 0) {
    el.appFarmName.textContent = farms[0].name;
    el.appFarmName.style.display = '';
  } else {
    el.appFarmName.textContent = '';
    el.appFarmName.style.display = 'none';
  }
  updateBrandDropdown();
}

async function updateBrandDropdown() {
  try {
    // Dados da fazenda
    const farms = state.lookups?.farms || [];
    const farm = farms[0] || {};
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };

    setText('drop-farm-name', farm.name);
    setText('drop-location', farm.location);
    setText('drop-area', farm.total_area ? `${Number(farm.total_area).toLocaleString('pt-BR')} ha` : '—');

    // Usuário logado
    setText('drop-username', state.user?.name || state.user?.username || '—');

    // Contagens dos lookups
    setText('drop-paddocks', (state.lookups?.paddocks || []).length || '0');
    setText('drop-plots',    (state.lookups?.plots    || []).length || '0');
    setText('drop-employees',(state.lookups?.employees|| []).length + ' pessoas' || '—');

    // Animais e itens do dashboard (já carregados no summary)
    if (state.lastSummary) {
      setText('drop-animals', state.lastSummary.animals ?? '—');
      setText('drop-items',   state.lastSummary.totalItems ?? '—');
    } else {
      // Busca rápida se ainda não tiver summary
      try {
        const summary = await api('/reports/dashboard');
        state.lastSummary = summary;
        setText('drop-animals', summary.animals ?? '—');
        // Conta itens totais
        const inv = await api('/inventory_items?limit=1');
        setText('drop-items', inv.total ?? '—');
      } catch (_) {}
    }
  } catch (_) {}
}

function normalizeInmetUf(value) {
  const uf = String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  return uf || 'TO';
}

function addDaysIso(baseIso, days) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(String(baseIso || '')) ? String(baseIso) : today();
  const dt = new Date(`${base}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return today();
  dt.setDate(dt.getDate() + Number(days || 0));
  return dt.toISOString().slice(0, 10);
}

function normalizeIsoDate(value, fallback = today()) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return fallback;
  const dt = new Date(`${text}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? fallback : text;
}

function inmetTempBand(period) {
  const min = Number.isFinite(period?.tempMin) ? `${period.tempMin}C` : '-';
  const max = Number.isFinite(period?.tempMax) ? `${period.tempMax}C` : '-';
  return `${min} / ${max}`;
}

function inmetPeriodRangeFromInputs() {
  const fallbackStart = state.inmetPeriodStart || today();
  const start = normalizeIsoDate(el.inmetPeriodStart?.value || fallbackStart, fallbackStart);
  const fallbackEnd = state.inmetPeriodEnd || addDaysIso(start, 6);
  let end = normalizeIsoDate(el.inmetPeriodEnd?.value || fallbackEnd, fallbackEnd);
  if (end < start) end = start;
  state.inmetPeriodStart = start;
  state.inmetPeriodEnd = end;
  localStorage.setItem('gestor_inmet_period_start', start);
  localStorage.setItem('gestor_inmet_period_end', end);
  if (el.inmetPeriodStart) el.inmetPeriodStart.value = start;
  if (el.inmetPeriodEnd) el.inmetPeriodEnd.value = end;
  return { start, end };
}

function applyInmetQuickRange(days, autoReload = true) {
  const safeDays = Number(days) === 15 ? 15 : 7;
  const start = today();
  const end = addDaysIso(start, safeDays - 1);
  state.inmetPeriodStart = start;
  state.inmetPeriodEnd = end;
  localStorage.setItem('gestor_inmet_period_start', start);
  localStorage.setItem('gestor_inmet_period_end', end);
  if (el.inmetPeriodStart) el.inmetPeriodStart.value = start;
  if (el.inmetPeriodEnd) el.inmetPeriodEnd.value = end;
  if (autoReload && state.currentReportTab === 'inmet') {
    loadReports({ forceInmet: true });
  }
}

function inmetSeverityClass(level) {
  if (level === 'critical') return 'critical';
  if (level === 'warning') return 'warning';
  return 'info';
}

function syncReportsFilterVisibility(activeTab) {
  const isInmet = activeTab === 'inmet';
  const isInmetPeriods = isInmet && state.inmetReportMode === 'periodos';
  [el.inmetUfLabel, el.inmetCityLabel, el.inmetReportModeLabel, el.inmetUf, el.inmetCity, el.inmetReportMode]
    .forEach((node) => node && node.classList.toggle('hidden', !isInmet));
  [el.reportStartLabel, el.reportEndLabel, el.reportStart, el.reportEnd]
    .forEach((node) => node && node.classList.toggle('hidden', isInmet));
  [el.inmetPeriodStartLabel, el.inmetPeriodEndLabel, el.inmetPeriodStart, el.inmetPeriodEnd, el.inmetPeriodQuick]
    .forEach((node) => node && node.classList.toggle('hidden', !isInmetPeriods));
  if (isInmetPeriods) inmetPeriodRangeFromInputs();
}

async function loadInmetReport(force = false, range = null) {
  const uf = normalizeInmetUf(el.inmetUf?.value || state.inmetUf);
  const city = String(el.inmetCity?.value || state.inmetCity || '').trim() || 'Araguaina';
  state.inmetUf = uf;
  state.inmetCity = city;
  localStorage.setItem('gestor_inmet_uf', state.inmetUf);
  localStorage.setItem('gestor_inmet_city', state.inmetCity);

  const params = [
    `uf=${encodeURIComponent(state.inmetUf)}`,
    `city=${encodeURIComponent(state.inmetCity)}`
  ];
  if (force) params.push('force=true');
  if (range?.start) params.push(`start=${encodeURIComponent(range.start)}`);
  if (range?.end) params.push(`end=${encodeURIComponent(range.end)}`);

  return api(`/reports/inmet?${params.join('&')}`);
}

function renderInmetSummaryCards(report) {
  return (report?.cards || []).map((card) => `
    <div class="card summary-card inmet-card ${inmetSeverityClass(card.severity)}">
      <div class="kicker">${escapeHtml(card.title || '-')}</div>
      <div class="value">${escapeHtml(card.value || '-')}</div>
      <div class="inmet-home-meta">${escapeHtml(card.detail || '')}</div>
    </div>`).join('');
}

function renderInmetAlertItem(alert) {
  return `<div class="list-item inmet-list-item inmet-alert-item ${inmetSeverityClass(alert?.severity)}"><strong>${escapeHtml(alert?.title || '-')}</strong><div class="inmet-line">${escapeHtml(alert?.description || '')}</div></div>`;
}

function renderInmetPeriodItem(period) {
  return `<div class="list-item inmet-list-item"><strong>${escapeHtml(period?.label || '-')}</strong><div class="inmet-line">${escapeHtml(period?.summary || 'Sem resumo')}</div><div class="inmet-temp">${escapeHtml(inmetTempBand(period))}</div></div>`;
}

function renderInmetAlertsPanel(report) {
  const alerts = report?.alerts || [];
  if (!alerts.length) {
    return '<div class="panel report-placeholder inmet-full"><div class="panel-title">Alertas agro INMET</div><div class="panel-subtitle">Sem alertas para o periodo consultado.</div></div>';
  }
  return `<div class="panel report-placeholder inmet-full"><div class="panel-title">Alertas agro INMET</div><div class="list-compact">${alerts.map(renderInmetAlertItem).join('')}</div></div>`;
}

function renderInmetPeriodsPanel(report) {
  const allPeriods = report?.periods || [];
  if (!allPeriods.length) {
    return '<div class="panel report-placeholder inmet-full"><div class="panel-title">Periodos previstos INMET</div><div class="panel-subtitle">Sem periodos disponiveis para o intervalo informado.</div></div>';
  }
  // Show only first 4 in card (no scroll), Ver Dados opens full modal
  const preview = allPeriods.slice(0, 4);
  const previewHtml = preview.map(renderInmetPeriodItem).join('');
  const allHtml = allPeriods.map(renderInmetPeriodItem).join('');
  // Store full data for modal access
  window._inmetPeriodsAll = allHtml;
  return `<div class="panel report-placeholder inmet-full"><div class="panel-title" style="display:flex;align-items:center;justify-content:space-between;gap:12px;">Proximas janelas climaticas (INMET)<button class="ghost compact" onclick="openInmetDataModal()" style="font-size:11px;padding:4px 10px;flex-shrink:0">Ver Dados</button></div><div class="list-compact">${previewHtml}</div></div>`;
}

function openInmetDataModal() {
  const html = window._inmetPeriodsAll || '';
  if (!html) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px';
  const box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:20px;width:660px;max-width:96vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 30px 60px rgba(0,0,0,.25);overflow:hidden';
  const header = document.createElement('div');
  header.style.cssText = 'padding:18px 24px;border-bottom:1px solid #d6e8db;display:flex;justify-content:space-between;align-items:center;flex-shrink:0';
  const title = document.createElement('h2');
  title.style.cssText = 'font-size:18px;font-weight:800;color:#0f5132;margin:0';
  title.textContent = 'Períodos Previstos INMET';
  const closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'background:none;border:none;font-size:20px;cursor:pointer;color:#5f7a69;line-height:1';
  closeBtn.textContent = '✕';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  header.appendChild(title);
  header.appendChild(closeBtn);
  const body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;padding:16px 24px';
  body.innerHTML = '<div class="list-compact">' + html + '</div>';
  box.appendChild(header);
  box.appendChild(body);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) document.body.removeChild(overlay); };
}


function shortcutIcon(key) {
  const icons = {
    home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 10.5V21h13V10.5"/><path d="M10 21v-6h4v6"/></svg>`,
    farm: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M8 20v-4.5h3V20"/><path d="M13.5 11.5h2.5"/><path d="M13.5 14.5h2.5"/></svg>`,
    livestock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8.5 4.5 6 3 8.5l2.5 2"/><path d="M17 8.5 19.5 6 21 8.5l-2.5 2"/><path d="M8 9.5c0-2.2 1.8-4 4-4s4 1.8 4 4V14c0 2.8-1.8 5-4 5s-4-2.2-4-5Z"/><path d="M10 13h.01"/><path d="M14 13h.01"/><path d="M10 16c1 .8 3 .8 4 0"/><path d="M9 6.5 7.5 4"/><path d="M15 6.5 16.5 4"/></svg>`,
    stock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10h18"/><path d="M5 10V6l3-2h8l3 2v4"/><path d="M4 10v10h16V10"/><path d="M8 14h8"/><path d="M8 17h5"/></svg>`,
    agriculture: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V11"/><path d="M12 11c0-4 2.5-6 6-6 0 4-2.5 6-6 6Z"/><path d="M12 14c0-3.2-2-5-5-5 0 3.2 2 5 5 5Z"/></svg>`,
    finance: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"/><path d="M6 7V5h12v2"/><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M8 13h8"/><path d="M8 16h5"/></svg>`,
    map: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5 9 4l6 2.5 6-2.5v13L15 19.5 9 17 3 19.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/></svg>`,
    reports: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V8"/><path d="M10 20V4"/><path d="M15 20v-9"/><path d="M20 20v-5"/></svg>`,
    settings: `<img src="../imagens/engrenagem_sem_fundo.png" class="tab-icon-img config-icon-img" alt="Configurações">`
  };
  return icons[key] || icons.home;
}


function permissionModal() {
  showModal({
    title: 'Acesso restrito',
    small: true,
    body: `<div class="permission-box"><div class="permission-icon">!</div><div><strong>VOCÊ NÃO TEM PERMISSÃO PARA ACESSAR ESSA ÁREA</strong></div></div>`,
    cancelLabel: 'Fechar'
  });
}

function showModal({ title, body, small = false, onSubmit, submitLabel = 'Salvar', cancelLabel = 'Cancelar' }) {
  el.modalOverlay.classList.remove('hidden');
  el.modalOverlay.innerHTML = `
    <div class="modal-window ${small ? 'small' : ''}">
      <div class="modal-header"><h2>${escapeHtml(title)}</h2></div>
      <form id="modal-form">
        <div class="modal-body">${body}${onSubmit ? '<div id="modal-error" class="error-text"></div>' : ''}</div>
        <div class="form-actions">
          <button type="button" class="ghost" id="modal-cancel">${cancelLabel}</button>
          ${onSubmit ? `<button type="submit" class="primary">${submitLabel}</button>` : ''}
        </div>
      </form>
    </div>`;
  document.getElementById('modal-cancel').onclick = hideModal;
  if (onSubmit) {
    document.getElementById('modal-form').onsubmit = async (event) => {
      event.preventDefault();
      try {
        await onSubmit(new FormData(event.target));
      } catch (error) {
        document.getElementById('modal-error').textContent = error.message;
      }
    };
  }
}
function hideModal() { el.modalOverlay.classList.add('hidden'); el.modalOverlay.innerHTML = ''; }

function renderShortcutBar() {
  el.shortcutBar.classList.remove('hidden');
  el.shortcutBar.innerHTML = visibleShortcuts().map((item) => `
    <button class="shortcut-btn top-tab ${currentGroup === item.key ? 'active-tab' : ''}" data-shortcut="${item.key}" aria-label="${item.title}">
      <span class="tab-icon">${shortcutIcon(item.iconKey || item.key)}</span>
      <span class="tab-label">${item.title}</span>
    </button>`).join('');
  el.shortcutBar.querySelectorAll('[data-shortcut]').forEach((btn) => btn.onclick = () => openShortcut(btn.dataset.shortcut));
}

function homeAlertTone(type, count) {
  if (type === 'resultado') return count < 0 ? 'critical' : 'ok';
  if (type === 'inmet') return count > 1 ? 'critical' : count > 0 ? 'warning' : 'ok';
  return count > 0 ? 'warning' : 'ok';
}

function homeAlertText(type, count) {
  if (type === 'estoque') return count > 0 ? `${count} item(ns) com estoque em alerta` : 'Estoque sem alertas criticos';
  if (type === 'payables') return count > 0 ? `${count > 1 ? 'Contas' : 'Conta'} em aberto exigem atencao` : 'Contas a pagar controladas';
  if (type === 'inmet') return count > 0 ? `${count} alerta(s) climaticos ativos` : 'Sem alertas climaticos relevantes';
  return count < 0 ? 'Resultado do periodo esta negativo' : 'Resultado do periodo esta saudavel';
}

function renderShortcutGrid(summary = {}, inmetReport = null) {
  if (!el.quickLinks || !el.homeAlerts || !el.homeHero) return;

  const lowStock = Number(summary.lowStockItems || 0);
  const openPayables = Number(summary.openPayables || 0);
  const result = Number(summary.totalRevenue || 0) - Number(summary.totalExpense || 0);
  const inmetAlerts = (inmetReport?.alerts || []).filter((a) => a.severity !== 'info').length;
  const totalArea = (state.lookups?.plots || []).reduce((sum, plot) => sum + Number(plot.area || 0), 0);
  const activeAnimals = Number(summary.animals || 0);
  const currentDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const alerts = [
    { type: 'estoque', icon: 'Estoque', text: homeAlertText('estoque', lowStock), action: 'Ver estoque', onclick: "openShortcut('stock')" },
    { type: 'payables', icon: 'Financeiro', text: homeAlertText('payables', openPayables), action: 'Abrir financeiro', onclick: 'window._goFinance && window._goFinance()' },
    { type: 'inmet', icon: 'Clima', text: homeAlertText('inmet', inmetAlerts), action: 'Ver relatorios', onclick: "openShortcut('reports')" },
    { type: 'resultado', icon: 'Resultado', text: homeAlertText('resultado', result), action: 'Ver painel', onclick: "openShortcut('home')" }
  ];

  el.homeAlerts.innerHTML = alerts.map((item) => `
    <button class="home-alert-chip ${homeAlertTone(item.type, item.type === 'resultado' ? result : item.type === 'inmet' ? inmetAlerts : item.type === 'payables' ? openPayables : lowStock)}" type="button" onclick="${item.onclick}">
      <span class="home-alert-chip-label">${item.icon}</span>
      <span class="home-alert-chip-text">${item.text}</span>
      <span class="home-alert-chip-action">${item.action}</span>
    </button>`).join('');

  el.homeHero.innerHTML = `
    <article class="hero-card modern-hero home-overview-card">
      <div class="home-overview-main">
        <div class="home-overview-kicker">Painel da Fazenda</div>
        <h1>Visao geral da operacao para agir rapido no que importa hoje.</h1>
        <p>Resumo consolidado de financeiro, rebanho, area cultivada e clima para orientar as proximas decisoes da rotina.</p>
        <div class="home-overview-meta">
          <span class="home-overview-meta-pill">Atualizado em ${escapeHtml(currentDate)}</span>
          <span class="home-overview-meta-pill">${escapeHtml(state.inmetCity)}/${escapeHtml(state.inmetUf)}</span>
        </div>
      </div>
      <div class="home-overview-side">
        <div class="home-overview-result ${result >= 0 ? 'positive' : 'negative'}">
          <div class="home-overview-result-label">Resultado do periodo</div>
          <div class="home-overview-result-value">${money(result)}</div>
          <div class="home-overview-result-sub">${result >= 0 ? 'operacao em equilibrio' : 'despesas acima das receitas'}</div>
        </div>
        <div class="home-overview-stats">
          <div class="home-overview-stat">
            <span class="home-overview-stat-value">${activeAnimals}</span>
            <span class="home-overview-stat-label">Animais ativos</span>
          </div>
          <div class="home-overview-stat">
            <span class="home-overview-stat-value">${totalArea > 0 ? `${totalArea.toLocaleString('pt-BR')} ha` : '-'}</span>
            <span class="home-overview-stat-label">Area cultivada</span>
          </div>
          <div class="home-overview-stat">
            <span class="home-overview-stat-value">${lowStock}</span>
            <span class="home-overview-stat-label">Alertas de estoque</span>
          </div>
        </div>
      </div>
    </article>`;

  const actionCards = [
    {
      title: 'Financeiro',
      desc: openPayables > 0 ? `${money(openPayables)} ainda exigem pagamento.` : 'Contas controladas e prontas para acompanhamento.',
      meta: result >= 0 ? 'Resultado positivo' : 'Resultado pressionado',
      onclick: 'window._goFinance && window._goFinance()'
    },
    {
      title: 'Operacao Rural',
      desc: `${activeAnimals} animais ativos e ${totalArea > 0 ? `${totalArea.toLocaleString('pt-BR')} ha` : 'nenhuma area cadastrada'} monitorados.`,
      meta: 'Pecuaria e agricultura',
      onclick: "openShortcut('farm')"
    },
    {
      title: 'Clima e Alertas',
      desc: inmetAlerts > 0 ? `${inmetAlerts} alerta(s) climaticos pedem atencao.` : 'Sem alertas climaticos relevantes no momento.',
      meta: `${escapeHtml(state.inmetCity)}/${escapeHtml(state.inmetUf)}`,
      onclick: "openShortcut('reports')"
    }
  ];

  el.quickLinks.innerHTML = actionCards.map((item) => `
    <button class="quick-link-card home-action-card" type="button" onclick="${item.onclick}">
      <div class="home-action-top">
        <strong>${item.title}</strong>
        <span class="home-action-meta">${item.meta}</span>
      </div>
      <span>${item.desc}</span>
      <span class="home-action-cta">Abrir area</span>
    </button>`).join('');
}

async function openShortcut(group) {
  if (!groupEnabled(group)) return;
  if (group === 'settings') return openSettingsAuth();
  if (group !== 'home' && !hasGroupAccess(group)) return permissionModal();
  await setGroup(group);
}

function openSettingsAuth(targetModule = null) {
  showModal({
    title: 'Acesso a Configurações',
    small: true,
    submitLabel: 'Entrar',
    body: `
      <label>Usuário</label>
      <input name="username" type="text" required />
      <label>Senha</label>
      <input name="password" type="password" required />`,
    onSubmit: async (formData) => {
      const username = String(formData.get('username') || '').trim();
      const password = String(formData.get('password') || '');
      try {
        const result = await api('/auth/settings-verify', { method: 'POST', body: JSON.stringify({ username, password }) });
        hideModal();
        if (result?.user?.role === 'ADMIN' || (Array.isArray(result?.user?.access_groups) && result.user.access_groups.includes('settings'))) {
          await setGroup('settings');
          if (targetModule && GROUPS.settings.modules.includes(targetModule)) {
            state.currentModule = targetModule;
            renderNav();
            await switchModule(targetModule);
          }
          return;
        }
        permissionModal();
      } catch (_error) {
        hideModal();
        permissionModal();
      }
    }
  });
}

function switchUser() {
  clearSession();
  location.reload();
}

function openManageUsersAuth() {
  openSettingsAuth('users');
}

function renderNav() {
  const available = modulesForCurrentGroup().filter((mod) => !mod.module || hasModuleAccess(mod.module));
  if (!available.find((mod) => mod.key === state.currentModule)) {
    state.currentModule = available[0]?.key || 'home_dashboard';
  }
  const hideSidebar = ['home', 'map', 'reports'].includes(currentGroup);
  document.getElementById('module-sidebar').classList.toggle('hidden', hideSidebar);
  el.workspace.classList.toggle('home-mode', hideSidebar);
  el.navList.innerHTML = available.map((mod) => `<button class="nav-btn ${state.currentModule === mod.key ? 'active' : ''}" data-module="${mod.key}">${mod.title}</button>`).join('');
  el.navList.querySelectorAll('[data-module]').forEach((btn) => btn.onclick = () => switchModule(btn.dataset.module));
}

function renderCrudHighlight(module) {
  if (!el.crudHighlight) return;
  el.crudHighlight.innerHTML = '';
  el.crudHighlight.className = '';
}

function switchView(view) {
  [el.homeSection, el.crudSection, el.reportsSection, el.settingsSection, el.mapSection].forEach((section) => {
    section.classList.remove('active');
    section.style.display = 'none';
  });
  // Mostrar/esconder o root dedicado do mapa interativo
  if (el.mapaRoot) el.mapaRoot.style.display = 'none';
  if (el.mainContent) el.mainContent.style.display = '';
  if (view === 'home') { el.homeSection.classList.add('active'); el.homeSection.style.display = ''; }
  if (view === 'crud') { el.crudSection.classList.add('active'); el.crudSection.style.display = ''; }
  if (view === 'reports') { el.reportsSection.classList.add('active'); el.reportsSection.style.display = ''; }
  if (view === 'settings') { el.settingsSection.classList.add('active'); el.settingsSection.style.display = ''; }
  if (view === 'map') { el.mapSection.classList.add('active'); el.mapSection.style.display = 'flex'; }
  if (view === 'mapa_interativo') {
    if (el.mainContent) el.mainContent.style.display = 'none';
    if (el.mapaRoot) el.mapaRoot.style.display = 'flex';
  }
}
function mapState(key, fallback = 'moderado') {
  return state.quality[key] || fallback;
}
function renderMapModule(type, selectedMetric) {
  if (type === 'farm') {
    const farms = state.lookups?.farms || [];
    const plots = state.lookups?.plots || [];
    const paddocks = state.lookups?.paddocks || [];
    const employees = state.lookups?.employees || [];
    const primaryFarm = farms[0] || {};
    const totalPlotArea = plots.reduce((sum, plot) => sum + Number(plot.area || 0), 0);
    const totalPaddockArea = paddocks.reduce((sum, paddock) => sum + Number(paddock.area || 0), 0);
    const activePaddocks = paddocks.filter((item) => String(item.status || '').toLowerCase() === 'ativo').length;
    const metrics = {
      pasture: mapState('livestock_pasture', 'bom'),
      water: mapState('livestock_water', 'moderado'),
      soil: mapState('agri_soil', 'bom')
    };
    const options = [
      { key:'farm_water', label:'Nível de Água' },
      { key:'farm_pasture', label:'Qualidade do pasto' },
      { key:'farm_soil', label:'Qualidade do solo' }
    ];
    const metric = selectedMetric || state.mapMetricSelection[type] || options[0].key;
    const valuesByMetric = {
      farm_water: { norte:metrics.water, centro:'moderado', oeste:metrics.water, lavouraA:'moderado', lavouraB:'bom', reserva:'bom', agua:metrics.water, leste:'ruim', nordeste:'moderado' },
      farm_pasture: { norte:metrics.pasture, centro:'moderado', oeste:metrics.pasture, lavouraA:'moderado', lavouraB:'moderado', reserva:'bom', agua:metrics.water, leste:'ruim', nordeste:'moderado' },
      farm_soil: { norte:metrics.soil, centro:'moderado', oeste:metrics.soil, lavouraA:metrics.soil, lavouraB:metrics.soil, reserva:'bom', agua:'moderado', leste:'ruim', nordeste:metrics.soil }
    };
    const farmSummary = `
      <div class="farm-overview-grid">
        <div class="farm-overview-card">
          <div class="farm-overview-label">Fazenda principal</div>
          <div class="farm-overview-value">${escapeHtml(primaryFarm.name || 'Nao cadastrada')}</div>
          <div class="farm-overview-meta">${escapeHtml(primaryFarm.location || 'Defina a localizacao da propriedade')}</div>
        </div>
        <div class="farm-overview-card">
          <div class="farm-overview-label">Talhoes</div>
          <div class="farm-overview-value">${plots.length}</div>
          <div class="farm-overview-meta">${totalPlotArea ? `${Number(totalPlotArea).toLocaleString('pt-BR')} ha cadastrados` : 'Cadastre as areas agricolas'}</div>
        </div>
        <div class="farm-overview-card">
          <div class="farm-overview-label">Pastos</div>
          <div class="farm-overview-value">${paddocks.length}</div>
          <div class="farm-overview-meta">${activePaddocks} ativo(s) · ${totalPaddockArea ? `${Number(totalPaddockArea).toLocaleString('pt-BR')} ha` : 'sem area definida'}</div>
        </div>
        <div class="farm-overview-card">
          <div class="farm-overview-label">Equipe</div>
          <div class="farm-overview-value">${employees.length}</div>
          <div class="farm-overview-meta">${employees.length ? 'Pessoas vinculadas à operação' : 'Nenhum funcionário cadastrado'}</div>
        </div>
      </div>
      <div class="farm-quick-actions">
        <button class="ghost small" type="button" data-farm-open="plots">Abrir talhões</button>
        <button class="ghost small" type="button" data-farm-open="paddocks">Abrir pastos</button>
        <button class="ghost small" type="button" data-farm-open="farms">Editar fazenda base</button>
      </div>`;
    const labels = { norte:'Pasto Norte', centro:'Centro', oeste:'Pasto Oeste', lavouraA:'Talhão A', lavouraB:'Talhão B', reserva:'Reserva', agua:'Represa', leste:'Corredor', nordeste:'Norte Leste' };
    el.mapTitle.textContent = 'Fazenda';
    el.mapSubtitle.textContent = 'Mapa técnico da propriedade';
    el.mapContent.innerHTML = `<div class="legend-panel"><div class="panel-title">Legenda e ajustes</div><div class="muted-card">Selecione um indicador e ajuste os níveis conforme a realidade da propriedade.</div>${metricBlock('Qualidade do pasto', 'Condição geral das pastagens da fazenda.', metrics.pasture, 'livestock_pasture')}${metricBlock('Nível de Água', 'Disponibilidade hídrica dos setores e pastos.', metrics.water, 'livestock_water')}${metricBlock('Qualidade do solo', 'Condição geral do solo da propriedade.', metrics.soil, 'agri_soil')}${mapMetricPanel(options, metric)}</div><div class="map-panel"><div class="panel-title">Mapa geral · ${options.find(o=>o.key===metric).label}</div><div class="map-frame">${buildMapSvg(valuesByMetric[metric], {}, labels, type)}</div></div>`;
    el.mapContent.innerHTML = `<div class="legend-panel"><div class="panel-title">Visão geral da propriedade</div><div class="muted-card">Acompanhe a estrutura principal da fazenda e ajuste os níveis conforme a realidade da propriedade.</div>${farmSummary}${metricBlock('Qualidade do pasto', 'Condição geral das pastagens da fazenda.', metrics.pasture, 'livestock_pasture')}${metricBlock('Nível de Água', 'Disponibilidade hídrica dos setores e pastos.', metrics.water, 'livestock_water')}${metricBlock('Qualidade do solo', 'Condição geral do solo da propriedade.', metrics.soil, 'agri_soil')}${mapMetricPanel(options, metric)}</div><div class="map-panel"><div class="panel-title">Mapa geral · ${options.find(o=>o.key===metric).label}</div><div class="map-frame">${buildMapSvg(valuesByMetric[metric], {}, labels, type)}</div></div>`;
    state.mapMetricSelection[type] = metric; storeMapMetricSelection();
    bindQualityControls(type); initMapInteractions(type);
    document.querySelectorAll('[data-farm-open]').forEach((btn) => btn.onclick = async () => {
      const target = btn.getAttribute('data-farm-open');
      if (target === 'farms') return openSettingsAuth('farms');
      state.currentModule = target;
      renderNav();
      await switchModule(target);
    });
    return;
  }


  if (type === 'farm_livestock') {
    const farms = state.lookups?.farms || [];
    const plots = state.lookups?.plots || [];
    const animals = state.lookups?.animals || [];
    const lots = state.lookups?.lots || [];
    const paddocks = state.lookups?.paddocks || [];
    const employees = state.lookups?.employees || [];
    const events = state.lookups?.animal_events || [];
    const sales = state.lookups?.sales || [];
    const primaryFarm = farms[0] || {};
    const totalFarmArea = Number(primaryFarm.total_area || 0);
    const totalPlotArea = plots.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const totalPaddockArea = paddocks.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const activeAnimals = animals.filter((item) => String(item.status || '').toLowerCase() === 'ativo');
    const occupiedPaddocks = new Set(activeAnimals.map((item) => item.paddock_id).filter(Boolean));
    const activePaddocks = paddocks.filter((item) => String(item.status || '').toLowerCase() === 'ativo').length;
    const lotsInUse = new Set(activeAnimals.map((item) => item.lot_id).filter(Boolean));
    const femaleAnimals = activeAnimals.filter((item) => String(item.sex || '').toUpperCase() === 'F').length;
    const maleAnimals = activeAnimals.filter((item) => String(item.sex || '').toUpperCase() === 'M').length;
    const calves = activeAnimals.filter((item) => String(item.category || '').toLowerCase() === 'bezerro').length;
    const animalsWithoutLot = activeAnimals.filter((item) => !item.lot_id).length;
    const animalsWithoutPaddock = activeAnimals.filter((item) => !item.paddock_id).length;
    const weighingEvents = events.filter((item) => String(item.event_type || '').toLowerCase() === 'pesagem' && Number(item.weight || 0) > 0);
    const avgWeight = weighingEvents.length
      ? Math.round(weighingEvents.reduce((sum, item) => sum + Number(item.weight || 0), 0) / weighingEvents.length)
      : 0;
    const sanitaryEvents = events.filter((item) => ['vacinação', 'vermifugação'].includes(String(item.event_type || '').toLowerCase()));
    const lastEvent = [...events].sort((a, b) => dateValue(b.event_date) - dateValue(a.event_date))[0] || null;
    const saleRevenue = sales.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.unit_price || 0)), 0);
    const pendingSales = sales.filter((item) => String(item.status || '').toLowerCase() !== 'pago').length;
    const occupancyRate = activePaddocks ? Math.round((occupiedPaddocks.size / activePaddocks) * 100) : 0;
    const animalsPerOccupiedPaddock = occupiedPaddocks.size ? (activeAnimals.length / occupiedPaddocks.size).toFixed(1).replace('.', ',') : '0';

    el.mapTitle.textContent = 'Geral';
    el.mapSubtitle.textContent = 'Resumo da fazenda com estrutura, áreas e operação';
    el.mapContent.innerHTML = `
      <div class="panel livestock-panel-shell">
        <div class="livestock-panel-hero">
          <div class="livestock-panel-copy">
            <div class="livestock-panel-kicker">Aba geral da fazenda</div>
            <h2>Visão consolidada da propriedade com os principais números da fazenda</h2>
            <p>${farms.length ? `${escapeHtml(primaryFarm.name || 'Fazenda principal')} em ${escapeHtml(primaryFarm.location || 'localização não informada')}, com ${totalFarmArea ? `${totalFarmArea.toLocaleString('pt-BR')} ha` : 'área total não definida'}, ${plots.length} talhão(ões) e ${paddocks.length} pasto(s) cadastrados.` : 'Cadastre a fazenda, os talhões e os pastos para centralizar as informações operacionais nesta aba.'}</p>
            <div class="livestock-panel-actions">
              <button class="ghost small" type="button" data-farm-livestock-open="plots">Abrir talhões</button>
              <button class="ghost small" type="button" data-farm-livestock-open="paddocks">Abrir pastos</button>
              <button class="ghost small" type="button" data-farm-livestock-open="employees">Abrir equipe</button>
              <button class="ghost small" type="button" data-farm-livestock-open="lots">Abrir lotes</button>
            </div>
          </div>
          <div class="livestock-panel-main-card">
            <div class="livestock-panel-main-label">Visão central da fazenda</div>
            <div class="livestock-panel-main-value">${totalFarmArea ? `${totalFarmArea.toLocaleString('pt-BR')} ha` : '-'}</div>
            <div class="livestock-panel-main-meta">área total cadastrada da propriedade</div>
            <div class="livestock-panel-main-stats">
              <div><strong>${plots.length}</strong><span>talhões cadastrados</span></div>
              <div><strong>${paddocks.length}</strong><span>pastos cadastrados</span></div>
              <div><strong>${employees.length}</strong><span>pessoa(s) na equipe</span></div>
            </div>
          </div>
        </div>
        <div class="livestock-mini-grid">
          <div class="livestock-mini-card">
            <div class="livestock-mini-label">Fazenda principal</div>
            <div class="livestock-mini-value">${escapeHtml(primaryFarm.name || 'Sem cadastro')}</div>
            <div class="livestock-mini-meta">${escapeHtml(primaryFarm.location || 'Defina a localização da propriedade')}</div>
          </div>
          <div class="livestock-mini-card">
            <div class="livestock-mini-label">Talhões</div>
            <div class="livestock-mini-value">${plots.length}</div>
            <div class="livestock-mini-meta">${totalPlotArea ? `${totalPlotArea.toLocaleString('pt-BR')} ha em área agrícola` : 'Sem área agrícola informada'}</div>
          </div>
          <div class="livestock-mini-card">
            <div class="livestock-mini-label">Pastos</div>
            <div class="livestock-mini-value">${activePaddocks}/${paddocks.length}</div>
            <div class="livestock-mini-meta">${totalPaddockArea ? `${totalPaddockArea.toLocaleString('pt-BR')} ha de pastagem` : 'Sem área de pastagem informada'}</div>
          </div>
          <div class="livestock-mini-card">
            <div class="livestock-mini-label">Equipe</div>
            <div class="livestock-mini-value">${employees.length}</div>
            <div class="livestock-mini-meta">${employees.length ? 'funcionário(s) vinculados à operação' : 'Nenhum funcionário cadastrado'}</div>
          </div>
          <div class="livestock-mini-card">
            <div class="livestock-mini-label">Rebanho ativo</div>
            <div class="livestock-mini-value">${activeAnimals.length}</div>
            <div class="livestock-mini-meta">${femaleAnimals} fêmea(s), ${maleAnimals} macho(s) e ${calves} bezerro(s)</div>
          </div>
          <div class="livestock-mini-card">
            <div class="livestock-mini-label">Comercialização</div>
            <div class="livestock-mini-value">${money(saleRevenue)}</div>
            <div class="livestock-mini-meta">${sales.length} venda(s), ${pendingSales} pendente(s) e ${lots.length} lote(s)</div>
          </div>
        </div>
        <div class="livestock-detail-grid">
          <div class="livestock-detail-card">
            <div class="panel-title">Estrutura e ocupação</div>
            <div class="list-compact">
              <div class="list-item"><strong>Pastos ocupados</strong><div>${occupiedPaddocks.size} em uso · ${occupancyRate}% dos pastos ativos</div></div>
              <div class="list-item"><strong>Animais por pasto ocupado</strong><div>${animalsPerOccupiedPaddock} animal(is) por pasto</div></div>
              <div class="list-item"><strong>Cadastros incompletos</strong><div>${animalsWithoutLot} sem lote e ${animalsWithoutPaddock} sem pasto</div></div>
            </div>
          </div>
          <div class="livestock-detail-card">
            <div class="panel-title">Manejo e movimentação</div>
            <div class="livestock-detail-highlight">
              <strong>${escapeHtml(lastEvent?.event_type || 'Sem eventos registrados')}</strong>
              <span>${lastEvent ? `${formatShortDate(lastEvent.event_date)}${lastEvent.notes ? ` · ${escapeHtml(lastEvent.notes)}` : ''}` : 'Registre pesagens, vacinações e movimentações para acompanhar o manejo.'}</span>
            </div>
            <div class="livestock-detail-highlight">
              <strong>${avgWeight ? `${avgWeight} kg de peso médio` : 'Sem pesagens registradas'}</strong>
              <span>${sanitaryEvents.length} evento(s) sanitário(s) e ${events.length} registro(s) totais de manejo</span>
            </div>
          </div>
        </div>
      </div>`;

    el.mapContent.querySelectorAll('[data-farm-livestock-open]').forEach((btn) => {
      btn.onclick = async () => {
        const target = btn.getAttribute('data-farm-livestock-open');
        if (['plots', 'paddocks'].includes(target)) {
          state.currentModule = target;
          renderNav();
          await switchModule(target);
          return;
        }
        if (target === 'employees') {
          openSettingsAuth('employees');
          return;
        }
        await setGroup('livestock');
        state.currentModule = target;
        renderNav();
        await switchModule(target);
      };
    });
    return;
  }

  if (type === 'livestock') {
    const metrics = {
      pasture: mapState('livestock_pasture', 'bom'),
      water: mapState('livestock_water', 'moderado'),
      herd: mapState('livestock_herd', 'bom'),
      sanitary: mapState('livestock_sanitary', 'moderado'),
      comfort: mapState('livestock_comfort', 'bom')
    };
    const options = [
      { key:'livestock_pasture', label:'Qualidade do pasto' },
      { key:'livestock_water', label:'Nível de Água' },
      { key:'livestock_herd', label:'Qualidade do gado' },
      { key:'livestock_sanitary', label:'Sanidade' },
      { key:'livestock_comfort', label:'Conforto animal' }
    ];
    const metric = selectedMetric || state.mapMetricSelection[type] || options[0].key;
    const areaValues = {
      livestock_pasture: { norte:metrics.pasture, centro:'moderado', oeste:metrics.pasture, lavouraA:'moderado', lavouraB:'moderado', reserva:'bom', agua:metrics.water, leste:'ruim', nordeste:'moderado' },
      livestock_water: { norte:metrics.water, centro:'moderado', oeste:'moderado', lavouraA:'moderado', lavouraB:'moderado', reserva:'bom', agua:metrics.water, leste:'ruim', nordeste:'moderado' },
      livestock_herd: { norte:metrics.herd, centro:'moderado', oeste:metrics.herd, lavouraA:'moderado', lavouraB:'moderado', reserva:'moderado', agua:'moderado', leste:'ruim', nordeste:'moderado' },
      livestock_sanitary: { norte:metrics.sanitary, centro:metrics.sanitary, oeste:'moderado', lavouraA:'moderado', lavouraB:'moderado', reserva:'bom', agua:'moderado', leste:'ruim', nordeste:'moderado' },
      livestock_comfort: { norte:metrics.comfort, centro:'moderado', oeste:metrics.comfort, lavouraA:'moderado', lavouraB:'moderado', reserva:'bom', agua:'moderado', leste:'ruim', nordeste:'moderado' }
    };
    const names = { norte:'Pasto Norte', centro:'Manejo', oeste:'Pasto Sul', lavouraA:'Descanso', lavouraB:'Confinamento', reserva:'Sombra', agua:'Represa', leste:'Corredor', nordeste:'Suplementação' };
    el.mapTitle.textContent = 'Pecuária';
    el.mapSubtitle.textContent = 'Mapa de qualidade da criação';
    el.mapContent.innerHTML = `<div class="legend-panel"><div class="panel-title">Indicadores da pecuária</div>${metricBlock('Qualidade do pasto', 'Condição da forragem para corte ou leite.', metrics.pasture, 'livestock_pasture')}${metricBlock('Água', 'Oferta e limpeza dos pontos de água.', metrics.water, 'livestock_water')}${metricBlock('Qualidade do gado', 'Condição corporal e desempenho.', metrics.herd, 'livestock_herd')}${metricBlock('Sanidade', 'Vacinação, vermifugação e risco sanitário.', metrics.sanitary, 'livestock_sanitary')}${metricBlock('Conforto animal', 'Sombra, lotação e bem-estar.', metrics.comfort, 'livestock_comfort')}${mapMetricPanel(options, metric)}</div><div class="map-panel"><div class="panel-title">Mapa pecuário · ${options.find(o=>o.key===metric).label}</div><div class="map-frame">${buildMapSvg(areaValues[metric], {}, names, type)}</div></div>`;
    state.mapMetricSelection[type] = metric; storeMapMetricSelection();
    bindQualityControls(type); initMapInteractions(type);
    return;
  }

  const metrics = {
    soil: mapState('agri_soil', 'bom'),
    lime: mapState('agri_lime', 'moderado'),
    nutrients: mapState('agri_nutrients', 'bom'),
    humidity: mapState('agri_humidity', 'moderado'),
    pests: mapState('agri_pests', 'bom')
  };
  const options = [
    { key:'agri_soil', label:'Qualidade da terra' },
    { key:'agri_lime', label:'Nível de cal' },
    { key:'agri_nutrients', label:'Nível de nutrientes' },
    { key:'agri_humidity', label:'Umidade' },
    { key:'agri_pests', label:'Pragas e doenças' }
  ];
  const metric = selectedMetric || state.mapMetricSelection[type] || options[0].key;
  const areaValues = {
    agri_soil: { norte:'moderado', centro:'moderado', oeste:'moderado', lavouraA:metrics.soil, lavouraB:metrics.soil, reserva:'bom', agua:metrics.humidity, leste:'ruim', nordeste:metrics.soil },
    agri_lime: { norte:'moderado', centro:'moderado', oeste:'moderado', lavouraA:metrics.lime, lavouraB:metrics.lime, reserva:'bom', agua:'moderado', leste:'ruim', nordeste:metrics.lime },
    agri_nutrients: { norte:'moderado', centro:'moderado', oeste:'moderado', lavouraA:metrics.nutrients, lavouraB:metrics.nutrients, reserva:'bom', agua:'moderado', leste:'ruim', nordeste:metrics.nutrients },
    agri_humidity: { norte:'moderado', centro:'moderado', oeste:'moderado', lavouraA:metrics.humidity, lavouraB:metrics.humidity, reserva:'bom', agua:'bom', leste:'ruim', nordeste:metrics.humidity },
    agri_pests: { norte:'moderado', centro:'moderado', oeste:'moderado', lavouraA:metrics.pests, lavouraB:metrics.pests, reserva:'bom', agua:'moderado', leste:'ruim', nordeste:metrics.pests }
  };
  const names = { norte:'Pastagem', centro:'Centro', oeste:'Reserva técnica', lavouraA:'Milho', lavouraB:'Soja', reserva:'APP', agua:'Represa', leste:'Capim de corte', nordeste:'Sorgo' };
  el.mapTitle.textContent = 'Agricultura';
  el.mapSubtitle.textContent = 'Mapa técnico das áreas de plantio';
  el.mapContent.innerHTML = `<div class="legend-panel"><div class="panel-title">Indicadores agrícolas</div>${metricBlock('Qualidade da terra', 'Estrutura e potencial produtivo do solo.', metrics.soil, 'agri_soil')}${metricBlock('Nível de cal', 'Necessidade de calagem da área.', metrics.lime, 'agri_lime')}${metricBlock('Nível de nutrientes', 'Disponibilidade de nutrientes para a cultura.', metrics.nutrients, 'agri_nutrients')}${metricBlock('Umidade', 'Condição hídrica da lavoura.', metrics.humidity, 'agri_humidity')}${metricBlock('Pragas e doenças', 'Risco fitossanitário atual.', metrics.pests, 'agri_pests')}${mapMetricPanel(options, metric)}</div><div class="map-panel"><div class="panel-title">Mapa agrícola · ${options.find(o=>o.key===metric).label}</div><div class="map-frame">${buildMapSvg(areaValues[metric], {}, names, type)}</div></div>`;
  state.mapMetricSelection[type] = metric; storeMapMetricSelection();
  bindQualityControls(type); initMapInteractions(type);
}



function renderMapHub() {
  const available = [
    { value: 'farm', label: 'Mapa geral da Fazenda' },
    ...(state.systemParameters.works_with_livestock !== false ? [{ value: 'livestock', label: 'Mapa da Pecuária' }] : []),
    ...(state.systemParameters.works_with_agriculture !== false ? [{ value: 'agriculture', label: 'Mapa da Agricultura' }] : [])
  ];
  if (!available.find((item) => item.value === state.currentMapType)) state.currentMapType = available[0].value;
  localStorage.setItem('gestor_current_map_type', state.currentMapType);
  el.mapTitle.textContent = 'Mapa';
  el.mapSubtitle.textContent = 'Escolha qual mapa deseja visualizar';
  el.mapContent.innerHTML = `<div class="panel map-hub-shell" style="grid-column:1/-1;"><div class="map-hub-header"><div><div class="panel-title">Mapa consolidado</div><div class="panel-subtitle">Selecione a origem do mapa para visualizar o panorama de qualidade.</div></div><select id="map-hub-select">${available.map((item) => `<option value="${item.value}" ${item.value === state.currentMapType ? 'selected' : ''}>${item.label}</option>`).join('')}</select></div><div id="map-hub-body"></div></div>`;
  document.getElementById('map-hub-select').onchange = (event) => {
    state.currentMapType = event.target.value;
    localStorage.setItem('gestor_current_map_type', state.currentMapType);
    renderMapHub();
  };
  const host = document.getElementById('map-hub-body');
  const originalContent = el.mapContent;
  el.mapContent = host;
  renderMapModule(state.currentMapType, state.mapMetricSelection[state.currentMapType]);
  el.mapContent = originalContent;
}

function initMapInteractions(mapType) {
  const viewport = document.querySelector(`[data-map-viewport="${mapType}"]`);
  const svg = viewport?.querySelector('.farm-svg');
  const target = viewport?.querySelector('.map-panzoom');
  if (!viewport || !svg || !target) return;
  const view = ensureMapView(mapType);
  const apply = () => {
    target.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    storeMapViewport();
  };
  const clamp = () => {
    view.scale = Math.max(0.45, Math.min(2.4, view.scale));
    view.x = Math.max(-220, Math.min(220, view.x));
    view.y = Math.max(-180, Math.min(180, view.y));
  };
  document.querySelector('[data-map-zoom="in"]')?.addEventListener('click', () => { view.scale += 0.1; clamp(); apply(); });
  document.querySelector('[data-map-zoom="out"]')?.addEventListener('click', () => { view.scale -= 0.1; clamp(); apply(); });
  document.querySelector('[data-map-center]')?.addEventListener('click', () => { view.x = 0; view.y = 0; clamp(); apply(); });
  document.querySelector('[data-map-reset]')?.addEventListener('click', () => { view.scale = 0.78; view.x = 0; view.y = 0; apply(); });
  viewport.onwheel = (event) => { event.preventDefault(); view.scale += event.deltaY < 0 ? 0.08 : -0.08; clamp(); apply(); };
  let dragging = false; let startX = 0; let startY = 0;
  viewport.onmousedown = (event) => { dragging = true; startX = event.clientX - view.x; startY = event.clientY - view.y; viewport.classList.add('dragging'); };
  window.onmouseup = () => { dragging = false; viewport.classList.remove('dragging'); };
  window.onmousemove = (event) => { if (!dragging) return; view.x = event.clientX - startX; view.y = event.clientY - startY; clamp(); apply(); };
  apply();
}

function pieSegment(value, total, color) {
  const pct = total ? Math.round((Number(value) / Number(total)) * 100) : 0;
  return { pct, color };
}
// ── Sistema de Qualidade (4 níveis) ─────────────────────────────────────────
const QUALITY_LEVELS = {
  otimo:      { label: 'ÓTIMO',      color: '#0f5132' },
  enfermaria: { label: 'ENFERMARIA', color: '#b45309' },
  uti:        { label: 'UTI',        color: '#b91c1c' },
  critico:    { label: 'CRÍTICO',    color: '#1a1a1a' },
};
function qualityFromPct(pct) {
  if (pct >= 50) return 'otimo';
  if (pct >= 35) return 'enfermaria';
  if (pct >= 15) return 'uti';
  return 'critico';
}
function qualityFromStockAlerts(count) {
  if (count === 0) return 'otimo';
  if (count <= 2) return 'enfermaria';
  if (count <= 5) return 'uti';
  return 'critico';
}
function qualityFromFinance(revenuePct) {
  if (revenuePct >= 60) return 'otimo';
  if (revenuePct >= 40) return 'enfermaria';
  if (revenuePct >= 20) return 'uti';
  return 'critico';
}
function qualityFromInmet(alerts) {
  if (!alerts || alerts.length === 0) return 'otimo';
  if (alerts.some((a) => a.severity === 'critical')) return 'critico';
  const warnCount = alerts.filter((a) => a.severity === 'warning').length;
  if (warnCount >= 3) return 'uti';
  if (warnCount > 0) return 'enfermaria';
  return 'otimo';
}
function qualityBadge(level) {
  const q = QUALITY_LEVELS[level] || QUALITY_LEVELS.otimo;
  return `<span style="display:inline-flex;align-items:center;background:${q.color};color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;padding:3px 10px;border-radius:999px;">${q.label}</span>`;
}
function qualityBar(pct, level) {
  const q = QUALITY_LEVELS[level] || QUALITY_LEVELS.otimo;
  const displayPct = Math.round(pct);
  return `<div style="position:relative;height:14px;background:#e8f4ed;border-radius:999px;overflow:visible;margin:8px 0 4px;cursor:pointer;"
    onmouseenter="this.querySelector('.qbar-tip').style.display='block'"
    onmouseleave="this.querySelector('.qbar-tip').style.display='none'">
    <div style="width:${Math.max(4,pct)}%;height:100%;background:${q.color};border-radius:999px;transition:width .4s;overflow:hidden;"></div>
    <div class="qbar-tip" style="display:none;position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;font-size:12px;font-weight:700;padding:6px 12px;border-radius:8px;white-space:nowrap;z-index:999;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.25);">
      <span style="color:${q.color === '#1a1a1a' ? '#aaa' : q.color};">${q.label}</span> &nbsp;·&nbsp; ${displayPct}%
      <div style="position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#1a1a1a;"></div>
    </div>
  </div>`;
}

async function openCriticalItemsModal() {
  let items = [];
  try {
    const token = localStorage.getItem('farm_token') || '';
    const r = await fetch('/api/reports/critical-items', { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    items = d.data || [];
  } catch (_) {}

  const levelColors = { otimo: '#0f5132', enfermaria: '#b45309', uti: '#b91c1c', critico: '#1a1a1a' };
  const levelLabels = { otimo: 'ÓTIMO', enfermaria: 'ENFERMARIA', uti: 'UTI', critico: 'CRÍTICO' };
  const badge = (level) => `<span style="background:${levelColors[level]||'#0f5132'};color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;white-space:nowrap;">${levelLabels[level]||'ÓTIMO'}</span>`;

  const fmt     = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const fmtNum  = (v) => v != null ? Number(v).toLocaleString('pt-BR') : '—';

  const rows = items.length === 0
    ? '<tr><td colspan="7" style="text-align:center;color:#888;padding:24px;">Nenhum item em alerta no momento.</td></tr>'
    : items.map((it) => {
        const dias = it.days_to_expiry != null
          ? (it.days_to_expiry < 0 ? '<span style="color:#b91c1c;font-weight:700;">VENCIDO</span>' : `${it.days_to_expiry} dias`)
          : '—';
        return `<tr style="border-bottom:1px solid #e8f4ed;">
          <td style="padding:10px 8px;font-weight:600;">${escapeHtml(it.name)}</td>
          <td style="padding:10px 8px;">${fmt(it.unit_price)}</td>
          <td style="padding:10px 8px;">${fmtNum(it.current_stock)} / ${fmtNum(it.minimum_stock)}</td>
          <td style="padding:10px 8px;">${badge(it.stock_level)}</td>
          <td style="padding:10px 8px;">${fmtDate(it.expiry_date)}</td>
          <td style="padding:10px 8px;">${dias}</td>
          <td style="padding:10px 8px;">${badge(it.expiry_level)}</td>
        </tr>`;
      }).join('');

  const html = `<div id="crit-modal-overlay" onclick="if(event.target===this)this.remove()" style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:16px;max-width:900px;width:97%;max-height:82vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.2);">
      <div style="padding:20px 24px;border-bottom:1px solid #e8f4ed;display:flex;justify-content:space-between;align-items:center;">
        <div style="font-size:18px;font-weight:800;color:#0f5132;">Itens em Alerta no Estoque</div>
        <button onclick="document.getElementById('crit-modal-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#666;">✕</button>
      </div>
      <div style="overflow-y:auto;padding:16px 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f4faf6;">
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Nome</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Preço</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Estoque / Mín.</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Nível estoque</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Validade</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Dias p/ vencer</th>
            <th style="padding:10px 8px;text-align:left;font-weight:700;color:#0f5132;">Nível validade</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild);
}

function renderHomeCharts(summary, inmetReport = null, inmetError = '') {

  const resultado = Number(summary.totalRevenue || 0) - Number(summary.totalExpense || 0);

  // Níveis de qualidade
  const financeTotal  = Number(summary.totalRevenue || 0) + Number(summary.totalExpense || 0) + Number(summary.openPayables || 0) + Number(summary.openReceivables || 0) || 1;
  const revenuePct    = Math.round((Number(summary.totalRevenue || 0) / financeTotal) * 100);
  const livestockGood = ['livestock_pasture','livestock_water','livestock_sanitary','livestock_herd','livestock_comfort'].filter((k) => state.quality[k] === 'bom').length;
  const agriGood      = ['agri_soil','agri_lime','agri_nutrients','agri_humidity','agri_pests'].filter((k) => state.quality[k] === 'bom').length;
  const livestockPct  = Math.round((livestockGood / 5) * 100);
  const agriPct       = Math.round((agriGood / 5) * 100);

  const financeLevel   = qualityFromFinance(revenuePct);
  const livestockLevel = qualityFromPct(livestockPct);
  const agriSoilLevel  = qualityFromPct(agriPct);
  const inmetLevel     = qualityFromInmet(inmetReport?.alerts || []);

  // ── Helpers compartilhados ──────────────────────────────────────────────
  const DASH_NIVEIS = [
    { chave: 'bom',      nome: 'Otimo',      cor: '#0f5132', faixa: '&ge; 75%' },
    { chave: 'moderado', nome: 'Enfermaria', cor: '#eab308', faixa: '50-74%'   },
    { chave: 'ruim',     nome: 'UTI',        cor: '#ef4444', faixa: '25-49%'   },
    { chave: 'critico',  nome: 'Critico',    cor: '#555',    faixa: '< 25%'    }
  ];
  const DASH_NIVEL_MAP = {
    bom:      { label: 'Otimo',      grad: 'linear-gradient(90deg,#0f5132,#49b36a)', bg: '#d1fae5', color: '#0f5132', pct: 88 },
    moderado: { label: 'Enfermaria', grad: 'linear-gradient(90deg,#b45309,#f59e0b)', bg: '#fef3c7', color: '#b45309', pct: 55 },
    ruim:     { label: 'UTI',        grad: 'linear-gradient(90deg,#b91c1c,#ef4444)', bg: '#fee2e2', color: '#b91c1c', pct: 28 },
    critico:  { label: 'Critico',    grad: 'linear-gradient(90deg,#1a1a1a,#555)',    bg: '#e5e5e5', color: '#1a1a1a', pct: 10 }
  };

  function dashTooltip(pct, nivelChave) {
    const linhas = DASH_NIVEIS.map((n) => {
      const ativo = n.chave === nivelChave ? 'dash-tip-nivel--ativo' : '';
      return `<div class="dash-tip-nivel ${ativo}"><span class="dash-tip-dot" style="background:${n.cor}"></span><span>${n.nome}</span><span class="dash-tip-range">${n.faixa}</span></div>`;
    }).join('');
    return `<div class="dash-bar-tip"><div class="dash-tip-pct">${pct}%</div><div class="dash-tip-div"></div><div class="dash-tip-niveis">${linhas}</div></div>`;
  }

  function dashInd(emoji, nome, desc, qualVal) {
    const n = DASH_NIVEL_MAP[qualVal] || DASH_NIVEL_MAP.moderado;
    return `<div class="dash-ind">
      <div class="dash-ind-emoji">${emoji}</div>
      <div class="dash-ind-info">
        <div class="dash-ind-nome">${nome}</div>
        <div class="dash-ind-desc">${desc}</div>
        <div class="dash-mini-wrap">
          <div class="dash-mini-bar" style="width:${n.pct}%;background:${n.grad}"></div>
          ${dashTooltip(n.pct, qualVal)}
        </div>
      </div>
      <span class="dash-ind-badge" style="background:${n.bg};color:${n.color}">${n.label}</span>
    </div>`;
  }

  function dashHeader(emoji, titulo, sub, nivel, progPct, progMeta) {
    const ql = QUALITY_LEVELS[nivel] || QUALITY_LEVELS.otimo;
    const bgMap = { '#0f5132': '#d1fae5', '#b45309': '#fef3c7', '#b91c1c': '#fee2e2', '#1a1a1a': '#e5e5e5' };
    const badgeStyle = `background:${bgMap[ql.color]||'#d1fae5'};color:${ql.color}`;
    return `<div class="dash-card-header">
      <div class="dash-card-header-top">
        <div class="dash-card-header-left">
          <span class="dash-card-emoji">${emoji}</span>
          <div>
            <div class="dash-card-titulo">${titulo}</div>
            <div class="dash-card-sub">${sub}</div>
          </div>
        </div>
        <span class="dash-card-nivel" style="${badgeStyle}">${ql.label}</span>
      </div>
      <div class="dash-prog-track"><div class="dash-prog-fill" style="width:${progPct}%"></div></div>
      <div class="dash-prog-meta"><span>${progMeta}</span><span>${progPct}%</span></div>
    </div>`;
  }

  function dashFooter(cntEmoji, cntNum, cntLabel, btnLabel, btnOnclick) {
    return `<div class="dash-card-footer">
      <div class="dash-cnt">
        <span class="dash-cnt-emoji">${cntEmoji}</span>
        <div><div class="dash-cnt-num">${cntNum}</div><div class="dash-cnt-label">${cntLabel}</div></div>
      </div>
      <button class="dash-ver-btn" onclick="${btnOnclick}">&#8594; ${btnLabel}</button>
    </div>`;
  }

  const charts = [];

  // ══════════════════════════════════════════════════════════════
  // 1. FINANCEIRO
  // ══════════════════════════════════════════════════════════════
  const finProgPct = Math.min(100, Math.round((Number(summary.totalRevenue || 0) / Math.max(Number(summary.totalRevenue || 0) + Number(summary.totalExpense || 0), 1)) * 100));
  const finItems = [
    { emoji: '📈', nome: 'Receitas',  desc: 'total recebido',      val: money(summary.totalRevenue),    cls: 'dash-fin-val--pos'  },
    { emoji: '📉', nome: 'Despesas',  desc: 'total gasto',         val: money(summary.totalExpense),    cls: 'dash-fin-val--neg'  },
    { emoji: '🔴', nome: 'A pagar',   desc: 'contas em aberto',    val: money(summary.openPayables),    cls: 'dash-fin-val--warn' },
    { emoji: '🟢', nome: 'A receber', desc: 'pendente de entrada', val: money(summary.openReceivables), cls: 'dash-fin-val--pos'  }
  ];
  const finItensHtml = finItems.map((f) => `
    <div class="dash-fin-item">
      <div class="dash-fin-left">
        <span class="dash-fin-emoji">${f.emoji}</span>
        <div><div class="dash-fin-nome">${f.nome}</div><div class="dash-fin-desc">${f.desc}</div></div>
      </div>
      <div class="dash-fin-val ${f.cls}">${f.val}</div>
    </div>`).join('');
  const resultadoCls = resultado >= 0 ? 'dash-resultado--pos' : 'dash-resultado--neg';

  charts.push(`<div class="panel dash-card dash-card--finance">
    ${dashHeader('💰', 'Financeiro', 'receitas, despesas e contas', financeLevel, finProgPct, 'receitas acima das despesas')}
    <div class="dash-fin-body">
      ${finItensHtml}
      <div class="dash-resultado ${resultadoCls}">
        <span class="dash-resultado-label">Resultado atual</span>
        <span class="dash-resultado-val">${money(resultado)}</span>
      </div>
    </div>
    <div class="dash-footer-single">
      <button class="dash-ver-btn dash-ver-btn--full" onclick="window._goFinance && window._goFinance()">&#8594; Ver Financeiro</button>
    </div>
  </div>`);

  // ══════════════════════════════════════════════════════════════
  // 2. PECUÁRIA
  // ══════════════════════════════════════════════════════════════
  if (state.systemParameters.works_with_livestock !== false) {
    const lInds = [
      { emoji: '🌿', nome: 'Qualidade do Pasto',  desc: 'Condicao da forragem',           key: 'livestock_pasture'  },
      { emoji: '💧', nome: 'Nivel de Agua',        desc: 'Oferta e limpeza dos bebedouros', key: 'livestock_water'    },
      { emoji: '💉', nome: 'Sanidade',             desc: 'Vacinacao e vermifugacao em dia', key: 'livestock_sanitary' },
      { emoji: '🐂', nome: 'Condicao Corporal',    desc: 'Peso e desempenho do rebanho',   key: 'livestock_herd'     },
      { emoji: '☀️', nome: 'Conforto Animal',      desc: 'Sombra, lotacao e bem-estar',    key: 'livestock_comfort'  }
    ];
    const livGood = lInds.filter((i) => (state.quality[i.key] || 'moderado') === 'bom').length;
    const livProg = Math.round((livGood / lInds.length) * 100);
    const livHtml = lInds.map((i) => dashInd(i.emoji, i.nome, i.desc, state.quality[i.key] || 'moderado')).join('');
    charts.push(`<div class="panel dash-card">
      ${dashHeader('🐄', 'Qualidade da Pecuaria', 'monitoramento diario do rebanho', livestockLevel, livProg, `${livGood} de ${lInds.length} em bom nivel`)}
      <div class="dash-body">${livHtml}</div>
      ${dashFooter('🐄', summary.animals || 0, 'animais ativos', 'Ver Pecuaria', 'window._goLivestock && window._goLivestock()')}
    </div>`);
  }

  // ══════════════════════════════════════════════════════════════
  // 3. AGRICULTURA
  // ══════════════════════════════════════════════════════════════
  if (state.systemParameters.works_with_agriculture !== false) {
    const aInds = [
      { emoji: '🪨', nome: 'Qualidade da Terra',  desc: 'Estrutura e potencial do solo',  key: 'agri_soil'      },
      { emoji: '🧪', nome: 'Nivel de Cal',         desc: 'Necessidade de calagem',         key: 'agri_lime'      },
      { emoji: '🌿', nome: 'Nivel de Nutrientes',  desc: 'Disponibilidade para a cultura', key: 'agri_nutrients' },
      { emoji: '💧', nome: 'Umidade',              desc: 'Condicao hidrica da lavoura',    key: 'agri_humidity'  },
      { emoji: '🐛', nome: 'Pragas e Doencas',     desc: 'Risco fitossanitario atual',     key: 'agri_pests'     }
    ];
    const agGood     = aInds.filter((i) => (state.quality[i.key] || 'moderado') === 'bom').length;
    const agProg     = Math.round((agGood / aInds.length) * 100);
    const agHtml     = aInds.map((i) => dashInd(i.emoji, i.nome, i.desc, state.quality[i.key] || 'moderado')).join('');
    const totalArea  = (state.lookups?.plots || []).reduce((s, p) => s + Number(p.area || 0), 0);
    const areaLabel  = totalArea > 0 ? `${totalArea.toLocaleString('pt-BR')}ha` : '—';
    charts.push(`<div class="panel dash-card">
      ${dashHeader('🌱', 'Qualidade da Agricultura', 'lavoura e solo', agriSoilLevel, agProg, `${agGood} de ${aInds.length} em bom nivel`)}
      <div class="dash-body">${agHtml}</div>
      ${dashFooter('🌾', areaLabel, 'area cultivada', 'Ver Agricultura', 'window._goAgriculture && window._goAgriculture()')}
    </div>`);
  }

  // ══════════════════════════════════════════════════════════════
  // 4. CLIMA INMET
  // ══════════════════════════════════════════════════════════════
  const inmetLocation = inmetReport?.location?.label || `${state.inmetCity}/${state.inmetUf}`;
  const inmetAlerts   = (inmetReport?.alerts || []).filter((a) => a.severity !== 'info').slice(0, 2);
  const inmetPeriods  = (inmetReport?.periods || []).slice(0, 4);
  const alertCount    = inmetAlerts.length;
  const inmetProgPct  = alertCount === 0 ? 100 : alertCount === 1 ? 60 : 30;
  const inmetMeta     = alertCount === 0 ? 'sem alertas ativos' : `${alertCount} alerta(s) na regiao`;

  let inmetBodyHtml = '';
  if (inmetError) {
    inmetBodyHtml = `<div class="dash-inmet-body"><div class="dash-inmet-erro">Servico INMET indisponivel.<br><small>${escapeHtml(inmetError)}</small></div></div>`;
  } else {
    const alertasHtml = inmetAlerts.map((a) => `
      <div class="dash-inmet-alerta">
        <span class="dash-inmet-alerta-icon">⚠️</span>
        <span><strong>${escapeHtml(a.title || 'Alerta')}</strong> — ${escapeHtml(a.description || '')}</span>
      </div>`).join('');
    const periodosHtml = inmetPeriods.length
      ? inmetPeriods.map((p) => `
        <div class="dash-inmet-periodo">
          <div class="dash-inmet-periodo-top">
            <span class="dash-inmet-data">🗓 ${escapeHtml(p.label || p.date || '-')}</span>
            <span class="dash-inmet-temp">${Number.isFinite(p.tempMax) ? p.tempMax + '°' : '-'} / ${Number.isFinite(p.tempMin) ? p.tempMin + '°' : '-'}</span>
          </div>
          <div class="dash-inmet-desc">${escapeHtml(p.summary || p.description || 'Sem resumo')}</div>
        </div>`).join('')
      : `<div class="dash-inmet-vazio">Sem previsoes disponiveis no momento.</div>`;
    inmetBodyHtml = `<div class="dash-inmet-body">${alertasHtml}${periodosHtml}</div>`;
  }

  charts.push(`<div class="panel dash-card">
    ${dashHeader('🌤️', 'Clima INMET', escapeHtml(inmetLocation), inmetLevel, inmetProgPct, inmetMeta)}
    ${inmetBodyHtml}
    <div class="dash-footer-single">
      <div class="dash-inmet-local">📍 ${escapeHtml(inmetLocation)}</div>
    </div>
  </div>`);

  el.homeCharts.innerHTML = charts.join('');
}
function renderDashboardCards(summary) {
  const cards = [];
  if (state.systemParameters.works_with_livestock !== false) cards.push(['Gado ativo', summary.animals]);
  cards.push(['Itens em alerta', summary.lowStockItems]);
  cards.push(['Resultado atual', money((summary.totalRevenue||0) - (summary.totalExpense||0))]);
  cards.push(['A receber', money(summary.openReceivables)]);
  el.dashboardCards.innerHTML = cards.map(([kicker, value]) => `<div class="card summary-card"><div class="kicker">${kicker}</div><div class="value">${value}</div></div>`).join('');
}

function labelForLookup(source, value) {
  if (!value) return '-';
  const found = (state.lookups[source] || []).find((row) => String(row.id) === String(value));
  return found ? found.name : value;
}
function displayValue(resource, column, value) {
  const field = (FORMS[resource] || []).find((f) => f.name === column);
  if (field?.type === 'lookup') return labelForLookup(field.source, value);
  if (field?.type === 'checkboxlist') return fmt(value);
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (['amount', 'unit_price', 'taxes', 'cost', 'unit_cost'].includes(column)) return money(value);
  return fmt(value);
}

function renderTable(resource, rows, totalRows) {
  const columns = COLUMNS[resource];
  const module = currentModuleConfig();
  const canEdit = canAction(module.module, 'update');
  const canDelete = canAction(module.module, 'delete');
  el.tableHead.innerHTML = `<tr>${columns.map((col) => `<th>${labelOf(col)}</th>`).join('')}<th>${labelOf('actions')}</th></tr>`;
  el.tableMeta.textContent = `Mostrando ${rows.length} de ${totalRows} registro(s)`;
  if (!rows.length) {
    el.tableBody.innerHTML = `<tr><td colspan="${columns.length + 1}" class="empty">Nenhum registro encontrado.</td></tr>`;
    return;
  }
  el.tableBody.innerHTML = rows.map((row) => `
    <tr>
      ${columns.map((col) => `<td title="${escapeHtml(displayValue(resource, col, row[col]))}">${escapeHtml(displayValue(resource, col, row[col]))}</td>`).join('')}
      <td>
        <div class="actions">
          ${canEdit ? `<button class="small ghost" data-edit="${row.id}">Editar</button>` : ''}
          ${canDelete ? `<button class="small danger" data-delete="${row.id}">Excluir</button>` : ''}
        </div>
      </td>
    </tr>`).join('');
  el.tableBody.querySelectorAll('[data-edit]').forEach((btn) => btn.onclick = () => openForm(resource, state.currentRows.find((r) => String(r.id) === btn.dataset.edit)));
  el.tableBody.querySelectorAll('[data-delete]').forEach((btn) => btn.onclick = async () => {
    if (!confirm('Excluir este registro?')) return;
    await api(`/${resource}/${btn.dataset.delete}`, { method: 'DELETE' });
    await loadLookups();
    await loadCrudData();
    if (resource === 'animals') {
      if (typeof window.syncMapAnimalCount === 'function') window.syncMapAnimalCount();
    }
  });
}

function inputControl(resource, field, value) {
  const current = value != null ? value : (field.defaultValue != null ? field.defaultValue : '');
  if (field.type === 'textarea') return `<textarea name="${field.name}">${escapeHtml(current || '')}</textarea>`;
  if (field.type === 'select') return `<select name="${field.name}">${(field.options || []).map((opt) => { const item = typeof opt === 'object' ? opt : { value: opt, label: opt }; return `<option value="${item.value}" ${String(item.value) === String(current) ? 'selected' : ''}>${item.label}</option>`; }).join('')}</select>`;
  if (field.type === 'lookup') {
    const rows = (state.lookups[field.source] || []).map((item) => `<option value="${item.id}" ${String(item.id) === String(current) ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('');
    return `<select name="${field.name}"><option value="">Selecione...</option>${rows}</select>`;
  }
  if (field.name === 'password_hash') { return `<input name="${field.name}" type="password" value="" autocomplete="new-password" />`; }
  if (field.type === 'checkboxlist') {
    const selected = Array.isArray(current) ? current : [];
    return `<div class="checkbox-grid">${field.options.map((option) => `<label class="checkbox-item"><input type="checkbox" name="${field.name}" value="${option.key}" ${selected.includes(option.key) ? 'checked' : ''}>${option.label}</label>`).join('')}</div>`;
  }
  return `<input name="${field.name}" type="${field.type || 'text'}" value="${escapeHtml(current || '')}" ${field.required ? 'required' : ''} />`;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function setupAnimalEventsForm(row = null) {
  const form = document.getElementById('modal-form');
  if (!form) return;

  const eventType = form.querySelector('[name="event_type"]');
  const animalId = form.querySelector('[name="animal_id"]');
  const paddockCurrentWrap = form.querySelector('[data-field-wrap="paddock_id"]');
  const paddockFutureWrap = form.querySelector('[data-field-wrap="paddock_future_id"]');
  const paddockCurrent = form.querySelector('[name="paddock_id"]');
  const paddockFuture = form.querySelector('[name="paddock_future_id"]');

  const syncCurrentPaddock = () => {
    if (!animalId || !paddockCurrent) return;
    const selectedAnimalId = Number(animalId.value || 0);
    if (!selectedAnimalId) return;
    const selectedAnimal = (state.lookups.animals || []).find((item) => Number(item.id) === selectedAnimalId);
    if (!selectedAnimal || !selectedAnimal.paddock_id) return;
    if (!paddockCurrent.value || normalizeText(eventType?.value) === 'movimentacao') {
      paddockCurrent.value = String(selectedAnimal.paddock_id);
    }
  };

  const toggleMovementFields = () => {
    const isMovement = normalizeText(eventType?.value) === 'movimentacao';
    if (paddockCurrentWrap) paddockCurrentWrap.style.display = isMovement ? '' : 'none';
    if (paddockFutureWrap) paddockFutureWrap.style.display = isMovement ? '' : 'none';
    if (paddockCurrent) paddockCurrent.required = isMovement;
    if (paddockFuture) paddockFuture.required = isMovement;
    if (isMovement) syncCurrentPaddock();
  };

  if (eventType) eventType.onchange = toggleMovementFields;
  if (animalId) animalId.onchange = () => { syncCurrentPaddock(); };

  if (row && row.paddock_id && paddockCurrent && !paddockCurrent.value) {
    paddockCurrent.value = String(row.paddock_id);
  }

  toggleMovementFields();
}

function setupAnimalsForm(row = null) {
  const form = document.getElementById('modal-form');
  if (!form) return;

  const entryMode = form.querySelector('[name="entry_mode"]');
  const modeTabs = form.querySelectorAll('[data-entry-mode-tab]');
  const earTagWrap = form.querySelector('[data-field-wrap="ear_tag"]');
  const prefixWrap = form.querySelector('[data-field-wrap="ear_tag_prefix"]');
  const quantityWrap = form.querySelector('[data-field-wrap="quantity"]');
  const earTagField = form.querySelector('[name="ear_tag"]');
  const prefixField = form.querySelector('[name="ear_tag_prefix"]');
  const quantityField = form.querySelector('[name="quantity"]');

  const toggleFields = () => {
    const isBatch = !row && entryMode && entryMode.value === 'lote';

    modeTabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.entryModeTab === (entryMode?.value || 'unidade'));
    });

    if (entryMode) {
      const modeWrap = form.querySelector('[data-field-wrap="entry_mode"]');
      if (modeWrap) modeWrap.style.display = row ? 'none' : '';
    }

    if (earTagWrap) earTagWrap.style.display = isBatch ? 'none' : '';
    if (prefixWrap) prefixWrap.style.display = isBatch ? '' : 'none';
    if (quantityWrap) quantityWrap.style.display = isBatch ? '' : 'none';

    if (earTagField) earTagField.required = !isBatch;
    if (prefixField) prefixField.required = isBatch;
    if (quantityField) quantityField.required = isBatch;

    if (!isBatch) {
      if (quantityField) quantityField.value = '1';
      return;
    }

    if (earTagField) earTagField.value = '';
    if (quantityField && (!quantityField.value || Number(quantityField.value) <= 0)) quantityField.value = '1';
  };

  if (entryMode) entryMode.onchange = toggleFields;
  modeTabs.forEach((tab) => {
    tab.onclick = () => {
      if (!entryMode) return;
      entryMode.value = tab.dataset.entryModeTab;
      toggleFields();
    };
  });
  toggleFields();
}

function setupSalesForm(row = null) {
  const form = document.getElementById('modal-form');
  if (!form) return;

  const saleType = form.querySelector('[name="sale_type"]');
  const saleScope = form.querySelector('[name="sale_scope"]');
  const animalWrap = form.querySelector('[data-field-wrap="animal_id"]');
  const lotWrap = form.querySelector('[data-field-wrap="lot_id"]');
  const itemWrap = form.querySelector('[data-field-wrap="item_id"]');
  const quantityWrap = form.querySelector('[data-field-wrap="quantity"]');
  const animalField = form.querySelector('[name="animal_id"]');
  const lotField = form.querySelector('[name="lot_id"]');
  const itemField = form.querySelector('[name="item_id"]');
  const quantityField = form.querySelector('[name="quantity"]');

  const countAnimalsByLot = (lotId) => {
    return (state.lookups.animals || []).filter((item) =>
      String(item.lot_id || '') === String(lotId || '') &&
      String(item.status || '').toLowerCase() === 'ativo'
    ).length;
  };

  const syncQuantity = () => {
    if (!quantityField || !saleType) return;
    const isAnimal = saleType.value === 'animal';
    const isLot = isAnimal && saleScope && saleScope.value === 'lote';

    if (isAnimal && !isLot) {
      quantityField.value = '1';
      quantityField.readOnly = true;
      return;
    }

    quantityField.readOnly = false;
    if (isLot && lotField && lotField.value) {
      const total = countAnimalsByLot(lotField.value);
      if (!quantityField.value || Number(quantityField.value) <= 0) quantityField.value = String(total || 1);
    }
  };

  const toggleFields = () => {
    const isAnimal = saleType && saleType.value === 'animal';
    const isLot = isAnimal && saleScope && saleScope.value === 'lote';

    if (saleScope) {
      const scopeWrap = form.querySelector('[data-field-wrap="sale_scope"]');
      if (scopeWrap) scopeWrap.style.display = isAnimal ? '' : 'none';
      saleScope.required = isAnimal;
      if (!isAnimal) saleScope.value = 'unidade';
    }

    if (animalWrap) animalWrap.style.display = isAnimal && !isLot ? '' : 'none';
    if (lotWrap) lotWrap.style.display = isLot ? '' : 'none';
    if (itemWrap) itemWrap.style.display = isAnimal ? 'none' : '';
    if (quantityWrap) quantityWrap.style.display = (!isAnimal || isLot) ? '' : 'none';

    if (animalField) animalField.required = isAnimal && !isLot;
    if (lotField) lotField.required = isLot;
    if (itemField) itemField.required = !isAnimal;
    if (quantityField) quantityField.required = !isAnimal || isLot;

    if (isAnimal) {
      if (itemField) itemField.value = '';
    } else {
      if (animalField) animalField.value = '';
      if (lotField) lotField.value = '';
    }

    syncQuantity();
  };

  if (saleType) saleType.onchange = toggleFields;
  if (saleScope) saleScope.onchange = toggleFields;
  if (lotField) lotField.onchange = syncQuantity;

  if (row && quantityField && row.quantity && !quantityField.value) {
    quantityField.value = String(row.quantity);
  }

  toggleFields();
}

function openForm(resource, row = null) {
  state.editingId = row?.id || null;
  const title = state.editingId ? `Editar ${currentModuleConfig().title}` : `Novo ${currentModuleConfig().title}`;
  const fields = FORMS[resource] || [];
  const modeTabs = resource === 'animals' && !row ? `
    <div class="entry-mode-tabs" data-entry-mode-tabs>
      <button class="entry-mode-tab active" type="button" data-entry-mode-tab="unidade">Por unidade</button>
      <button class="entry-mode-tab" type="button" data-entry-mode-tab="lote">Por lote</button>
    </div>` : '';
  showModal({
    small: fields.length <= 4,
    title,
    body: `${modeTabs}<div class="form-grid">${fields.map((field) => `<div class="${field.type === 'textarea' || field.type === 'checkboxlist' ? 'full-span' : ''}" data-field-wrap="${field.name}"><label>${field.label}</label>${inputControl(resource, field, row ? row[field.name] : null)}</div>`).join('')}</div>`,
    submitLabel: state.editingId ? 'Salvar alteração' : 'Salvar',
    onSubmit: async (formData) => {
      const payload = {};
      fields.forEach((field) => {
        if (field.type === 'checkboxlist') {
          payload[field.name] = formData.getAll(field.name);
          return;
        }
        const raw = formData.get(field.name);
        if (raw === null) return;
        let value = raw;
        if (field.type === 'number') value = raw === '' ? null : Number(raw);
        if (field.type === 'lookup') value = raw === '' ? null : Number(raw);
        if (field.name === 'active') value = raw === 'true';
        if (resource === 'users' && field.name === 'password_hash') { if (raw && String(raw).trim() !== '') payload.password = String(raw).trim(); return; }
        if (raw !== '' || ['active'].includes(field.name)) payload[field.name] = value;
      });
      if (resource === 'animal_events') {
        const normalizedEvent = normalizeText(payload.event_type || formData.get('event_type'));
        if (normalizedEvent === 'movimentacao') {
          if (!payload.paddock_id) {
            const selectedAnimalId = Number(payload.animal_id || 0);
            const selectedAnimal = (state.lookups.animals || []).find((item) => Number(item.id) === selectedAnimalId);
            if (selectedAnimal && selectedAnimal.paddock_id) payload.paddock_id = Number(selectedAnimal.paddock_id);
          }
          if (!payload.paddock_future_id) {
            throw new Error('Selecione o Pasto Futuro para a movimentacao.');
          }
        } else {
          delete payload.paddock_id;
          delete payload.paddock_future_id;
        }
      }
      if (resource === 'animals') {
        const entryMode = String(payload.entry_mode || formData.get('entry_mode') || 'unidade');
        payload.entry_mode = entryMode;
        if (entryMode === 'lote') {
          delete payload.ear_tag;
          if (!payload.ear_tag_prefix) throw new Error('Informe o prefixo do brinco para o lançamento por lote.');
          if (!payload.quantity || Number(payload.quantity) <= 0) throw new Error('Informe a quantidade para o lançamento por lote.');
        } else {
          delete payload.ear_tag_prefix;
          payload.quantity = 1;
          if (!payload.ear_tag) throw new Error('Informe o brinco para o lançamento por unidade.');
        }
      }
      if (resource === 'sales') {
        const saleType = String(payload.sale_type || formData.get('sale_type') || '');
        const saleScope = String(payload.sale_scope || formData.get('sale_scope') || 'unidade');
        if (saleType === 'animal') {
          payload.sale_scope = saleScope;
          delete payload.item_id;
          if (saleScope === 'lote') {
            delete payload.animal_id;
            if (!payload.lot_id) throw new Error('Selecione o lote para lançamento por lote.');
            if (!payload.quantity || Number(payload.quantity) <= 0) throw new Error('Informe a quantidade de animais do lote.');
          } else {
            delete payload.lot_id;
            if (!payload.animal_id) throw new Error('Selecione o animal para lançamento por unidade.');
            payload.quantity = 1;
          }
        } else {
          payload.sale_scope = 'unidade';
          delete payload.animal_id;
          delete payload.lot_id;
          if (!payload.item_id) throw new Error('Selecione o item para venda de produto.');
        }
      }
      let endpoint = SPECIAL_ENDPOINTS[resource] || `/${resource}`;
      const method = state.editingId && !SPECIAL_ENDPOINTS[resource] ? 'PUT' : 'POST';
      if (resource === 'animals' && !state.editingId) {
        endpoint = payload.entry_mode === 'lote' ? '/animals/register' : '/animals';
      } else if (state.editingId && !SPECIAL_ENDPOINTS[resource]) {
        endpoint = `/${resource}/${state.editingId}`;
      }
      await api(endpoint, { method, body: JSON.stringify(payload) });
      hideModal();
      await loadLookups();
      await loadCrudData();
      // Sync map animal count when animal is created/updated
      if (resource === 'animals') {
        if (typeof window.syncMapAnimalCount === 'function') window.syncMapAnimalCount();
      }
    }
  });

  if (resource === 'animals') setupAnimalsForm(row);
  if (resource === 'animal_events') setupAnimalEventsForm(row);
  if (resource === 'sales') setupSalesForm(row);
}


async function renderSettingsParameters() {
  const rows = await api('/system-parameters');
  const items = (rows.data || []).map((item) => ({ ...item, value: !!item.value }));
  el.settingsContent.innerHTML = `
    <form id="system-parameters-form" class="settings-parameters-form">
      <div class="settings-brand-card">
        <div class="settings-brand-main">
          <div class="settings-brand-pill">
            <div class="settings-brand-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4cdf8a" stroke-width="2.2" stroke-linecap="round">
                <path d="M12 22V12M12 12C12 7 17 3 21 3C21 8 18 12 12 12ZM12 12C12 7 7 3 3 3C3 8 6 12 12 12Z"/>
              </svg>
            </div>
            <div>
              <div class="settings-brand-kicker">Gestor Agro</div>
              <div class="settings-brand-title">Configuracoes do Sistema</div>
            </div>
          </div>
          <p class="settings-brand-text">Ajuste os modulos e o comportamento global da aplicacao com a mesma linguagem visual do selo principal do sistema.</p>
        </div>
        <div class="settings-brand-side">
          <div class="settings-brand-badge">Area protegida</div>
          <div class="settings-brand-meta">Somente perfis autorizados podem alterar estes parametros globais.</div>
        </div>
      </div>
      <div class="panel settings-parameters-panel">
        <div class="panel-title">Parâmetros do Sistema</div>
        <div class="parameter-list">
          ${items.map((item, index) => `
            <div class="parameter-row">
              <div>
                <div class="parameter-index">${index + 1}. ${item.label}</div>
              </div>
              <div class="parameter-toggle">
                <label><input type="radio" name="${item.key}" value="true" ${item.value ? 'checked' : ''}> Sim</label>
                <label><input type="radio" name="${item.key}" value="false" ${!item.value ? 'checked' : ''}> Não</label>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="settings-actions">
        <button type="button" class="ghost" id="settings-exit-btn">Sair</button>
        <button type="submit" class="primary">Salvar</button>
      </div>
      <div id="settings-error" class="error-text"></div>
    </form>`;
  document.getElementById('settings-exit-btn').onclick = () => setGroup('home');
  document.getElementById('system-parameters-form').onsubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = items.map((item) => ({ key: item.key, label: item.label, sort_order: item.sort_order || 0, value: formData.get(item.key) === 'true' }));
    try {
      const response = await api('/system-parameters', { method: 'POST', body: JSON.stringify({ items: payload }) });
      state.systemParameters = (response.data || []).reduce((acc, row) => { acc[row.key] = !!row.value; return acc; }, {});
      localStorage.setItem('gestor_system_parameters', JSON.stringify(state.systemParameters));
      clearSession();
      location.reload();
    } catch (error) {
      document.getElementById('settings-error').textContent = error.message;
    }
  };
}

async function loadCrudData() {
  const resource = state.currentModule;
  const search = el.searchInput.value.trim();
  const result = await api(`/${resource}${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  state.currentRows = result.data || [];
  renderTable(resource, state.currentRows.slice(0, PAGE_SIZE), state.currentRows.length);
}

async function loadReports(options = {}) {
  const forceInmet = !!options.forceInmet;
  const start = el.reportStart.value || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10);
  const end = el.reportEnd.value || today();
  const tabs = [
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'pecuaria', label: 'Pecuaria' },
    { key: 'agricultura', label: 'Agricultura' },
    { key: 'inmet', label: 'INMET' }
  ];

  if (!tabs.some((tab) => tab.key === state.currentReportTab)) {
    state.currentReportTab = 'financeiro';
  }

  const active = state.currentReportTab;
  if (active === 'inmet') {
    state.inmetReportMode = INMET_REPORT_MODES.includes(state.inmetReportMode) ? state.inmetReportMode : 'resumo';
    localStorage.setItem('gestor_inmet_report_mode', state.inmetReportMode);
    if (el.inmetReportMode) el.inmetReportMode.value = state.inmetReportMode;
  }
  syncReportsFilterVisibility(active);
  const inmetRange = active === 'inmet' && state.inmetReportMode === 'periodos' ? inmetPeriodRangeFromInputs() : null;

  let report = null;
  let inmet = null;
  let inmetError = '';

  if (active === 'financeiro') {
    report = await api(`/reports/finance?start=${start}&end=${end}`);
  }

  if (active === 'inmet') {
    try {
      inmet = await loadInmetReport(forceInmet, inmetRange);
    } catch (error) {
      inmetError = error.message;
    }
  }

  const tabsHtml = `<div class="report-tabs">${tabs.map((tab) => `<button class="report-tab ${tab.key === active ? 'active' : ''}" data-report-tab="${tab.key}">${tab.label}</button>`).join('')}</div>`;
  let cardsHtml = '';

  if (active === 'financeiro') {
    cardsHtml = `
      <div class="card summary-card"><div class="kicker">Receita</div><div class="value">${money(report.dre.receita)}</div></div>
      <div class="card summary-card"><div class="kicker">Despesa</div><div class="value">${money(report.dre.despesa)}</div></div>
      <div class="card summary-card"><div class="kicker">Resultado</div><div class="value">${money(report.dre.resultado)}</div></div>
      <div class="card summary-card"><div class="kicker">Custo por hectare</div><div class="value">${money(report.heuristicCosts.costPerHectare)}</div></div>
      <div class="card summary-card"><div class="kicker">Custo por cabeca</div><div class="value">${money(report.heuristicCosts.costPerHead)}</div></div>`;
  } else if (active === 'inmet') {
    const mode = state.inmetReportMode;

    let locationBar = '';
    if (!inmetError && inmet?.location?.label) {
      const rangeLabel = mode === 'periodos' && inmetRange ? ` · ${inmetRange.start} até ${inmetRange.end}` : '';
      locationBar = `<div class="inmet-location-bar inmet-full">📍 ${escapeHtml(inmet.location.label)}${escapeHtml(rangeLabel)}</div>`;
    }

    if (inmetError) {
      cardsHtml = locationBar + `<div class="panel report-placeholder inmet-full"><div class="panel-title">INMET indisponível</div><div class="panel-subtitle">${escapeHtml(inmetError)}</div></div>`;
    } else if (mode === 'alertas') {
      cardsHtml = locationBar + renderInmetAlertsPanel(inmet);
    } else if (mode === 'periodos') {
      // Summary cards + periods panel + alerts panel — all inside reportCards
      const summaryCards = renderInmetSummaryCards(inmet);
      const periodsPanel = renderInmetPeriodsPanel(inmet);
      const alertsPanel = renderInmetAlertsPanel(inmet);
      cardsHtml = locationBar + summaryCards + `<div class="inmet-two-col inmet-full">${periodsPanel}${alertsPanel}</div>`;
    } else {
      // Resumo mode: summary cards + two panels below
      const summaryCards = renderInmetSummaryCards(inmet);
      const periods = (inmet?.periods || []).slice(0, 5);
      const alerts = (inmet?.alerts || []).slice(0, 6);
      const periodsHtml = periods.length
        ? periods.map(renderInmetPeriodItem).join('')
        : '<div class="empty">Sem períodos previstos.</div>';
      const alertsHtml = alerts.length
        ? alerts.map(renderInmetAlertItem).join('')
        : '<div class="empty">Sem alertas.</div>';
      cardsHtml = locationBar + summaryCards +
        `<div class="inmet-two-col inmet-full">` +
          `<div class="panel inmet-panel-box"><div class="panel-title">Próximas janelas climáticas</div><div class="list-compact">${periodsHtml}</div></div>` +
          `<div class="panel inmet-panel-box"><div class="panel-title">Alertas agro (INMET)</div><div class="list-compact">${alertsHtml}</div></div>` +
        `</div>`;
    }
  } else {
    cardsHtml = `<div class="panel report-placeholder"><div class="panel-title">Relatorios de ${active}</div><div class="panel-subtitle">Esta area esta pronta para receber relatorios especificos desse setor.</div></div>`;
  }

  el.reportCards.innerHTML = tabsHtml + cardsHtml;
  el.reportCards.querySelectorAll('[data-report-tab]').forEach((btn) => btn.onclick = () => {
    state.currentReportTab = btn.dataset.reportTab;
    localStorage.setItem('gestor_current_report_tab', state.currentReportTab);
    loadReports();
  });

  // Show/hide dashboard-grid below: only for financeiro
  const dashGrid = document.querySelector('#reports-section .dashboard-grid');
  if (dashGrid) dashGrid.style.display = (active === 'financeiro') ? '' : 'none';

  if (active === 'financeiro') {
    if (el.reportsLeftTitle) el.reportsLeftTitle.textContent = 'Fluxo de caixa mensal';
    if (el.reportsRightTitle) el.reportsRightTitle.textContent = 'Custos por centro de custo';
    el.cashflowList.innerHTML = report.cashFlow.length ? `<div class="list-compact">${report.cashFlow.slice(0, 8).map((row) => `<div class="list-item"><strong>${escapeHtml(row.month)}</strong><div>${escapeHtml(row.entry_type)} - ${money(row.total)}</div></div>`).join('')}</div>` : '<div class="empty">Sem dados no periodo.</div>';
    el.costCenterList.innerHTML = report.costCenter.length ? `<div class="list-compact">${report.costCenter.slice(0, 8).map((row) => `<div class="list-item"><strong>${escapeHtml(row.cost_center || 'Sem centro')}</strong><div>${money(row.total)}</div></div>`).join('')}</div>` : '<div class="empty">Sem despesas por centro de custo.</div>';
  } else {
    if (el.cashflowList) el.cashflowList.innerHTML = '';
    if (el.costCenterList) el.costCenterList.innerHTML = '';
  }
}
async function loadHomeDashboard() {
  let summary = { animals: 0, lowStockItems: 0, totalRevenue: 0, totalExpense: 0, openPayables: 0, openReceivables: 0 };
  let inmetReport = null;
  let inmetError = '';

  try {
    summary = await api('/reports/dashboard');
    state.lastSummary = summary;
    updateBrandDropdown();
  } catch (_error) {
    // Mantem o painel funcional mesmo sem acesso ao endpoint
  }

  try {
    inmetReport = await loadInmetReport(false);
  } catch (error) {
    inmetError = error.message || 'Falha ao carregar dados climaticos do INMET.';
  }

  if (el.dashboardCards) el.dashboardCards.innerHTML = '';

  renderShortcutGrid(summary, inmetReport);
  renderHomeCharts(summary, inmetReport, inmetError);
}
async function switchModule(key) {
  state.currentModule = key;
  const module = currentModuleConfig();
  renderNav();
  if (module.view === 'home') { el.groupTitle.textContent = GROUPS[currentGroup].title; switchView('home'); return loadHomeDashboard(); }
  if (module.view === 'reports') { el.groupTitle.textContent = GROUPS[currentGroup].title; switchView('reports'); return loadReports(); }
  if (module.view === 'map') { el.groupTitle.textContent = GROUPS[currentGroup].title; switchView('map'); return renderMapModule(module.mapType); }
  if (module.view === 'maphub') { el.groupTitle.textContent = GROUPS[currentGroup].title; switchView('map'); return renderMapHub(); }
  if (module.view === 'mapa_interativo') {
    el.groupTitle.textContent = GROUPS[currentGroup].title;
    switchView('mapa_interativo');
    if (el.mapaRoot && typeof window.renderMapaInterativo === 'function') {
      // Só re-renderiza se o root estiver vazio (evita re-render desnecessário)
      if (!el.mapaRoot.dataset.rendered) {
        el.mapaRoot.dataset.rendered = '1';
        window.renderMapaInterativo(el.mapaRoot, state.token);
      }
    }
    return;
  }
  if (module.view === 'settings') { el.groupTitle.textContent = GROUPS[currentGroup].title; el.pageTitle.textContent = module.title; el.pageSubtitle.textContent = module.subtitle; switchView('settings'); return renderSettingsParameters(); }

  switchView('crud');
  el.groupTitle.textContent = GROUPS[currentGroup].title;
  el.pageTitle.textContent = module.title;
  el.pageSubtitle.textContent = module.subtitle;
  el.tableTitle.textContent = module.title;
  renderCrudHighlight(module);
  el.newRecordBtn.classList.toggle('hidden', !canAction(module.module, 'create'));
  await loadCrudData();
}

async function bootstrap() {
  renderShortcutBar();
  el.reportStart.value = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10);
  el.reportEnd.value = today();
  if (el.inmetUf) el.inmetUf.value = normalizeInmetUf(state.inmetUf);
  if (el.inmetCity) el.inmetCity.value = state.inmetCity;
  state.inmetReportMode = INMET_REPORT_MODES.includes(state.inmetReportMode) ? state.inmetReportMode : 'resumo';
  if (el.inmetReportMode) el.inmetReportMode.value = state.inmetReportMode;
  state.inmetPeriodStart = normalizeIsoDate(state.inmetPeriodStart, today());
  state.inmetPeriodEnd = normalizeIsoDate(state.inmetPeriodEnd, addDaysIso(state.inmetPeriodStart, 6));
  if (state.inmetPeriodEnd < state.inmetPeriodStart) state.inmetPeriodEnd = state.inmetPeriodStart;
  localStorage.setItem('gestor_inmet_period_start', state.inmetPeriodStart);
  localStorage.setItem('gestor_inmet_period_end', state.inmetPeriodEnd);
  if (el.inmetPeriodStart) el.inmetPeriodStart.value = state.inmetPeriodStart;
  if (el.inmetPeriodEnd) el.inmetPeriodEnd.value = state.inmetPeriodEnd;
  updateShellTitle();

  if (state.token) {
    try {
      const me = await api('/me');
      state.user = me.user;
      state.permissions = me.permissions;
      if (me.systemParameters) { state.systemParameters = { ...state.systemParameters, ...me.systemParameters }; localStorage.setItem('gestor_system_parameters', JSON.stringify(state.systemParameters)); }
      localStorage.setItem('farm_user', JSON.stringify(state.user));
      localStorage.setItem('farm_permissions', JSON.stringify(state.permissions));
      el.loginScreen.classList.remove('active');
      el.appScreen.classList.add('active');
      el.userBadge.textContent = `${state.user.full_name || state.user.username} · ${state.user.role}`;
      await loadLookups();
      renderNav();
      await switchModule(state.currentModule);
      if (window._hideSplash) window._hideSplash();
      return;
    } catch (_error) { clearSession(); }
  }
  el.loginScreen.classList.add('active');
  el.appScreen.classList.remove('active');
  if (window._hideSplash) window._hideSplash();
  const userInput = document.getElementById('login-username');
  const pwdInput = document.getElementById('login-password');
  if (userInput) userInput.value = state.lastUsername || '';
  if (pwdInput) pwdInput.value = '';
  if (pwdInput && !state.lastUsername) userInput.focus();
}

el.loginForm.onsubmit = async (event) => {
  event.preventDefault();
  el.loginError.textContent = '';
  try {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const response = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (response.user?.role === 'ADMIN') response.user.access_groups = ACCESS_GROUPS.map((g) => g.key);
    setSession(response.token, response.user, response.permissions, response.systemParameters);
    el.loginScreen.classList.remove('active');
    el.appScreen.classList.add('active');
    el.userBadge.textContent = `${response.user.full_name || response.user.username} · ${response.user.role}`;
    await loadLookups();
    renderNav();
    await switchModule(state.currentModule);
  } catch (error) { el.loginError.textContent = error.message; }
};

el.newRecordBtn.onclick = () => openForm(state.currentModule);
el.searchInput.oninput = () => { if (currentModuleConfig().view === 'crud') loadCrudData(); };
if (el.refreshBtn) el.refreshBtn.onclick = () => switchModule(state.currentModule);
if (el.switchUserBtn) el.switchUserBtn.onclick = () => { el.userDropdown.classList.add('hidden'); switchUser(); };
if (el.manageUsersBtn) el.manageUsersBtn.onclick = () => { el.userDropdown.classList.add('hidden'); openManageUsersAuth(); };
if (el.settingsBtn) el.settingsBtn.onclick = () => { el.userDropdown.classList.add('hidden'); openSettingsAuth(); };
el.loadReportsBtn.onclick = () => loadReports({ forceInmet: state.currentReportTab === 'inmet' });
if (el.inmetReportMode) el.inmetReportMode.onchange = () => {
  state.inmetReportMode = INMET_REPORT_MODES.includes(el.inmetReportMode.value) ? el.inmetReportMode.value : 'resumo';
  localStorage.setItem('gestor_inmet_report_mode', state.inmetReportMode);
  syncReportsFilterVisibility(state.currentReportTab);
  if (state.currentReportTab === 'inmet') loadReports({ forceInmet: state.inmetReportMode === 'periodos' });
};
if (el.inmetPeriodStart) el.inmetPeriodStart.onchange = () => {
  inmetPeriodRangeFromInputs();
  if (state.currentReportTab === 'inmet' && state.inmetReportMode === 'periodos') loadReports({ forceInmet: true });
};
if (el.inmetPeriodEnd) el.inmetPeriodEnd.onchange = () => {
  inmetPeriodRangeFromInputs();
  if (state.currentReportTab === 'inmet' && state.inmetReportMode === 'periodos') loadReports({ forceInmet: true });
};
if (el.inmetQuick7) el.inmetQuick7.onclick = () => applyInmetQuickRange(7, true);
if (el.inmetQuick15) el.inmetQuick15.onclick = () => applyInmetQuickRange(15, true);
if (el.inmetUf) el.inmetUf.onchange = () => {
  state.inmetUf = normalizeInmetUf(el.inmetUf.value);
  el.inmetUf.value = state.inmetUf;
  localStorage.setItem('gestor_inmet_uf', state.inmetUf);
  if (state.currentReportTab === 'inmet') loadReports({ forceInmet: true });
};
if (el.inmetCity) el.inmetCity.onchange = () => {
  state.inmetCity = String(el.inmetCity.value || '').trim() || 'Araguaina';
  el.inmetCity.value = state.inmetCity;
  localStorage.setItem('gestor_inmet_city', state.inmetCity);
  if (state.currentReportTab === 'inmet') loadReports({ forceInmet: true });
};
if (el.homeBtn) el.homeBtn.onclick = () => setGroup('home');
if (el.brandBtn) el.brandBtn.onclick = () => setGroup('home');
if (el.userMenuBtn && el.userDropdown) {
  el.userMenuBtn.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    el.userDropdown.classList.toggle('hidden');
  };
  el.userDropdown.onclick = (event) => {
    event.stopPropagation();
  };
}
document.addEventListener('click', (event) => {
  if (el.userDropdown && !event.target.closest('.user-menu')) {
    el.userDropdown.classList.add('hidden');
  }
});

window._goLivestock  = function() { openShortcut('livestock'); };
window._goAgriculture = function() { openShortcut('agriculture'); };
window._goFinance    = function() { openShortcut('finance'); };

// ── SPLASH SCREEN ────────────────────────────────────────────────────────
(function initSplash() {
  const splash  = document.getElementById('splash-screen');
  const bar     = splash?.querySelector('.splash-bar');
  const status  = document.getElementById('splash-status');
  if (!splash) return;

  const steps = [
    { pct: 20,  msg: 'Iniciando sistema...' },
    { pct: 45,  msg: 'Conectando ao banco de dados...' },
    { pct: 70,  msg: 'Carregando configurações...' },
    { pct: 90,  msg: 'Preparando interface...' },
    { pct: 100, msg: 'Pronto!' }
  ];

  let i = 0;
  function nextStep() {
    if (i >= steps.length) return;
    const s = steps[i++];
    if (bar)    bar.style.width = s.pct + '%';
    if (status) status.textContent = s.msg;
    if (i < steps.length) setTimeout(nextStep, 350 + Math.random() * 200);
  }
  setTimeout(nextStep, 300);

  window._hideSplash = function() {
    if (!splash || splash.classList.contains('hiding')) return;
    if (bar)    bar.style.width = '100%';
    if (status) status.textContent = 'Pronto!';
    setTimeout(() => {
      splash.classList.add('hiding');
      setTimeout(() => { splash.style.display = 'none'; }, 500);
    }, 300);
  };
})();


bootstrap();








