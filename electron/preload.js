// preload.js
const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  unmaximize: () => ipcRenderer.send('window-unmaximize'),
  close: () => ipcRenderer.send('window-close'),
  onMaximized: (cb) => ipcRenderer.on('window-is-maximized', cb),
  onUnmaximized: (cb) => ipcRenderer.on('window-is-unmaximized', cb),
  
  // 全局快捷键 API
  registerGlobalShortcut: (accelerator, action) => 
    ipcRenderer.invoke('shortcut:register', accelerator, action),
  unregisterGlobalShortcut: (accelerator) => 
    ipcRenderer.invoke('shortcut:unregister', accelerator),
  testGlobalShortcut: (accelerator) => 
    ipcRenderer.invoke('shortcut:test', accelerator),
  onGlobalShortcut: (callback) => {
    if (typeof callback !== 'function') return () => {}
    const listener = (_event, action) => callback(action)
    ipcRenderer.on('shortcut:triggered', listener)
    return () => ipcRenderer.removeListener('shortcut:triggered', listener)
  },
  
  // 内存清理 API
  onMemoryCleanup: (callback) => {
    if (typeof callback !== 'function') return () => {}
    const listener = () => callback()
    ipcRenderer.on('memory-cleanup', listener)
    return () => ipcRenderer.removeListener('memory-cleanup', listener)
  }
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