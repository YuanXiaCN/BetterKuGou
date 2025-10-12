// preload.js
const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  unmaximize: () => ipcRenderer.send('window-unmaximize'),
  close: () => ipcRenderer.send('window-close'),
  onMaximized: (cb) => ipcRenderer.on('window-is-maximized', cb),
  onUnmaximized: (cb) => ipcRenderer.on('window-is-unmaximized', cb),
  
  // 外部链接打开 API
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
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
  },

  // 播放器相关: 向主进程汇报当前歌曲/状态
  updateTrack: (track) => {
    if (!track || typeof track !== 'object') return
    ipcRenderer.send('player:track-update', {
      title: track.title || track.name || '未知歌曲',
      cover: track.cover || track.pic || track.image || null,
      artist: track.artist || track.singername || '未知歌手'
    })
  },
  updatePlaybackState: (isPlaying) => {
    ipcRenderer.send('player:playback-state', isPlaying ? 'playing' : 'paused')
  },
  updateLyrics: (lyrics) => {
    if (Array.isArray(lyrics)) {
      console.log('📡 preload发送歌词数据:', lyrics.length, '行')
      ipcRenderer.send('player:lyric-update', lyrics)
    } else {
      console.log('❌ 歌词数据格式错误:', typeof lyrics)
    }
  },
  updateCurrentTime: (time) => {
    if (typeof time === 'number') {
      // 减少日志频率，只在整数秒时输出
      if (Math.floor(time) !== Math.floor(time - 0.1)) {
        console.log('⏱️ preload发送当前时间:', Math.floor(time * 1000), 'ms')
      }
      ipcRenderer.send('player:time-update', time * 1000) // 转换为毫秒
    }
  },
  updatePlaybackTime: (time) => {
    if (typeof time === 'number') {
      console.log('⏱️ preload发送播放时间:', time)
      ipcRenderer.send('player:time-update', time)
    }
  },
  onPlayerControl: (callback) => {
    if (typeof callback !== 'function') return () => {}
    const listener = (_e, action) => callback(action)
    ipcRenderer.on('player:control', listener)
    return () => ipcRenderer.removeListener('player:control', listener)
  },
  
  // 桌面歌词相关API
  desktopLyric: {
    toggle: () => ipcRenderer.invoke('desktop-lyric:toggle'),
    show: () => ipcRenderer.invoke('desktop-lyric:show'),
    hide: () => ipcRenderer.invoke('desktop-lyric:hide')
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