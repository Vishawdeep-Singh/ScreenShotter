const { contextBridge, ipcRenderer } = require('electron');

// Expose API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
});