<template>
  <div class="lyric-view" v-if="visible" @click="closeLyricView">
    <!-- 模糊背景 -->
    <div class="lyric-background">
      <img v-if="song && (song.cover || song.album_img)" 
           :src="song.cover ? song.cover.replace('{size}', '400') : song.album_img" 
           alt="专辑封面" 
           class="background-image">
      <div class="background-overlay"></div>
    </div>

    <!-- 主要内容 -->
    <div class="lyric-container" @click.stop>
      <!-- 左侧专辑信息 -->
      <div class="album-section">
        <!-- 专辑封面 -->
        <div class="album-cover-wrapper">
          <!-- 当前时间 -->
          <div class="current-time">{{ currentTime }}</div>
          <img v-if="song && (song.cover || song.album_img)" 
               :src="song.cover ? song.cover.replace('{size}', '400') : song.album_img" 
               alt="专辑封面" 
               class="album-cover">
          <div v-else class="album-cover-placeholder">
            <svg viewBox="0 0 1024 1024" width="120" height="120" fill="currentColor">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z"/>
            </svg>
          </div>
        </div>

        <!-- 歌曲信息 -->
        <div class="song-info">
          <h2 class="song-title">{{ getSongName(song) }}</h2>
          <p class="song-artist">{{ getSingerNames(song) }}</p>
        </div>

        <!-- 频谱进度条 -->
        <div class="spectrum-progress-wrapper">
          <div class="spectrum-progress" ref="spectrumProgress" @click="handleProgressClick">
            <!-- 频谱条 -->
            <div class="spectrum-bars">
              <div v-for="i in 50" :key="i" class="spectrum-bar" :style="{ height: getBarHeight(i) }"></div>
            </div>
            <!-- 进度条 -->
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
              <div 
                class="progress-thumb" 
                :style="{ left: progressPercentage + '%' }"
                @mousedown="handleThumbMouseDown"
              ></div>
            </div>
          </div>
          <!-- 时间显示 -->
          <div class="time-display">
            <span>{{ formatTime(currentPlayTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>

          <!-- 播放控制按钮 -->
          <div class="playback-controls">
            <!-- 收藏按钮 -->
            <button class="control-btn favorite-btn" @click="toggleFavorite" title="收藏">
              <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
                <path d="M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/>
              </svg>
            </button>

            <!-- 上一首按钮 -->
            <button class="control-btn" @click="playPrevious" title="上一首">
              <svg viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
                <path d="M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512zm304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z"/>
              </svg>
            </button>

            <!-- 播放/暂停按钮 -->
            <button class="control-btn play-btn" @click="togglePlayPause" title="播放/暂停">
              <svg v-if="isPlaying" viewBox="0 0 1024 1024" width="32" height="32" fill="currentColor">
                <path d="M304 176h80v672h-80zm336 0h80v672h-80z"/>
              </svg>
              <svg v-else viewBox="0 0 1024 1024" width="32" height="32" fill="currentColor">
                <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z"/>
              </svg>
            </button>

            <!-- 下一首按钮 -->
            <button class="control-btn" @click="playNext" title="下一首">
              <svg viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
                <path d="M751.1 512L485.7 172.9c-4.1-5.2-.4-12.9 6.3-12.9h77.3c4.9 0 9.6 2.3 12.6 6.1l255.3 326.1c9.4 12.1 9.4 29.4 0 41.5L581.9 859.8c-3 3.9-7.7 6.1-12.6 6.1H492c-6.7 0-10.4-7.7-6.3-12.9L751.1 512zm-304 0L181.7 172.9c-4.1-5.2-.4-12.9 6.3-12.9h77.3c4.9 0 9.6 2.3 12.6 6.1l255.3 326.1c9.4 12.1 9.4 29.4 0 41.5L277.9 859.8c-3 3.9-7.7 6.1-12.6 6.1H188c-6.7 0-10.4-7.7-6.3-12.9L447.1 512z"/>
              </svg>
            </button>

            <!-- 播放模式按钮 -->
            <button class="control-btn" @click="togglePlayMode" :title="playModeText">
              <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
                <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"/>
                <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"/>
              </svg>
            </button>

            <!-- 翻译切换按钮 -->
            <button 
              v-if="hasTranslation" 
              class="control-btn translation-btn" 
              :class="{ active: showTranslation }" 
              @click="toggleTranslation" 
              title="显示翻译"
            >
              <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
                <path d="M140 188h584v164h92V144c0-17.7-14.3-32-32-32H96c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h232v-92H140V188z"/>
                <path d="M414.3 256h-60.6c-3.4 0-6.4 2.2-7.6 5.4L219 629.4c-.3.8-.4 1.7-.4 2.6 0 4.4 3.6 8 8 8h55.1c3.4 0 6.4-2.2 7.6-5.4L322 540h196.2l32.7 94.6c1.3 3.2 4.3 5.4 7.6 5.4H614c4.4 0 8-3.6 8-8 0-.9-.1-1.8-.4-2.6L494.3 261.4c-1.3-3.2-4.3-5.4-7.6-5.4zM353.7 447L420 277.7 486.3 447H353.7z"/>
                <path d="M936 528H800v-93c0-4.4-3.6-8-8-8h-56c-4.4 0-8 3.6-8 8v93H592c-13.3 0-24 10.7-24 24v176c0 13.3 10.7 24 24 24h136v152c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V752h136c13.3 0 24-10.7 24-24V552c0-13.3-10.7-24-24-24zM888 704H728V576h160v128z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧歌词 -->
      <div class="lyrics-section">
        <div class="lyrics-container" ref="lyricsContainer">
          
          <!-- 所有歌词行，通过transform控制位置实现动画 -->
          <div 
            v-for="(line, index) in parsedLyrics" 
            :key="index"
            class="lyric-line"
            :class="{ 
              'current': index === currentLyricIndex,
              'played': index < currentLyricIndex,
              'upcoming': index > currentLyricIndex,
              'has-translation': showTranslation && line.translation
            }"
            :style="getLyricLineStyle(index)"
            :ref="el => { if (el) lyricLineRefs[index] = el }"
          >
            <!-- 主要歌词（原文） -->
            <div class="main-lyric">
              <!-- 渲染歌词内容 -->
              <template v-if="line.words && line.words.length > 0">
                <template v-for="(word, wordIndex) in line.words" :key="wordIndex">
                  <template v-for="(char, charIdx) in word.word.split('')" :key="`${wordIndex}-${charIdx}`">
                    <span 
                      v-if="char === ' '"
                      class="lyric-word karaoke-char is-space"
                      :data-word-index="wordIndex"
                      :data-line-index="index"
                      :data-start="word.startTime"
                      :data-end="word.endTime"
                      :data-line-start="line.time"
                      :style="{ display: 'inline-block', width: '0.25em', minWidth: '0.25em' }"
                    >&#8203;</span>
                    <span 
                      v-else
                      class="lyric-word karaoke-char"
                      :data-word-index="wordIndex"
                      :data-line-index="index"
                      :data-start="word.startTime"
                      :data-end="word.endTime"
                      :data-line-start="line.time"
                    >{{ char }}</span>
                  </template>
                </template>
              </template>
              <template v-else>
                <template v-for="(char, charIndex) in line.text" :key="charIndex">
                  <span 
                    v-if="char === ' '"
                    class="lyric-char karaoke-char is-space"
                    :data-char-index="charIndex"
                    :data-line-index="index"
                    :style="{ display: 'inline-block', width: '0.25em', minWidth: '0.25em' }"
                  >&#8203;</span>
                  <span 
                    v-else
                    class="lyric-char karaoke-char"
                    :data-char-index="charIndex"
                    :data-line-index="index"
                  >{{ char }}</span>
                </template>
              </template>
            </div>
            
            <!-- 翻译歌词 -->
            <div 
              v-if="showTranslation && line.translation" 
              class="translation-lyric"
            >
              {{ line.translation }}
            </div>
          </div>

          <!-- 桥段进度条（覆盖在正在播放的歌词位置） -->
          <transition name="bridge-fade">
            <div 
              v-if="isBridgeActive && bridgeInfo" 
              class="bridge-progress-bar overlay"
              :style="{
                transform: `translate(-50%, -50%) scaleX(${Math.max(0.05, (100 - bridgeProgress) / 100)})`,
                backgroundColor: getBridgeProgressColor()
              }"
            ></div>
          </transition>

        </div>
      </div>

      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeLyricView">
        <svg viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
          <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { useSettingsStore } from '../stores/settingsStore.js'

export default {
  name: 'LyricView',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    song: {
      type: Object,
      default: null
    },
    lyrics: {
      type: String,
      default: ''
    },
    lyricData: {
      type: Object,
      default: null
    },
    currentPlayTime: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    playMode: {
      type: String,
      default: 'loop'
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
    pauseUpdates: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const settingsStore = useSettingsStore()
    return {
      settingsStore
    }
  },
  data() {
    return {
      currentTime: '',
      timeInterval: null,
      parsedLyrics: [],
      currentLyricIndex: 0,
      currentCharIndex: 0,
      lyricLineRefs: {},
      spectrumBars: Array(50).fill(0),
      spectrumInterval: null,
      // 性能监控
      lastUpdateTime: null,
      frameCount: 0,
      // 高性能卡拉OK缓存
      styleCache: new Map(),
      lastProgressValues: new Map(),
      rafId: null,
      // RAF 驱动的更新循环
      updateLoopRafId: null,
      internalPlayTime: 0, // 内部时间，用于 RAF 更新
      // 桥段进度条
      bridgeInfo: null, // { startTime, duration, startLyricIndex } - 当前桥段信息
      isBridgeActive: false, // 是否正在显示桥段进度条
      bridgeProgress: 0, // 桥段进度 0-100
      // 翻译相关
      hasTranslation: false, // 是否有翻译
      translationData: null, // 翻译数据
      showTranslation: false, // 是否显示翻译（会根据设置和检测结果动态设置）
      isNonChinese: false // 是否为非中文歌曲
    }
  },
  computed: {
    progressPercentage() {
      if (!this.duration) return 0
      return (this.currentPlayTime / this.duration) * 100
    },
    playModeText() {
      switch (this.playMode) {
        case 'loop': return '列表循环'
        case 'single': return '单曲循环' 
        case 'shuffle': return '随机播放'
        default: return '列表循环'
      }
    },
    // 检测所有桥段（句子间隔>10秒）
    bridges() {
      const bridges = []
      const BRIDGE_THRESHOLD = 20 // 20秒阈值，避免误检测短间隔
      const LYRIC_FINISH_OFFSET = 3 // 假设每句歌词在下一句前3秒唱完
      
      if (!this.parsedLyrics || this.parsedLyrics.length === 0) return bridges
      
      // 检查开头是否是桥段（第一句之前>10秒）
      if (this.parsedLyrics[0] && this.parsedLyrics[0].time > BRIDGE_THRESHOLD) {
        bridges.push({
          startTime: 0,
          endTime: this.parsedLyrics[0].time,
          duration: this.parsedLyrics[0].time,
          startLyricIndex: -1, // 开头前
          endLyricIndex: 0
        })
        if (process.env.NODE_ENV === 'development') {
          console.log('检测到开头桥段:', bridges[bridges.length - 1])
        }
      }
      
      // 检查句子之间的间隔
      for (let i = 0; i < this.parsedLyrics.length - 1; i++) {
        const currentLine = this.parsedLyrics[i]
        const nextLine = this.parsedLyrics[i + 1]
        const gap = nextLine.time - currentLine.time
        
        // 过滤创作信息行（作词、作曲等）
        const isInfoLine = /^(作词|作曲|编曲|演唱|歌手)[:：]/.test(currentLine.text) || 
                          /^(作词|作曲|编曲|演唱|歌手)[:：]/.test(nextLine.text)
        
        if (gap > BRIDGE_THRESHOLD && !isInfoLine) {
          // 计算当前句的实际结束时间
          let currentLineEndTime = currentLine.time + LYRIC_FINISH_OFFSET // 默认估算
          
          // 如果有 KRC 逐字信息，使用精确的结束时间
          if (currentLine.words && currentLine.words.length > 0) {
            const lastWord = currentLine.words[currentLine.words.length - 1]
            // 最后一个字的结束时间 = 行开始时间 + 字的相对结束时间
            currentLineEndTime = currentLine.time + lastWord.endTime
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`使用KRC精确时间 [行${i}]:`, {
                lineStart: currentLine.time.toFixed(2) + 's',
                lastWordEndTime: lastWord.endTime.toFixed(2) + 's',
                lineEndTime: currentLineEndTime.toFixed(2) + 's',
                text: currentLine.text.substring(0, 20)
              })
            }
          }
          
          // 桥段从当前句唱完后开始
          const bridgeStartTime = currentLineEndTime
          const bridgeDuration = nextLine.time - bridgeStartTime
          
          // 确保桥段时长合理（至少1秒）
          if (bridgeDuration >= 1) {
            bridges.push({
              startTime: bridgeStartTime,
              endTime: nextLine.time,
              duration: bridgeDuration,
              startLyricIndex: i,
              endLyricIndex: i + 1
            })
            if (process.env.NODE_ENV === 'development') {
              console.log(`检测到桥段 [${i} -> ${i+1}]:`, {
                currentLineTime: currentLine.time.toFixed(2) + 's',
                currentLineEndTime: currentLineEndTime.toFixed(2) + 's',
                nextLineTime: nextLine.time.toFixed(2) + 's',
                gap: gap.toFixed(2) + 's',
                bridgeStart: bridgeStartTime.toFixed(2) + 's',
                bridgeDuration: bridgeDuration.toFixed(2) + 's',
                from: currentLine.text.substring(0, 20),
                to: nextLine.text.substring(0, 20)
              })
            }
          }
        }
      }
      
      // 注意：结尾不视为桥段
      
      if (process.env.NODE_ENV === 'development' && bridges.length > 0) {
        console.debug('总共检测到', bridges.length, '个桥段')
      }
      return bridges
    },


  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.startTimeClock()
        this.startSpectrum()
        this.startUpdateLoop() // 启动RAF循环
        document.body.style.overflow = 'hidden'
      } else {
        this.stopTimeClock()
        this.stopSpectrum()
        this.stopUpdateLoop() // 立即停止RAF循环，释放资源
        document.body.style.overflow = ''
        // 清理缓存，避免内存泄漏
        this.styleCache.clear()
        this.lastProgressValues.clear()
      }
    },
    lyrics: {
      immediate: true,
      handler(newLyrics) {
        this.parseLyrics(newLyrics, this.lyricData)
      }
    },
    lyricData: {
      immediate: true,
      handler(newData) {
        // 当歌词数据变化时重新解析
        if (this.lyrics) {
          this.parseLyrics(this.lyrics, newData)
        }
      }
    },
    isPlaying() {
      this.startSpectrum()
    },
    pauseUpdates(newVal) {
      if (newVal) {
        // 暂停更新时立即停止RAF循环
        this.stopUpdateLoop()
        if (process.env.NODE_ENV === 'development') {
          console.debug('🔄 歌词更新已暂停 - 切歌进行中')
        }
      } else {
        // 恢复更新时重新启动RAF循环
        this.startUpdateLoop()
        if (process.env.NODE_ENV === 'development') {
          console.debug('✅ 歌词更新已恢复 - 切歌完成')
        }
      }
    }
  },
  beforeUnmount() {
    if (process.env.NODE_ENV === 'development') {
      console.debug('🔄 LyricView 组件即将卸载，清理所有资源')
    }
    this.stopTimeClock()
    this.stopSpectrum()
    this.stopUpdateLoop()
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
    }
    // 清理所有缓存
    this.styleCache.clear()
    this.lastProgressValues.clear()
    this.lyricLineRefs = {}
    document.body.style.overflow = ''
  },
  mounted() {
    if (process.env.NODE_ENV === 'development') {
      console.debug('🎵 LyricView 组件已挂载')
    }
    // 启动持续的 RAF 更新循环
    this.startUpdateLoop()
  },
  methods: {
    // RAF 驱动的持续更新循环（60fps）
    updateLoop() {
      // 检查组件是否仍然可见，如果不可见或者被暂停则完全停止循环
      if (!this.visible || this.pauseUpdates) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🛑 歌词更新循环已暂停 - visible:', this.visible, 'pauseUpdates:', this.pauseUpdates, 'rafId:', this.updateLoopRafId)
        }
        // 关键修复：确保当前RAF ID被清除，避免重复调用
        this.updateLoopRafId = null
        return
      }
      
      // 同步父组件传入的时间
      this.internalPlayTime = this.currentPlayTime
      
      // 更新桥段进度条
      this.updateBridgeProgress()
      
      // 更新歌词卡拉OK效果
      this.updateKaraokeStylesDirectly()
      
      // 性能监控
      if (process.env.NODE_ENV === 'development') {
        if (!this.lastUpdateTime) {
          this.lastUpdateTime = performance.now()
          this.frameCount = 0
        } else {
          this.frameCount++
          const now = performance.now()
          if (now - this.lastUpdateTime >= 1000) {
            console.debug(`歌词更新帧率: ${this.frameCount} FPS`)
            this.lastUpdateTime = now
            this.frameCount = 0
          }
        }
      }
      
      // 持续循环
      this.updateLoopRafId = requestAnimationFrame(this.updateLoop)
      
      // 额外的性能监控：RAF调用计数
      if (process.env.NODE_ENV === 'development') {
        if (!window._lyricRafCount) {
          window._lyricRafCount = 0
        }
        window._lyricRafCount++
      }
    },
    
    // 启动更新循环
    startUpdateLoop() {
      // 首先停止任何现有的循环，避免重复
      this.stopUpdateLoop()
      
      if (this.visible && !this.pauseUpdates) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('✅ 启动歌词更新循环 - visible:', this.visible, 'pauseUpdates:', this.pauseUpdates)
        }
        this.updateLoopRafId = requestAnimationFrame(this.updateLoop)
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.debug('⏸️ 跳过启动歌词更新循环 - visible:', this.visible, 'pauseUpdates:', this.pauseUpdates)
        }
      }
    },
    
    // 停止更新循环
    stopUpdateLoop() {
      if (this.updateLoopRafId) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('🛑 停止歌词更新循环 - rafId:', this.updateLoopRafId)
        }
        cancelAnimationFrame(this.updateLoopRafId)
        this.updateLoopRafId = null
      }
    },
    
    // 更新桥段进度条
    updateBridgeProgress() {
      const currentTime = this.internalPlayTime
      const wasActive = this.isBridgeActive
      
      // 检查当前是否在某个桥段中
      const currentBridge = this.bridges.find(bridge => 
        currentTime >= bridge.startTime && currentTime < bridge.endTime
      )
      
      if (process.env.NODE_ENV === 'development' && currentBridge && !wasActive) {
        console.log('检查桥段条件:', {
          currentTime: currentTime.toFixed(2) + 's',
          currentLyricIndex: this.currentLyricIndex,
          bridgeStartLyricIndex: currentBridge.startLyricIndex,
          shouldShow: this.currentLyricIndex >= currentBridge.startLyricIndex,
          bridgeStart: currentBridge.startTime.toFixed(2) + 's',
          bridgeEnd: currentBridge.endTime.toFixed(2) + 's'
        })
      }
      
      if (currentBridge) {
        // 额外条件：只有当前歌词行索引 >= 桥段起始行时才显示
        // 这样可以避免在播放早期歌词时，触发后面的桥段
        const shouldShow = this.currentLyricIndex >= currentBridge.startLyricIndex
        
        if (shouldShow) {
          // 桥段条应该显示
          if (!wasActive && process.env.NODE_ENV === 'development') {
            console.log(`进入桥段 [${currentBridge.startLyricIndex} -> ${currentBridge.endLyricIndex}]`, {
              currentTime: currentTime.toFixed(2) + 's',
              currentLyricIndex: this.currentLyricIndex,
              startTime: currentBridge.startTime.toFixed(2) + 's',
              endTime: currentBridge.endTime.toFixed(2) + 's',
              duration: currentBridge.duration.toFixed(2) + 's'
            })
          }
          
          this.isBridgeActive = true
          this.bridgeInfo = currentBridge
          
          // 计算进度（从桥段开始到当前时间的进度）
          const elapsed = currentTime - currentBridge.startTime
          this.bridgeProgress = Math.min((elapsed / currentBridge.duration) * 100, 100)
          
          if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
            // 1% 概率输出进度信息，避免刷屏
            console.log('桥段进度条状态:', {
              progress: this.bridgeProgress.toFixed(2) + '%',
              scaleX: Math.max(0.05, (100 - this.bridgeProgress) / 100).toFixed(3),
              color: this.getBridgeProgressColor(),
              isActive: this.isBridgeActive
            })
          }
          
          // 如果刚进入桥段，恢复已唱字符样式并触发滚动
          if (!wasActive) {
            // 恢复当前行所有字符的样式（移除高亮和悬浮）
            this.$nextTick(() => {
              const container = this.$refs.lyricsContainer
              if (container) {
                const currentLineChars = container.querySelectorAll(`[data-line-index="${this.currentLyricIndex}"]`)
                currentLineChars.forEach(char => {
                  if (!char.classList.contains('is-space')) {
                    char.style.color = 'rgba(255, 255, 255, 0.7)'
                    char.style.fontWeight = '500'
                    char.style.textShadow = ''
                    char.style.transform = '' // 恢复位置，移除悬浮
                    char.style.transition = 'all 0.3s ease-out'
                  }
                })
              }
              // 触发滚动，让当前行保持在中心
              this.scrollToCurrentLyric()
            })
          }
        } else {
          // 不满足显示条件
          if (wasActive && process.env.NODE_ENV === 'development') {
            console.log('桥段条件不满足，隐藏')
          }
          this.isBridgeActive = false
          this.bridgeInfo = null
          this.bridgeProgress = 0
        }
      } else {
        if (wasActive && process.env.NODE_ENV === 'development') {
          console.log('桥段结束')
        }
        this.isBridgeActive = false
        this.bridgeInfo = null
        this.bridgeProgress = 0
      }
    },
    
    // 获取桥段进度条颜色（100%绿色 -> 50%黄色 -> 0%红色）
    getBridgeProgressColor() {
      const progress = this.bridgeProgress
      
      if (progress > 50) {
        // 100% -> 50%: 绿色 -> 黄色
        // green(0, 255, 0) -> yellow(255, 255, 0)
        const ratio = (100 - progress) / 50 // 1 -> 0
        const r = Math.round(255 * (1 - ratio))
        const g = 255
        const b = 0
        return `rgb(${r}, ${g}, ${b})`
      } else {
        // 50% -> 0%: 黄色 -> 红色
        // yellow(255, 255, 0) -> red(255, 0, 0)
        const ratio = progress / 50 // 1 -> 0
        const r = 255
        const g = Math.round(255 * ratio)
        const b = 0
        return `rgb(${r}, ${g}, ${b})`
      }
    },

    // 统一获取歌词行样式（包含位置动画）
    getLyricLineStyle(index) {
      const distance = Math.abs(index - this.currentLyricIndex)
      const maxVisibleDistance = 8 // 最大可见距离
      
      if (distance > maxVisibleDistance) {
        return { 
          display: 'none',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }

      // 计算垂直位置（相对于屏幕中心）
      const hasTranslation = this.showTranslation && this.parsedLyrics[index]?.translation
      const lineHeight = hasTranslation ? 140 : 80 // 有翻译时每行高度增加更多以防重叠
      let translateY = 0
      
      if (index === this.currentLyricIndex) {
        // 正在播放的歌词在屏幕中心
        translateY = 0
      } else if (index < this.currentLyricIndex) {
        // 已播放的歌词在上方
        const relativeDistance = this.currentLyricIndex - index
        translateY = -relativeDistance * lineHeight
      } else {
        // 未播放的歌词在下方
        const relativeDistance = index - this.currentLyricIndex
        translateY = relativeDistance * lineHeight
      }
      
      // 桥段时的特殊处理
      if (this.isBridgeActive && index < this.currentLyricIndex) {
        translateY -= 100 // 已播放歌词上移
      }

      // 计算视觉效果
      let opacity = 1
      let blur = 0
      let scale = 1
      let fontWeight = 400
      let fontSize = '2.2em' // 基础字体调大
      
      if (index === this.currentLyricIndex) {
        // 正在播放 - 桥段时隐藏，否则高亮显示
        if (this.isBridgeActive) {
          // 桥段激活时，隐藏正在播放的歌词
          opacity = 0
          scale = 0.8
        } else {
          // 正常播放时高亮显示
          opacity = 1
          blur = 0
          scale = 1.2
          fontWeight = 600
          fontSize = '2.7em' // 调大字体
        }
      } else if (index < this.currentLyricIndex) {
        // 已播放 - 从近到远模糊
        const relativeDistance = this.currentLyricIndex - index
        if (relativeDistance === 1) {
          opacity = 0.9 // 刚唱完的歌词10%模糊
          blur = 2
          scale = 0.95
        } else {
          opacity = Math.max(0.05, 1 - (relativeDistance * 0.2))
          blur = Math.min(5, relativeDistance * 1.5)
          scale = Math.max(0.8, 1 - (relativeDistance * 0.1))
        }
      } else {
        // 未播放 - 从近到远模糊
        const relativeDistance = index - this.currentLyricIndex
        opacity = Math.max(0.1, 1 - (relativeDistance * 0.15))
        blur = Math.min(3, relativeDistance * 0.8)
        scale = Math.max(0.85, 1 - (relativeDistance * 0.08))
      }

      return {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '100%',
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
        opacity: opacity,
        filter: `blur(${blur}px)`,
        fontSize: fontSize,
        fontWeight: fontWeight,
        zIndex: index === this.currentLyricIndex ? 10 : 1,
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', // 长一点的过渡时间让动画更明显
        pointerEvents: index === this.currentLyricIndex ? 'auto' : 'none'
      }
    },
    
    // 获取歌曲名称
    getSongName(song) {
      if (!song) return '未知歌曲'
      // 取可用的原始标题
      const raw = (song.name || song.songname || song.audio_name || song.filename || '').toString()

      if (!raw) return '未知歌曲'

      // 常见格式："歌手 - 歌名"，也可能使用不同的破折号
      // 如果包含分隔符，则优先取最后一段作为歌名，避免将歌手名带入标题
      const parts = raw.split(/\s[-—–]\s/)
      let title = parts.length >= 2 ? parts[parts.length - 1].trim() : raw.trim()

      // 去掉常见音频扩展名
      title = title.replace(/\.(mp3|flac|wav|m4a|aac)$/i, '')

      // 兜底
      return title || '未知歌曲'
    },
    
    // 获取歌手名称
    getSingerNames(song) {
      if (!song) return '未知歌手'
      
      // 尝试不同的字段
      if (song.singername) return song.singername
      if (song.artist) return song.artist
      
      // 处理歌手信息数组
      if (song.singerinfo && Array.isArray(song.singerinfo) && song.singerinfo.length > 0) {
        const names = song.singerinfo.map(singer => {
          if (typeof singer === 'object' && singer !== null) {
            return singer.name || singer.singer_name || singer.singername || singer.author_name
          }
          return String(singer)
        }).filter(name => name && name.trim() && name !== '[object Object]')
        
        if (names.length > 0) {
          return names.join(' / ')
        }
      }
      
      if (song.authors && Array.isArray(song.authors)) {
        return song.authors.map(author => author.author_name).filter(Boolean).join(' / ')
      }
      
      // 从 name 字段提取(格式: "歌手 - 歌名")
      if (song.name) {
        // 兼容不同破折号：半角/全角/短横/长横
        const match = song.name.split(/\s[-—–]\s/)
        if (match.length >= 2) {
          return match[0].trim()
        }
      }
      
      return '未知歌手'
    },

    // 时间格式化
    formatTime(seconds) {
      if (!seconds || seconds < 0) return '00:00'
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    // 开始时间时钟
    startTimeClock() {
      this.updateCurrentTime()
      this.timeInterval = setInterval(() => {
        this.updateCurrentTime()
      }, 1000)
    },

    // 停止时间时钟
    stopTimeClock() {
      if (this.timeInterval) {
        clearInterval(this.timeInterval)
        this.timeInterval = null
      }
    },

    // 更新当前时间
    updateCurrentTime() {
      const now = new Date()
      this.currentTime = now.toLocaleTimeString('zh-CN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    },

    // 解析翻译数据（从language字段）
    parseTranslationData(languageField) {
      try {
        console.log('开始解析翻译数据:', languageField)
        
        if (!languageField) {
          console.log('没有language字段')
          return null
        }

        // 解码Base64字符串
        let decodedData
        try {
          decodedData = atob(languageField)
          console.log('Base64解码成功:', decodedData.substring(0, 200))
        } catch (e) {
          console.log('Base64解码失败，尝试直接解析JSON:', e)
          decodedData = languageField
        }

        // 解析JSON
        const translationObj = JSON.parse(decodedData)
        console.log('翻译数据解析成功:', translationObj)

        if (!translationObj.content || !Array.isArray(translationObj.content)) {
          console.log('翻译数据格式不正确')
          return null
        }

        // 提取原文和翻译
        let originalContent = null
        let translationContent = null

        translationObj.content.forEach(item => {
          if (item.type === 0) {
            // 原文（发音）
            originalContent = item.lyricContent
          } else if (item.type === 1) {
            // 翻译
            translationContent = item.lyricContent
          }
        })

        console.log('原文内容:', originalContent)
        console.log('翻译内容:', translationContent)
        
        // 输出翻译内容的前几行用于调试
        if (translationContent && Array.isArray(translationContent)) {
          console.log('=== 翻译数据详细信息 ===')
          console.log(`翻译总行数: ${translationContent.length}`)
          translationContent.slice(0, 5).forEach((item, index) => {
            console.log(`翻译第${index + 1}行:`, item)
          })
          console.log('=======================')
        }

        return {
          original: originalContent,
          translation: translationContent,
          version: translationObj.version
        }
      } catch (error) {
        console.error('解析翻译数据失败:', error)
        return null
      }
    },

    // 检测歌曲是否为非中文
    detectNonChineseSong(songData, lyricsData) {
      try {
        // 方法1：检查歌曲信息中的语言标识
        if (songData) {
          const songName = this.getSongName(songData)
          const artistName = this.getSingerNames(songData)
          
          // 检查歌名和歌手名是否包含非中文字符
          const hasChinese = /[\u4e00-\u9fff]/.test(songName + artistName)
          const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(songName + artistName)
          const hasKorean = /[\uac00-\ud7af]/.test(songName + artistName)
          const hasEnglish = /[a-zA-Z]/.test(songName + artistName)
          
          console.log('语言检测结果:', { 
            songName, 
            artistName, 
            hasChinese, 
            hasJapanese, 
            hasKorean, 
            hasEnglish 
          })
          
          // 如果有日文、韩文，或者英文但没有中文，认为是非中文歌曲
          if (hasJapanese || hasKorean || (hasEnglish && !hasChinese)) {
            return true
          }
        }

        // 方法2：检查歌词内容
        if (lyricsData && typeof lyricsData === 'string') {
          const lyricsText = lyricsData.substring(0, 1000) // 取前1000字符检测
          const chineseCharCount = (lyricsText.match(/[\u4e00-\u9fff]/g) || []).length
          const totalCharCount = lyricsText.replace(/[^\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z]/g, '').length
          
          if (totalCharCount > 0) {
            const chineseRatio = chineseCharCount / totalCharCount
            console.log('歌词中文比例:', chineseRatio, '中文字符:', chineseCharCount, '总字符:', totalCharCount)
            
            // 如果中文字符比例小于30%，认为是非中文歌曲
            return chineseRatio < 0.3
          }
        }

        return false
      } catch (error) {
        console.error('检测歌曲语言失败:', error)
        return false
      }
    },

    // 解析歌词
    parseLyrics(lrcContent, rawLyricData = null) {
      console.log('解析歌词，内容长度:', lrcContent?.length)
      console.log('歌词内容预览:', lrcContent?.substring(0, 200))
      console.log('原始歌词数据:', rawLyricData)
      
      // 重置翻译相关状态
      this.hasTranslation = false
      this.translationData = null
      this.isNonChinese = false
      this.showTranslation = false

      // 检测是否为非中文歌曲
      this.isNonChinese = this.detectNonChineseSong(this.song, lrcContent)
      console.log('是否为非中文歌曲:', this.isNonChinese)

      // 详细检查原始歌词数据结构
      console.log('🔍 检查原始歌词数据结构:')
      console.log('  rawLyricData 是否存在:', !!rawLyricData)
      console.log('  rawLyricData 类型:', typeof rawLyricData)
      if (rawLyricData) {
        console.log('  rawLyricData 所有键:', Object.keys(rawLyricData))
        console.log('  rawLyricData.language 是否存在:', 'language' in rawLyricData)
        console.log('  rawLyricData 完整内容:', rawLyricData)
        
        // 检查是否有其他可能包含翻译的字段
        const possibleFields = ['trans', 'translation', 'lang', 'multilang', 'lyric_translation', 'lyricTranslation', 'translationData']
        possibleFields.forEach(field => {
          if (rawLyricData[field]) {
            console.log(`  🔍 发现可能的翻译字段 ${field}:`, rawLyricData[field])
          }
        })
      }

      // 尝试解析翻译数据 - 检查多个可能的数据源
      let languageField = null
      
      // 方法1：直接从rawLyricData.language获取
      if (rawLyricData && rawLyricData.language) {
        languageField = rawLyricData.language
        console.log('✅ 从rawLyricData.language获取到翻译数据')
      }
      
      // 方法2：从decodeContent中的[language:...]标签提取
      if (!languageField && lrcContent) {
        const languageMatch = lrcContent.match(/\[language:(.*?)\]/s)
        if (languageMatch && languageMatch[1]) {
          languageField = languageMatch[1]
          console.log('✅ 从歌词内容的[language:...]标签中提取到翻译数据')
        }
      }
      
      // 开始解析翻译数据
      if (languageField) {
        console.log('🔍 开始解析翻译数据，数据长度:', languageField.length)
        this.translationData = this.parseTranslationData(languageField)
        if (this.translationData) {
          this.hasTranslation = true
          // 根据用户设置和歌曲类型决定是否显示翻译
          const userSetting = this.settingsStore.settings?.playback?.showTranslation ?? true // 默认显示翻译
          // 临时强制显示翻译用于测试
          this.showTranslation = userSetting // 暂时不考虑语言检测，直接显示翻译
          console.log('✅ 成功解析翻译数据')
          console.log('  - 翻译版本:', this.translationData.version)
          console.log('  - 是否为非中文歌曲:', this.isNonChinese)
          console.log('  - 用户设置显示翻译:', userSetting)
          console.log('  - 最终显示翻译:', this.showTranslation)
        } else {
          console.log('❌ 翻译数据存在但解析失败')
        }
      } else {
        console.log('❌ 没有找到翻译数据')
      }
      
      if (!lrcContent) {
        this.parsedLyrics = [{ time: 0, text: '暂无歌词' }]
        console.log('歌词内容为空')
        return
      }

      // 清理BOM和多余的空白字符
      let cleanContent = lrcContent.replace(/^\ufeff/, '') // 移除BOM
      cleanContent = cleanContent.trim()
      
      console.log('清理后内容预览:', cleanContent?.substring(0, 200))

      // 处理不同的换行符（\r\n, \n, \r）
      const lines = cleanContent.split(/\r\n|\n|\r/).filter(line => line.trim())
      const result = []
      
      console.log('歌词总行数:', lines.length)
      console.log('前5行原始内容:', lines.slice(0, 5))
      
      for (let line of lines) {
        console.log('处理行:', line)
        
        // KRC格式：[时间,持续时间]<字符时间信息>歌词内容
        const krcMatch = line.match(/^\[(\d+),(\d+)\](.*)$/)
        if (krcMatch) {
          const startTime = parseInt(krcMatch[1]) / 1000  // 毫秒转秒
          const duration = parseInt(krcMatch[2]) / 1000   // 毫秒转秒
          const text = krcMatch[3].trim()
          
          console.log('KRC行匹配:', { startTime, duration, text: text.substring(0, 50) })
          
          if (text) {
            // 解析KRC格式的逐字时间信息
            const words = this.parseKrcWords(text)
            const lineText = words.map(w => w.word).join('')
            
            console.log('KRC 解析结果 - words数量:', words.length)
            console.log('KRC 解析结果 - lineText:', lineText)
            console.log('KRC 解析结果 - 是否有空格:', lineText.includes(' '))
            
            if (lineText.trim()) {
              result.push({ 
                time: startTime, 
                text: lineText, 
                words: words // 保存逐字信息
              })
              console.log('添加KRC歌词行:', lineText)
            }
          }
        } else {
          // 普通LRC格式：[mm:ss.xx]歌词内容
          const lrcMatch = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/)
          if (lrcMatch) {
            const minutes = parseInt(lrcMatch[1])
            const seconds = parseInt(lrcMatch[2])
            const milliseconds = lrcMatch[3] ? parseInt(lrcMatch[3].padEnd(3, '0')) : 0
            const time = minutes * 60 + seconds + milliseconds / 1000
            const text = lrcMatch[4].trim()
            
            console.log('LRC行匹配:', { time, text })
            
            if (text) {
              result.push({ time, text })
              console.log('添加LRC歌词行:', text)
            }
          } else {
            // 跳过元信息行（如[ar:], [ti:]等）
            if (!line.match(/^\[[a-z]+:/)) {
              console.log('无法匹配的行:', line)
            }
          }
        }
      }
      
      // 按时间排序
      result.sort((a, b) => a.time - b.time)
      this.parsedLyrics = result.length > 0 ? result : [{ time: 0, text: '暂无歌词' }]
      
      // 检查是否有空格
      const hasSpaces = result.some(line => line.text.includes(' '))
      console.log('🔍 歌词是否包含空格:', hasSpaces)
      if (hasSpaces) {
        const linesWithSpaces = result.filter(line => line.text.includes(' '))
        console.log('包含空格的行数:', linesWithSpaces.length)
        console.log('第一行带空格的歌词:', linesWithSpaces[0]?.text)
        console.log('空格数量:', (linesWithSpaces[0]?.text.match(/ /g) || []).length)
      }
      
      console.log('歌词解析完成，共', this.parsedLyrics.length, '行')
      console.log('前3行歌词:', this.parsedLyrics.slice(0, 3))

      // 处理翻译映射
      if (this.hasTranslation && this.translationData) {
        this.mapTranslationToLyrics()
      }
    },

    // 将翻译数据映射到歌词行
    mapTranslationToLyrics() {
      try {
        const { translation } = this.translationData
        if (!translation || !Array.isArray(translation)) {
          console.log('翻译数据格式不正确')
          return
        }

        console.log('开始映射翻译到歌词行，翻译行数:', translation.length, '歌词行数:', this.parsedLyrics.length)

        // 为每行歌词添加翻译
        this.parsedLyrics.forEach((lyricLine, index) => {
          if (index < translation.length && translation[index] && translation[index][0]) {
            lyricLine.translation = translation[index][0].trim()
            console.log(`第${index}行添加翻译:`, lyricLine.text, '->', lyricLine.translation)
          }
        })

        console.log('翻译映射完成')
        
        // 输出前五句歌词的翻译用于调试
        console.log('=== 前五句歌词翻译预览 ===')
        this.parsedLyrics.slice(0, 5).forEach((line, index) => {
          console.log(`第${index + 1}句:`)
          console.log(`  原文: ${line.text}`)
          console.log(`  翻译: ${line.translation || '(无翻译)'}`)
          console.log(`  时间: ${line.time.toFixed(2)}s`)
          console.log('---')
        })
        console.log('=========================')
        
        // 检查当前翻译显示状态
        console.log('🔍 当前翻译显示状态:')
        console.log('  - hasTranslation:', this.hasTranslation)
        console.log('  - showTranslation:', this.showTranslation)
        console.log('  - 有翻译的歌词行数:', this.parsedLyrics.filter(line => line.translation).length)
        
      } catch (error) {
        console.error('翻译映射失败:', error)
      }
    },

    // 解析KRC格式的逐字时间信息
    parseKrcWords(text) {
      const words = []
      console.log('解析逐字信息:', text)
      
      // KRC格式：<startTime,duration>word<startTime,duration>word...
      // 注意：时间是相对于行开始的毫秒数
      const krcPattern = /<(\d+),(\d+),(\d+)>([^<]*)/g
      let match
      
      while ((match = krcPattern.exec(text)) !== null) {
        const startTime = parseInt(match[1]) / 1000 // 毫秒转秒，相对于行开始
        const duration = parseInt(match[2]) / 1000  // 毫秒转秒
        const word = match[4] // 注意这里是match[4]，因为有3个数字参数
        
        console.log('找到字符:', { word, startTime, duration })
        
        if (word) {
          words.push({
            word: word,
            startTime: startTime,
            endTime: startTime + duration
          })
        }
      }
      
      // 如果没有找到3参数格式，尝试2参数格式
      if (words.length === 0) {
        const krcPattern2 = /<(\d+),(\d+)>([^<]*)/g
        while ((match = krcPattern2.exec(text)) !== null) {
          const startTime = parseInt(match[1]) / 1000 // 毫秒转秒
          const duration = parseInt(match[2]) / 1000  // 毫秒转秒
          const word = match[3]
          
          console.log('找到字符(2参数):', { word, startTime, duration })
          
          if (word) {
            words.push({
              word: word,
              startTime: startTime,
              endTime: startTime + duration
            })
          }
        }
      }
      
      // 如果还是没有找到KRC格式，则按字符平分时间
      if (words.length === 0 && text) {
        // 移除所有<>标签，获取纯文本
        const cleanText = text.replace(/<[^>]*>/g, '')
        if (cleanText) {
          const chars = cleanText.split('')
          const charDuration = 3 / chars.length // 假设每行3秒
          
          chars.forEach((char, index) => {
            words.push({
              word: char,
              startTime: index * charDuration,
              endTime: (index + 1) * charDuration
            })
          })
          console.log('使用平分时间，字符数:', chars.length)
        }
      }
      
      console.log('解析完成，共', words.length, '个字符')
      return words
    },

    // 判断字符是否应该高亮（基于KRC逐字时间）
    isWordHighlighted(word, lineStartTime) {
      // 计算字符的绝对时间
      const wordAbsoluteStartTime = lineStartTime + word.startTime
      const wordAbsoluteEndTime = lineStartTime + word.endTime
      
      // 判断当前播放时间是否在字符时间范围内
      return this.currentPlayTime >= wordAbsoluteStartTime && this.currentPlayTime <= wordAbsoluteEndTime
    },

    // 获取卡拉OK样式（逐字填充效果） - 高性能缓存版本
    getKaraokeStyle(word, lineStartTime, lineIndex) {
      // 生成唯一缓存key
      const cacheKey = `${lineIndex}-${word.startTime}-${word.endTime}`
      
      const wordAbsoluteStartTime = lineStartTime + word.startTime
      const wordAbsoluteEndTime = lineStartTime + word.endTime
      
      // 当前行
      if (lineIndex === this.currentLyricIndex) {
        if (this.currentPlayTime < wordAbsoluteStartTime) {
          // 还没开始唱
          return { color: 'rgba(255, 255, 255, 0.9)' }
        } else if (this.currentPlayTime >= wordAbsoluteEndTime) {
          // 已唱完，但还在当前行，保持高亮
          return {
            color: '#feca57',
            textShadow: '0 0 8px rgba(254, 202, 87, 0.5)'
          }
        } else {
          // 正在唱，填充效果（降低精度到5%提升性能）
          const progress = (this.currentPlayTime - wordAbsoluteStartTime) / (wordAbsoluteEndTime - wordAbsoluteStartTime)
          const fillPercentage = Math.floor(progress * 20) * 5 // 5%精度，平衡性能和流畅度
          
          // 检查缓存
          const lastProgress = this.lastProgressValues.get(cacheKey)
          if (lastProgress === fillPercentage && this.styleCache.has(cacheKey)) {
            return this.styleCache.get(cacheKey)
          }
          
          const style = {
            background: `linear-gradient(90deg, #feca57 0%, #feca57 ${fillPercentage}%, rgba(255, 255, 255, 0.9) ${fillPercentage}%, rgba(255, 255, 255, 0.9) 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 6px rgba(254, 202, 87, 0.3)'
          }
          
          // 更新缓存
          this.styleCache.set(cacheKey, style)
          this.lastProgressValues.set(cacheKey, fillPercentage)
          return style
        }
      }
      // 非当前行，全部恢复白色
      else {
        return { color: 'rgba(255, 255, 255, 0.7)' }
      }
    },

    // 获取普通字符的卡拉OK样式（当没有逐字信息时） - 高性能版本
    getCharKaraokeStyle(charIndex, line, lineIndex) {
      // 只有当前行才有特殊效果
      if (lineIndex !== this.currentLyricIndex) {
        return { color: 'rgba(255, 255, 255, 0.7)' }
      }

      // 当前行的字符效果
      if (charIndex < this.currentCharIndex) {
        // 已唱完的字符，保持高亮
        return {
          color: '#feca57',
          textShadow: '0 0 6px rgba(254, 202, 87, 0.4)'
        }
      } else if (charIndex === this.currentCharIndex) {
        // 正在唱的字符，填充效果（优化缓存）
        const cacheKey = `char-${lineIndex}-${charIndex}`
        const progress = this.getCharProgress(line)
        const fillPercentage = Math.floor(progress * 10) * 10 // 10%精度，减少计算频率
        
        // 检查缓存
        const lastProgress = this.lastProgressValues.get(cacheKey)
        if (lastProgress === fillPercentage && this.styleCache.has(cacheKey)) {
          return this.styleCache.get(cacheKey)
        }
        
        const style = {
          background: `linear-gradient(90deg, #feca57 0%, #feca57 ${fillPercentage}%, rgba(255, 255, 255, 0.9) ${fillPercentage}%, rgba(255, 255, 255, 0.9) 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }
        
        // 更新缓存
        this.styleCache.set(cacheKey, style)
        this.lastProgressValues.set(cacheKey, fillPercentage)
        return style
      } else {
        // 还没开始唱的字符
        return { color: 'rgba(255, 255, 255, 0.9)' }
      }
    },

    // 获取字符进度（用于没有逐字信息的情况）
    getCharProgress(line) {
      if (this.currentLyricIndex >= this.parsedLyrics.length - 1) {
        return 0
      }
      
      const currentLine = this.parsedLyrics[this.currentLyricIndex]
      const nextLine = this.parsedLyrics[this.currentLyricIndex + 1]
      const lineProgress = (this.currentPlayTime - currentLine.time) / (nextLine.time - currentLine.time)
      const charProgress = (lineProgress * currentLine.text.length) - this.currentCharIndex
      
      return Math.max(0, Math.min(1, charProgress))
    },

    // 直接更新DOM样式，只更新当前行以获得最佳性能
    updateKaraokeStylesDirectly() {
      if (!this.parsedLyrics.length) return
      
      const container = this.$refs.lyricsContainer
      if (!container) return

      // 使用内部时间而不是 prop（避免 Vue 响应式）
      const currentTime = this.internalPlayTime

      // 找到当前歌词行（考虑桥段的影响）
      let newIndex = 0
      for (let i = 0; i < this.parsedLyrics.length; i++) {
        if (currentTime >= this.parsedLyrics[i].time) {
          newIndex = i
        } else {
          break
        }
      }
      
      // 如果正在桥段中，保持在上一句不动，直到桥段结束
      if (this.isBridgeActive && this.bridgeInfo) {
        // 保持在桥段起始行（上一句）
        if (this.bridgeInfo.startLyricIndex === -1) {
          // 开头桥段，还没有第一句，保持在第一句之前
          newIndex = 0
        } else {
          // 句间桥段，保持在上一句
          newIndex = this.bridgeInfo.startLyricIndex
        }
      }

      const lineChanged = newIndex !== this.currentLyricIndex

      // 如果行改变，清理旧行样式并恢复位置
      if (lineChanged && this.currentLyricIndex >= 0) {
        const oldLineChars = container.querySelectorAll(`[data-line-index="${this.currentLyricIndex}"]`)
        oldLineChars.forEach(char => {
          char.style.color = 'rgba(255, 255, 255, 0.7)'
          char.style.fontWeight = '500'
          char.style.textShadow = ''
          char.style.transform = '' // 恢复位置
          char.style.transition = 'all 0.3s ease-out' // 平滑恢复
        })
      }

      // 更新索引
      if (lineChanged) {
        this.currentLyricIndex = newIndex
        this.scrollToCurrentLyric()
        this.handleLongLyric() // 处理长歌词滚动
      }

      // 只更新当前行的字符（关键优化！）
      const currentLineChars = container.querySelectorAll(`[data-line-index="${this.currentLyricIndex}"]`)
      
      // 如果正在桥段中，不更新字符样式（保持恢复后的状态）
      if (this.isBridgeActive) {
        return
      }
      
      currentLineChars.forEach(char => {
        // 跳过空格字符的样式更新
        if (char.classList.contains('is-space')) {
          return
        }
        
        if (char.dataset.start !== undefined) {
          // KRC模式 - 逐字时间
          const lineStart = parseFloat(char.dataset.lineStart)
          const wordStart = lineStart + parseFloat(char.dataset.start)
          const wordEnd = lineStart + parseFloat(char.dataset.end)
          
          if (currentTime < wordStart) {
            // 未开始
            char.style.color = 'rgba(255, 255, 255, 0.9)'
            char.style.fontWeight = '500'
            char.style.textShadow = ''
            char.style.transform = ''
            char.style.transition = 'transform 0.15s ease-out'
          } else if (currentTime >= wordEnd) {
            // 已完成 - 保持高亮和悬浮
            char.style.color = '#feca57'
            char.style.fontWeight = '600'
            char.style.textShadow = '0 0 12px rgba(254, 202, 87, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)'
            char.style.transform = 'translateY(-3px)'
            char.style.transition = 'transform 0.15s ease-out'
          } else {
            // 进行中 - 使用双色文字而非渐变（保持字体粗细）
            const progress = (currentTime - wordStart) / (wordEnd - wordStart)
            const fillPercentage = Math.floor(progress * 20) * 5
            
            // 使用 text-shadow 叠加实现渐变效果，保持字体清晰
            const highlightIntensity = progress
            char.style.color = `rgb(${254 * highlightIntensity + 255 * (1 - highlightIntensity)}, ${202 * highlightIntensity + 255 * (1 - highlightIntensity)}, ${87 * highlightIntensity + 255 * (1 - highlightIntensity)})`
            char.style.fontWeight = '600'
            char.style.textShadow = `0 0 ${8 * progress}px rgba(254, 202, 87, ${0.5 * progress})`
            char.style.transform = 'translateY(-3px)'
            char.style.transition = 'transform 0.15s ease-out'
          }
        } else {
          // LRC模式 - 按字符索引
          const charIndex = parseInt(char.dataset.charIndex)
          const currentLine = this.parsedLyrics[this.currentLyricIndex]
          
          if (this.currentLyricIndex < this.parsedLyrics.length - 1) {
            const nextLine = this.parsedLyrics[this.currentLyricIndex + 1]
            const lineProgress = (currentTime - currentLine.time) / (nextLine.time - currentLine.time)
            const currentCharIndex = Math.floor(lineProgress * currentLine.text.length)
            
            if (charIndex < currentCharIndex) {
              // 已完成 - 保持高亮和悬浮
              char.style.color = '#feca57'
              char.style.fontWeight = '600'
              char.style.textShadow = '0 0 12px rgba(254, 202, 87, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)'
              char.style.transform = 'translateY(-5px)'
              char.style.transition = 'transform 0.15s ease-out'
            } else if (charIndex === currentCharIndex) {
              // 进行中
              const charProgress = (lineProgress * currentLine.text.length) - currentCharIndex
              const highlightIntensity = charProgress
              char.style.color = `rgb(${254 * highlightIntensity + 255 * (1 - highlightIntensity)}, ${202 * highlightIntensity + 255 * (1 - highlightIntensity)}, ${87 * highlightIntensity + 255 * (1 - highlightIntensity)})`
              char.style.fontWeight = '600'
              char.style.textShadow = `0 0 ${10 * charProgress}px rgba(254, 202, 87, ${0.5 * charProgress})`
              char.style.transform = 'translateY(-5px)'
              char.style.transition = 'transform 0.15s ease-out'
            } else {
              // 未开始
              char.style.color = 'rgba(255, 255, 255, 0.9)'
              char.style.fontWeight = '500'
              char.style.textShadow = ''
              char.style.transform = ''
              char.style.transition = 'transform 0.15s ease-out'
            }
          }
        }
      })
    },

    // 优化的歌词位置更新方法
    updateLyricPositionOptimized() {
      if (!this.parsedLyrics.length) return

      // 找到当前应该显示的歌词行
      let newIndex = 0
      for (let i = 0; i < this.parsedLyrics.length; i++) {
        if (this.currentPlayTime >= this.parsedLyrics[i].time) {
          newIndex = i
        } else {
          break
        }
      }

      if (newIndex !== this.currentLyricIndex) {
        this.currentLyricIndex = newIndex
        this.scrollToCurrentLyric()
        this.currentCharIndex = 0
        // 清除缓存，新的行需要重新计算
        this.styleCache.clear()
        this.lastProgressValues.clear()
      }

      // 计算当前字符高亮位置
      if (this.currentLyricIndex < this.parsedLyrics.length - 1) {
        const currentLine = this.parsedLyrics[this.currentLyricIndex]
        const nextLine = this.parsedLyrics[this.currentLyricIndex + 1]
        const lineProgress = (this.currentPlayTime - currentLine.time) / (nextLine.time - currentLine.time)
        this.currentCharIndex = Math.floor(lineProgress * currentLine.text.length)
      }
    },

    // 兼容旧方法
    updateLyricPosition() {
      this.updateLyricPositionOptimized()
    },

    // 滚动到当前歌词
    scrollToCurrentLyric() {
      this.$nextTick(() => {
        const container = this.$refs.lyricsContainer
        const currentElement = this.lyricLineRefs[this.currentLyricIndex]
        
        if (container && currentElement) {
          const containerHeight = container.clientHeight
          const elementTop = currentElement.offsetTop
          const elementHeight = currentElement.clientHeight
          
          // 确保当前歌词在容器中央，增加边界检查
          const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)
          const maxScrollTop = container.scrollHeight - containerHeight
          const scrollTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop))
          
          container.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
        }
      })
    },

    // 处理长歌词滚动效果
    handleLongLyric() {
      this.$nextTick(() => {
        const currentElement = this.lyricLineRefs[this.currentLyricIndex]
        if (!currentElement) {
          console.log('当前歌词元素不存在')
          return
        }

        // 移除上一行的滚动效果
        Object.values(this.lyricLineRefs).forEach(el => {
          if (el && el !== currentElement) {
            el.classList.remove('long-lyric')
            el.style.animationDuration = ''
            el.style.setProperty('--scroll-distance', '0px')
          }
        })

        // 获取容器和歌词宽度
        const container = this.$refs.lyricsContainer
        const lyricsSection = document.querySelector('.lyrics-section')
        
        // 使用歌词区域的宽度作为容器宽度
        const containerWidth = lyricsSection?.clientWidth || container?.clientWidth || window.innerWidth * 0.5
        const lyricWidth = currentElement.scrollWidth
        
        console.log('宽度检测:', { 
          lyricWidth, 
          containerWidth,
          lyricsSectionWidth: lyricsSection?.clientWidth,
          containerClientWidth: container?.clientWidth,
          scrollWidth: currentElement.scrollWidth,
          offsetWidth: currentElement.offsetWidth,
          threshold: containerWidth * 0.95
        })
        
        // 只有当歌词宽度超过容器宽度的95%时才滚动
        // 这样只有真正长的歌词才会滚动
        if (lyricWidth > containerWidth * 0.95) {
          // 计算需要滚动的距离：使右侧刚好完全显示
          // 负值表示向左滚动
          const scrollDistance = -(lyricWidth - containerWidth * 0.9)
          
          // 计算歌词行的持续时间（到下一句的时间）
          const currentLine = this.parsedLyrics[this.currentLyricIndex]
          const nextLine = this.parsedLyrics[this.currentLyricIndex + 1]
          const duration = nextLine ? (nextLine.time - currentLine.time) : 5 // 默认5秒
          
          // 添加 long-lyric class 并设置动画参数
          currentElement.classList.add('long-lyric')
          currentElement.style.animationDuration = `${duration}s`
          currentElement.style.setProperty('--scroll-distance', `${scrollDistance}px`)
          
          console.log('启用长歌词滚动:', { 
            scrollDistance, 
            duration,
            willScroll: true
          })
        } else {
          // 短歌词移除滚动效果
          currentElement.classList.remove('long-lyric')
          currentElement.style.animationDuration = ''
          currentElement.style.setProperty('--scroll-distance', '0px')
          
          console.log('歌词长度正常，无需滚动')
        }
      })
    },

    // 开始频谱动画 - 简化为静态设计
    startSpectrum() {
      // 清除现有定时器
      if (this.spectrumInterval) {
        clearInterval(this.spectrumInterval)
        this.spectrumInterval = null
      }
      
      if (this.isPlaying) {
        // 播放时启动动态频谱动画
        this.animateSpectrum()
        this.spectrumInterval = setInterval(() => {
          this.animateSpectrum()
        }, 150) // 每150ms更新一次
      } else {
        // 暂停时设置低频状态
        this.spectrumBars = Array(50).fill(0).map(() => Math.random() * 15 + 5)
      }
    },

    // 停止频谱动画
    stopSpectrum() {
      if (this.spectrumInterval) {
        clearInterval(this.spectrumInterval)
        this.spectrumInterval = null
      }
      // 设置暂停状态的低频条
      this.spectrumBars = Array(50).fill(0).map(() => Math.random() * 15 + 5)
    },

    // 生成动态频谱动画
    animateSpectrum() {
      const bars = []
      for (let i = 0; i < 50; i++) {
        // 使用多个正弦波叠加模拟音频频谱
        const time = Date.now() / 1000
        const baseFreq = (i + 1) / 50
        
        // 多重波形叠加
        const wave1 = Math.sin(time * 2 + i * 0.2) * 0.4
        const wave2 = Math.sin(time * 3.5 + i * 0.15) * 0.3
        const wave3 = Math.sin(time * 1.2 + i * 0.1) * 0.2
        const noise = (Math.random() - 0.5) * 0.1
        
        // 根据频率位置调整幅度（低频更强）
        const freqMultiplier = 1 - Math.pow(baseFreq, 0.7)
        
        // 计算最终高度
        let height = (wave1 + wave2 + wave3 + noise + 1) * 30 * freqMultiplier + 10
        height = Math.max(5, Math.min(80, height)) // 限制范围
        
        bars.push(height)
      }
      this.spectrumBars = bars
    },

    // 获取频谱条高度
    getBarHeight(index) {
      return this.spectrumBars[index - 1] + '%'
    },

    // 关闭歌词视图
    closeLyricView() {
      this.$emit('close')
    },

    // 播放控制方法
    togglePlayPause() {
      this.$emit('toggle-play')
    },

    playPrevious() {
      this.$emit('previous')
    },

    playNext() {
      this.$emit('next')
    },

    togglePlayMode() {
      this.$emit('toggle-play-mode')
    },

    toggleFavorite() {
      this.$emit('toggle-favorite')
    },

    // 切换翻译显示
    toggleTranslation() {
      if (!this.hasTranslation) return
      
      this.showTranslation = !this.showTranslation
      console.log('切换翻译显示:', this.showTranslation)
      
      // 输出当前状态用于调试
      console.log('🎵 翻译切换后状态:')
      console.log('  - hasTranslation:', this.hasTranslation)
      console.log('  - showTranslation:', this.showTranslation)
      console.log('  - 当前歌词索引:', this.currentLyricIndex)
      if (this.parsedLyrics[this.currentLyricIndex]) {
        const currentLine = this.parsedLyrics[this.currentLyricIndex]
        console.log('  - 当前行原文:', currentLine.text)
        console.log('  - 当前行翻译:', currentLine.translation || '(无翻译)')
      }
      
      // 更新用户设置
      try {
        if (this.settingsStore && this.settingsStore.updateSettings) {
          this.settingsStore.updateSettings({
            playback: {
              ...this.settingsStore.settings?.playback,
              showTranslation: this.showTranslation
            }
          })
        }
      } catch (error) {
        console.warn('更新翻译设置失败:', error)
      }
    },

    // 处理进度条点击事件
    handleProgressClick(event) {
      const progressBar = event.currentTarget
      const rect = progressBar.getBoundingClientRect()
      const pos = (event.clientX - rect.left) / rect.width
      const time = pos * this.duration
      this.seekTo(time)
    },

    // 处理拖动点按下事件
    handleThumbMouseDown(event) {
      event.preventDefault()
      event.stopPropagation()
      const progressBar = this.$refs.spectrumProgress
      const rect = progressBar.getBoundingClientRect()
      
      const onMouseMove = (moveEvent) => {
        const pos = (moveEvent.clientX - rect.left) / rect.width
        const time = Math.max(0, Math.min(1, pos)) * this.duration
        this.seekTo(time)
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },

    // 跳转到指定时间
    seekTo(time) {
      // 发送事件到父组件，让播放器跳转到指定时间
      this.$emit('seek', time)
    }
  }
}
</script>

<style scoped>
.lyric-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 背景 */
.lyric-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(30px);
  transform: scale(1.1);
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.5) 50%,
    rgba(0, 0, 0, 0.3) 100%
  );
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* 主容器 */
.lyric-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  color: white;
  z-index: 1;
}

/* 左侧专辑信息 */
.album-section {
  flex: 0 0 40%;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.current-time {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 28px;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.95);
  font-family: 'SF Display', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  text-align: center;
  letter-spacing: 1px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.album-cover-wrapper {
  position: relative;
  margin-bottom: 40px;
}

.album-cover {
  width: 320px;
  height: 320px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  object-fit: cover;
}

.album-cover-placeholder {
  width: 320px;
  height: 320px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
}

.song-info {
  text-align: center;
  margin-bottom: 60px;
}

.song-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: white;
  /* 避免超长歌名撑破布局，支持两行显示并省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  line-height: 1.25;
  max-height: calc(1.25em * 2);
}

.song-artist {
  font-size: 18px;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  /* 单行省略，过长时不换行 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 频谱进度条 */
.spectrum-progress-wrapper {
  width: 100%;
  max-width: 400px;
  user-select: none;
}

.spectrum-progress {
  position: relative;
  height: 60px;
  margin-bottom: 12px;
  cursor: pointer;
}

.spectrum-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 40px;
  margin-bottom: 8px;
  pointer-events: none;
}

.spectrum-bar {
  width: 3px;
  background: linear-gradient(to top, var(--color-primary), var(--color-secondary, #feca57), var(--color-accent, #48dbfb));
  border-radius: 2px;
  transition: height 0.1s ease;
  min-height: 2px;
}

.progress-track {
  position: relative;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary, #feca57));
  border-radius: 3px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: left 0.1s ease;
  cursor: pointer;
  opacity: 0;
}

.spectrum-progress:hover .progress-thumb {
  opacity: 1;
}

.progress-thumb:hover {
  transform: translate(-50%, -50%) scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
}

/* 播放控制按钮 */
.playback-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.control-btn {
  width: 48px;
  height: 48px;
}

.control-btn.play-btn {
  width: 64px;
  height: 64px;
  background: linear-gradient(45deg, #ff6b6b, #feca57);
}

.control-btn.favorite-btn.active {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-btn.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.3);
}

/* 右侧歌词 */
.lyrics-section {
  flex: 1;
  padding: 60px 40px 60px 20px;
  overflow: hidden;
}

.lyrics-container {
  height: 100%;
  overflow: hidden;
  position: relative;
}

.lyrics-container::-webkit-scrollbar {
  display: none;
}

/* 歌词行的基本样式 */
.lyric-line {
  text-align: center;
  padding: 0 20px;
  white-space: nowrap;
  overflow: visible;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2em; /* 调大基础字体 */
  line-height: 1.2; /* 紧凑行高防止重叠 */
  /* position, transform, transition 等由 getLyricLineStyle 动态控制 */
}

/* 有翻译的歌词行需要更紧凑 */
.lyric-line.has-translation {
  line-height: 1.1;
  padding: 8px 20px; /* 增加上下内边距 */
}

/* 正在播放的歌词 */
.lyric-line.current {
  color: white;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

/* 已播放的歌词 */
.lyric-line.played {
  color: rgba(255, 255, 255, 0.6);
}

/* 未播放的歌词 */
.lyric-line.upcoming {
  color: rgba(255, 255, 255, 0.7);
}

/* 双语歌词支持 */
.lyric-line.has-translation {
  white-space: normal; /* 允许换行 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px; /* 减少间距 */
  /* 确保不会重叠 */
  z-index: 1;
  position: relative;
  min-height: 60px; /* 设置最小高度确保不重叠 */
}

.main-lyric {
  font-size: inherit;
  font-weight: inherit;
  margin: 0;
  line-height: 1.1;
  text-align: center;
}

.translation-lyric {
  font-size: 0.6em; /* 翻译字体更小 */
  opacity: 0.75;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  line-height: 1.0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  text-align: center;
  margin: 2px 0 0 0; /* 只保留顶部间距 */
  padding: 0; /* 移除内边距 */
  max-width: 90%;
  word-wrap: break-word;
  /* 确保翻译不会影响布局 */
  flex-shrink: 0;
}

/* 翻译按钮样式 */
.translation-btn {
  position: relative;
}

.translation-btn.active {
  color: #feca57 !important;
  background: rgba(254, 202, 87, 0.15);
}

.translation-btn::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 2px;
  background: #feca57;
  transition: width 0.3s ease;
}

.translation-btn.active::after {
  width: 80%;
}

/* 正在播放的歌词行样式 */
.current-line {
  color: white;
  font-weight: bold;
  font-size: 1.1em;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

/* 未播放的歌词行样式 */  
.upcoming-line {
  color: rgba(255, 255, 255, 0.6); /* 基础颜色更暗 */
}

/* 渐变模糊效果的通用样式 */
.fade-blur {
  filter: blur(0px); /* 默认无模糊 */
  transition: opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease;
}

.lyric-line {
  text-align: center;
  margin: 30px 0;
  font-size: 32px;
  font-weight: 500;
  line-height: 1.5;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.4);
  word-spacing: 0.1em; /* 单词间距 */
  letter-spacing: 0.02em; /* 字符间距 */
  white-space: nowrap; /* 不换行 */
  word-break: keep-all; /* 保持单词完整 */
  overflow: visible; /* 允许溢出 */
  position: relative;
  display: inline-block;
  min-width: 100%;
}

/* 当前播放的歌词行 - 如果内容过长则滚动 */
.lyric-line.active {
  color: white;
  font-size: 36px;
  transform: scale(1.05);
  animation: none; /* 默认无动画 */
}

/* 长歌词滚动动画 - 从右向左滚动到刚好完全显示 */
@keyframes scroll-lyric {
  0% {
    transform: translateX(0) scale(1.05);
  }
  100% {
    transform: translateX(var(--scroll-distance)) scale(1.05);
  }
}

/* 为长歌词添加滚动效果的类 */
.lyric-line.active.long-lyric {
  animation: scroll-lyric linear forwards;
}

.lyric-line.blur {
  filter: blur(2px);
  opacity: 0.2;
}

/* 卡拉OK字符样式 - 优化版本 */
.karaoke-char {
  display: inline-block;
  font-weight: 500;
  position: relative;
  transition: transform 0.15s ease-out, color 0.1s ease; /* 平滑过渡 */
  text-rendering: optimizeLegibility; /* 优化文字渲染 */
  -webkit-font-smoothing: antialiased; /* 抗锯齿 */
  -moz-osx-font-smoothing: grayscale;
  vertical-align: baseline; /* 基线对齐 */
  margin-right: 0; /* 默认无间距 */
}

/* 非空格字符后面如果跟着空格，不添加间距（空格自己会处理） */
.karaoke-char:not(.is-space) {
  margin-right: 0;
}

/* 空格字符保持宽度 */
.karaoke-char.is-space {
  display: inline-block !important;
  min-width: 0.25em !important; /* 空格宽度 */
  width: 0.25em !important;
  height: 1em !important;
  white-space: pre !important; /* 保留空格 */
  pointer-events: none !important; /* 空格不响应事件 */
  margin: 0 !important;
  padding: 0 !important;
  flex-shrink: 0 !important; /* 防止空格被压缩 */
  vertical-align: baseline !important;
}

.lyric-char {
  display: inline-block;
}

.lyric-word {
  display: inline-block;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 30px;
  left: 30px;
  width: 44px;
  height: 44px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 50%;
  backdrop-filter: none;
  z-index: 10;
}

.close-btn:hover {
  color: white;
  transform: scale(1.15);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .album-section {
    flex: 0 0 35%;
  }
  
  .album-cover {
    width: 280px;
    height: 280px;
  }
  
  .song-title {
    font-size: 28px;
  }
  
  .lyric-line {
    font-size: 28px;
  }
  
  .lyric-line.active {
    font-size: 32px;
  }
}

@media (max-width: 768px) {
  .lyric-container {
    flex-direction: column;
  }
  
  .album-section {
    flex: 0 0 auto;
    padding: 40px 20px 20px;
  }
  
  .lyrics-section {
    flex: 1;
    padding: 20px;
  }
  
  .album-cover {
    width: 200px;
    height: 200px;
  }
  
  .song-title {
    font-size: 24px;
  }
  
  .lyric-line {
    font-size: 24px;
  }
  
  .lyric-line.active {
    font-size: 28px;
  }
}

/* 桥段进度条样式 */
.lyrics-container {
  position: relative; /* 确保进度条相对于容器定位 */
}

.bridge-progress-bar {
  height: 5px;
  border-radius: 2.5px;
  transition: transform 0.05s linear, background-color 0.1s ease;
  box-shadow: 0 0 18px currentColor, 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 100;
  width: 480px;
  pointer-events: none;
  transform-origin: center center; /* 从中心缩放，实现两端同时缩短 */
}

/* 桥段进度条覆盖显示时的样式 */
.bridge-progress-bar.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 20; /* 在正在播放歌词之上 */
}

/* 桥段进度条淡入淡出动画 */
.bridge-fade-enter-active {
  transition: opacity 0.3s ease;
}

.bridge-fade-leave-active {
  transition: opacity 0.3s ease;
}

.bridge-fade-enter-from,
.bridge-fade-leave-to {
  opacity: 0;
}

.bridge-fade-enter-to,
.bridge-fade-leave-from {
  opacity: 1;
}
</style>