const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const startServer = require('../servidor');

let serverInstance;
const groupWindows = new Map();

const GROUP_META = {
  home:        { title: 'Gestor Agro' },
  farm:        { title: 'Fazenda · Gestor Agro' },
  livestock:   { title: 'Pecuária · Gestor Agro' },
  stock:       { title: 'Estoque · Gestor Agro' },
  agriculture: { title: 'Agricultura · Gestor Agro' },
  finance:     { title: 'Financeiro · Gestor Agro' },
  settings:    { title: 'Configurações · Gestor Agro' }
};

function loadEnvConfig() {
  const envPath    = path.join(process.cwd(), '.env');
  const examplePath = path.join(process.cwd(), '.env.exemplo');
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
  }
  require('dotenv').config({ path: envPath });
}

async function createAppWindow(group = 'home') {
  const meta = GROUP_META[group] || GROUP_META.home;
  const existing = groupWindows.get(group);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return existing;
  }

  const win = new BrowserWindow({
    width:  group === 'home' ? 1460 : 1380,
    height: 900,
    minWidth:  1180,
    minHeight: 760,
    title: meta.title,
    backgroundColor: '#ffffff',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.maximize();
  groupWindows.set(group, win);
  win.on('closed', () => groupWindows.delete(group));

  win.webContents.on('context-menu', (_event, params) => {
    const menu = Menu.buildFromTemplate([{
      label: 'Inspecionar',
      click: () => {
        win.webContents.inspectElement(params.x, params.y);
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.devToolsWebContents.focus();
        }
      }
    }]);
    menu.popup({ window: win });
  });

  win.webContents.on('before-input-event', (_event, input) => {
    if (input.control && input.shift && String(input.key || '').toLowerCase() === 'i') {
      win.webContents.toggleDevTools();
    }
  });

  await win.loadFile(path.join(__dirname, '../interface/index.html'), { query: { group } });
  return win;
}

app.whenReady().then(async () => {
  try {
    loadEnvConfig();
    Menu.setApplicationMenu(null);
    serverInstance = await startServer({
      host:     process.env.DB_HOST     || 'localhost',
      port:     Number(process.env.DB_PORT || 5432),
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME     || 'farmmanager',
      appPort:  Number(process.env.APP_PORT || 4312)
    });
    await createAppWindow('home');
  } catch (error) {
    dialog.showErrorBox('Erro ao iniciar o Gestor Agro', error.message || String(error));
    app.quit();
  }
});

ipcMain.handle('app:open-group', async (_event, group) => createAppWindow(group));

app.on('window-all-closed', async () => {
  if (serverInstance?.close) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) await createAppWindow('home');
});
