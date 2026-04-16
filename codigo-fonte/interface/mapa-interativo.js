/**
 * mapa-interativo.js â€” Gestor Agro v5
 * Layout baseado no prototipo aprovado.
 */

const API_MAP = `${window.location.origin}/api`;

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (m) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}

function apiMap(path, opts = {}) {
  const token = localStorage.getItem('farm_token') || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_MAP}${path}`, { ...opts, headers })
    .then((r) => r.json().catch(() => ({})))
    .then((d) => { if (d && d.error) throw new Error(d.error); return d; });
}

function today() { return new Date().toISOString().slice(0, 10); }

function mapaAlert(msg) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:28px 32px;max-width:400px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.2)">
      <div style="font-size:14px;color:#333;margin-bottom:20px;line-height:1.6">${msg}</div>
      <div style="text-align:right"><button id="_ma_ok" style="padding:8px 24px;background:#0f5132;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">OK</button></div>
    </div>`;
    document.body.appendChild(el);
    el.querySelector('#_ma_ok').onclick = () => { document.body.removeChild(el); resolve(); };
  });
}

function mapaConfirm(msg) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center';
    el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:28px 32px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.25);text-align:center">
      <div style="font-size:14px;color:#0f5132;font-weight:700;margin-bottom:20px;line-height:1.6;text-transform:uppercase">${msg}</div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button id="_mc_yes" style="padding:10px 28px;background:#c0392b;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">SIM</button>
        <button id="_mc_no" style="padding:10px 28px;background:#fff;color:#0f5132;border:1.5px solid #0f5132;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">NÃƒO</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    el.querySelector('#_mc_yes').onclick = () => { document.body.removeChild(el); resolve(true); };
    el.querySelector('#_mc_no').onclick  = () => { document.body.removeChild(el); resolve(false); };
  });
}

function mapaPrompt(msg, placeholder) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:28px 32px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.2)">
      <div style="font-size:14px;color:#0f5132;font-weight:700;margin-bottom:12px;line-height:1.5">${msg}</div>
      <input id="_mp_inp" type="text" placeholder="${placeholder || ''}" style="width:100%;padding:10px 12px;border:1px solid #d6e8db;border-radius:8px;font-size:14px;box-sizing:border-box;margin-bottom:16px;outline:none" />
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="_mp_cancel" style="padding:8px 20px;background:#fff;color:#0f5132;border:1.5px solid #0f5132;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">Cancelar</button>
        <button id="_mp_ok" style="padding:8px 20px;background:#0f5132;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700">Criar</button>
      </div>
    </div>`;
    document.body.appendChild(el);
    const inp = el.querySelector('#_mp_inp');
    inp.focus();
    const confirm = () => { const v = inp.value.trim(); document.body.removeChild(el); resolve(v || null); };
    el.querySelector('#_mp_ok').onclick = confirm;
    el.querySelector('#_mp_cancel').onclick = () => { document.body.removeChild(el); resolve(null); };
    inp.onkeydown = (e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') { document.body.removeChild(el); resolve(null); } };
  });
}

const AREA_COLORS = {
  pasto:'#4caf50', talhao:'#f9a825', reserva:'#27ae60',
  represa:'#2980b9', curral:'#795548', sede:'#9e9e9e', outro:'#78909c'
};

const AREA_TYPE_LABELS = {
  pasto:'Pasto', talhao:'TalhÃ£o', reserva:'Reserva/APP',
  represa:'Represa/Lago', curral:'Curral/Brete', sede:'Sede/InstalaÃ§Ã£o', outro:'Outro'
};

const FIELD_DEFS = {
  gado: [
    { key:'qtd_animais',      label:'Quantidade de Animais', unit:'cab' },
    { key:'raca',             label:'RaÃ§a Predominante' },
    { key:'categoria',        label:'Categoria', hint:'bezerros, novilhas...' },
    { key:'lotacao',          label:'LotaÃ§Ã£o', unit:'UA/ha' },
    { key:'peso_medio',       label:'Peso MÃ©dio', unit:'kg' },
    { key:'data_vacinacao',   label:'Ãšltima VacinaÃ§Ã£o', type:'date' },
    { key:'proxima_vacina',   label:'PrÃ³xima VacinaÃ§Ã£o', type:'date' },
    { key:'observacoes_gado', label:'ObservaÃ§Ãµes', type:'textarea' }
  ],
  solo: [
    { key:'ph_solo',       label:'pH do Solo' },
    { key:'mat_organica',  label:'MatÃ©ria OrgÃ¢nica', unit:'%' },
    { key:'fosforo',       label:'FÃ³sforo', unit:'mg/dmÂ³' },
    { key:'potassio',      label:'PotÃ¡ssio', unit:'mg/dmÂ³' },
    { key:'calcio',        label:'CÃ¡lcio', unit:'cmol/dmÂ³' },
    { key:'magnesio',      label:'MagnÃ©sio', unit:'cmol/dmÂ³' },
    { key:'sat_bases',     label:'SaturaÃ§Ã£o de Bases', unit:'%' },
    { key:'recomendacao',  label:'RecomendaÃ§Ã£o de Calagem/AdubaÃ§Ã£o', type:'textarea' }
  ],
  pastagem: [
    { key:'tipo_pastagem', label:'Tipo', type:'select', options:['Pastagem','Lavoura','Misto'] },
    { key:'especie',       label:'EspÃ©cie / Cultivar' },
    { key:'area_ha',       label:'Ãrea', unit:'ha' },
    { key:'condicao',      label:'CondiÃ§Ã£o', type:'select', options:['Ã“tima','Boa','Regular','Degradada'] },
    { key:'data_plantio',  label:'Data do Plantio / FormaÃ§Ã£o', type:'date' },
    { key:'produtividade', label:'Produtividade Estimada' },
    { key:'obs_pastagem',  label:'ObservaÃ§Ãµes de Manejo', type:'textarea' }
  ],
  agua: [
    { key:'fonte_hidrica',   label:'Fonte HÃ­drica', type:'select', options:['Rio','AÃ§ude','PoÃ§o','CÃ³rrego'] },
    { key:'ph_agua',         label:'pH da Ãgua' },
    { key:'turbidez',        label:'Turbidez', unit:'NTU' },
    { key:'coliformes',      label:'Coliformes', type:'select', options:['Ausente','Presente','NÃ£o analisado'] },
    { key:'disponibilidade', label:'Disponibilidade', type:'select', options:['Alta','MÃ©dia','Baixa','CrÃ­tica'] },
    { key:'obs_agua',        label:'ObservaÃ§Ãµes', type:'textarea' }
  ]
};

const CAT_LABELS = {
  gado:'Gado', solo:'Solo', pastagem:'Pastagem / Cultura', agua:'Qualidade da Agua'
};

function parseKML(kmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, 'text/xml');
  const areas = [];
  doc.querySelectorAll('Placemark').forEach((pm) => {
    const name = pm.querySelector('name')?.textContent?.trim() || 'Ãrea sem nome';
    let coordsEl = pm.querySelector('Polygon outerBoundaryIs LinearRing coordinates')
      || pm.querySelector('LinearRing coordinates') || pm.querySelector('coordinates');
    if (!coordsEl) return;
    const points = coordsEl.textContent.trim().split(/\s+/).map((pt) => {
      const [lng, lat] = pt.split(',').map(Number);
      return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
    }).filter(Boolean);
    if (points.length < 3) return;
    areas.push({ name, rawPoints: points });
  });
  return areas;
}

function normalizeToSVG(allAreas, W, H) {
  if (!allAreas.length) return allAreas;
  const allLats = allAreas.flatMap((a) => a.rawPoints.map((p) => p.lat));
  const allLngs = allAreas.flatMap((a) => a.rawPoints.map((p) => p.lng));
  const minLat = Math.min(...allLats), maxLat = Math.max(...allLats);
  const minLng = Math.min(...allLngs), maxLng = Math.max(...allLngs);
  const spanLat = maxLat - minLat || 1, spanLng = maxLng - minLng || 1;
  const pad = 40;
  return allAreas.map((a) => ({
    ...a,
    svgPoints: a.rawPoints.map((p) => ({
      x: pad + ((p.lng - minLng) / spanLng) * (W - pad * 2),
      y: pad + ((maxLat - p.lat) / spanLat) * (H - pad * 2)
    }))
  }));
}

function buildSVG(areas, savedAreas, W, H) {
  const areaMap = {};
  (savedAreas || []).forEach((a) => { areaMap[a.area_key] = a; });
  const polygons = areas.map((area, i) => {
    const key = area.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const saved = areaMap[key];
    const color = saved?.color || AREA_COLORS[saved?.area_type] || AREA_COLORS.pasto;
    const pts = area.svgPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const cx = (area.svgPoints.reduce((s, p) => s + p.x, 0) / area.svgPoints.length).toFixed(1);
    const cy = (area.svgPoints.reduce((s, p) => s + p.y, 0) / area.svgPoints.length).toFixed(1);
    return `<g class="map-area-group" data-key="${esc(key)}" data-name="${esc(area.name)}" data-idx="${i}">
      <polygon points="${pts}" fill="${color}" fill-opacity="0.65" stroke="${color}" stroke-width="2" class="map-polygon"/>
      <text x="${cx}" y="${parseFloat(cy)+4}" class="map-label" text-anchor="middle">${esc(area.name)}</text>
    </g>`;
  });
  return `<svg id="kml-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;cursor:default">
    <defs><style>
      .map-polygon{cursor:pointer;transition:fill-opacity .18s,stroke-width .18s}
      .map-polygon:hover{fill-opacity:.88;stroke-width:3}
      .map-label{font-size:12px;fill:#fff;pointer-events:none;font-weight:700;paint-order:stroke;stroke:#0006;stroke-width:3}
      .map-area-group.selected .map-polygon{stroke-width:4;stroke:#fff;fill-opacity:.92}
    </style></defs>
    ${polygons.join('\n')}
  </svg>`;
}

async function renderMapaInterativo(container, token) {
  container.innerHTML = `
  <style>
    .mi-shell{display:flex;flex-direction:column;height:100%;overflow:hidden;padding:12px 18px}
    .mi-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 0 12px 0;flex-shrink:0}
    .mi-toolbar select{height:36px;padding:0 10px;border-radius:10px;border:1.5px solid #d6e8db;font-size:13px;font-weight:600;color:#0f5132;background:#fff;min-width:180px}
    .mi-btn{height:36px;padding:0 14px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
    .mi-btn-primary{background:#0f5132;color:#fff}.mi-btn-primary:hover{background:#0b3a24}
    .mi-btn-outline{background:#fff;color:#0f5132;border:1.5px solid #0f5132}.mi-btn-outline:hover{background:#eaf5ed}
    .mi-btn-info{background:#2980b9;color:#fff}.mi-btn-info:hover{background:#1f6391}
    .mi-btn-warning{background:#e67e22;color:#fff}.mi-btn-warning:hover{background:#ca6f1e}
    .mi-btn-danger{background:#c0392b;color:#fff}.mi-btn-danger:hover{background:#a93226}
    .mi-body{display:grid;grid-template-columns:minmax(0,1.35fr) clamp(360px,34vw,520px);gap:14px;flex:1;min-height:0;overflow:hidden}
    .mi-map-panel{min-width:0;border-radius:16px;border:1px solid #d6e8db;background:#eaf5ed;overflow:hidden;position:relative;display:flex;flex-direction:column}
    .mi-map-inner{flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:8px 10px}
    .mi-map-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:#5f7a69}
    .mi-map-empty svg{width:52px;height:52px;stroke:#d6e8db;stroke-width:1.5;fill:none}
    .mi-map-empty span{font-size:14px;font-weight:600}
    .mi-map-empty small{font-size:12px;color:#9ad8b1;text-align:center}
    
    
    
    
    .mi-legend{padding:8px 14px;border-top:1px solid #d6e8db;background:#fff;display:flex;gap:14px;flex-wrap:wrap;align-items:center;flex-shrink:0}
    .mi-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:#5f7a69;font-weight:600}
    .mi-legend-dot{width:12px;height:12px;border-radius:3px;flex-shrink:0}
    .mi-side{min-width:0;display:flex;flex-direction:column;border-radius:16px;border:1px solid #d6e8db;background:#fff;overflow:hidden;position:sticky;top:0;align-self:stretch;max-height:100%}
    .mi-side-header{background:#0f5132;color:#fff;padding:12px 16px;font-weight:700;font-size:14px;display:flex;align-items:center;gap:8px;flex-shrink:0}
    .mi-side-body{flex:1;overflow-y:auto;padding:14px}
    .mi-side-empty{color:#5f7a69;font-size:13px;text-align:center;padding:32px 12px;line-height:1.7}
    .mi-area-name{font-size:16px;font-weight:800;color:#0f5132;border-bottom:1px solid #d6e8db;padding-bottom:8px;margin-bottom:6px}
    .mi-area-badge{display:inline-block;background:#eaf5ed;color:#0f5132;border-radius:8px;padding:3px 10px;font-size:11px;font-weight:700;margin-bottom:10px}
    .mi-cat-block{margin-bottom:14px}
    .mi-cat-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#5f7a69;margin-bottom:7px;padding-bottom:3px;border-bottom:1px solid #eaf5ed}
    .mi-fields-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}
    .mi-field{display:flex;flex-direction:column;gap:2px}
    .mi-field-label{font-size:10px;color:#5f7a69;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
    .mi-field-value{font-size:12px;font-weight:700;color:#0f5132}
    .mi-no-data{background:#f4faf6;border-radius:8px;padding:10px;text-align:center;color:#9ad8b1;font-size:12px}
    .mi-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:999;display:none;place-items:center}
    .mi-modal-overlay.open{display:grid}
    .mi-modal{background:#fff;border-radius:20px;width:700px;max-width:96vw;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 30px 60px rgba(0,0,0,.25);overflow:visible}
    .mi-modal-header{padding:18px 24px;border-bottom:1px solid #d6e8db;display:flex;justify-content:space-between;align-items:center}
    .mi-modal-header h2{font-size:18px;font-weight:800;color:#0f5132}
    .mi-modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:#5f7a69;line-height:1}
    .mi-modal-tabs{display:flex;border-bottom:1px solid #d6e8db;background:#f4faf6;padding:0 24px;flex-shrink:0}
    .mi-modal-tab{padding:12px 16px;font-size:13px;font-weight:700;color:#5f7a69;cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-1px;white-space:nowrap;background:none;border-top:none;border-left:none;border-right:none}
    .mi-modal-tab.active{color:#0f5132;border-bottom-color:#0f5132}
    .mi-modal-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:20px 24px;max-height:calc(88vh - 160px)}
    .mi-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin-bottom:12px}
    .mi-form-row.single{grid-template-columns:1fr}
    .mi-form-group{display:flex;flex-direction:column;gap:5px}
    .mi-form-group label{font-size:11px;font-weight:700;color:#5f7a69;text-transform:uppercase;letter-spacing:.04em}
    .mi-form-group input,.mi-form-group select,.mi-form-group textarea{padding:9px 12px;border:1px solid #d6e8db;border-radius:10px;font-size:13px;color:#0f5132;background:#fff;outline:none;font-family:inherit;pointer-events:auto !important;user-select:text !important;-webkit-user-select:text !important;-webkit-app-region:no-drag !important;cursor:text}
    .mi-form-group input:focus,.mi-form-group select:focus,.mi-form-group textarea:focus{border-color:#3fb86d;box-shadow:0 0 0 3px rgba(63,184,109,.12)}
    .mi-form-group textarea{resize:vertical;min-height:70px}
    .mi-modal-footer{padding:14px 24px;border-top:1px solid #d6e8db;display:flex;justify-content:flex-end;gap:10px;background:#fff;flex-shrink:0}
    #kml-svg{width:100%;height:100%;max-width:100%;max-height:100%;display:block}
    @media (max-width: 1480px){.mi-body{grid-template-columns:minmax(0,1.2fr) clamp(320px,36vw,460px)}}
    @media (max-width: 1024px){.mi-body{grid-template-columns:1fr}.mi-side{min-height:260px}}
  </style>

  <div class="mi-shell">
    <div class="mi-toolbar">
      <select id="mi-map-select"><option value="">â€” Selecione um mapa â€”</option></select>
      <button class="mi-btn mi-btn-primary" id="mi-btn-novo">+ Novo mapa</button>
      <button class="mi-btn mi-btn-outline" id="mi-btn-importar" style="display:none">IMPORTAR MAPA (.KML)</button>
      <input type="file" id="mi-kml-input" style="display:none" accept=".kml,.kmz"/>
      <button class="mi-btn mi-btn-info" id="mi-btn-dados" style="display:none">INSERIR DADOS</button>
      <button class="mi-btn mi-btn-danger" id="mi-btn-excluir" style="display:none">EXCLUIR MAPA</button>
    </div>
    <div class="mi-body">
      <div class="mi-map-panel">
        <div class="mi-map-inner" id="mi-map-inner">
          <div class="mi-map-empty" id="mi-map-empty">
            <svg viewBox="0 0 24 24"><path d="M3 6.5 9 4l6 2.5 6-2.5v13L15 19.5 9 17 3 19.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/></svg>
            <span>Selecione ou crie um mapa</span>
            <small>ApÃ³s criar, importe um arquivo .KML<br>para visualizar as Ã¡reas da fazenda</small>
          </div>
        </div>
        <div class="mi-legend" id="mi-legend" style="display:none">
          ${Object.entries(AREA_TYPE_LABELS).map(([k,v]) =>
            `<div class="mi-legend-item"><div class="mi-legend-dot" style="background:${AREA_COLORS[k]}"></div>${v}</div>`
          ).join('')}
        </div>
      </div>
      <div class="mi-side">
        <div class="mi-side-header">Area Selecionada</div>
        <div class="mi-side-body" id="mi-side-body">
          <div class="mi-side-empty">Clique em uma Ã¡rea do mapa para ver as informaÃ§Ãµes cadastradas.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="mi-modal-overlay" id="mi-modal-dados">
    <div class="mi-modal">
      <div class="mi-modal-header">
        <h2 id="mi-modal-title">Inserir Dados da Area</h2>
        <button class="mi-modal-close" id="mi-modal-close">âœ•</button>
      </div>
      <div class="mi-modal-tabs">
        <button class="mi-modal-tab active" data-cat="gado">Gado</button>
        <button class="mi-modal-tab" data-cat="solo">Solo</button>
        <button class="mi-modal-tab" data-cat="pastagem">Pastagem / Cultura</button>
        <button class="mi-modal-tab" data-cat="agua">Qualidade da Agua</button>
      </div>
      <div class="mi-modal-body" id="mi-modal-body"></div>
      <div class="mi-modal-footer">
        <button class="mi-btn mi-btn-outline" id="mi-modal-cancel">Cancelar</button>
        <button class="mi-btn mi-btn-primary" id="mi-modal-save">Salvar</button>
      </div>
    </div>
  </div>`;

  const S = {
    maps:[], currentMapId:null, currentMap:null,
    kmlAreas:[], savedAreas:[], selectedAreaKey:null, selectedAreaId:null,
    areaDataCache:{}, hasData:false, activeCat:'gado'
  };

  const $ = (id) => document.getElementById(id);
  const sel = $('mi-map-select');

  async function loadMaps() {
    try {
      S.maps = await apiMap('/farm-maps');
      sel.innerHTML = '<option value="">â€” Selecione um mapa â€”</option>' +
        S.maps.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join('');
      if (S.currentMapId) sel.value = S.currentMapId;
    } catch (_) {}
    updateToolbar();
  }

  function updateToolbar() {
    const hasMapa = !!S.currentMapId;
    const hasKml  = hasMapa && S.kmlAreas.length > 0;
    $('mi-btn-importar').style.display = hasMapa ? '' : 'none';
    $('mi-btn-dados').style.display    = hasKml  ? '' : 'none';
    $('mi-btn-excluir').style.display  = hasMapa ? '' : 'none';
    if (hasKml) {
      if (S.hasData) {
        $('mi-btn-dados').innerHTML = 'ALTERAR DADOS';
        $('mi-btn-dados').className = 'mi-btn mi-btn-warning';
      } else {
        $('mi-btn-dados').innerHTML = 'INSERIR DADOS';
        $('mi-btn-dados').className = 'mi-btn mi-btn-info';
      }
    }
  }

  async function loadMap(mapId) {
    if (!mapId) return;
    S.currentMapId = mapId;
    try {
      S.currentMap = await apiMap(`/farm-maps/${mapId}`);
      S.savedAreas = await apiMap(`/farm-maps/${mapId}/areas`) || [];
    } catch (_) { S.savedAreas = []; }

    if (S.currentMap && S.currentMap.kml_content) {
      const raw = parseKML(S.currentMap.kml_content);
      S.kmlAreas = normalizeToSVG(raw, 900, 520);
      renderSVG();
      $('mi-legend').style.display = '';
    } else {
      S.kmlAreas = [];
      $('mi-map-inner').innerHTML = `<div class="mi-map-empty">
        <svg viewBox="0 0 24 24"><path d="M3 6.5 9 4l6 2.5 6-2.5v13L15 19.5 9 17 3 19.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/></svg>
        <span>Mapa criado com sucesso!</span>
        <small>Clique em <strong>IMPORTAR MAPA (.KML)</strong><br>para visualizar as Ã¡reas</small>
      </div>`;
      $('mi-legend').style.display = 'none';
    }
    clearSidePanel();
    S.hasData = S.savedAreas.some((a) => a.has_data);
    updateToolbar();
  }

  function renderSVG() {
    $('mi-map-inner').innerHTML = buildSVG(S.kmlAreas, S.savedAreas, 900, 520);
    document.querySelectorAll('.map-area-group').forEach((g) => {
      g.onclick = () => onAreaClick(g.dataset.key, g.dataset.name);
    });
  }

  async function onAreaClick(key, name) {
    document.querySelectorAll('.map-area-group').forEach((g) => g.classList.remove('selected'));
    const grp = document.querySelector(`.map-area-group[data-key="${key}"]`);
    if (grp) grp.classList.add('selected');
    S.selectedAreaKey = key;

    let saved = S.savedAreas.find((a) => a.area_key === key);
    if (!saved && S.currentMapId) {
      try {
        saved = await apiMap(`/farm-maps/${S.currentMapId}/areas`, {
          method:'POST',
          body:JSON.stringify({ area_key:key, name, area_type:'pasto', color:AREA_COLORS.pasto })
        });
        S.savedAreas.push(saved);
      } catch (_) {}
    }
    S.selectedAreaId = saved ? saved.id : null;

    // Buscar contagem real de animais (Alt 14)
    let livestockSummary = null;
    if (S.selectedAreaId) {
      try {
        const r = await apiMap(`/map-areas/${S.selectedAreaId}/livestock-summary`);
        if (r && typeof r.count === 'number') livestockSummary = r;
      } catch (_) {}
    }

    // Carregar dados da area
    if (S.selectedAreaId && !S.areaDataCache[S.selectedAreaId]) {
      try {
        const raw = await apiMap(`/map-areas/${S.selectedAreaId}/data`);
        const grouped = {};
        (raw || []).forEach((d) => {
          if (!grouped[d.category]) grouped[d.category] = {};
          grouped[d.category][d.field_key] = d;
        });
        S.areaDataCache[S.selectedAreaId] = grouped;
      } catch (_) { S.areaDataCache[S.selectedAreaId] = {}; }
    }

    await renderSidePanel(name, saved, livestockSummary);
  }

  async function saveAreaTypeColor(areaId, areaType, color, paddockId) {
    try {
      // Get existing area data to preserve name/notes
      const existing = S.savedAreas.find((a) => a.id === areaId) || {};
      await apiMap(`/map-areas/${areaId}`, { method:'PUT', body:JSON.stringify({
        name: existing.name || S.selectedAreaKey || 'Area',
        area_type: areaType,
        color,
        polygon_coords: existing.polygon_coords || null,
        notes: existing.notes || null,
        paddock_id: paddockId || null
      }) });
      // Update savedAreas cache
      const idx = S.savedAreas.findIndex((a) => a.id === areaId);
      if (idx >= 0) { S.savedAreas[idx].area_type = areaType; S.savedAreas[idx].color = color; S.savedAreas[idx].paddock_id = paddockId || null; }
      renderSVG();
      // Re-select the area
      document.querySelectorAll('.map-area-group').forEach((g) => g.classList.remove('selected'));
      const grp = document.querySelector(`.map-area-group[data-key="${S.selectedAreaKey}"]`);
      if (grp) grp.classList.add('selected');
    } catch (err) { await mapaAlert('Erro ao salvar: ' + err.message); }
  }

  async function autoCreateFarmRecord(areaType, areaName) {
    const token = localStorage.getItem('farm_token') || '';
    const headers = { 'Content-Type':'application/json', Authorization: `Bearer ${token}` };
    try {
      if (areaType === 'pasto') {
        // Check if paddock with this name already exists
        const existing = await fetch(`${API_MAP}/paddocks`, { headers }).then(r=>r.json()).catch(()=>({data:[]}));
        const exists = (existing.data||[]).some((p) => p.name.toLowerCase() === areaName.toLowerCase());
        if (!exists) {
          await fetch(`${API_MAP}/paddocks`, { method:'POST', headers, body:JSON.stringify({ name:areaName, status:'ativo' }) });
        }
      } else if (areaType === 'talhao') {
        const existing = await fetch(`${API_MAP}/plots`, { headers }).then(r=>r.json()).catch(()=>({data:[]}));
        const exists = (existing.data||[]).some((p) => p.name.toLowerCase() === areaName.toLowerCase());
        if (!exists) {
          await fetch(`${API_MAP}/plots`, { method:'POST', headers, body:JSON.stringify({ name:areaName }) });
        }
      }
    } catch (_) {}
  }

  async function renderSidePanel(name, saved, livestockSummary) {
    const body = $('mi-side-body');
    const areaType = (saved && saved.area_type) ? saved.area_type : 'pasto';
    const currentColor = (saved && saved.color) ? saved.color : (AREA_COLORS[areaType] || AREA_COLORS.pasto);
    const data = S.areaDataCache[S.selectedAreaId] || {};
    const currentPaddockId = (saved && saved.paddock_id) ? String(saved.paddock_id) : '';
    const animalCount = (livestockSummary && typeof livestockSummary.count === 'number') ? livestockSummary.count : null;
    const linkedLots = Array.isArray(livestockSummary?.lots) ? livestockSummary.lots : [];

    // Carrega lista de pastos para o seletor
    let paddockOptions = '<option value="">â€” Nenhum â€”</option>';
    try {
      const paddocks = await apiMap('/paddocks-list');
      if (Array.isArray(paddocks)) {
        paddockOptions += paddocks.map((p) =>
          `<option value="${p.id}" ${String(p.id) === currentPaddockId ? 'selected' : ''}>${esc(p.name)}</option>`
        ).join('');
      }
    } catch (_) {}

    let html = `<div class="mi-area-name">${esc(name)}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;background:#f4faf6;border-radius:10px;padding:10px">
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end">
          <div>
            <label style="font-size:10px;font-weight:700;color:#5f7a69;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px">Tipo de Ãrea</label>
            <select id="mi-area-type-sel" style="width:100%;padding:7px 10px;border:1px solid #d6e8db;border-radius:8px;font-size:13px;color:#0f5132;background:#fff">
              ${Object.entries(AREA_TYPE_LABELS).map(([k,v]) => `<option value="${k}" ${k===areaType?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:10px;font-weight:700;color:#5f7a69;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px">Cor</label>
            <input type="color" id="mi-area-color-inp" value="${esc(currentColor)}" style="width:42px;height:34px;border:1px solid #d6e8db;border-radius:8px;cursor:pointer;padding:2px;background:#fff" />
          </div>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#5f7a69;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:4px">Pasto Vinculado</label>
          <select id="mi-area-paddock-sel" style="width:100%;padding:7px 10px;border:1px solid #d6e8db;border-radius:8px;font-size:13px;color:#0f5132;background:#fff">
            ${paddockOptions}
          </select>
        </div>
        <button id="mi-area-save-type" style="padding:7px 14px;background:#0f5132;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;width:100%">Salvar tipo / cor / pasto</button>
      </div>`;

    Object.entries(CAT_LABELS).forEach(([catKey, catLabel]) => {
      const catData = data[catKey] || {};
      const fields = FIELD_DEFS[catKey] || [];
      const hasAny = fields.some((f) => {
        if (catData[f.key] && catData[f.key].value) return true;
        if (catKey === 'gado' && f.key === 'qtd_animais' && animalCount !== null && animalCount > 0) return true;
        return false;
      });

      html += `<div class="mi-cat-block"><div class="mi-cat-title">${catLabel}</div>`;
      if (!hasAny) {
        html += `<div class="mi-no-data">Sem dados cadastrados</div>`;
      } else {
        html += `<div class="mi-fields-grid">`;
        fields.filter((f) => f.type !== 'textarea').forEach((f) => {
          let val = (catData[f.key] && catData[f.key].value) ? catData[f.key].value : '';
          if (catKey === 'gado' && f.key === 'raca_predominante' && !val && livestockSummary?.predominant_breed) val = livestockSummary.predominant_breed;
          if (catKey === 'gado' && f.key === 'categoria' && !val && livestockSummary?.categories) val = livestockSummary.categories;
          if (catKey === 'gado' && f.key === 'qtd_animais' && animalCount !== null) val = String(animalCount);
          if (!val) return;
          const unit = f.unit ? ` ${f.unit}` : '';
          html += `<div class="mi-field"><span class="mi-field-label">${esc(f.label)}</span><span class="mi-field-value">${esc(val)}${unit}</span></div>`;
        });
        if (catKey === 'gado' && linkedLots.length) {
          html += `<div class="mi-field" style="grid-column:1/-1"><span class="mi-field-label">Lotes vinculados</span><span class="mi-field-value">${esc(linkedLots.map((lot) => `${lot.name} (${lot.quantity})`).join(', '))}</span></div>`;
        }
        html += `</div>`;
        fields.filter((f) => f.type === 'textarea').forEach((f) => {
          const val = (catData[f.key] && catData[f.key].value) ? catData[f.key].value : '';
          if (!val) return;
          html += `<div class="mi-field" style="margin-top:6px"><span class="mi-field-label">${esc(f.label)}</span><span class="mi-field-value" style="font-weight:500;font-size:12px">${esc(val)}</span></div>`;
        });
      }
      html += `</div>`;
    });

    body.innerHTML = html;

    // Bind save type/color button
    const saveTypeBtn = document.getElementById('mi-area-save-type');
    if (saveTypeBtn && S.selectedAreaId) {
      saveTypeBtn.onclick = async () => {
        const sel = document.getElementById('mi-area-type-sel');
        const colorInp = document.getElementById('mi-area-color-inp');
        const paddockSel = document.getElementById('mi-area-paddock-sel');
        if (!sel || !colorInp) return;
        const newType = sel.value;
        const newColor = colorInp.value;
        const newPaddockId = paddockSel ? (paddockSel.value || null) : null;
        await saveAreaTypeColor(S.selectedAreaId, newType, newColor, newPaddockId);
        // Auto-create farm record if pasto or talhao
        const savedArea = S.savedAreas.find((a) => a.id === S.selectedAreaId);
        if (savedArea) await autoCreateFarmRecord(newType, savedArea.name || name);
        await mapaAlert('Tipo, cor e pasto salvos!');
        // Re-render side panel
        const updatedSaved = S.savedAreas.find((a) => a.id === S.selectedAreaId);
        let livestockSummary = null;
        try {
          const r = await apiMap(`/map-areas/${S.selectedAreaId}/livestock-summary`);
          if (r && typeof r.count === 'number') livestockSummary = r;
        } catch (_) {}
        await renderSidePanel(name, updatedSaved, livestockSummary);
      };
    }

    // Auto-update color when type changes
    const typeSelEl = document.getElementById('mi-area-type-sel');
    const colorInpEl = document.getElementById('mi-area-color-inp');
    if (typeSelEl && colorInpEl) {
      typeSelEl.onchange = () => {
        const autoColor = AREA_COLORS[typeSelEl.value];
        if (autoColor) colorInpEl.value = autoColor;
      };
    }
  }

  function clearSidePanel() {
    $('mi-side-body').innerHTML = '<div class="mi-side-empty">Clique em uma Ã¡rea do mapa para ver as informaÃ§Ãµes cadastradas.</div>';
    S.selectedAreaKey = null;
    S.selectedAreaId  = null;
  }

  async function openDataModal() {
    if (!S.selectedAreaId) { mapaAlert('Clique em uma Ã¡rea do mapa primeiro.'); return; }
    $('mi-modal-title').textContent = S.hasData ? 'Alterar Dados da Ãrea' : 'Inserir Dados da Ãrea';
    $('mi-modal-dados').classList.add('open');
    S.activeCat = 'gado';
    document.querySelectorAll('.mi-modal-tab').forEach((t) => t.classList.toggle('active', t.dataset.cat === 'gado'));
    await renderModalTab('gado');
    // Focus first input after render to activate keyboard in Electron
    setTimeout(() => {
      const firstInput = $('mi-modal-body') && $('mi-modal-body').querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 80);
  }

  function makeEl(tag, attrs, parent) {
    const el = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'textContent') el.textContent = v;
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v);
    });
    // Ensure interactive elements are always focusable/editable in Electron
    if (['input', 'select', 'textarea'].includes(tag.toLowerCase())) {
      el.style.pointerEvents = 'auto';
      el.style.userSelect = 'auto';
      el.style.webkitUserSelect = 'auto';
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      if (!el.getAttribute('tabindex')) el.setAttribute('tabindex', '0');
    }
    if (parent) parent.appendChild(el);
    return el;
  }

  async function renderModalTab(cat) {
    const body = $('mi-modal-body');
    body.innerHTML = '';
    const fields = FIELD_DEFS[cat] || [];
    const cached = (S.areaDataCache[S.selectedAreaId] && S.areaDataCache[S.selectedAreaId][cat]) ? S.areaDataCache[S.selectedAreaId][cat] : {};
    const firstKey = Object.keys(cached)[0];
    const dateVal = (cached[firstKey] && cached[firstKey].recorded_at) ? cached[firstKey].recorded_at.slice(0,10) : today();

    // Busca contagem real de animais para pre-preencher qtd_animais na aba gado
    let liveAnimalCount = null;
    if (cat === 'gado' && S.selectedAreaId) {
      try {
        const r = await apiMap(`/map-areas/${S.selectedAreaId}/animal-count`);
        if (r && typeof r.count === 'number') liveAnimalCount = r.count;
      } catch (_) {}
    }

    // Data row
    const dateRow = makeEl('div', { class: 'mi-form-row' }, body);
    const dateGrp = makeEl('div', { class: 'mi-form-group', style: 'grid-column:1/-1' }, dateRow);
    makeEl('label', { textContent: 'Data do Registro' }, dateGrp);
    const dateInp = makeEl('input', { type: 'date', id: 'mi-field-date', value: dateVal }, dateGrp);
    dateInp.value = dateVal;

    const nonTA = fields.filter((f) => f.type !== 'textarea');
    const tas   = fields.filter((f) => f.type === 'textarea');

    for (let i = 0; i < nonTA.length; i += 2) {
      const row = makeEl('div', { class: 'mi-form-row' }, body);
      [nonTA[i], nonTA[i+1]].filter(Boolean).forEach((f) => {
        let val = (cached[f.key] && cached[f.key].value) ? cached[f.key].value : '';
        // Pre-preenche qtd_animais com contagem real se for > 0 (tem prioridade sobre valor salvo)
        if (cat === 'gado' && f.key === 'qtd_animais' && liveAnimalCount !== null) {
          val = String(liveAnimalCount);
        }
        const labelTxt = f.label + (f.unit ? ` (${f.unit})` : '');
        const grp = makeEl('div', { class: 'mi-form-group' }, row);
        makeEl('label', { textContent: labelTxt }, grp);
        let input;
        if (f.type === 'select') {
          input = makeEl('select', { id: 'mi-f-' + f.key }, grp);
          (f.options || []).forEach((o) => {
            const opt = makeEl('option', { value: o, textContent: o }, input);
            if (o === val) opt.selected = true;
          });
          if (val) input.value = val;
        } else if (f.type === 'date') {
          input = makeEl('input', { type: 'date', id: 'mi-f-' + f.key }, grp);
          input.value = val;
        } else {
          input = makeEl('input', { type: 'text', id: 'mi-f-' + f.key, placeholder: f.hint || f.label }, grp);
          input.value = val;
        }
      });
    }

    tas.forEach((f) => {
      const val = (cached[f.key] && cached[f.key].value) ? cached[f.key].value : '';
      const row = makeEl('div', { class: 'mi-form-row single' }, body);
      const grp = makeEl('div', { class: 'mi-form-group' }, row);
      makeEl('label', { textContent: f.label }, grp);
      const ta = makeEl('textarea', { id: 'mi-f-' + f.key, placeholder: f.label }, grp);
      ta.value = val;
    });
  }

  async function saveModalData() {
    if (!S.selectedAreaId) return;
    const cat = S.activeCat;
    const fields = FIELD_DEFS[cat] || [];
    const date = ($('mi-field-date') && $('mi-field-date').value) ? $('mi-field-date').value : today();
    const payload = fields.map((f) => {
      const el = $(`mi-f-${f.key}`);
      return { key:f.key, label:f.label, value: el ? el.value : '', unit: f.unit || '' };
    });
    try {
      const result = await apiMap(`/map-areas/${S.selectedAreaId}/data`, {
        method:'POST',
        body:JSON.stringify({ category:cat, fields:payload, recorded_at:date })
      });
      if (!S.areaDataCache[S.selectedAreaId]) S.areaDataCache[S.selectedAreaId] = {};
      const grouped = {};
      (result || []).forEach((d) => { grouped[d.field_key] = d; });
      S.areaDataCache[S.selectedAreaId][cat] = grouped;
      S.hasData = true;
      updateToolbar();
    } catch (err) { await mapaAlert('Erro ao salvar:<br>' + err.message); }
  }

  async function saveAllAndClose() {
    await saveModalData();
    $('mi-modal-dados').classList.remove('open');
    if (S.selectedAreaId && S.selectedAreaKey) {
      // Limpa cache e recarrega dados frescos do banco
      delete S.areaDataCache[S.selectedAreaId];
      try {
        const raw = await apiMap(`/map-areas/${S.selectedAreaId}/data`);
        const grouped = {};
        (raw || []).forEach((d) => {
          if (!grouped[d.category]) grouped[d.category] = {};
          grouped[d.category][d.field_key] = d;
        });
        S.areaDataCache[S.selectedAreaId] = grouped;
      } catch (_) { S.areaDataCache[S.selectedAreaId] = {}; }

      const saved = S.savedAreas.find((a) => a.id === S.selectedAreaId);
      let livestockSummary = null;
      try {
        const r = await apiMap(`/map-areas/${S.selectedAreaId}/livestock-summary`);
        if (r && typeof r.count === 'number') livestockSummary = r;
      } catch (_) {}
      if (saved) await renderSidePanel(saved.name, saved, livestockSummary);
    }
  }

  async function confirmCancelModal() {
    const ok = await mapaConfirm('DESEJA MESMO CANCELAR A OPERAÃ‡ÃƒO?<br>TODOS OS DADOS NÃƒO SALVOS SERÃƒO PERDIDOS.');
    if (ok) $('mi-modal-dados').classList.remove('open');
  }

  $('mi-modal-close').onclick  = () => confirmCancelModal();
  $('mi-modal-cancel').onclick = () => confirmCancelModal();
  $('mi-modal-save').onclick   = saveAllAndClose;

  document.querySelectorAll('.mi-modal-tab').forEach((tab) => {
    tab.onclick = async () => {
      if (S.selectedAreaId) await saveModalData();
      S.activeCat = tab.dataset.cat;
      document.querySelectorAll('.mi-modal-tab').forEach((t) => t.classList.toggle('active', t === tab));
      await renderModalTab(S.activeCat);
    };
  });

  $('mi-modal-dados').addEventListener('click', (e) => {
    if (e.target === $('mi-modal-dados')) confirmCancelModal();
  });
  // Prevent overlay from stealing focus from inputs
  $('mi-modal-dados').addEventListener('mousedown', (e) => {
    const modal = $('mi-modal-dados').querySelector('.mi-modal');
    if (modal && modal.contains(e.target)) return;
  });

  $('mi-btn-novo').onclick = async () => {
    const name = await mapaPrompt('Nome do novo mapa:', 'Ex: Fazenda Boa EsperanÃ§a');
    if (!name) return;
    try {
      const m = await apiMap('/farm-maps', { method:'POST', body:JSON.stringify({ name:name.trim(), image_type:'kml' }) });
      S.currentMapId = m.id;
      await loadMaps();
      sel.value = m.id;
      await loadMap(m.id);
    } catch (err) { await mapaAlert('Erro: ' + err.message); }
  };

  $('mi-btn-importar').onclick = () => {
    if (!S.currentMapId) { mapaAlert('Selecione ou crie um mapa primeiro.'); return; }
    $('mi-kml-input').click();
  };

  $('mi-kml-input').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      await apiMap(`/farm-maps/${S.currentMapId}`, {
        method:'PUT',
        body:JSON.stringify({ name: (S.currentMap && S.currentMap.name) ? S.currentMap.name : 'Mapa', kml_content:text, image_type:'kml' })
      });
      await loadMap(S.currentMapId);
      await loadMaps();
    } catch (err) { await mapaAlert('Erro ao importar KML:<br>' + err.message); }
    e.target.value = '';
  };

  $('mi-btn-dados').onclick = openDataModal;

  $('mi-btn-excluir').onclick = async () => {
    if (!S.currentMapId) return;
    const ok = await mapaConfirm('DESEJA REALMENTE EXCLUIR O MAPA E TODOS SEUS DADOS?<br>TODAS AS INFORMAÃ‡Ã•ES SERÃƒO PERDIDAS.');
    if (!ok) return;
    try {
      await apiMap(`/farm-maps/${S.currentMapId}`, { method:'DELETE' });
      S.currentMapId = null; S.currentMap = null; S.kmlAreas = []; S.savedAreas = []; S.hasData = false;
      $('mi-map-inner').innerHTML = `<div class="mi-map-empty">
        <svg viewBox="0 0 24 24"><path d="M3 6.5 9 4l6 2.5 6-2.5v13L15 19.5 9 17 3 19.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/></svg>
        <span>Mapa excluÃ­do.</span><small>Crie um novo mapa para comeÃ§ar</small>
      </div>`;
      $('mi-legend').style.display = 'none';
      clearSidePanel();
      await loadMaps();
    } catch (err) { await mapaAlert('Erro: ' + err.message); }
  };

  sel.onchange = async (e) => {
    const id = parseInt(e.target.value);
    if (id) {
      S.currentMapId = id;      await loadMap(id);
    } else {
      S.currentMapId = null; S.currentMap = null; S.kmlAreas = []; S.savedAreas = []; S.hasData = false;
      $('mi-map-inner').innerHTML = `<div class="mi-map-empty">
        <svg viewBox="0 0 24 24"><path d="M3 6.5 9 4l6 2.5 6-2.5v13L15 19.5 9 17 3 19.5z"/><path d="M9 4v13"/><path d="M15 6.5v13"/></svg>
        <span>Selecione ou crie um mapa</span>
        <small>ApÃ³s criar, importe um arquivo .KML<br>para visualizar as Ã¡reas da fazenda</small>
      </div>`;
      $('mi-legend').style.display = 'none';
      clearSidePanel();
      updateToolbar();
    }
  };

  await loadMaps();
  if (S.maps.length) {
    S.currentMapId = S.maps[0].id;
    sel.value = S.currentMapId;
    await loadMap(S.currentMapId);
  }

  // Expose sync function for when animals are created/updated/deleted
  window.syncMapAnimalCount = async () => {
    if (!S.selectedAreaId || !S.selectedAreaKey) return;
    try {
      const r = await apiMap(`/map-areas/${S.selectedAreaId}/livestock-summary`);
      const livestockSummary = (r && typeof r.count === 'number') ? r : null;
      const saved = S.savedAreas.find((a) => a.id === S.selectedAreaId);
      if (saved) {
        const savedName = saved.name || S.selectedAreaKey;
        // Invalidate cache to force reload
        delete S.areaDataCache[S.selectedAreaId];
        const raw = await apiMap(`/map-areas/${S.selectedAreaId}/data`).catch(() => []);
        const grouped = {};
        (raw || []).forEach((d) => { if (!grouped[d.category]) grouped[d.category] = {}; grouped[d.category][d.field_key] = d; });
        S.areaDataCache[S.selectedAreaId] = grouped;
        await renderSidePanel(savedName, saved, livestockSummary);
      }
    } catch (_) {}
  };
}

window.renderMapaInterativo = renderMapaInterativo;

