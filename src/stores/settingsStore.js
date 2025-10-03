import { reactive, computed } from 'vue'
import { cloneDeep, mergeDeep, replaceReactive } from '../utils/objectUtils.js'
import { applyTheme } from '../utils/themeManager.js'

const LOCAL_STORAGE_KEY = 'betterkugou_settings'
const CURRENT_SCHEMA_VERSION = 1

const baseDefaultSettings = Object.freeze({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  playback: {
    fullscreenLyrics: true,
    enqueueFullPlaylist: true
  },
  download: {
    downloadPath: '',
    cachePath: '',
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
})

const state = reactive({
  settings: reactive(cloneDeep(baseDefaultSettings)),
  ready: false,
  loading: false,
  error: null,
  revision: 0
})

const bridge = typeof window !== 'undefined' ? window.settingsAPI : null

let initPromise = null
let defaultSnapshot = cloneDeep(baseDefaultSettings)
let unsubscribeExternalListener = null
let isApplyingExternalUpdate = false

async function resolvePathDefaults(settings) {
  const resolved = cloneDeep(settings)
  if (bridge?.getDefaultPaths) {
    try {
      const paths = await bridge.getDefaultPaths()
      if (paths?.downloadPath) {
        resolved.download.downloadPath = paths.downloadPath
      }
      if (paths?.cachePath) {
        resolved.download.cachePath = paths.cachePath
      }
      return resolved
    } catch (err) {
      console.warn('[settingsStore] 获取默认路径失败:', err)
    }
  }
  if (!resolved.download.downloadPath) {
    resolved.download.downloadPath = 'C:/Users/BetterKugou/Downloads'
  }
  if (!resolved.download.cachePath) {
    resolved.download.cachePath = 'C:/Users/BetterKugou/AppData/Local/BetterKugou/Cache'
  }
  return resolved
}

function applySettings(newSettings, { persist = false, notify = true } = {}) {
  replaceReactive(state.settings, newSettings)
  applyTheme(state.settings)
  if (notify) {
    state.revision += 1
  }
  if (persist) {
    void persistSettings()
  }
}

async function fetchDefaultSettings() {
  if (!bridge?.getDefaults) return cloneDeep(baseDefaultSettings)
  try {
    const defaults = await bridge.getDefaults()
    if (defaults && typeof defaults === 'object') {
      return mergeDeep(cloneDeep(baseDefaultSettings), defaults)
    }
  } catch (err) {
    console.warn('[settingsStore] 获取主进程默认设置失败:', err)
  }
  return cloneDeep(baseDefaultSettings)
}

async function loadFromBridge() {
  if (!bridge?.get) return null
  try {
    const remoteSettings = await bridge.get()
    if (remoteSettings && typeof remoteSettings === 'object') {
      return remoteSettings
    }
  } catch (err) {
    console.warn('[settingsStore] 读取主进程设置失败:', err)
  }
  return null
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (err) {
    console.warn('[settingsStore] 解析本地设置失败:', err)
  }
  return null
}

async function persistSettings() {
  const payload = cloneDeep(state.settings)
  state.error = null
  try {
    if (bridge?.set) {
      await bridge.set(payload)
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
    }
  } catch (err) {
    console.warn('[settingsStore] 持久化设置失败:', err)
    state.error = {
      source: 'persist',
      code: err?.code || 'UNKNOWN',
      message: err?.message || '保存设置失败'
    }
    if (bridge?.get) {
      try {
        isApplyingExternalUpdate = true
        const latest = await bridge.get()
        if (latest && typeof latest === 'object') {
          const migrated = migrateSettings(latest, defaultSnapshot)
          applySettings(migrated, { persist: false, notify: true })
        }
      } catch (fetchErr) {
        console.warn('[settingsStore] 回滚设置失败:', fetchErr)
      } finally {
        isApplyingExternalUpdate = false
      }
    }
    throw err
  }
}

function migrateSettings(rawSettings, defaults) {
  if (!rawSettings || typeof rawSettings !== 'object') {
    return cloneDeep(defaults)
  }
  const version = rawSettings.schemaVersion ?? 0
  let migrated = cloneDeep(rawSettings)

  if (version < 1) {
    migrated.schemaVersion = CURRENT_SCHEMA_VERSION
    migrated = mergeDeep(cloneDeep(defaults), migrated)
  }

  return migrated
}

async function initSettings() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    state.loading = true
    try {
      const defaults = await fetchDefaultSettings()
      const defaultResolved = await resolvePathDefaults(defaults)
      defaultSnapshot = cloneDeep(defaultResolved)

      const remote = await loadFromBridge()
      const local = !remote ? loadFromLocalStorage() : null
      const base = remote ?? local ?? defaultResolved

      const migrated = migrateSettings(base, defaultResolved)
      applySettings(migrated, { persist: !remote })

      if (!remote) {
        await persistSettings()
      }

      if (bridge?.onUpdate && !unsubscribeExternalListener) {
        unsubscribeExternalListener = bridge.onUpdate((payload) => {
          if (!payload || typeof payload !== 'object') return
          isApplyingExternalUpdate = true
          applySettings(migrateSettings(payload, defaultSnapshot), { persist: false, notify: true })
          isApplyingExternalUpdate = false
        })
      }
    } catch (err) {
      console.error('[settingsStore] 初始化失败:', err)
      state.error = err
      const fallback = await resolvePathDefaults(baseDefaultSettings)
      applySettings(fallback, { persist: false })
    } finally {
      state.loading = false
      state.ready = true
    }
  })()
  return initPromise
}

async function updateSettings(patch, { merge = true, persist = true } = {}) {
  if (!patch || typeof patch !== 'object') return
  const cloned = cloneDeep(patch)
  if (merge) {
    mergeDeep(state.settings, cloned)
  } else {
    replaceReactive(state.settings, cloned)
  }
  applyTheme(state.settings)
  state.revision += 1
  if (persist && !isApplyingExternalUpdate) {
    await persistSettings()
  }
}

async function overwriteSettings(newSettings, options = {}) {
  await updateSettings(newSettings, { ...options, merge: false })
}

async function resetSettings() {
  const defaults = await resolvePathDefaults(baseDefaultSettings)
  await overwriteSettings(defaults)
}

async function exportSettingsToFile(targetPath) {
  if (!bridge?.export) {
    console.warn('[settingsStore] 当前环境不支持导出设置')
    return { canceled: true, reason: 'unsupported' }
  }
  try {
    return await bridge.export(targetPath)
  } catch (err) {
    console.error('[settingsStore] 导出设置失败:', err)
    return { canceled: true, error: err }
  }
}

async function importSettingsFromFile() {
  if (!bridge?.import) {
    console.warn('[settingsStore] 当前环境不支持导入设置')
    return { canceled: true, reason: 'unsupported' }
  }
  try {
    const result = await bridge.import()
    if (result?.canceled) return result
    if (result?.settings) {
      await overwriteSettings(result.settings, { persist: true })
    }
    return result
  } catch (err) {
    console.error('[settingsStore] 导入设置失败:', err)
    return { canceled: true, error: err }
  }
}

async function chooseDirectory(options = {}) {
  if (!bridge?.chooseDirectory) {
    console.warn('[settingsStore] 当前环境不支持目录选择')
    return { canceled: true, reason: 'unsupported' }
  }
  try {
    return await bridge.chooseDirectory(options)
  } catch (err) {
    console.error('[settingsStore] 选择目录失败:', err)
    return { canceled: true, error: err }
  }
}

function getSessionSnapshot() {
  return cloneDeep(state.settings.session || baseDefaultSettings.session)
}

async function saveSessionSnapshot(partial) {
  if (!partial || typeof partial !== 'object') return
  const current = cloneDeep(state.settings.session || baseDefaultSettings.session)
  mergeDeep(current, partial)
  await updateSettings({ session: current })
}

async function resetSessionSnapshot() {
  await updateSettings({ session: cloneDeep(baseDefaultSettings.session) })
}

export function useSettingsStore() {
  return {
    settings: state.settings,
    ready: computed(() => state.ready),
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    revision: computed(() => state.revision),
    defaults: () => cloneDeep(defaultSnapshot),
    initSettings,
    updateSettings,
    overwriteSettings,
    resetSettings,
    exportSettings: exportSettingsToFile,
    importSettings: importSettingsFromFile,
    chooseDirectory,
    getSessionSnapshot,
    saveSessionSnapshot,
    resetSessionSnapshot
  }
}

export function getCurrentSettings() {
  return state.settings
}

export { initSettings }
