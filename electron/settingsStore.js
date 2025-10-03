const fs = require('fs')
const fsp = fs.promises
const path = require('path')

const {
  isAutoLaunchSupported,
  getAutoLaunchEnabled,
  setAutoLaunchEnabled
} = require('./autoLaunch')

const CURRENT_SCHEMA_VERSION = 1

const listeners = new Set()

let settingsFilePath = null
let defaultsCache = null
let settingsCache = null
let appRef = null
let initPromise = null

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function cloneDeep(value) {
  if (value === undefined) return undefined
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (err) {
      // fall through
    }
  }
  return JSON.parse(JSON.stringify(value))
}

function mergeDeep(target, source) {
  if (!isPlainObject(target) && !Array.isArray(target)) {
    return cloneDeep(source)
  }
  const output = Array.isArray(target) ? target.slice() : { ...target }
  Object.keys(source || {}).forEach((key) => {
    const sourceValue = source[key]
    if (Array.isArray(sourceValue)) {
      output[key] = sourceValue.slice()
      return
    }
    if (isPlainObject(sourceValue)) {
      output[key] = mergeDeep(output[key], sourceValue)
      return
    }
    output[key] = sourceValue
  })
  return output
}

function ensureSchema(settings) {
  let normalized = cloneDeep(settings)
  if (!isPlainObject(normalized)) {
    normalized = {}
  }
  if (normalized.schemaVersion == null) {
    normalized.schemaVersion = CURRENT_SCHEMA_VERSION
  }
  if (normalized.schemaVersion < CURRENT_SCHEMA_VERSION) {
    normalized.schemaVersion = CURRENT_SCHEMA_VERSION
    normalized = mergeDeep(defaultsCache, normalized)
  } else {
    normalized = mergeDeep(defaultsCache, normalized)
  }
  return normalized
}

function notifyListeners() {
  const snapshot = cloneDeep(settingsCache)
  listeners.forEach((listener) => {
    try {
      listener(snapshot)
    } catch (err) {
      console.error('[settingsStore] listener error:', err)
    }
  })
}

async function readSettingsFromDisk() {
  try {
    const raw = await fsp.readFile(settingsFilePath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[settingsStore] 读取设置文件失败，将使用默认值:', err)
    }
    return null
  }
}

async function writeSettingsToDisk(settings) {
  const data = JSON.stringify(settings, null, 2)
  await fsp.writeFile(settingsFilePath, data, 'utf8')
}

function createDefaults(app) {
  const downloadsDir = app.getPath('downloads')
  const userDataDir = app.getPath('userData')
  const cacheDir = path.join(userDataDir, 'Cache')

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    playback: {
      fullscreenLyrics: true,
      enqueueFullPlaylist: true
    },
    download: {
      downloadPath: path.join(downloadsDir, 'BetterKugou'),
      cachePath: cacheDir,
      cacheSizeIndex: 0,
      concurrentDownloads: 3
    },
    custom: {
      playerStyle: 'default',
      theme: 'dark',
      customTheme: {
        primary: '#667eea',
        hover: '#764ba2',
        background: '#1f1f1f'
      }
    },
    software: {
      autoLaunch: false,
      restorePlaylist: true,
      restorePlaybackState: true,
      defaultPage: 'home'
    },
    session: {
      playlist: [],
      playlistIndex: 0,
      currentSong: null,
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 80,
        playMode: 'loop'
      }
    }
  }
}

async function initSettingsStore(app) {
  if (initPromise) return initPromise
  initPromise = (async () => {
    appRef = app
    const userDataDir = app.getPath('userData')
    settingsFilePath = path.join(userDataDir, 'settings.json')
    defaultsCache = createDefaults(app)

    let stored = await readSettingsFromDisk()
    if (!stored) {
      stored = cloneDeep(defaultsCache)
      await writeSettingsToDisk(stored)
    }

    settingsCache = ensureSchema(stored)

    if (!settingsCache.software) {
      settingsCache.software = {}
    }

    if (isAutoLaunchSupported()) {
      try {
        const applied = setAutoLaunchEnabled(app, Boolean(settingsCache.software.autoLaunch))
        settingsCache.software.autoLaunch = applied
      } catch (err) {
        console.warn('[settingsStore] 初始化自启设置失败，将以系统实际状态为准:', err)
        try {
          const actual = getAutoLaunchEnabled(app)
          settingsCache.software.autoLaunch = actual
        } catch (readErr) {
          console.warn('[settingsStore] 读取系统自启状态失败，默认关闭:', readErr)
          settingsCache.software.autoLaunch = false
        }
      }
    } else {
      settingsCache.software.autoLaunch = false
    }

    // 如果 ensureSchema 增补了字段或修正了自启状态，写回磁盘
    await writeSettingsToDisk(settingsCache)

    return settingsCache
  })()
  return initPromise
}

function getSettings() {
  if (!settingsCache) {
    throw new Error('Settings store not initialized')
  }
  return cloneDeep(settingsCache)
}

async function setSettings(nextSettings, { merge = true } = {}) {
  if (!settingsCache) {
    throw new Error('Settings store not initialized')
  }
  let updated
  if (merge) {
    updated = mergeDeep(settingsCache, nextSettings)
  } else {
    updated = cloneDeep(nextSettings)
  }
  updated = ensureSchema(updated)
  if (!updated.software) {
    updated.software = {}
  }

  const requestedAutoLaunch = Boolean(updated.software.autoLaunch)
  let autoLaunchError = null

  if (!isAutoLaunchSupported()) {
    if (requestedAutoLaunch) {
      updated.software.autoLaunch = false
      autoLaunchError = new Error('AUTO_LAUNCH_UNSUPPORTED')
      autoLaunchError.code = 'AUTO_LAUNCH_UNSUPPORTED'
    }
  } else if (appRef) {
    try {
      const applied = setAutoLaunchEnabled(appRef, requestedAutoLaunch)
      updated.software.autoLaunch = applied
    } catch (err) {
      autoLaunchError = err
      try {
        const actual = getAutoLaunchEnabled(appRef)
        updated.software.autoLaunch = actual
      } catch (readErr) {
        updated.software.autoLaunch = false
        if (!autoLaunchError.code) {
          autoLaunchError.code = 'AUTO_LAUNCH_WRITE_FAILED'
        }
        autoLaunchError.cause = autoLaunchError.cause || err.cause || err
        autoLaunchError.details = { readError: readErr }
      }
    }
  }

  settingsCache = updated
  await writeSettingsToDisk(settingsCache)
  notifyListeners()

  if (autoLaunchError) {
    throw autoLaunchError
  }

  return getSettings()
}

function onSettingsChange(listener) {
  if (typeof listener !== 'function') return () => {}
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSettingsFilePath() {
  return settingsFilePath
}

function getDefaultSettings() {
  if (!defaultsCache) {
    throw new Error('Settings store not initialized')
  }
  return cloneDeep(defaultsCache)
}

function getDefaultPaths() {
  if (!defaultsCache) {
    throw new Error('Settings store not initialized')
  }
  return {
    downloadPath: defaultsCache.download.downloadPath,
    cachePath: defaultsCache.download.cachePath
  }
}

async function overwriteSettings(newSettings) {
  return setSettings(newSettings, { merge: false })
}

async function exportSettings(targetPath) {
  if (!targetPath) {
    throw new Error('targetPath is required for export')
  }
  const data = JSON.stringify(getSettings(), null, 2)
  await fsp.writeFile(targetPath, data, 'utf8')
  return targetPath
}

async function importSettings(sourcePath) {
  const raw = await fsp.readFile(sourcePath, 'utf8')
  const parsed = JSON.parse(raw)
  await overwriteSettings(parsed)
  return getSettings()
}

async function ensureCacheDirectory() {
  if (!settingsCache) return
  const cacheDir = settingsCache.download?.cachePath
  if (!cacheDir) return
  try {
    await fsp.mkdir(cacheDir, { recursive: true })
  } catch (err) {
    console.warn('[settingsStore] 创建缓存目录失败:', err)
  }
}

module.exports = {
  CURRENT_SCHEMA_VERSION,
  initSettingsStore,
  getSettings,
  setSettings,
  overwriteSettings,
  onSettingsChange,
  getSettingsFilePath,
  getDefaultSettings,
  getDefaultPaths,
  exportSettings,
  importSettings,
  ensureCacheDirectory
}
