<template>
  <div class="settings-view">

    <div class="settings-body">
      <aside class="settings-sidebar">
        <nav class="sidebar-nav">
          <button
            v-for="section in sections"
            :key="section.id"
            :class="['sidebar-item', { active: activeSection === section.id }]"
            type="button"
            @click="scrollToSection(section.id)"
          >
            {{ section.label }}
          </button>
        </nav>
        <div class="sidebar-logo">
          <img src="/logo.png" alt="BetterKugou Logo">
          <span>BetterKugou</span>
        </div>
      </aside>

      <main class="settings-main" ref="settingsMain">
        <section class="settings-section" id="playback-section" :ref="sectionRefs.playback" data-section="playback">
          <header class="section-header">
            <h2 class="section-title">播放设置</h2>
          </header>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">播放音乐时，自动拉起全屏歌词</div>
              <div class="setting-desc">启用后，每次播放都会进入全屏歌词界面</div>
            </div>
            <label class="setting-switch">
              <input type="checkbox" v-model="localSettings.playback.fullscreenLyrics">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">在歌单中播放歌曲，自动将全部歌单歌曲加入播放列表</div>
              <div class="setting-desc">开启后，播放歌单内任意歌曲时，将歌单全部歌曲加入播放列表</div>
            </div>
            <label class="setting-switch">
              <input type="checkbox" v-model="localSettings.playback.enqueueFullPlaylist">
              <span class="slider"></span>
            </label>
          </div>
        </section>

  <section class="settings-section" id="download-section" :ref="sectionRefs.download" data-section="download">
          <header class="section-header">
            <h2 class="section-title">下载与缓存</h2>
          </header>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">默认下载目录</div>
              <div class="setting-desc">下载的音乐文件将保存到此目录</div>
            </div>
            <div class="setting-path">
              <input type="text" class="path-input" :value="localSettings.download.downloadPath" readonly>
              <button class="path-btn" type="button" @click="handleSelectDownloadPath" :disabled="isChoosingPath">
                {{ isChoosingPath ? '选择中…' : '更改目录' }}
              </button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">默认缓存目录</div>
              <div class="setting-desc">临时缓存文件将存放在此目录</div>
            </div>
            <div class="setting-path">
              <input type="text" class="path-input" :value="localSettings.download.cachePath" readonly>
              <button class="path-btn" type="button" @click="handleSelectCachePath" :disabled="isChoosingPath">
                {{ isChoosingPath ? '选择中…' : '更改目录' }}
              </button>
            </div>
          </div>
          <div class="setting-item setting-item--stack">
            <div class="setting-info">
              <div class="setting-label">缓存大小设置</div>
              <div class="setting-desc">当前选择：{{ currentCacheSizeLabel }}</div>
            </div>
            <div class="setting-slider">
              <input
                type="range"
                :min="0"
                :max="cacheSizeOptions.length - 1"
                v-model.number="localSettings.download.cacheSizeIndex"
              >
              <div class="slider-scale">
                <span>2048M</span>
                <span>无限制</span>
              </div>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">同时下载文件数量</div>
              <div class="setting-desc">可同时下载的任务数，范围 1-10</div>
            </div>
            <input
              class="number-input"
              type="number"
              min="1"
              max="10"
              v-model.number="localSettings.download.concurrentDownloads"
            >
          </div>
        </section>

  <section class="settings-section" id="custom-section" :ref="sectionRefs.custom" data-section="custom">
          <header class="section-header">
            <h2 class="section-title">自定义功能</h2>
          </header>
          <div class="setting-actions">
            <button class="outline-btn" type="button" @click="handleExportSettings" :disabled="isExporting">
              {{ isExporting ? '导出中…' : '导出设置' }}
            </button>
            <button class="outline-btn" type="button" @click="handleImportSettings" :disabled="isImporting">
              {{ isImporting ? '导入中…' : '导入设置' }}
            </button>
          </div>

          <div class="setting-group">
            <h3 class="setting-subtitle">样式设置</h3>
            <div class="setting-item setting-item--column">
              <div class="setting-info">
                <div class="setting-label">默认播放器样式</div>
                <div class="setting-desc">选择最适合你的播放器界面</div>
              </div>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" value="default" v-model="localSettings.custom.playerStyle">
                  <span class="radio-option__display">
                    <span class="radio-option__dot"></span>
                    <span class="radio-option__label">BetterKuGou 默认样式</span>
                  </span>
                </label>
                <label class="radio-option">
                  <input type="radio" value="netease" v-model="localSettings.custom.playerStyle">
                  <span class="radio-option__display">
                    <span class="radio-option__dot"></span>
                    <span class="radio-option__label">网易云样式</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h3 class="setting-subtitle">颜色设置</h3>
            <div class="setting-item setting-item--column">
              <div class="setting-info">
                <div class="setting-label">主题</div>
                <div class="setting-desc">选择整体界面的配色方案</div>
              </div>
              <div class="radio-group">
                <label class="radio-option">
                  <input type="radio" value="dark" v-model="localSettings.custom.theme">
                  <span class="radio-option__display">
                    <span class="radio-option__dot"></span>
                    <span class="radio-option__label">深色</span>
                  </span>
                </label>
                <label class="radio-option">
                  <input type="radio" value="light" v-model="localSettings.custom.theme">
                  <span class="radio-option__display">
                    <span class="radio-option__dot"></span>
                    <span class="radio-option__label">浅色</span>
                  </span>
                </label>
                <label class="radio-option">
                  <input type="radio" value="system" v-model="localSettings.custom.theme">
                  <span class="radio-option__display">
                    <span class="radio-option__dot"></span>
                    <span class="radio-option__label">跟随系统</span>
                  </span>
                </label>
                <label class="radio-option">
                  <input type="radio" value="custom" v-model="localSettings.custom.theme">
                  <span class="radio-option__display">
                    <span class="radio-option__dot"></span>
                    <span class="radio-option__label">自定义</span>
                  </span>
                </label>
              </div>
            </div>

            <transition name="fade">
              <div v-if="localSettings.custom.theme === 'custom'" class="custom-color-panel">
                <div class="setting-item setting-item--column">
                  <div class="setting-info setting-info--inline">
                    <div class="setting-label">
                      默认主题色
                      <span class="tooltip-icon" title="影响字体选中颜色、按钮背景色、标签颜色">?</span>
                    </div>
                  </div>
                  <input type="color" v-model="localSettings.custom.customTheme.primary" class="color-input">
                </div>
                <div class="setting-item setting-item--column">
                  <div class="setting-info setting-info--inline">
                    <div class="setting-label">
                      默认悬浮颜色
                      <span class="tooltip-icon" title="影响鼠标悬浮时的字体颜色与按钮背景色">?</span>
                    </div>
                  </div>
                  <input type="color" v-model="localSettings.custom.customTheme.hover" class="color-input">
                </div>
                <div class="setting-item setting-item--column">
                  <div class="setting-info setting-info--inline">
                    <div class="setting-label">
                      背景颜色
                      <span class="tooltip-icon" title="影响主页、收藏页与歌单页面的背景">?</span>
                    </div>
                  </div>
                  <input type="color" v-model="localSettings.custom.customTheme.background" class="color-input">
                </div>
                <p class="note-text">本自定义系统未包含所有的自定义类别，可通过导入设置更改。</p>
              </div>
            </transition>
          </div>
        </section>

  <section class="settings-section" id="shortcut-section" :ref="sectionRefs.shortcuts" data-section="shortcuts">
          <header class="section-header">
            <h2 class="section-title">快捷键</h2>
          </header>
          
          <div v-if="!localSettings.shortcuts" class="setting-item">
            <div class="setting-info">
              <div class="setting-label">加载中...</div>
              <div class="setting-desc">正在加载快捷键设置</div>
            </div>
          </div>
          
          <div v-else>
            <!-- 全局快捷键开关 -->
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-label">启用全局快捷键</div>
                <div class="setting-desc">允许在应用程序失去焦点时也能响应快捷键</div>
              </div>
              <label class="setting-switch">
                <input type="checkbox" v-model="localSettings.shortcuts.enableGlobal">
                <span class="slider"></span>
              </label>
            </div>

            <!-- 快捷键列表 -->
            <div class="shortcut-grid">
            <div 
              v-for="shortcut in shortcutList" 
              :key="shortcut.id"
              class="shortcut-card"
              :class="{ 
                'is-editing': editingShortcut === shortcut.id,
                'has-error': shortcutErrors[shortcut.id]
              }"
            >
              <div class="shortcut-info">
                <div class="shortcut-label">{{ shortcut.label }}</div>
                <div class="shortcut-desc">{{ shortcut.description }}</div>
              </div>
              <div class="shortcut-key-wrapper">
                <button 
                  class="shortcut-key"
                  :class="{ 'is-error': shortcutErrors[shortcut.id] }"
                  @click="startEditingShortcut(shortcut.id)"
                  type="button"
                >
                  <span v-if="editingShortcut === shortcut.id" class="recording">
                    按下按键...
                  </span>
                  <span v-else class="key-display">
                    {{ formatShortcutKey(localSettings.shortcuts.keys[shortcut.id]) }}
                  </span>
                </button>
                <button 
                  v-if="localSettings.shortcuts.keys[shortcut.id] && localSettings.shortcuts.keys[shortcut.id] !== 'Escape'"
                  class="clear-shortcut-btn"
                  @click="clearShortcut(shortcut.id)"
                  type="button"
                  title="清除快捷键"
                >
                  ×
                </button>
              </div>
              <div v-if="shortcutErrors[shortcut.id]" class="shortcut-error">
                {{ shortcutErrors[shortcut.id] }}
              </div>
            </div>
          </div>
          
          <p class="note-text">按 ESC 键可清除快捷键绑定</p>
          </div>
        </section>

  <section class="settings-section" id="software-section" :ref="sectionRefs.software" data-section="software">
          <header class="section-header">
            <h2 class="section-title">软件设置</h2>
          </header>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">开机自启动</div>
              <div class="setting-desc">启动系统时自动运行 BetterKugou</div>
            </div>
            <label class="setting-switch">
              <input type="checkbox" v-model="localSettings.software.autoLaunch">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">打开软件时恢复上一次的播放列表和播放位置</div>
              <div class="setting-desc">保存并还原上一次的播放队列和播放进度</div>
            </div>
            <label class="setting-switch">
              <input type="checkbox" v-model="localSettings.software.restorePlaylist">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">打开软件时恢复上一次的播放状态</div>
              <div class="setting-desc">记住播放/暂停状态以及循环模式等播放设置</div>
            </div>
            <label class="setting-switch">
              <input type="checkbox" v-model="localSettings.software.restorePlaybackState">
              <span class="slider"></span>
            </label>
          </div>
          <div class="setting-item setting-item--column">
            <div class="setting-info">
              <div class="setting-label">默认页面</div>
              <div class="setting-desc">选择启动软件时打开的页面</div>
            </div>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" value="home" v-model="localSettings.software.defaultPage">
                <span class="radio-option__display">
                  <span class="radio-option__dot"></span>
                  <span class="radio-option__label">推荐（主页）</span>
                </span>
              </label>
              <label class="radio-option">
                <input type="radio" value="favorites" v-model="localSettings.software.defaultPage">
                <span class="radio-option__display">
                  <span class="radio-option__dot"></span>
                  <span class="radio-option__label">我的收藏</span>
                </span>
              </label>
            </div>
          </div>
          <div class="setting-item setting-item--actions">
            <button class="outline-btn" type="button">检查更新</button>
            <button class="outline-btn" type="button">反馈 / 建议</button>
            <button class="outline-btn" type="button">使用协议</button>
            <button class="outline-btn" type="button">项目主页（真的不给个Star嘛）</button>
          </div>
          <div class="setting-item setting-item--center">
            <img class="software-logo" src="/logo.png" alt="BetterKugou Logo">
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.js'
import { cloneDeep, replaceReactive } from '../utils/objectUtils.js'

const emit = defineEmits(['close', 'settings-changed'])

const sections = [
  { id: 'playback', label: '播放设置' },
  { id: 'download', label: '下载与缓存' },
  { id: 'custom', label: '自定义功能' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'software', label: '软件设置' }
]

const activeSection = ref('playback')
const settingsMain = ref(null)
const sectionRefs = {
  playback: ref(null),
  download: ref(null),
  custom: ref(null),
  shortcuts: ref(null),
  software: ref(null)
}

const shortcutList = ref([
  { id: 'playPause', label: '播放 / 暂停', description: '切换播放和暂停状态' },
  { id: 'nextTrack', label: '下一首', description: '播放下一首歌曲' },
  { id: 'prevTrack', label: '上一首', description: '播放上一首歌曲' },
  { id: 'volumeUp', label: '音量增加', description: '增加音量' },
  { id: 'volumeDown', label: '音量减少', description: '减少音量' },
  { id: 'toggleLyrics', label: '显示/隐藏歌词', description: '切换歌词显示' },
  { id: 'toggleFullscreen', label: '全屏模式', description: '切换全屏显示' },
  { id: 'bossKey', label: '老板键', description: '快速隐藏窗口' }
])

const editingShortcut = ref(null)
const shortcutErrors = ref({})

const cacheSizeOptions = [
  { value: 2048, label: '2048 MB' },
  { value: 4096, label: '4096 MB' },
  { value: 6144, label: '6144 MB' },
  { value: 8192, label: '8192 MB' },
  { value: 10240, label: '10240 MB' },
  { value: -1, label: '无限制' }
]

const {
  settings,
  ready,
  updateSettings,
  revision,
  exportSettings,
  importSettings,
  chooseDirectory,
  defaults
} = useSettingsStore()

// 确保 localSettings 包含所有默认字段
const ensureDefaults = (settings) => {
  const defaultSettings = defaults()
  const merged = cloneDeep(settings)
  
  // 如果 shortcuts 不存在,使用默认值
  if (!merged.shortcuts) {
    merged.shortcuts = cloneDeep(defaultSettings.shortcuts)
  }
  
  return merged
}

const localSettings = reactive(ensureDefaults(settings))
const isSyncingFromStore = ref(false)
const isInitializing = ref(true) // 防止初始化时触发保存
const containerPaddingTop = ref(0)
let scrollListener = null
let resizeListener = null
let scrollRafId = null
let scrollContainer = null
let saveTimer = null
const isExporting = ref(false)
const isImporting = ref(false)
const isChoosingPath = ref(false)

const currentCacheSizeLabel = computed(() => {
  const index = localSettings?.download?.cacheSizeIndex ?? 0
  return cacheSizeOptions[index]?.label || '无限制'
})

function syncFromStore() {
  if (!ready.value) return
  isSyncingFromStore.value = true
  try {
    replaceReactive(localSettings, ensureDefaults(settings))
  } finally {
    // 使用 nextTick 确保所有响应式更新完成后再恢复标志
    nextTick(() => {
      isSyncingFromStore.value = false
    })
  }
}

watch(ready, (value) => {
  if (value) {
    syncFromStore()
    // 延迟标记初始化完成,避免初始赋值触发保存
    nextTick(() => {
      setTimeout(() => {
        isInitializing.value = false
      }, 100)
    })
  }
}, { immediate: true })

// 注释掉 revision 监听,避免保存后又同步导致循环
// watch(revision, () => {
//   if (isSyncingFromStore.value) return
//   syncFromStore()
// })

watch(localSettings, () => {
  if (isSyncingFromStore.value || !ready.value || isInitializing.value) {
    console.log('[SettingsView] 跳过保存 - isSyncingFromStore:', isSyncingFromStore.value, 'ready:', ready.value, 'isInitializing:', isInitializing.value)
    return
  }
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  saveTimer = setTimeout(async () => {
    try {
      console.log('[SettingsView] 保存设置...', {
        defaultPage: localSettings.software?.defaultPage,
        allSettings: cloneDeep(localSettings)
      })
      await updateSettings(cloneDeep(localSettings), { merge: false })
      console.log('[SettingsView] 设置保存成功')
      emit('settings-changed', cloneDeep(localSettings))
    } catch (err) {
      console.error('[SettingsView] 更新设置失败:', err)
    }
    saveTimer = null
  }, 500) // 增加防抖时间到500ms
}, { deep: true })

function scrollToSection(sectionId) {
  activeSection.value = sectionId
  nextTick(() => {
    const target = sectionRefs[sectionId]?.value
    const container = settingsMain.value

    if (!target || !container) {
      console.warn('Target or container not found:', { target, container, sectionId })
      return
    }

    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const offset = targetRect.top - containerRect.top + scrollTop

    container.scrollTo({
      top: offset - 20,
      behavior: 'smooth'
    })
  })
}

async function handleExportSettings() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const result = await exportSettings()
    if (result?.canceled) return
    console.info('[SettingsView] 设置已导出到:', result.path)
  } catch (err) {
    console.error('[SettingsView] 导出设置失败:', err)
  } finally {
    isExporting.value = false
  }
}

async function handleImportSettings() {
  if (isImporting.value) return
  isImporting.value = true
  try {
    const result = await importSettings()
    if (result?.canceled) return
    console.info('[SettingsView] 设置导入成功')
  } catch (err) {
    console.error('[SettingsView] 导入设置失败:', err)
  } finally {
    isImporting.value = false
  }
}

async function handleSelectPath(type) {
  if (isChoosingPath.value) return
  isChoosingPath.value = true
  try {
    const currentValue = type === 'download'
      ? localSettings.download.downloadPath
      : localSettings.download.cachePath

    const result = await chooseDirectory({
      title: type === 'download' ? '选择下载目录' : '选择缓存目录',
      defaultPath: currentValue || undefined,
      buttonLabel: '选择'
    })
    if (result?.canceled || !result?.path) return

    if (type === 'download') {
      localSettings.download.downloadPath = result.path
    } else {
      localSettings.download.cachePath = result.path
    }
  } catch (err) {
    console.error('[SettingsView] 选择目录失败:', err)
  } finally {
    isChoosingPath.value = false
  }
}

function handleSelectDownloadPath() {
  return handleSelectPath('download')
}

function handleSelectCachePath() {
  return handleSelectPath('cache')
}

// 快捷键相关函数
function formatShortcutKey(key) {
  if (!key || key === 'Escape') return '未设置'
  return key
    .replace(/Control/g, 'Ctrl')
    .replace(/\+/g, ' + ')
}

function startEditingShortcut(shortcutId) {
  editingShortcut.value = shortcutId
  delete shortcutErrors.value[shortcutId]
  
  // 设置全局标志,阻止触发其他快捷键
  window.__editingShortcut = true
  
  // 添加键盘监听
  document.addEventListener('keydown', handleShortcutKeyDown, { capture: true })
}

function stopEditingShortcut() {
  editingShortcut.value = null
  
  // 清除全局标志
  window.__editingShortcut = false
  
  document.removeEventListener('keydown', handleShortcutKeyDown, { capture: true })
}

function handleShortcutKeyDown(event) {
  if (!editingShortcut.value) return
  
  event.preventDefault()
  event.stopPropagation()
  
  // 按 ESC 清除快捷键
  if (event.key === 'Escape') {
    localSettings.shortcuts.keys[editingShortcut.value] = 'Escape'
    stopEditingShortcut()
    return
  }
  
  // 构建快捷键字符串
  const keys = []
  if (event.ctrlKey || event.metaKey) keys.push('Control')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')
  
  // 获取主键
  let mainKey = event.key
  
  // 特殊键映射
  const keyMap = {
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    ' ': 'Space'
  }
  
  mainKey = keyMap[mainKey] || mainKey
  
  // 忽略单独的修饰键
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
    return
  }
  
  keys.push(mainKey)
  const shortcutKey = keys.join('+')
  
  // 检查是否与其他快捷键冲突
  const conflict = shortcutList.value.find(s => 
    s.id !== editingShortcut.value && 
    localSettings.shortcuts.keys[s.id] === shortcutKey
  )
  
  if (conflict) {
    shortcutErrors.value[editingShortcut.value] = `与"${conflict.label}"冲突`
    setTimeout(() => {
      delete shortcutErrors.value[editingShortcut.value]
    }, 3000)
    stopEditingShortcut()
    return
  }
  
  // 尝试注册全局快捷键（如果启用）
  if (localSettings.shortcuts.enableGlobal) {
    // TODO: 调用 Electron API 注册全局快捷键
    // 这里需要检查注册是否成功
    const registered = tryRegisterGlobalShortcut(shortcutKey)
    if (!registered) {
      shortcutErrors.value[editingShortcut.value] = '无法注册此快捷键'
      setTimeout(() => {
        delete shortcutErrors.value[editingShortcut.value]
      }, 3000)
      stopEditingShortcut()
      return
    }
  }
  
  // 设置快捷键
  localSettings.shortcuts.keys[editingShortcut.value] = shortcutKey
  delete shortcutErrors.value[editingShortcut.value]
  stopEditingShortcut()
}

function clearShortcut(shortcutId) {
  localSettings.shortcuts.keys[shortcutId] = 'Escape'
  delete shortcutErrors.value[shortcutId]
}

function tryRegisterGlobalShortcut(key) {
  // 如果未启用全局快捷键,直接返回成功
  if (!localSettings.shortcuts.enableGlobal) {
    return true
  }
  
  // 测试是否能注册全局快捷键
  if (window.electronAPI?.testGlobalShortcut) {
    try {
      const result = window.electronAPI.testGlobalShortcut(key)
      if (!result) {
        console.warn('⚠️ 快捷键无法注册:', key)
      }
      return result
    } catch (err) {
      console.error('测试快捷键注册失败:', err)
      return false
    }
  }
  
  // 开发模式或 Electron API 不可用时默认返回成功
  return true
}

function updateActiveSection() {
  const container = scrollContainer || settingsMain.value
  if (!container) return

  let closestId = null
  let closestDistance = Infinity
  const containerRect = container.getBoundingClientRect()

  sections.forEach((section) => {
    const el = sectionRefs[section.id]?.value
    if (!el) return

    const targetRect = el.getBoundingClientRect()
    const relativeTop = targetRect.top - containerRect.top + container.scrollTop - containerPaddingTop.value
    const distance = Math.abs(relativeTop - container.scrollTop)

    if (distance < closestDistance) {
      closestDistance = distance
      closestId = section.id
    }
  })

  if (closestId) {
    activeSection.value = closestId
  }
}

function setupScrollTracking() {
  const container = settingsMain.value
  if (!container) return

  scrollContainer = container

  const computedStyle = window.getComputedStyle(container)
  containerPaddingTop.value = parseFloat(computedStyle.paddingTop) || 0

  scrollListener = () => {
    if (scrollRafId) {
      window.cancelAnimationFrame(scrollRafId)
    }
    scrollRafId = window.requestAnimationFrame(() => {
      updateActiveSection()
    })
  }

  container.addEventListener('scroll', scrollListener, { passive: true })

  resizeListener = () => {
    updateActiveSection()
  }
  window.addEventListener('resize', resizeListener, { passive: true })

  updateActiveSection()
}

function teardownScrollTracking() {
  if (scrollContainer && scrollListener) {
    scrollContainer.removeEventListener('scroll', scrollListener)
  }
  if (resizeListener) {
    window.removeEventListener('resize', resizeListener)
  }
  if (scrollRafId) {
    window.cancelAnimationFrame(scrollRafId)
    scrollRafId = null
  }
  scrollContainer = null
}

onMounted(() => {
  nextTick(() => {
    setupScrollTracking()
  })
})

onBeforeUnmount(() => {
  teardownScrollTracking()
  stopEditingShortcut() // 清理快捷键编辑监听器
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
})

defineExpose({
  scrollToSection
})
</script>

<style scoped>
.settings-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
}

.settings-view > * {
  position: relative;
  z-index: 1;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-light);
}

.settings-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.settings-body {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-xl);
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-xl);
  min-height: 0;
  overflow: hidden;
}

.settings-sidebar {
  width: 260px;
  padding: var(--spacing-xl) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-xl);
  background: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  position: sticky;
  top: var(--spacing-xl);
  height: fit-content;
  max-height: calc(100vh - 180px); /* 减去顶部标题栏、底部播放器等空间 */
  overflow-y: auto;
}

/* 左侧导航栏滚动条样式 */
.settings-sidebar::-webkit-scrollbar {
  width: 6px;
}

.settings-sidebar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.settings-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  padding-left: calc(var(--spacing-md) + 6px);
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: color 0.25s ease, background 0.25s ease, transform 0.25s ease;
}

.sidebar-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12%;
  bottom: 12%;
  width: 4px;
  border-radius: 999px;
  background: var(--color-primary);
  opacity: 0;
  transform: scaleY(0.4);
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.sidebar-item:hover,
.sidebar-item.active {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.sidebar-item:hover::before,
.sidebar-item.active::before {
  opacity: 1;
  transform: scaleY(1);
}

.sidebar-item.active {
  box-shadow: none;
}

.sidebar-item:hover {
  transform: translateX(4px);
}

.sidebar-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-background);
  border-radius: var(--radius-md);
}

.sidebar-logo img {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-logo span {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 180px);
}

/* 主内容滚动条样式 */
.settings-main::-webkit-scrollbar {
  width: 8px;
}

.settings-main::-webkit-scrollbar-track {
  background: transparent;
}

.settings-main::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.settings-main::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

.settings-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-background-light);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.settings-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.settings-section > * {
  position: relative;
  z-index: 1;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
  transition: all var(--transition-fast);
}

.setting-item > * {
  position: relative;
  z-index: 1;
}
.setting-item:hover {
  border-color: var(--color-primary);
  background: var(--color-background-light);
}

.setting-item--stack {
  align-items: stretch;
}

.setting-item--column {
  flex-direction: column;
  align-items: stretch;
}

.setting-item--actions {
  justify-content: flex-start;
  gap: var(--spacing-md);
}

.setting-item--center {
  justify-content: center;
}

.setting-info {
  flex: 1;
}

.setting-info--inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.setting-label {
  font-size: var(--font-size-base);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  letter-spacing: 0.01em;
}

.setting-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.setting-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: 600;
  margin: var(--spacing-xl) 0 var(--spacing-md);
}

.setting-group:first-of-type .setting-subtitle {
  margin-top: 0;
}

.setting-group {
  display: flex;
  flex-direction: column;
}

.setting-path {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  max-width: 460px;
}

.path-input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.path-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.path-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.setting-slider {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 220px;
}

.setting-slider input[type='range'] {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-primary-light);
  border-radius: 999px;
  outline: none;
  position: relative;
}

.setting-slider input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.setting-slider input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.setting-slider input[type='range']::-moz-range-track {
  height: 8px;
  border-radius: 999px;
  background: var(--color-primary-light);
}

.setting-slider input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.slider-scale {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.number-input {
  width: 88px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-base);
  text-align: center;
}

.number-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.number-input[type='number'] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.setting-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.outline-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-xl);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.outline-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.radio-group {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--color-background);
  border: 1px solid var(--color-border);
}

.radio-option {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  cursor: pointer;
  font-size: var(--font-size-sm);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.25s ease;
}

.radio-option input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.radio-option__display {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: inherit;
  color: var(--color-text-secondary);
  font-weight: 600;
  transition: color 0.3s ease, transform 0.3s ease;
}

.radio-option__display::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--color-primary-light);
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 0.3s ease, transform 0.3s ease;
  z-index: -1;
}

.radio-option__dot {
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.radio-option__label {
  white-space: nowrap;
}

.radio-option:hover {
  transform: translateY(-1px);
}

.radio-option:hover .radio-option__dot {
  border-color: var(--color-primary);
}

.radio-option input:focus-visible + .radio-option__display {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
}

.radio-option input:checked + .radio-option__display {
  color: var(--color-primary);
}

.radio-option input:checked + .radio-option__display::before {
  opacity: 1;
  transform: scale(1);
}

.radio-option input:checked + .radio-option__display .radio-option__dot {
  border-color: transparent;
  transform: scale(1.2);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  background: var(--color-primary);
  animation: radio-pop 0.3s ease;
}

.radio-option input:checked + .radio-option__display .radio-option__label {
  transform: translateX(0);
}

@keyframes radio-pop {
  0% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1.2);
  }
}

.custom-color-panel {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.color-input {
  width: 64px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
}

.tooltip-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 12px;
  cursor: help;
  margin-left: var(--spacing-xs);
}

.note-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin: 0 var(--spacing-md) var(--spacing-sm);
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.shortcut-card {
  padding: var(--spacing-lg);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: all var(--transition-fast);
  position: relative;
}

.shortcut-card:hover {
  border-color: var(--color-border-light);
  background: var(--color-background-light);
}

.shortcut-card.is-editing {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.shortcut-card.has-error {
  border-color: #ff4d4f;
}

.shortcut-info {
  flex: 1;
}

.shortcut-label {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.shortcut-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.shortcut-key-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.shortcut-key {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background-lighter);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shortcut-key:hover {
  border-color: var(--color-primary);
  background: var(--color-background);
}

.shortcut-key.is-error {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.shortcut-key .recording {
  color: var(--color-primary);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.shortcut-key .key-display {
  font-family: 'Courier New', monospace;
}

.clear-shortcut-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-shortcut-btn:hover {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.shortcut-error {
  font-size: var(--font-size-xs);
  color: #ff4d4f;
  margin-top: var(--spacing-xs);
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.software-logo {
  width: 96px;
  height: 96px;
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 开关样式 */
.setting-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.setting-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

input:checked + .slider {
  background: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
