const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Library
  pickFolder: () => ipcRenderer.invoke('library:pickFolder'),
  rescanLast: () => ipcRenderer.invoke('library:rescanLast'),

  // Playlists
  getPlaylists: () => ipcRenderer.invoke('playlists:getAll'),
  savePlaylists: (playlists) => ipcRenderer.invoke('playlists:save', playlists),

  // Automations
  getAutomations: () => ipcRenderer.invoke('automations:getAll'),
  saveAutomations: (rules) => ipcRenderer.invoke('automations:save', rules),

  // System events (for automation triggers like lid close / resume)
  onSystemEvent: (callback) => {
    if (typeof callback !== 'function') return () => {};

    const listener = (_event, eventName) => callback(eventName);
    ipcRenderer.on('system:event', listener);

    return () => {
      ipcRenderer.off('system:event', listener);
    };
  }
});
