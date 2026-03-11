const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gestorAgroMeta', {
  appName: 'Gestor Agro',
  version: '5.2.0'
});

contextBridge.exposeInMainWorld('gestorAgroApp', {
  openGroup: (group) => ipcRenderer.invoke('app:open-group', group),
  focusHome: () => ipcRenderer.invoke('app:open-group', 'home')
});
