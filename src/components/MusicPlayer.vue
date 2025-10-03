<template>
  <div class="music-player" v-if="currentSong">
    <!-- 进度条 -->
    <div class="progress-bar-container">
      <input 
        type="range" 
        class="progress-bar" 
        :style="{ '--progress': progressPercent + '%' }"
        min="0" 
        :max="duration"
        :value="currentTime"
        @input="handleProgressDrag"
        @change="handleProgressChange"
      />
    </div>

    <!-- 播放器主体 -->
    <div class="player-main">
      <!-- 左侧：歌曲信息 -->
      <div class="song-info-section">
        <img 
          v-if="currentSong.cover" 
          :src="currentSong.cover.replace('{size}', '400')" 
          class="song-cover"
          :alt="currentSong.name"
          @click="showLyrics"
          title="点击查看歌词"
        />
        <div class="song-details">
          <div class="song-name">{{ getSongName(currentSong.name) }}</div>
          <div class="song-artist">{{ getSingerNames(currentSong.singerinfo) }}</div>
        </div>
        <button class="icon-btn favorite-btn" :class="{ active: isFavorite }" @click="toggleFavorite">
          <svg viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor">
            <path d="M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/>
          </svg>
        </button>
        <div class="time-info">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="separator">/</span>
          <span class="total-time">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- 中间：播放控制 -->
      <div class="player-controls-section">
        <div class="control-buttons">
          <button class="control-btn" @click="playPrevious" :disabled="isSwitchingSong" title="上一曲">
            <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
              <path d="M793.6 150.4c-12.8 0-25.6 4.8-35.2 14.4L416 480v-288c0-19.2-16-35.2-35.2-35.2s-35.2 16-35.2 35.2v646.4c0 19.2 16 35.2 35.2 35.2s35.2-16 35.2-35.2V544l342.4 315.2c9.6 9.6 22.4 14.4 35.2 14.4 19.2 0 35.2-16 35.2-35.2V185.6c0-19.2-16-35.2-35.2-35.2z"/>
            </svg>
          </button>
          
          <button class="control-btn play-btn" @click="togglePlay">
            <svg v-if="isPlaying" viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
              <path d="M304 176h80v672h-80zm336 0h80v672h-80z"/>
            </svg>
            <svg v-else viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
              <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z"/>
            </svg>
          </button>
          
          <button class="control-btn" @click="playNext" :disabled="isSwitchingSong" title="下一曲">
            <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
              <path d="M230.4 150.4c12.8 0 25.6 4.8 35.2 14.4L608 480v-288c0-19.2 16-35.2 35.2-35.2s35.2 16 35.2 35.2v646.4c0 19.2-16 35.2-35.2 35.2s-35.2-16-35.2-35.2V544L265.6 859.2c-9.6 9.6-22.4 14.4-35.2 14.4-19.2 0-35.2-16-35.2-35.2V185.6c0-19.2 16-35.2 35.2-35.2z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 右侧:音量和其他控制 -->
      <div class="player-extras-section">
        <button 
          class="icon-btn" 
          @click="togglePlayMode" 
          @contextmenu.prevent.stop="showPlayModeMenu"
          :title="playModeText"
        >
          <img v-if="playMode === 'loop'" :src="repeatAllIcon" alt="列表循环" width="18" height="18" />
          <img v-else-if="playMode === 'single'" :src="repeatOneIcon" alt="单曲循环" width="18" height="18" />
          <img v-else :src="shuffleIcon" alt="随机播放" width="18" height="18" />
        </button>

        <div class="volume-control">
          <button class="icon-btn" @click="toggleMute">
            <img v-if="isMuted || volume === 0" :src="sound0Icon" alt="静音" width="18" height="18" />
            <img v-else-if="volume <= 30" :src="sound1Icon" alt="音量低" width="18" height="18" />
            <img v-else-if="volume <= 60" :src="sound2Icon" alt="音量中" width="18" height="18" />
            <img v-else :src="sound3Icon" alt="音量高" width="18" height="18" />
          </button>
          <input 
            type="range" 
            class="volume-slider" 
            min="0" 
            max="100" 
            v-model="volume"
            @input="handleVolumeChange"
          />
        </div>

        <button class="icon-btn" @click="togglePlaylist" title="播放列表">
          <img :src="playlistIcon" alt="播放列表" width="18" height="18" />
        </button>
      </div>
    </div>

    <!-- 音频元素 -->
    <audio 
      ref="audioPlayer" 
      @loadedmetadata="handleLoadedMetadata"
      @ended="handleEnded"
      @play="handlePlay"
      @pause="handlePause"
      @timeupdate="handleTimeUpdate"
    ></audio>
    
    <!-- 播放列表抽屉 -->
    <PlaylistDrawer 
      :visible="showPlaylist"
      :playlist="playlist"
      :currentSong="currentSong"
      :isPlaying="isPlaying"
      @close="showPlaylist = false"
      @play="handlePlaylistPlay"
      @remove="handleRemoveSong"
      @clear="handleClearPlaylist"
    />

    <!-- 播放模式右键菜单 -->
    <ContextMenu
      :visible="playModeMenuVisible"
      :position="playModeMenuPosition"
      :items="playModeMenuItems"
      @close="playModeMenuVisible = false"
    />

    <!-- 歌词界面 -->
    <Transition name="lyric-view">
      <LyricView
        v-if="showLyricView"
        :visible="showLyricView"
        :song="currentSong"
        :lyrics="currentLyrics"
        :current-play-time="currentTime"
        :duration="duration"
        :is-playing="isPlaying"
        :play-mode="playMode"
        :is-favorite="isFavorite"
        @close="closeLyrics"
        @toggle-play="togglePlay"
        @previous="playPrevious"
        @next="playNext"
        @toggle-play-mode="cyclePlayMode"
        @toggle-favorite="toggleFavorite"
      />
    </Transition>
  </div>
</template>

<script>
import { getSongUrl, getLyric, getSongDetail } from '../api/music.js'
import PlaylistDrawer from './PlaylistDrawer.vue'
import ContextMenu from './ContextMenu.vue'
import LyricView from './LyricView.vue'
import contextMenuManager from '../utils/contextMenuManager.js'

// 动态导入 SVG 图标
import playlistIcon from '../icon/playlist.svg'
import repeatAllIcon from '../icon/repeat_all.svg'
import repeatOneIcon from '../icon/repeat_one.svg'
import shuffleIcon from '../icon/shuffle.svg'
import sound0Icon from '../icon/sound_0.svg'
import sound1Icon from '../icon/sound_1.svg'
import sound2Icon from '../icon/sound_2.svg'
import sound3Icon from '../icon/sound_3.svg'

export default {
  name: 'MusicPlayer',
  components: {
    PlaylistDrawer,
    ContextMenu,
    LyricView
  },
  props: {
    song: {
      type: Object,
      default: null
    },
    playlist: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // SVG 图标
      playlistIcon,
      repeatAllIcon,
      repeatOneIcon,
      shuffleIcon,
      sound0Icon,
      sound1Icon,
      sound2Icon,
      sound3Icon,
      // 状态
      currentSong: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isDragging: false, // 是否正在拖动进度条
      volume: 80,
      isMuted: false,
      playMode: 'loop', // loop: 列表循环, single: 单曲循环, shuffle: 随机播放
      isFavorite: false,
      currentIndex: 0, // 当前播放索引
      showPlaylist: false, // 是否显示播放列表
      playedHistory: [], // 已播放历史（用于随机播放）
      playOrderHistory: [], // 播放顺序历史（用于上一首功能）
      historyPointer: -1, // 播放历史指针，-1表示在最新位置
      isNavigatingHistory: false, // 是否正在历史记录中导航
      playNextQueue: [], // 下一首播放队列
      playModeMenuVisible: false, // 播放模式菜单显示状态
      playModeMenuPosition: { x: 0, y: 0 }, // 播放模式菜单位置
      // 歌词相关
      showLyricView: false, // 是否显示歌词界面
      currentLyrics: '', // 当前歌词内容
      // MediaSession 相关
      lastPositionUpdate: null, // 上次位置更新的时间（秒）
      // 切歌控制
      isSwitchingSong: false, // 是否正在切歌（防止并发）
      switchSongDebounceTimer: null, // 切歌防抖定时器
      // RAF 循环
      rafId: null // requestAnimationFrame ID
    }
  },
  computed: {
    progressPercent() {
      if (this.duration === 0) return 0
      return (this.currentTime / this.duration) * 100
    },
    playModeText() {
      const modeMap = {
        loop: '列表循环',
        single: '单曲循环',
        shuffle: '随机播放'
      }
      return modeMap[this.playMode]
    },
    playModeMenuItems() {
      return [
        {
          label: '单曲循环',
          icon: 'M196 256h-48c-4.4 0-8 3.6-8 8v456c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V264c0-4.4-3.6-8-8-8z M792 256h-48c-4.4 0-8 3.6-8 8v456c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V264c0-4.4-3.6-8-8-8z',
          action: () => this.setPlayMode('single')
        },
        {
          label: '列表循环',
          icon: 'M758.2 839.1C851.8 765.9 912 651.9 912 523.9 912 303 733.5 124.3 512.6 124 291.4 123.7 112 302.8 112 524c0 125.2 57.5 236.9 147.6 310.2 3.5 2.8 8.6 2.2 11.4-1.3l39.4-50.5c2.7-3.4 2.1-8.3-1.2-11.1-8.1-6.6-15.9-13.7-23.4-21.2a318.64 318.64 0 01-68.6-101.7C200.4 609 192 567.1 192 523.9s8.4-85.1 25.1-124.5c16.1-38.1 39.2-72.3 68.6-101.7 29.4-29.4 63.6-52.5 101.7-68.6C426.9 212.4 468.8 204 512 204s85.1 8.4 124.5 25.1c38.1 16.1 72.3 39.2 101.7 68.6 29.4 29.4 52.5 63.6 68.6 101.7 16.7 39.4 25.1 81.3 25.1 124.5s-8.4 85.1-25.1 124.5a318.64 318.64 0 01-68.6 101.7c-9.3 9.3-19.1 18-29.3 26L668.2 724a8 8 0 00-14.1 3l-39.6 162.2c-1.2 5 2.6 9.9 7.7 9.9l167.3-4.3c5.3-.1 8.8-5.3 6.8-10.2l-36.1-146.8z',
          action: () => this.setPlayMode('loop')
        },
        {
          label: '随机播放',
          icon: 'M568 424h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H568c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm0 248h144c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H568c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-184-24c9.9 0 19.6-2.2 28.5-6.4L459 731.2c2.1 0.9 4.5 0.8 6.4-0.4 2-1.2 3.3-3.3 3.3-5.6v-76.5l119.4 89.6c6.6 5 14.9 7.7 23.4 7.7 20.7 0 37.5-16.8 37.5-37.5V316.5c0-20.7-16.8-37.5-37.5-37.5-8.5 0-16.8 2.7-23.4 7.7L468.6 376v-76.5c0-2.3-1.3-4.4-3.3-5.6-1.9-1.2-4.3-1.3-6.4-0.4l-46.5 23.6c-8.9-4.2-18.6-6.4-28.5-6.4-35.3 0-64 28.7-64 64v272c0 35.3 28.7 64 64 64z',
          action: () => this.setPlayMode('shuffle')
        }
      ]
    }
  },
  watch: {
    song: {
      handler(newSong) {
        if (newSong) {
          // 如果新歌曲与当前播放的歌曲相同，不重新加载
          if (this.currentSong && this.currentSong.hash === newSong.hash) {
            console.log('🔄 歌曲相同，跳过重复加载:', newSong.name || newSong.filename)
            return
          }
          // ⚠️ 检查是否正在切歌中，避免冲突
          if (this.isSwitchingSong) {
            console.log('⚠️ 正在切歌中，忽略外部 song prop 变化')
            return
          }
          console.log('📻 外部传入新歌曲，加载:', newSong.name || newSong.filename)
          this.currentSong = newSong
          this.loadSong(newSong)
        }
      },
      immediate: true
    },
    // 监听播放列表变化
    playlist: {
      handler(newPlaylist) {
        console.log('播放列表更新:', newPlaylist.length, '首歌曲')
        // 播放列表变化时重置历史记录
        this.playOrderHistory = []
        this.playedHistory = []
      },
      deep: true
    },
    // 监听当前播放索引变化，记录播放顺序
    currentIndex: {
      handler(newIndex, oldIndex) {
        if (newIndex !== -1 && oldIndex !== newIndex && !this.isNavigatingHistory && !this.isSwitchingSong) {
          // 如果我们在历史中间，需要截断后面的历史
          if (this.historyPointer !== -1) {
            this.playOrderHistory = this.playOrderHistory.slice(0, this.historyPointer + 1)
          }
          
          // 只有真正切换歌曲时才记录（避免重复记录）
          const lastRecordedIndex = this.playOrderHistory[this.playOrderHistory.length - 1]
          if (lastRecordedIndex !== newIndex) {
            this.playOrderHistory.push(newIndex)
            // 限制历史记录长度
            if (this.playOrderHistory.length > 50) {
              this.playOrderHistory.shift()
            }
            console.log('🎵 记录播放顺序历史:', newIndex, '历史长度:', this.playOrderHistory.length)
          }
          
          // 重置指针到最新位置
          this.historyPointer = -1
        }
        
        // ⚠️ 注意：不在这里触发 loadSong，由 playNext/playPrevious 等方法直接调用
        // 只在索引改变后通知父组件（但不触发重复加载）
        if (newIndex !== -1 && this.playlist[newIndex] && !this.isSwitchingSong) {
          this.$emit('song-changed', this.playlist[newIndex])
        }
      }
    }
  },
  mounted() {
    // 从 localStorage 恢复音量和播放模式
    const savedVolume = localStorage.getItem('player_volume')
    if (savedVolume) {
      this.volume = parseInt(savedVolume)
      this.$refs.audioPlayer.volume = this.volume / 100
    }
    
    const savedMode = localStorage.getItem('player_mode')
    if (savedMode && ['loop', 'single', 'shuffle'].includes(savedMode)) {
      this.playMode = savedMode
    }
    
    // 初始化系统媒体控制
    this.initMediaSessionHandlers()
    
    // 启动 RAF 循环进行高频时间更新
    this.startTimeUpdate()
  },
  beforeUnmount() {
    // 组件销毁前停止 RAF 循环
    this.stopTimeUpdate()
  },
  methods: {
    // 加载歌曲
    async loadSong(song) {
      // 保存当前播放的歌曲作为备份
      const previousSong = this.currentSong
      const wasPlaying = this.isPlaying
      
      try {
        console.log('开始加载歌曲:', song)
        
        // 第一步：获取歌曲详细信息（如果需要）
        let audioDetail = song
        if (!song.album_audio_id || song.album_audio_id === 0) {
          console.log('获取歌曲详情...')
          const detailResponse = await getSongDetail(song.hash)
          console.log('歌曲详情响应:', detailResponse)
          
          if (detailResponse && detailResponse.status === 1 && detailResponse.data && detailResponse.data.length > 0) {
            audioDetail = { ...song, ...detailResponse.data[0] }
            console.log('合并后的歌曲信息:', audioDetail)
          }
        }
        
        // 第二步：获取歌曲播放地址（使用旧版API，返回未加密的mp3格式）
        const urlResponse = await getSongUrl(
          audioDetail.hash,
          audioDetail.album_id || 0,
          audioDetail.album_audio_id || 0
        )
        
        console.log('播放地址响应状态:', urlResponse.status)
        
        // 检查响应状态
        if (urlResponse && urlResponse.status === 1) {
          let playUrl = null
          
          // 参考 BetterKugou：response.url 是一个数组，取第一个元素
          if (urlResponse.url && Array.isArray(urlResponse.url) && urlResponse.url.length > 0) {
            playUrl = urlResponse.url[0]  // ⚠️ 重要：取数组第一个元素
            console.log('✅ 获取播放URL:', playUrl)
            
            // 如果是 http，转换为 https（提高安全性）
            if (playUrl && playUrl.startsWith('http://')) {
              playUrl = playUrl.replace('http://', 'https://')
              console.log('🔒 转换为HTTPS')
            }
          }
          // 备用：直接字符串格式
          else if (urlResponse.url && typeof urlResponse.url === 'string') {
            playUrl = urlResponse.url
            console.log('✅ 获取播放URL (字符串):', playUrl)
          }
          
          if (playUrl && typeof playUrl === 'string') {
            console.log('🎵 设置音频源')
            const audioEl = this.$refs.audioPlayer
            audioEl.src = playUrl
            
            // ✅ 只在成功获取播放地址后才更新 currentSong
            this.currentSong = song
            
            // 自动播放
            try {
              await audioEl.play()
              console.log('▶️ 播放成功')
              
              // 设置系统媒体会话信息 (SMTC)
              this.updateMediaSession(audioDetail)
              
              // 更新收藏状态
              this.checkFavoriteStatus()
              
              // 更新随机播放的已播放历史
              if (this.playMode === 'shuffle' && !this.playedHistory.includes(this.currentIndex)) {
                this.playedHistory.push(this.currentIndex)
              }
              
              // 加载歌词（不阻塞，失败也不影响播放）
              this.loadLyric(song).catch(err => {
                console.warn('歌词加载失败，但不影响播放:', err.message)
              })
            } catch (playError) {
              console.error('❌ 播放失败:', playError.message)
              this.showError(`播放失败: ${playError.message}`)
              // 恢复之前的歌曲
              this.currentSong = previousSong
              return false
            }
          } else {
            console.error('❌ 播放地址无效')
            this.showError('播放地址格式错误，跳过该歌曲')
            // 恢复之前的歌曲
            this.currentSong = previousSong
            return false
          }
        } else {
          console.error('❌ 获取播放地址失败，状态:', urlResponse?.status)
          const errorMsg = this.getPlayErrorMessage(urlResponse)
          this.showError(errorMsg)
          // 恢复之前的歌曲
          this.currentSong = previousSong
          return false
        }
        
        return true
      } catch (error) {
        console.error('加载歌曲失败:', error)
        this.showError(`加载歌曲失败: ${error.response?.data?.msg || error.message}`)
        // 恢复之前的歌曲
        this.currentSong = previousSong
        return false
      }
    },
    
    // 显示错误提示（非弹窗）
    showError(message) {
      console.warn('⚠️', message)
      // TODO: 可以在这里添加一个非阻塞的提示组件
      // 例如 Toast 提示
    },
    
    // 获取播放错误信息
    getPlayErrorMessage(response) {
      if (!response) {
        return '获取播放地址失败，请检查网络连接'
      }
      
      // 检查版权和VIP限制
      if (response.priv_status === 0) {
        return '该歌曲需要VIP权限或存在版权限制'
      }
      
      if (response.error_code) {
        return `播放失败: ${response.error_msg || response.error_code}`
      }
      
      if (response.fail_process && response.fail_process.length > 0) {
        return '该歌曲暂时无法播放，可能是版权限制'
      }
      
      return '无法获取歌曲播放地址，请稍后重试'
    },
    
    // 加载歌词
    async loadLyric(song) {
      try {
        console.log('开始加载歌词，歌曲信息:', {
          hash: song.hash,
          album_audio_id: song.album_audio_id
        })
        
        // 设置超时和重试机制
        const lyricResponse = await Promise.race([
          getLyric(song.hash, song.album_audio_id || 0),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('歌词加载超时')), 10000)
          )
        ])
        
        console.log('歌词API响应:', lyricResponse)
        
        // 检查API响应状态 (可能是status: 200 或 status: 1)
        if (lyricResponse && (lyricResponse.status === 200 || lyricResponse.status === 1)) {
          // 优先使用解码后的内容
          if (lyricResponse.decodeContent) {
            this.currentLyrics = lyricResponse.decodeContent
            console.log('✅ 歌词加载成功（已解码），内容长度:', lyricResponse.decodeContent.length)
            console.log('🔍 设置的歌词内容预览:', this.currentLyrics.substring(0, 200))
          } else if (lyricResponse.content) {
            // 如果没有解码内容，尝试使用原始content（可能是base64编码）
            try {
              // 尝试base64解码
              const decoded = atob(lyricResponse.content)
              this.currentLyrics = decoded
              console.log('✅ 歌词base64解码成功，内容长度:', decoded.length)
            } catch (e) {
              // 如果解码失败，直接使用原始内容
              this.currentLyrics = lyricResponse.content
              console.log('✅ 使用原始歌词内容，长度:', lyricResponse.content.length)
            }
          } else if (lyricResponse.data && lyricResponse.data.content) {
            // 尝试从data.content获取
            this.currentLyrics = lyricResponse.data.content
            console.log('✅ 从data.content获取歌词成功')
          } else {
            // 打印完整响应以便调试
            console.log('📋 完整歌词API响应:', JSON.stringify(lyricResponse, null, 2))
            this.setDefaultLyrics(song)
            console.log('⚠️ 歌词内容为空，使用默认歌词')
          }
        } else {
          console.log('📋 完整响应:', JSON.stringify(lyricResponse, null, 2))
          this.setDefaultLyrics(song)
          console.log('⚠️ 歌词获取失败，状态:', lyricResponse?.status)
        }
      } catch (error) {
        console.error('❌ 加载歌词失败:', error)
        
        // 根据错误类型提供不同的处理
        if (error.code === 'ERR_BAD_RESPONSE' || error.response?.status === 502) {
          console.log('🔄 API服务暂时不可用，使用默认歌词')
          this.setDefaultLyrics(song)
        } else {
          this.currentLyrics = '[00:00.00]歌词服务暂时不可用'
        }
      }
    },

    // 设置默认歌词
    setDefaultLyrics(song) {
      const songName = this.getSongName(song.name || song.songname || song.audio_name)
      const artistName = this.getSingerNames(song.singerinfo || song.singername)
      
      this.currentLyrics = `[00:00.00]♪ 正在播放: ${songName}
[00:02.00]♪ 演唱者: ${artistName}
[00:04.00]
[00:06.00]🎵 暂时无法获取歌词
[00:08.00]🎵 请欣赏这美妙的音乐
[00:10.00]
[00:30.00]♪ 享受音乐带来的美好时光`
    },
    
    // 播放/暂停
    togglePlay() {
      const audioEl = this.$refs.audioPlayer
      if (!audioEl.src) {
        console.warn('没有设置音频源')
        return
      }
      
      if (this.isPlaying) {
        audioEl.pause()
      } else {
        audioEl.play().catch(error => {
          console.error('播放失败:', error)
        })
      }
    },
    
    // 上一曲
    async playPrevious() {
      if (this.playlist.length === 0) return
      
      // 防止并发切歌
      if (this.isSwitchingSong) {
        console.warn('⚠️ 正在切歌中，忽略本次请求')
        return
      }
      
      // 清除防抖定时器
      if (this.switchSongDebounceTimer) {
        clearTimeout(this.switchSongDebounceTimer)
      }
      
      // 设置切歌锁
      this.isSwitchingSong = true
      console.log('🔒 开始切歌（上一曲），已加锁')
      
      const originalIndex = this.currentIndex
      let attempts = 0
      const maxAttempts = Math.min(5, this.playlist.length) // 最多尝试5首歌，避免无限循环
      
      this.isNavigatingHistory = true // 设置导航标志
      
      try {
        while (attempts < maxAttempts) {
          if (this.playMode === 'shuffle') {
            // 随机模式下，从播放历史中获取上一首
            if (this.playOrderHistory.length > 0) {
              let targetPointer;
              
              if (this.historyPointer === -1) {
                // 当前在最新位置，回到倒数第二个
                targetPointer = this.playOrderHistory.length - 2
              } else {
                // 当前在历史中间，继续向前
                targetPointer = this.historyPointer - 1
              }
              
              if (targetPointer >= 0) {
                this.historyPointer = targetPointer
                const previousIndex = this.playOrderHistory[targetPointer]
                this.currentIndex = previousIndex
                
                // 从 playedHistory 中移除当前歌曲
                const currentIndexPos = this.playedHistory.indexOf(originalIndex)
                if (currentIndexPos !== -1) {
                  this.playedHistory.splice(currentIndexPos, 1)
                }
                
                console.log('🔀 随机模式回到上一首:', this.playlist[this.currentIndex].name, '索引:', this.currentIndex, '指针位置:', targetPointer)
              } else {
                // 已经到历史最前面，按列表循环处理
                this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
                console.log('� 已到历史最前，循环到上一首:', this.playlist[this.currentIndex].name)
              }
            } else {
              // 没有播放历史，按列表循环处理
              this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
              console.log('🔀 随机模式无历史，循环到上一首:', this.playlist[this.currentIndex].name)
            }
          } else {
            // 列表循环
            this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length
          }
          
          const nextSong = this.playlist[this.currentIndex]
          console.log(`尝试播放上一曲 (${attempts + 1}/${maxAttempts}):`, nextSong.name || nextSong.filename, '索引:', this.currentIndex)
          
          // 验证歌曲是否有效（必须有 hash）
          if (!nextSong.hash) {
            console.warn('⚠️ 歌曲缺少 hash，跳过:', nextSong)
            await new Promise(resolve => setTimeout(resolve, 300))
            attempts++
            continue
          }
          
          const success = await this.loadSong(nextSong)
          if (success) {
            console.log('✅ 上一曲加载成功:', nextSong.name)
            return
          }
          
          console.warn('❌ 上一曲加载失败，尝试下一首...')
          // 添加短暂延迟，避免过快切换
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }
        
        // 所有歌曲都尝试失败
        console.error('所有歌曲都无法播放')
        this.currentIndex = originalIndex
        this.showError('播放列表中没有可播放的歌曲')
      } finally {
        this.isNavigatingHistory = false // 重置导航标志
        // 解除切歌锁，添加防抖延迟
        this.switchSongDebounceTimer = setTimeout(() => {
          this.isSwitchingSong = false
          console.log('🔓 切歌完成，已解锁')
        }, 300)
      }
    },
    
    // 下一曲
    async playNext() {
      if (this.playlist.length === 0) return
      
      // 防止并发切歌
      if (this.isSwitchingSong) {
        console.warn('⚠️ 正在切歌中，忽略本次请求')
        return
      }
      
      // 清除防抖定时器
      if (this.switchSongDebounceTimer) {
        clearTimeout(this.switchSongDebounceTimer)
      }
      
      // 设置切歌锁
      this.isSwitchingSong = true
      console.log('🔒 开始切歌（下一曲），已加锁')
      
      try {
        const originalIndex = this.currentIndex
        let attempts = 0
        const maxAttempts = Math.min(5, this.playlist.length) // 最多尝试5首歌，避免无限循环
      
      while (attempts < maxAttempts) {
        // 先检查"下一首播放"队列
        if (this.playNextQueue.length > 0) {
          const nextSong = this.playNextQueue.shift() // 取出队列第一首
          const songIndex = this.playlist.findIndex(s => s.hash === nextSong.hash)
          
          if (songIndex !== -1) {
            this.currentIndex = songIndex
            console.log('🎯 播放"下一首播放"队列中的歌曲:', nextSong.name, '索引:', this.currentIndex)
            
            const success = await this.loadSong(nextSong)
            if (success) {
              console.log('✅ 下一首播放成功:', nextSong.name)
              return
            }
            console.warn('❌ 下一首播放失败，继续尝试队列中的下一首或正常播放...')
            continue // 继续尝试下一首
          }
        }
        
        // 正常播放逻辑
        if (this.playMode === 'shuffle') {
          // 随机播放：从未播放的歌曲中随机选择
          const unplayedSongs = this.playlist.filter((song, index) => 
            !this.playedHistory.includes(index) && index !== this.currentIndex
          )
          
          if (unplayedSongs.length === 0) {
            // 所有歌曲都播放过了，清空历史重新开始
            this.playedHistory = [this.currentIndex]
            const availableSongs = this.playlist.filter((song, index) => index !== this.currentIndex)
            if (availableSongs.length > 0) {
              const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)]
              this.currentIndex = this.playlist.findIndex(s => s.hash === randomSong.hash)
            }
          } else {
            // 从未播放的歌曲中随机选择
            const randomSong = unplayedSongs[Math.floor(Math.random() * unplayedSongs.length)]
            this.currentIndex = this.playlist.findIndex(s => s.hash === randomSong.hash)
            this.playedHistory.push(this.currentIndex)
          }
        } else {
          // 列表循环
          this.currentIndex = (this.currentIndex + 1) % this.playlist.length
        }
        
        const nextSong = this.playlist[this.currentIndex]
        console.log(`尝试播放下一曲 (${attempts + 1}/${maxAttempts}):`, nextSong.name || nextSong.filename, '索引:', this.currentIndex)
        
        // 验证歌曲是否有效（必须有 hash）
        if (!nextSong.hash) {
          console.warn('⚠️ 歌曲缺少 hash，跳过:', nextSong)
          await new Promise(resolve => setTimeout(resolve, 300))
          attempts++
          continue
        }
        
        const success = await this.loadSong(nextSong)
        if (success) {
          console.log('✅ 下一曲加载成功:', nextSong.name)
          return
        }
        
        console.warn('❌ 下一曲加载失败，尝试下一首...')
        // 添加短暂延迟，避免过快切换
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }
      
      // 所有歌曲都尝试失败
      console.error('所有歌曲都无法播放')
      this.currentIndex = originalIndex
      this.showError('播放列表中没有可播放的歌曲')
      } finally {
        // 解除切歌锁，添加防抖延迟
        this.switchSongDebounceTimer = setTimeout(() => {
          this.isSwitchingSong = false
          console.log('🔓 切歌完成，已解锁')
        }, 300)
      }
    },
    
    // RAF 驱动的高频时间更新（60fps）
    updateTimeLoop() {
      const audioEl = this.$refs.audioPlayer
      if (audioEl && !this.isDragging) {
        this.currentTime = audioEl.currentTime
      }
      // 持续循环
      this.rafId = requestAnimationFrame(this.updateTimeLoop)
    },
    
    // 启动时间更新循环
    startTimeUpdate() {
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(this.updateTimeLoop)
      }
    },
    
    // 停止时间更新循环
    stopTimeUpdate() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId)
        this.rafId = null
      }
    },
    
    // 元数据加载完成
    handleLoadedMetadata() {
      this.duration = this.$refs.audioPlayer.duration
      // 初始化 MediaSession 位置状态
      this.updatePositionState()
    },
    
    // 播放结束
    handleEnded() {
      if (this.playMode === 'single') {
        this.$refs.audioPlayer.currentTime = 0
        this.$refs.audioPlayer.play()
      } else {
        this.playNext()
      }
    },
    
    // 进度条拖动（实时更新显示但不改变播放位置）
    handleProgressDrag(e) {
      // 只更新显示，不影响播放
      this.isDragging = true
    },
    
    // 进度条更改完成（释放鼠标时更改播放位置）
    handleProgressChange(e) {
      const audioEl = this.$refs.audioPlayer
      if (!audioEl.src) return
      
      audioEl.currentTime = parseFloat(e.target.value)
      this.isDragging = false
    },
    
    // 音量调节
    handleVolumeChange() {
      const audioEl = this.$refs.audioPlayer
      audioEl.volume = this.volume / 100
      this.isMuted = this.volume === 0
      
      // 保存音量设置到 localStorage
      localStorage.setItem('player_volume', this.volume)
    },
    
    // 静音切换
    toggleMute() {
      const audioEl = this.$refs.audioPlayer
      this.isMuted = !this.isMuted
      audioEl.muted = this.isMuted
    },
    
    // 音频播放事件
    handlePlay() {
      this.isPlaying = true
      // 更新 MediaSession 播放状态
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
        this.updatePositionState()
      }
    },
    
    // 音频暂停事件
    handlePause() {
      this.isPlaying = false
      // 更新 MediaSession 播放状态
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused'
        this.updatePositionState()
      }
    },
    
    // 播放模式切换
    togglePlayMode() {
      const modes = ['loop', 'single', 'shuffle']
      const currentIndex = modes.indexOf(this.playMode)
      this.playMode = modes[(currentIndex + 1) % modes.length]
      
      // 如果切换到随机模式，初始化已播放历史
      if (this.playMode === 'shuffle') {
        this.playedHistory = [this.currentIndex]
        console.log('切换到随机播放模式，已播放历史:', this.playedHistory)
      } else {
        // 切换到其他模式，清空历史
        this.playedHistory = []
      }
      
      // 保存播放模式到 localStorage
      localStorage.setItem('player_mode', this.playMode)
      
      console.log('切换播放模式:', this.playModeText)
    },
    
    // 设置播放模式（从右键菜单调用）
    setPlayMode(mode) {
      this.playMode = mode
      
      // 重置播放历史记录
      if (mode === 'shuffle') {
        // 切换到随机模式，初始化已播放历史和播放顺序历史
        this.playedHistory = [this.currentIndex]
        this.playOrderHistory = [this.currentIndex]
        this.historyPointer = -1 // 重置指针
        console.log('设置为随机播放模式，已播放历史:', this.playedHistory)
      } else {
        // 切换到其他模式，清空所有历史
        this.playedHistory = []
        this.playOrderHistory = [this.currentIndex] // 保留当前歌曲
        this.historyPointer = -1 // 重置指针
      }
      
      // 保存播放模式到 localStorage
      localStorage.setItem('player_mode', mode)
      
      console.log('设置播放模式:', this.playModeText)
    },
    
    // 显示播放模式菜单
    showPlayModeMenu(event) {
      // 先关闭所有其他菜单
      contextMenuManager.closeActiveMenu()
      
      // 然后关闭自己的旧菜单，防止瞬移
      this.playModeMenuVisible = false
      
      // 使用 nextTick 确保旧菜单完全关闭后再打开新菜单
      this.$nextTick(() => {
        this.playModeMenuPosition = {
          x: event.clientX,
          y: event.clientY
        }
        this.playModeMenuVisible = true
        
        // 注册到全局管理器
        contextMenuManager.registerMenu(() => {
          this.playModeMenuVisible = false
        })
      })
    },

    // 循环切换播放模式
    cyclePlayMode() {
      const modes = ['loop', 'single', 'shuffle']
      const currentIndex = modes.indexOf(this.playMode)
      const nextIndex = (currentIndex + 1) % modes.length
      this.setPlayMode(modes[nextIndex])
    },
    
    // 收藏切换
    toggleFavorite() {
      this.isFavorite = !this.isFavorite
      this.$emit('toggle-favorite', this.currentSong)
    },

    // 显示歌词界面
    async showLyrics() {
      if (!this.currentSong) return
      
      // 如果没有歌词，尝试加载
      if (!this.currentLyrics) {
        await this.loadLyric(this.currentSong)
      }
      
      this.showLyricView = true
      this.$emit('lyric-view-changed', true)
    },

    // 关闭歌词界面
    closeLyrics() {
      this.showLyricView = false
      this.$emit('lyric-view-changed', false)
    },


    
    // 检查收藏状态
    checkFavoriteStatus() {
      if (!this.currentSong) {
        this.isFavorite = false
        return
      }
      
      try {
        const favorites = localStorage.getItem('favorite_songs')
        if (favorites) {
          const favoriteList = JSON.parse(favorites)
          this.isFavorite = favoriteList.some(song => song.hash === this.currentSong.hash)
        } else {
          this.isFavorite = false
        }
      } catch (e) {
        console.error('检查收藏状态失败:', e)
        this.isFavorite = false
      }
    },
    
    // 显示/隐藏播放列表
    togglePlaylist() {
      this.showPlaylist = !this.showPlaylist
    },
    
    // 播放列表中的歌曲
    async handlePlaylistPlay(song) {
      const index = this.playlist.findIndex(s => s.hash === song.hash)
      if (index !== -1) {
        const previousIndex = this.currentIndex
        this.currentIndex = index
        
        console.log('🎵 用户手动点击播放:', song.name, '索引:', index)
        const success = await this.loadSong(song)
        
        if (success) {
          console.log('✅ 手动播放成功')
          // 如果是随机模式，添加到已播放历史
          if (this.playMode === 'shuffle' && !this.playedHistory.includes(index)) {
            this.playedHistory.push(index)
          }
        } else {
          console.warn('❌ 手动播放失败，恢复原索引')
          this.currentIndex = previousIndex
          this.showError(`无法播放《${song.name}》`)
        }
      }
    },
    
    // 从播放列表移除歌曲
    async handleRemoveSong(index) {
      this.playlist.splice(index, 1)
      
      // 如果移除的是当前播放的歌曲之前的歌曲，需要调整索引
      if (index < this.currentIndex) {
        this.currentIndex--
      }
      // 如果移除的是当前播放的歌曲，播放下一曲
      else if (index === this.currentIndex && this.playlist.length > 0) {
        const nextSong = this.playlist[this.currentIndex] || this.playlist[0]
        const success = await this.loadSong(nextSong)
        if (!success && this.playlist.length > 1) {
          // 如果加载失败，尝试播放下一曲
          await this.playNext()
        }
      }
    },
    
    // 清空播放列表
    async handleClearPlaylist() {
      console.log('🗑️ 清空播放列表')
      
      // 先关闭播放列表抽屉，给用户平滑的视觉体验
      this.showPlaylist = false
      
      // 等待抽屉关闭动画完成
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 通过事件通知父组件清空播放列表
      this.$emit('clear-playlist')
      this.playNextQueue = [] // 清空下一首播放队列
    },
    
    // 添加到下一首播放队列
    addToPlayNextQueue(song) {
      // 检查歌曲是否已在队列中
      if (!this.playNextQueue.some(s => s.hash === song.hash)) {
        this.playNextQueue.push(song)
        console.log('🎯 添加到下一首播放队列:', song.name, '队列长度:', this.playNextQueue.length)
        
        // 如果歌曲不在播放列表中，添加到播放列表
        if (!this.playlist.some(s => s.hash === song.hash)) {
          this.playlist.push(song)
        }
      } else {
        console.log('歌曲已在下一首播放队列中:', song.name)
      }
    },
    
    // 从播放列表移除歌曲
    removeFromPlaylist(song) {
      const index = this.playlist.findIndex(s => s.hash === song.hash)
      if (index !== -1) {
        this.handleRemoveSong(index)
      }
      
      // 同时从下一首播放队列移除
      const queueIndex = this.playNextQueue.findIndex(s => s.hash === song.hash)
      if (queueIndex !== -1) {
        this.playNextQueue.splice(queueIndex, 1)
        console.log('从下一首播放队列中移除:', song.name)
      }
    },
    
    // 格式化时间
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    // 提取歌曲名称
    getSongName(fullName) {
      if (!fullName) return '未知歌曲'
      const parts = fullName.split(' - ')
      if (parts.length > 1) {
        return parts.slice(1).join(' - ')
      }
      return fullName
    },
    
    // 获取歌手名称
    getSingerNames(singerinfo) {
      if (!singerinfo || !Array.isArray(singerinfo)) return '未知歌手'
      return singerinfo.map(s => s.name).join('、')
    },
    
    // 更新系统媒体会话信息 (SMTC - System Media Transport Controls)
    updateMediaSession(song) {
      if ('mediaSession' in navigator) {
        try {
          // 提取歌名（去除歌手前缀）
          const songTitle = this.getSongName(song.filename || song.songname || song.audio_name || '未知歌曲')
          const artistName = this.getSingerNames(song.singerinfo) || song.singername || '未知歌手'
          
          // 获取封面图片 URL
          let coverUrl = song.img || song.album_cover || song.cover || ''
          
          // 调试日志：检查歌曲对象的所有图片相关字段
          console.log('🖼️ 封面图片调试信息:', {
            'song.img': song.img,
            'song.album_cover': song.album_cover,
            'song.cover': song.cover,
            'song.imgUrl': song.imgUrl,
            'song.pic': song.pic,
            '最终使用的URL': coverUrl
          })
          
          // 如果没有封面，使用占位图
          if (!coverUrl) {
            coverUrl = 'https://p1.music.126.net/6y-UleORITEDbvrOLV0Q8A==/5639395138885805.jpg'
            console.warn('⚠️ 未找到封面图片，使用默认占位图')
          }
          
          // 替换封面URL中的 {size} 占位符（酷狗API返回的URL格式）
          // 使用更高分辨率（1000）以获得更清晰的封面显示
          if (coverUrl.includes('{size}')) {
            coverUrl = coverUrl.replace('{size}', '1000')
            console.log('🔧 替换封面URL占位符（高清）:', coverUrl)
          }
          
          // 确保 URL 使用 HTTPS（避免混合内容问题）
          if (coverUrl.startsWith('http://')) {
            coverUrl = coverUrl.replace('http://', 'https://')
            console.log('将封面 URL 转换为 HTTPS:', coverUrl)
          }
          
          // 设置媒体元数据
          // Windows SMTC 
          navigator.mediaSession.metadata = new MediaMetadata({
            title: songTitle,
            artist: artistName,
            album: song.album_name || '',
            artwork: [
              {
                src: coverUrl,
                sizes: '512x512',
                type: 'image/jpeg'
              },
              {
                src: coverUrl,
                sizes: '1000x1000',
                type: 'image/jpeg'
              }
            ]
          })
          
          console.log('元数据已更新:', {
            title: songTitle,
            artist: artistName,
            album: song.album_name || '',
            artwork: coverUrl
          })
        } catch (error) {
          console.error('❌ 更新 MediaSession 失败:', error)
          console.error('错误详情:', error.message)
          console.error('歌曲对象:', song)
        }
      } else {
        console.warn('⚠️ 浏览器不支持 MediaSession API')
      }
    },
    
    // 音频时间更新事件
    handleTimeUpdate() {
      const audioEl = this.$refs.audioPlayer
      if (audioEl && !isNaN(audioEl.currentTime)) {
        this.currentTime = audioEl.currentTime
        this.duration = audioEl.duration || 0
        
        // 定期更新 MediaSession 位置状态（每秒更新一次，避免过于频繁）
        if ('mediaSession' in navigator && this.isPlaying) {
          const now = Math.floor(audioEl.currentTime)
          if (!this.lastPositionUpdate || now !== this.lastPositionUpdate) {
            this.lastPositionUpdate = now
            this.updatePositionState()
          }
        }
      }
    },
    
    // 更新 MediaSession 位置状态
    updatePositionState() {
      if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
        try {
          const audioEl = this.$refs.audioPlayer
          if (audioEl && !isNaN(audioEl.duration) && audioEl.duration > 0) {
            navigator.mediaSession.setPositionState({
              duration: audioEl.duration,
              playbackRate: audioEl.playbackRate || 1.0,
              position: audioEl.currentTime || 0
            })
          }
        } catch (error) {
          // 某些浏览器可能不支持 setPositionState
          console.debug('设置 MediaSession 位置状态失败:', error)
        }
      }
    },
    
    // 初始化媒体控制处理器
    initMediaSessionHandlers() {
      if ('mediaSession' in navigator) {
        try {
          // 播放/暂停
          navigator.mediaSession.setActionHandler('play', () => {
            this.togglePlay()
          })
          
          navigator.mediaSession.setActionHandler('pause', () => {
            this.togglePlay()
          })
          
          // 上一曲/下一曲
          navigator.mediaSession.setActionHandler('previoustrack', () => {
            this.playPrevious()
          })
          
          navigator.mediaSession.setActionHandler('nexttrack', () => {
            this.playNext()
          })
          
          // 快进/快退 (可选)
          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const audioEl = this.$refs.audioPlayer
            audioEl.currentTime = Math.max(0, audioEl.currentTime - (details.seekOffset || 10))
          })
          
          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const audioEl = this.$refs.audioPlayer
            audioEl.currentTime = Math.min(audioEl.duration, audioEl.currentTime + (details.seekOffset || 10))
          })
          
          // 进度跳转
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            const audioEl = this.$refs.audioPlayer
            if (details.seekTime !== undefined) {
              audioEl.currentTime = details.seekTime
            }
          })
          
          console.log('✅ MediaSession 控制处理器已初始化')
        } catch (error) {
          console.error('❌ 初始化 MediaSession 处理器失败:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
.music-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-background-light);
  border-top: 1px solid var(--color-border);
  z-index: 1000;
  user-select: none;
  -webkit-user-select: none;
}

/* 进度条 */
.progress-bar-container {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: relative;
  border-radius: 2px;
  padding: 6px 0; /* 增加上下内边距，避免滑块被裁剪 */
  margin: -6px 0; /* 负外边距补偿，保持整体高度不变 */
}

.progress-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  cursor: pointer;
  margin: 0;
  padding: 0;
  outline: none;
}

/* Webkit/Blink 浏览器样式 */
.progress-bar::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary) var(--progress, 0%),
    rgba(255, 255, 255, 0.1) var(--progress, 0%),
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 2px;
  border: none;
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  margin-top: -4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover::-webkit-slider-thumb {
  opacity: 1;
}

.progress-bar-container:hover .progress-bar::-webkit-slider-runnable-track {
  background: linear-gradient(
    to right,
    var(--color-primary-hover) 0%,
    var(--color-primary-hover) var(--progress, 0%),
    rgba(255, 255, 255, 0.1) var(--progress, 0%),
    rgba(255, 255, 255, 0.1) 100%
  );
}

/* Firefox 浏览器样式 */
.progress-bar::-moz-range-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  border: none;
}

.progress-bar::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover::-moz-range-thumb {
  opacity: 1;
}

.progress-bar::-moz-range-progress {
  background: var(--color-primary);
  height: 4px;
  border-radius: 2px;
}

/* 播放器主体 */
.player-main {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  gap: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

/* 左侧：歌曲信息 */
.song-info-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.song-cover:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.song-details {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.song-artist {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 中间：播放控制 */
.player-controls-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.control-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.control-btn:hover {
  background: var(--color-background);
  color: var(--color-primary);
}

.control-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.play-btn {
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: white;
}

.play-btn:hover {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.time-info {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  white-space: nowrap;
  margin-left: var(--spacing-md);
}

.separator {
  opacity: 0.5;
}

/* 右侧：音量和其他控制 */
.player-extras-section {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

/* SVG 图标样式重置 */
.icon-btn img {
  width: 18px;
  height: 18px;
  filter: brightness(0) saturate(100%) invert(64%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(92%) contrast(88%);
  transition: filter var(--transition-fast);
}

.icon-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.icon-btn:hover img {
  filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

.favorite-btn.active {
  color: #ff4d4f;
}

.favorite-btn.active:hover {
  color: #ff7875;
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.volume-slider {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.volume-slider:hover::-webkit-slider-thumb {
  background: var(--color-primary-hover);
}

.volume-slider:hover::-moz-range-thumb {
  background: var(--color-primary-hover);
}

/* 响应式 */
@media (max-width: 1024px) {
  .player-main {
    grid-template-columns: 1fr auto 1fr;
    max-width: 100%;
  }
  
  .volume-slider {
    width: 80px;
  }
}

@media (max-width: 768px) {
  .player-main {
    grid-template-columns: 1fr auto auto;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .song-cover {
    width: 48px;
    height: 48px;
  }
  
  .time-info {
    display: none;
  }
  
  .volume-control {
    display: none;
  }
}

/* 歌词界面过渡动画 */
.lyric-view-enter-active,
.lyric-view-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyric-view-enter-from {
  opacity: 0;
  transform: scale(1.1);
}

.lyric-view-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
