<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import TitleBar from './components/TitleBar.vue'
import LoginView from './components/LoginView.vue'
import Sidebar from './components/Sidebar.vue'
import HomeView from './components/HomeView.vue'
import FavoriteView from './components/FavoriteView.vue'
import SettingsView from './components/SettingsView.vue'
import MusicPlayer from './components/MusicPlayer.vue'
import { getLoginInfo, isLoggedIn } from './api/auth.js'
import { getUserPlaylists } from './api/music.js'
import { useSettingsStore } from './stores/settingsStore.js'
import { cloneDeep } from './utils/objectUtils.js'

console.log('App.vue loaded')

// 控制显示登录界面
const showLogin = ref(false)

// 控制显示设置界面
const showSettings = ref(false)

// 用户登录状态
const userLoggedIn = ref(false)
const userInfo = ref(null)

// 当前视图
const currentView = ref('home')

// 用户歌单列表（TODO: 从API获取）
const userPlaylists = ref([
  // 示例数据，后续需要从API获取
  // { id: 1, name: '我喜欢的音乐' },
  // { id: 2, name: '每日推荐' },
])

// 播放器状态
const currentSong = ref(null)
const playlist = ref([])
const playlistIndex = ref(0)

// 检查登录状态
const checkLoginStatus = () => {
  if (isLoggedIn()) {
    const loginInfo = getLoginInfo()
    if (loginInfo) {
      userLoggedIn.value = true
      userInfo.value = loginInfo.userInfo
      console.log('用户已登录:', userInfo.value)
      // 登录后获取用户歌单
      fetchUserPlaylists()
    }
  }
}

// 获取用户歌单
const fetchUserPlaylists = async () => {
  try {
    const response = await getUserPlaylists(1, 100)
    console.log('用户歌单列表:', response)
    
    if (response.status === 1 && response.data) {
      const playlists = response.data.info || []
      // 转换为侧边栏需要的格式
      userPlaylists.value = playlists.map(p => ({
        id: p.global_collection_id,
        name: p.name,
        count: p.count || 0
      }))
    }
  } catch (error) {
    console.error('获取用户歌单失败:', error)
  }
}

// 显示登录界面
const handleShowLogin = () => {
  showLogin.value = true
}

// 显示设置界面
const handleShowSettings = () => {
  console.log('打开设置界面')
  currentView.value = 'settings'
  showSettings.value = true
}

// 关闭设置界面
const handleCloseSettings = () => {
  console.log('关闭设置界面')
  currentView.value = 'home'
  showSettings.value = false
}

// 设置改变处理
const handleSettingsChanged = (settings) => {
  console.log('设置已更新:', settings)
  // TODO: 根据设置更新应用状态
}

// 返回主界面
const handleBackToMain = () => {
  showLogin.value = false
}

// 登录成功处理
const handleLoginSuccess = (data) => {
  console.log('登录成功:', data)
  userLoggedIn.value = true
  userInfo.value = {
    userid: data.userid,
    username: data.username || data.nickname || '',
    avatar: data.pic || data.avatar || '',
    vip_type: data.vip_type || 0
  }
  showLogin.value = false
  // 登录后获取用户歌单
  fetchUserPlaylists()
}

// 退出登录处理
const handleLogout = () => {
  console.log('退出登录')
  // 清除本地存储
  localStorage.removeItem('kugou_token')
  localStorage.removeItem('kugou_userid')
  localStorage.removeItem('kugou_userinfo')
  
  // 重置状态
  userLoggedIn.value = false
  userInfo.value = null
  userPlaylists.value = []
  currentView.value = 'home'
  
  // 显示登录界面
  showLogin.value = true
}

// 处理侧边栏导航
const handleNavigate = (view, data) => {
  console.log('Navigate to:', view, data)
  currentView.value = view
  // TODO: 根据不同的视图加载不同的内容
}

// 处理创建歌单
const handleCreatePlaylist = () => {
  console.log('Create new playlist')
  // TODO: 显示创建歌单对话框
}

// 处理播放歌曲
const handlePlay = (song) => {
  console.log('App.vue - Play song:', song)
  console.log('App.vue - userLoggedIn:', userLoggedIn.value)
  currentSong.value = song
  console.log('App.vue - currentSong after set:', currentSong.value)
  // 如果是单曲播放，只有当前歌曲
  if (!playlist.value.find(s => s.hash === song.hash)) {
    playlist.value = [song]
    playlistIndex.value = 0
  } else {
    playlistIndex.value = playlist.value.findIndex(s => s.hash === song.hash)
  }
}

// 处理播放全部
const handlePlayAll = (songs) => {
  console.log('Play all songs:', songs)
  if (songs && songs.length > 0) {
    // 清空当前播放列表
    playlist.value = []
    // 添加所有歌曲到播放列表
    playlist.value = [...songs]
    playlistIndex.value = 0
    // 播放第一首歌
    currentSong.value = songs[0]
    console.log('已添加', songs.length, '首歌曲到播放列表')
  }
}

// 处理下一首播放
const handlePlayNext = (song) => {
  console.log('下一首播放:', song)
  // 通过ref访问MusicPlayer组件的方法
  if (musicPlayerRef.value) {
    musicPlayerRef.value.addToPlayNextQueue(song)
  }
}

// 处理从播放列表移除
const handleRemoveFromPlaylist = (song) => {
  console.log('从播放列表移除:', song)
  if (musicPlayerRef.value) {
    musicPlayerRef.value.removeFromPlaylist(song)
  }
}

// 处理搜索歌曲
const handleSearch = (song) => {
  console.log('搜索歌曲:', song)
  // TODO: 实现搜索功能
  alert(`搜索功能开发中...\n歌曲: ${song.name}`)
}

// 处理清空播放列表
const handleClearPlaylist = async () => {
  console.log('清空播放列表')
  
  // 先清空播放列表，这会触发 TransitionGroup 的离开动画
  playlist.value = []
  playlistIndex.value = 0
  
  // 等待播放列表项的离开动画完成（0.3s）
  await new Promise(resolve => setTimeout(resolve, 400))
  
  // 然后隐藏播放器，触发退出动画
  currentSong.value = null
}

// MusicPlayer组件的ref
const musicPlayerRef = ref(null)

const {
  settings,
  ready: settingsReady,
  saveSessionSnapshot,
  getSessionSnapshot,
  defaults: getSettingsDefaults
} = useSettingsStore()

const defaultSessionTemplate = cloneDeep(getSettingsDefaults().session)
const hasAppliedDefaultPage = ref(false)
const hasRestoredSession = ref(false)
let sessionPersistTimer = null
let isRestoringSession = false

// 歌词界面显示状态
const isLyricViewVisible = ref(false)

// 处理歌词界面显示状态变化
const handleLyricViewChanged = (visible) => {
  console.log('🎵 歌词界面状态变化:', visible)
  isLyricViewVisible.value = visible
}

// 播放上一曲（由 MusicPlayer 组件内部处理）
const handlePrevious = () => {
  // MusicPlayer 组件已经处理了播放逻辑
  console.log('上一曲事件')
}

// 播放下一曲（由 MusicPlayer 组件内部处理）
const handleNext = () => {
  // MusicPlayer 组件已经处理了播放逻辑
  console.log('下一曲事件')
}

// 处理歌曲切换事件
const handleSongChanged = (song) => {
  console.log('歌曲已切换:', song)
  currentSong.value = song
  // 同时更新播放列表索引
  const index = playlist.value.findIndex(s => s.hash === song.hash)
  if (index !== -1) {
    playlistIndex.value = index
  }
  if (settings.playback?.fullscreenLyrics && musicPlayerRef.value?.showLyrics) {
    musicPlayerRef.value.showLyrics()
  }
}

// 切换播放列表显示
const handleTogglePlaylist = () => {
  console.log('Toggle playlist')
  // TODO: 显示播放列表侧边栏
}

// 切换收藏状态
const handleToggleFavorite = (song) => {
  console.log('Toggle favorite:', song)
  // TODO: 添加/移除收藏
}

// 快捷键处理
const handleKeyDown = (event) => {
  // 如果正在输入,忽略快捷键
  const target = event.target
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  // 如果正在编辑快捷键,不触发任何快捷键
  if (window.__editingShortcut) {
    return
  }

  if (!settings.shortcuts) return

  const keys = []
  if (event.ctrlKey || event.metaKey) keys.push('Control')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')

  let mainKey = event.key
  const keyMap = {
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    ' ': 'Space'
  }
  mainKey = keyMap[mainKey] || mainKey
  
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(mainKey)) {
    return
  }

  keys.push(mainKey)
  const pressedKey = keys.join('+')

  const shortcuts = settings.shortcuts.keys
  if (!shortcuts) return

  // 匹配快捷键并执行对应操作
  let handled = false

  if (pressedKey === shortcuts.playPause && shortcuts.playPause !== 'Escape') {
    event.preventDefault()
    musicPlayerRef.value?.togglePlay()
    handled = true
  } else if (pressedKey === shortcuts.nextTrack && shortcuts.nextTrack !== 'Escape') {
    event.preventDefault()
    musicPlayerRef.value?.playNext()
    handled = true
  } else if (pressedKey === shortcuts.prevTrack && shortcuts.prevTrack !== 'Escape') {
    event.preventDefault()
    musicPlayerRef.value?.playPrevious()
    handled = true
  } else if (pressedKey === shortcuts.volumeUp && shortcuts.volumeUp !== 'Escape') {
    event.preventDefault()
    if (musicPlayerRef.value) {
      musicPlayerRef.value.volume = Math.min(100, musicPlayerRef.value.volume + 5)
    }
    handled = true
  } else if (pressedKey === shortcuts.volumeDown && shortcuts.volumeDown !== 'Escape') {
    event.preventDefault()
    if (musicPlayerRef.value) {
      musicPlayerRef.value.volume = Math.max(0, musicPlayerRef.value.volume - 5)
    }
    handled = true
  } else if (pressedKey === shortcuts.toggleLyrics && shortcuts.toggleLyrics !== 'Escape') {
    event.preventDefault()
    musicPlayerRef.value?.toggleLyrics()
    handled = true
  } else if (pressedKey === shortcuts.toggleFullscreen && shortcuts.toggleFullscreen !== 'Escape') {
    event.preventDefault()
    if (window.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen()
    }
    handled = true
  } else if (pressedKey === shortcuts.bossKey && shortcuts.bossKey !== 'Escape') {
    event.preventDefault()
    if (window.electronAPI?.hide) {
      window.electronAPI.hide()
    }
    handled = true
  }

  if (handled) {
    console.log('🎹 快捷键触发:', pressedKey)
  }
}

// 全局快捷键注册
const registeredGlobalShortcuts = ref(new Set())

function registerGlobalShortcuts() {
  if (!window.electronAPI?.registerGlobalShortcut) {
    console.warn('⚠️ Electron API 不可用,无法注册全局快捷键')
    return
  }

  if (!settings.shortcuts?.enableGlobal) {
    // 如果关闭了全局快捷键,注销所有
    unregisterAllGlobalShortcuts()
    return
  }

  const shortcuts = settings.shortcuts.keys
  if (!shortcuts) return

  // 注销所有旧的快捷键
  unregisterAllGlobalShortcuts()

  // 注册新的快捷键
  Object.entries(shortcuts).forEach(([action, key]) => {
    if (!key || key === 'Escape') return

    try {
      const success = window.electronAPI.registerGlobalShortcut(key, action)
      if (success) {
        registeredGlobalShortcuts.value.add(key)
        console.log('✅ 全局快捷键注册成功:', key, '→', action)
      } else {
        console.warn('❌ 全局快捷键注册失败:', key)
      }
    } catch (err) {
      console.error('全局快捷键注册错误:', key, err)
    }
  })
}

function unregisterAllGlobalShortcuts() {
  if (!window.electronAPI?.unregisterGlobalShortcut) return

  registeredGlobalShortcuts.value.forEach(key => {
    try {
      window.electronAPI.unregisterGlobalShortcut(key)
      console.log('🔓 全局快捷键已注销:', key)
    } catch (err) {
      console.error('注销全局快捷键错误:', key, err)
    }
  })

  registeredGlobalShortcuts.value.clear()
}

// 监听全局快捷键设置变化
watch(
  () => [settings.shortcuts?.enableGlobal, settings.shortcuts?.keys],
  () => {
    if (settingsReady.value) {
      registerGlobalShortcuts()
    }
  },
  { deep: true }
)

// 监听来自主进程的全局快捷键触发
onMounted(() => {
  if (window.electronAPI?.onGlobalShortcut) {
    window.electronAPI.onGlobalShortcut((action) => {
      console.log('🌐 全局快捷键触发:', action)
      
      // 执行对应的操作
      switch (action) {
        case 'playPause':
          musicPlayerRef.value?.togglePlay()
          break
        case 'nextTrack':
          musicPlayerRef.value?.playNext()
          break
        case 'prevTrack':
          musicPlayerRef.value?.playPrevious()
          break
        case 'volumeUp':
          if (musicPlayerRef.value) {
            musicPlayerRef.value.volume = Math.min(100, musicPlayerRef.value.volume + 5)
          }
          break
        case 'volumeDown':
          if (musicPlayerRef.value) {
            musicPlayerRef.value.volume = Math.max(0, musicPlayerRef.value.volume - 5)
          }
          break
        case 'toggleLyrics':
          musicPlayerRef.value?.toggleLyrics()
          break
        case 'toggleFullscreen':
          if (window.electronAPI?.toggleFullscreen) {
            window.electronAPI.toggleFullscreen()
          }
          break
        case 'bossKey':
          if (window.electronAPI?.hide) {
            window.electronAPI.hide()
          }
          break
      }
    })
  }
})

// 应用启动时检查登录状态
onMounted(() => {
  checkLoginStatus()
  
  // 添加快捷键监听
  document.addEventListener('keydown', handleKeyDown)
  
  // 注册全局快捷键
  if (settingsReady.value) {
    registerGlobalShortcuts()
  }
  
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload)
  }
  
  // 监听内存清理事件
  if (window.electronAPI && window.electronAPI.onMemoryCleanup) {
    window.electronAPI.onMemoryCleanup(() => {
      performMemoryCleanup()
    })
  }
})

onBeforeUnmount(() => {
  // 移除快捷键监听
  document.removeEventListener('keydown', handleKeyDown)
  
  // 注销所有全局快捷键
  unregisterAllGlobalShortcuts()
  
  if (sessionPersistTimer) {
    clearTimeout(sessionPersistTimer)
    sessionPersistTimer = null
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
})

function applyDefaultPage(page) {
  console.log('[App] applyDefaultPage 调用:', { 
    page, 
    userLoggedIn: userLoggedIn.value,
    currentView: currentView.value,
    hasAppliedDefaultPage: hasAppliedDefaultPage.value
  })
  
  // 计算期望的页面
  const desired = page === 'favorites' && !userLoggedIn.value ? 'home' : page
  const normalizedDesired = desired === 'favorites' ? 'favorite' : desired
  
  console.log('[App] 计算结果:', { desired, normalizedDesired })
  
  // 首次应用：直接设置
  if (!hasAppliedDefaultPage.value) {
    if (normalizedDesired && normalizedDesired !== currentView.value) {
      currentView.value = normalizedDesired
      console.log('[App] 首次应用，已切换到:', normalizedDesired)
    }
    hasAppliedDefaultPage.value = true
    return
  }
  
  // 已应用过，但如果当前在 home 页面，且期望页面是 favorite，且用户刚登录
  // 则允许切换到 favorite（这是为了处理登录状态延迟的情况）
  if (normalizedDesired === 'favorite' && 
      currentView.value === 'home' && 
      userLoggedIn.value) {
    currentView.value = normalizedDesired
    console.log('[App] 登录后切换到收藏页:', normalizedDesired)
  }
}

watch(
  [settingsReady, () => settings.software?.defaultPage, userLoggedIn],
  ([ready, page, loggedIn]) => {
    console.log('[App] watch 触发:', { ready, page, loggedIn, hasApplied: hasAppliedDefaultPage.value })
    if (!ready) return
    applyDefaultPage(page)
  },
  { immediate: true }
)

function shouldPersistSession() {
  return Boolean(settings.software?.restorePlaylist || settings.software?.restorePlaybackState)
}

function collectSessionSnapshot() {
  const snapshot = {}
  if (settings.software?.restorePlaylist) {
    snapshot.playlist = cloneDeep(playlist.value)
    snapshot.playlistIndex = playlistIndex.value
    snapshot.currentSong = cloneDeep(currentSong.value)
  }

  if (settings.software?.restorePlaybackState) {
    const player = musicPlayerRef.value
    const audio = player?.$refs?.audioPlayer
    snapshot.playbackState = {
      isPlaying: player?.isPlaying ?? false,
      currentTime: audio?.currentTime ?? 0,
      duration: audio?.duration ?? 0,
      volume: player?.volume ?? 80,
      playMode: player?.playMode ?? 'loop'
    }
  }

  return snapshot
}

function queueSessionPersist({ immediate = false } = {}) {
  if (!settingsReady.value) return

  if (!shouldPersistSession()) {
    return
  }

  const persist = async () => {
    const snapshot = collectSessionSnapshot()
    const hasPlaylistData = Object.prototype.hasOwnProperty.call(snapshot, 'playlist')
    const hasPlaybackState = Object.prototype.hasOwnProperty.call(snapshot, 'playbackState')
    if (!hasPlaylistData && !hasPlaybackState) return
    try {
      await saveSessionSnapshot(snapshot)
    } catch (err) {
      console.error('[App] 保存播放会话失败:', err)
    }
  }

  if (immediate) {
    void persist()
    return
  }

  if (sessionPersistTimer) {
    clearTimeout(sessionPersistTimer)
  }
  sessionPersistTimer = setTimeout(() => {
    sessionPersistTimer = null
    void persist()
  }, 300)
}

async function applyPlaybackSession(state) {
  if (!state) return
  const player = musicPlayerRef.value
  const audio = player?.$refs?.audioPlayer
  if (!player || !audio) return

  const applyState = () => {
    if (state.playMode) {
      player.playMode = state.playMode
    }
    if (typeof state.volume === 'number') {
      player.volume = state.volume
      audio.volume = Math.min(1, Math.max(0, state.volume / 100))
    }
    if (typeof state.currentTime === 'number') {
      const targetTime = Math.max(0, state.currentTime)
      audio.currentTime = Number.isFinite(targetTime) ? targetTime : 0
      player.currentTime = audio.currentTime
    }
    if (typeof state.duration === 'number') {
      player.duration = state.duration
    }
    if (state.isPlaying) {
      audio.play().catch(() => {})
      player.isPlaying = true
    } else {
      audio.pause()
      player.isPlaying = false
    }
  }

  if (audio.readyState >= 1) {
    applyState()
    return
  }

  const handleLoaded = () => {
    audio.removeEventListener('loadedmetadata', handleLoaded)
    audio.removeEventListener('loadeddata', handleLoaded)
    applyState()
  }

  audio.addEventListener('loadedmetadata', handleLoaded)
  audio.addEventListener('loadeddata', handleLoaded)
}

async function restoreSessionIfNeeded() {
  if (hasRestoredSession.value || !settingsReady.value) return
  const session = getSessionSnapshot()
  const shouldRestorePlaylist = Boolean(settings.software?.restorePlaylist && Array.isArray(session.playlist) && session.playlist.length > 0)
  const shouldRestorePlayback = Boolean(settings.software?.restorePlaybackState && session.playbackState)

  if (!shouldRestorePlaylist && !shouldRestorePlayback) {
    hasRestoredSession.value = true
    return
  }

  isRestoringSession = true
  try {
    if (shouldRestorePlaylist) {
      playlist.value = cloneDeep(session.playlist)
      const playlistLength = playlist.value.length
      const targetIndex = Math.min(Math.max(session.playlistIndex ?? 0, 0), Math.max(playlistLength - 1, 0))
      playlistIndex.value = playlistLength > 0 ? targetIndex : 0
      const fallbackSong = playlistLength > 0 ? (session.playlist?.[targetIndex] || session.playlist?.[0] || null) : null
      currentSong.value = cloneDeep(session.currentSong || fallbackSong)
    }

    await nextTick()

    if (shouldRestorePlayback) {
      await applyPlaybackSession(session.playbackState)
    }

    hasRestoredSession.value = true
  } finally {
    isRestoringSession = false
  }
}

watch(
  [settingsReady, () => settings.session, () => settings.software?.restorePlaylist, () => settings.software?.restorePlaybackState],
  () => {
    void restoreSessionIfNeeded()
  },
  { immediate: true }
)

watch(
  () => settings.playback?.fullscreenLyrics,
  (enabled) => {
    if (!enabled && isLyricViewVisible.value && musicPlayerRef.value?.closeLyrics) {
      musicPlayerRef.value.closeLyrics()
    }
  }
)

watch(playlist, () => {
  if (isRestoringSession) return
  queueSessionPersist()
}, { deep: true })

watch(currentSong, () => {
  if (isRestoringSession) return
  queueSessionPersist({ immediate: true })
})

watch(playlistIndex, () => {
  if (isRestoringSession) return
  queueSessionPersist({ immediate: true })
})

watch(
  () => musicPlayerRef.value?.isPlaying,
  () => {
    if (isRestoringSession) return
    queueSessionPersist({ immediate: true })
  }
)

watch(
  () => settings.software?.restorePlaylist,
  (enabled) => {
    if (!settingsReady.value) return
    if (!enabled) {
      void saveSessionSnapshot({
        playlist: [],
        playlistIndex: 0,
        currentSong: null
      })
    } else {
      queueSessionPersist({ immediate: true })
    }
  },
  { immediate: true }
)

watch(
  () => settings.software?.restorePlaybackState,
  (enabled) => {
    if (!settingsReady.value) return
    if (!enabled) {
      void saveSessionSnapshot({
        playbackState: cloneDeep(defaultSessionTemplate.playbackState)
      })
    } else {
      queueSessionPersist({ immediate: true })
    }
  },
  { immediate: true }
)

function handleBeforeUnload() {
  queueSessionPersist({ immediate: true })
}

// 渲染进程内存清理
function performMemoryCleanup() {
  console.log('🧹 [渲染进程] 执行内存清理...')
  
  try {
    // 1. 清理音频缓存
    if (musicPlayerRef.value && musicPlayerRef.value.$refs.audioPlayer) {
      const audio = musicPlayerRef.value.$refs.audioPlayer
      // 清理音频资源但不影响当前播放
      if (audio.paused) {
        audio.src = ''
        audio.load()
      }
    }
    
    // 2. 清理图片缓存 - 移除不可见的图片元素
    const images = document.querySelectorAll('img[data-loaded="true"]')
    images.forEach(img => {
      const rect = img.getBoundingClientRect()
      // 如果图片不在视口内且已加载
      if (rect.top < -500 || rect.bottom > window.innerHeight + 500) {
        // 清理图片引用，但保留占位
        if (img.dataset.originalSrc) {
          img.removeAttribute('src')
        }
      }
    })
    
    // 3. 触发垃圾回收（如果可用）
    if (window.gc) {
      window.gc()
      console.log('✅ 渲染进程 GC 已执行')
    }
    
    // 4. 清理大型数组和对象缓存
    // 保留最近的播放历史，清理较旧的
    if (playlist.value.length > 100) {
      console.log(`清理播放列表，保留最近100首歌曲 (原有 ${playlist.value.length} 首)`)
      // 保留当前播放的歌曲和前后的歌曲
      const currentIndex = playlistIndex.value
      const start = Math.max(0, currentIndex - 50)
      const end = Math.min(playlist.value.length, currentIndex + 50)
      playlist.value = playlist.value.slice(start, end)
      playlistIndex.value = currentIndex - start
    }
    
    console.log('✅ [渲染进程] 内存清理完成')
  } catch (error) {
    console.error('❌ [渲染进程] 内存清理失败:', error)
  }
}
</script>

<template>
  <div class="app-container">
    <TitleBar 
      @show-login="handleShowLogin"
      @logout="handleLogout"
      @open-settings="handleShowSettings"
      :userLoggedIn="userLoggedIn"
      :userInfo="userInfo"
      :isLyricViewVisible="isLyricViewVisible"
    />
    
    <div class="content">
      <!-- 登录界面 -->
      <LoginView 
        v-if="showLogin" 
        @back="handleBackToMain"
        @loginSuccess="handleLoginSuccess"
      />
      
      <!-- 主界面布局 -->
      <div v-else class="main-layout">
        <!-- 侧边栏（始终显示）-->
        <Sidebar 
          :playlists="userPlaylists"
          :currentView="currentView"
          :userLoggedIn="userLoggedIn"
          @navigate="handleNavigate"
          @create-playlist="handleCreatePlaylist"
        />
        
        <!-- 主内容区域 -->
        <div class="main-content">
          <div class="content-view">
            <!-- 设置视图 -->
            <div v-if="currentView === 'settings'" class="view-settings">
              <SettingsView 
                @close="handleCloseSettings"
                @settings-changed="handleSettingsChanged"
              />
            </div>
            
            <!-- 主页视图（未登录和登录后都显示）-->
            <div v-else-if="currentView === 'home'" class="view-home">
              <HomeView 
                @navigate="handleNavigate"
                @play="handlePlay"
              />
            </div>
            
            <!-- 收藏视图（仅登录后可访问）-->
            <div v-else-if="currentView === 'favorite' && userLoggedIn" class="view-favorite">
              <FavoriteView 
                :current-song="currentSong"
                @navigate="handleNavigate"
                @play="handlePlay"
                @play-all="handlePlayAll"
                @play-next="handlePlayNext"
                @remove-from-playlist="handleRemoveFromPlaylist"
                @search="handleSearch"
              />
            </div>
            
            <!-- 歌单视图（仅登录后可访问）-->
            <div v-else-if="currentView === 'playlist' && userLoggedIn" class="view-playlist">
              <h1>歌单详情</h1>
              <p class="placeholder">歌单内容将在这里显示</p>
            </div>
            
            <!-- 未登录时访问需要登录的页面，显示提示 -->
            <div v-else-if="!userLoggedIn && currentView !== 'home'" class="login-required">
              <svg viewBox="0 0 1024 1024" width="80" height="80" fill="currentColor" opacity="0.3">
                <path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"/>
              </svg>
              <h2>需要登录</h2>
              <p>请先登录以访问此页面</p>
              <button class="primary-btn" @click="handleShowLogin">
                立即登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 全局音乐播放器 -->
    <Transition name="player-slide">
      <MusicPlayer 
        v-if="currentSong"
        ref="musicPlayerRef"
        :song="currentSong"
        :playlist="playlist"
        @previous="handlePrevious"
        @next="handleNext"
        @song-changed="handleSongChanged"
        @toggle-playlist="handleTogglePlaylist"
        @toggle-favorite="handleToggleFavorite"
        @clear-playlist="handleClearPlaylist"
        @lyric-view-changed="handleLyricViewChanged"
      />
    </Transition>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow: hidden;
  position: relative;
}

/* 播放器滑入滑出动画 */
.player-slide-enter-active {
  animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.player-slide-leave-active {
  animation: slideDown 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  position: relative;
  z-index: 1;
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(135deg, var(--color-background) 0%, var(--color-background-light) 100%);
  padding-bottom: 90px; /* 为播放器留出空间 */
}

/* 自定义滚动条 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: var(--color-background);
}

.main-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.welcome-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--spacing-lg);
}

.welcome-screen h1 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-md);
}

.welcome-screen p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

/* 需要登录提示页面 */
.login-required {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 140px); /* 减去标题栏和播放器高度 */
  padding: var(--spacing-xl);
  text-align: center;
}

.login-required svg {
  margin-bottom: var(--spacing-xl);
  opacity: 0.3;
}

.login-required h2 {
  font-size: var(--font-size-xl);
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.login-required p {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

.primary-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.primary-btn:active {
  transform: translateY(0);
}

.content-view {
  min-height: 100%;
}

.view-home {
  height: 100%;
}

.view-favorite {
  height: 100%;
}

.view-settings {
  height: 100%;
}

.content-view h1 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--spacing-lg);
  color: var(--color-text);
}

.user-welcome {
  text-align: center;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  background: var(--color-background-light);
  border: 1px solid var(--color-border);
  max-width: 400px;
  margin: var(--spacing-xl) auto;
}

.user-welcome p {
  margin: var(--spacing-sm) 0;
  color: var(--color-text);
  font-size: var(--font-size-base);
}

.user-id {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.vip-badge {
  display: inline-block;
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #000;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
}

.placeholder {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  text-align: center;
  padding: var(--spacing-xl);
}
</style>
