// preload.js
const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  unmaximize: () => ipcRenderer.send('window-unmaximize'),
  close: () => ipcRenderer.send('window-close'),
  onMaximized: (cb) => ipcRenderer.on('window-is-maximized', cb),
  onUnmaximized: (cb) => ipcRenderer.on('window-is-unmaximized', cb)
}

const settingsAPI = {
  get: () => ipcRenderer.invoke('settings:get'),
  getDefaults: () => ipcRenderer.invoke('settings:get-defaults'),
  getDefaultPaths: () => ipcRenderer.invoke('settings:get-default-paths'),
  set: (payload) => ipcRenderer.invoke('settings:set', payload),
  export: (targetPath) => ipcRenderer.invoke('settings:export', targetPath),
  import: () => ipcRenderer.invoke('settings:import'),
  chooseDirectory: (options) => ipcRenderer.invoke('settings:choose-directory', options),
  onUpdate: (callback) => {
    if (typeof callback !== 'function') return () => {}
    const listener = (_event, settings) => callback(settings)
    ipcRenderer.on('settings:updated', listener)
    return () => ipcRenderer.removeListener('settings:updated', listener)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
contextBridge.exposeInMainWorld('settingsAPI', settingsAPI)