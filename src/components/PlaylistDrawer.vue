<template>
  <div class="playlist-drawer" :class="{ 'show': visible }" @click.self="closeDrawer">
    <!-- 抽屉内容 -->
    <div class="drawer-content" @click.stop>
      <!-- 头部 -->
      <div class="drawer-header">
        <h3>播放列表</h3>
        <span class="song-count">共 {{ playlist.length }} 首</span>
        <button class="close-btn" @click="closeDrawer">
          <svg viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
            <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/>
          </svg>
        </button>
      </div>

      <!-- 播放列表 -->
      <div class="playlist-content">
        <TransitionGroup 
          name="playlist-item" 
          tag="div" 
          class="playlist-list"
          appear
        >
          <div 
            v-for="(song, index) in playlist" 
            :key="song.hash || index"
            class="playlist-item"
            :class="{ 'active': currentSong && currentSong.hash === song.hash }"
            @dblclick="playSong(song)"
            @contextmenu.prevent.stop="showContextMenu($event, song, index)"
          >
          <!-- 播放状态指示器 -->
          <div class="play-indicator">
            <svg v-if="currentSong && currentSong.hash === song.hash && isPlaying" 
                 viewBox="0 0 1024 1024" width="14" height="14" fill="currentColor">
              <path d="M304 176h80v672h-80zm336 0h80v672h-80z"/>
            </svg>
            <span v-else class="song-index">{{ index + 1 }}</span>
          </div>

          <!-- 歌曲信息 -->
          <div class="song-info">
            <div class="song-name">{{ getSongName(song) }}</div>
            <div class="song-artist">{{ getSingerNames(song) }}</div>
          </div>

          <!-- 歌曲时长 -->
          <div class="song-duration">
            {{ formatDuration(song) }}
          </div>

          <!-- 操作按钮 -->
          <div class="song-actions">
            <button class="action-btn" @click.stop="removeSong(index)" title="移除">
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/>
              </svg>
            </button>
          </div>
          </div>
        </TransitionGroup>

        <!-- 空状态 -->
        <div v-if="playlist.length === 0" class="empty-state">
          <svg viewBox="0 0 1024 1024" width="64" height="64" fill="currentColor" opacity="0.3">
            <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z"/>
            <path d="M304 368c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H312c-4.4 0-8 3.6-8 8v48zm0 192c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H312c-4.4 0-8 3.6-8 8v48zm0 192c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H312c-4.4 0-8 3.6-8 8v48z"/>
          </svg>
          <p>播放列表为空</p>
          <p class="hint">双击歌曲添加到播放列表</p>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="drawer-footer">
        <button 
          class="footer-btn" 
          :class="{ 'confirm-delete': showClearConfirm }"
          @click="handleClearClick" 
          @mouseleave="cancelClear"
          :disabled="playlist.length === 0"
        >
          <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
            <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z"/>
          </svg>
          {{ showClearConfirm ? '确认清除' : '清空列表' }}
        </button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="contextMenuVisible"
      :position="contextMenuPosition"
      :items="contextMenuItems"
      @close="contextMenuVisible = false"
    />
  </div>
</template>

<script>
import { TransitionGroup } from 'vue'
import ContextMenu from './ContextMenu.vue'
import contextMenuManager from '../utils/contextMenuManager.js'

export default {
  name: 'PlaylistDrawer',
  components: {
    ContextMenu,
    TransitionGroup
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    playlist: {
      type: Array,
      default: () => []
    },
    currentSong: {
      type: Object,
      default: null
    },
    isPlaying: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      contextMenuVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      currentContextSong: null,
      currentContextIndex: -1,
      showClearConfirm: false // 是否显示清空确认状态
    }
  },
  computed: {
    contextMenuItems() {
      if (!this.currentContextSong) return []
      
      return [
        {
          label: '播放',
          icon: 'M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z',
          action: () => this.playSong(this.currentContextSong)
        },
        { divider: true },
        {
          label: '从播放列表移除',
          icon: '63.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z',
          action: () => this.removeSong(this.currentContextIndex)
        }
      ]
    }
  },
  watch: {
    playlist: {
      handler(newPlaylist) {
        if (newPlaylist && newPlaylist.length > 0) {
          console.log('📋 播放列表更新:', newPlaylist)
          console.log('📋 第一首歌曲数据结构:', newPlaylist[0])
          console.log('📋 第一首歌曲的所有字段:', Object.keys(newPlaylist[0]))
        }
      },
      immediate: true
    },
    // 监听抽屉显示状态，打开时滚动到当前播放的歌曲
    visible: {
      handler(isVisible) {
        if (isVisible && this.currentSong) {
          this.$nextTick(() => {
            this.scrollToCurrentSong()
          })
        }
      },
      immediate: false
    },
    // 监听当前歌曲变化，如果播放列表开启则自动滚动定位
    currentSong: {
      handler(newSong) {
        if (this.visible && newSong) {
          this.$nextTick(() => {
            this.scrollToCurrentSong()
          })
        }
      },
      immediate: false
    }
  },
  methods: {
    closeDrawer() {
      this.$emit('close')
    },
    
    playSong(song) {
      this.$emit('play', song)
    },
    
    removeSong(index) {
      this.$emit('remove', index)
    },
    
    // 处理清空按钮点击
    handleClearClick() {
      if (this.playlist.length === 0) return
      
      if (!this.showClearConfirm) {
        // 第一次点击：显示确认状态
        this.showClearConfirm = true
        console.log('显示清空确认状态')
      } else {
        // 第二次点击：执行清空
        console.log('确认清空播放列表')
        this.$emit('clear')
        this.showClearConfirm = false
      }
    },
    
    // 取消清空（鼠标移开）
    cancelClear() {
      if (this.showClearConfirm) {
        console.log('取消清空操作')
        this.showClearConfirm = false
      }
    },
    
    // 显示右键菜单
    showContextMenu(event, song, index) {
      // 先关闭所有其他菜单
      contextMenuManager.closeActiveMenu()
      
      // 然后关闭自己的旧菜单，防止瞬移
      this.contextMenuVisible = false
      
      // 使用 nextTick 确保旧菜单完全关闭后再打开新菜单
      this.$nextTick(() => {
        this.currentContextSong = song
        this.currentContextIndex = index
        this.contextMenuPosition = {
          x: event.clientX,
          y: event.clientY
        }
        this.contextMenuVisible = true
        
        // 注册到全局管理器
        contextMenuManager.registerMenu(() => {
          this.contextMenuVisible = false
        })
      })
    },
    
    // 滚动到当前播放的歌曲
    scrollToCurrentSong() {
      if (!this.currentSong || !this.playlist.length) return
      
      const currentIndex = this.playlist.findIndex(song => 
        song.hash === this.currentSong.hash
      )
      
      if (currentIndex === -1) return
      
      // 获取播放列表容器和当前歌曲元素
      const container = this.$el.querySelector('.playlist-content')
      const items = this.$el.querySelectorAll('.playlist-item')
      const currentItem = items[currentIndex]
      
      if (container && currentItem) {
        // 计算滚动位置（将当前歌曲滚动到中间位置）
        const containerHeight = container.clientHeight
        const itemTop = currentItem.offsetTop
        const itemHeight = currentItem.clientHeight
        const scrollTop = itemTop - (containerHeight / 2) + (itemHeight / 2)
        
        container.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        })
        
        console.log('🎵 滚动到当前播放歌曲:', currentIndex)
      }
    },
    
    // 提取歌曲名称
    getSongName(song) {
      if (!song) return '未知歌曲'
      
      // 优先使用 name 字段（实际数据字段）
      const fullName = song.name || song.filename || song.songname || song.audio_name || ''
      
      if (!fullName) {
        console.warn('歌曲名称字段为空，歌曲对象:', song)
        return '未知歌曲'
      }
      
      // 如果包含 " - "，提取歌名部分
      const parts = fullName.split(' - ')
      if (parts.length > 1) {
        return parts.slice(1).join(' - ')
      }
      return fullName
    },
    
    // 获取歌手名称
    getSingerNames(song) {
      if (!song) return '未知歌手'
      
      // 尝试从 singerinfo 数组获取
      if (song.singerinfo && Array.isArray(song.singerinfo) && song.singerinfo.length > 0) {
        const names = song.singerinfo.map(s => {
          if (typeof s === 'object' && s !== null) {
            return s.name || s.singer_name || s.singername || s.author_name
          }
          return String(s)
        }).filter(name => name && name.trim() && name !== '[object Object]')
        
        if (names.length > 0) {
          return names.join('、')
        }
      }
      
      // 备用字段
      if (song.singername) {
        return song.singername
      }
      
      if (song.author) {
        return song.author
      }
      
      // 从 name 字段提取(格式: "歌手 - 歌名")
      if (song.name && song.name.includes(' - ')) {
        return song.name.split(' - ')[0]
      }
      
      return '未知歌手'
    },
    
    // 格式化时长
    formatDuration(song) {
      if (!song) return '0:00'
      
      // 优先使用 timelen 字段（实际数据字段，毫秒）
      let milliseconds = song.timelen || song.duration || song.timelength || song.time || 0
      
      if (!milliseconds || isNaN(milliseconds)) {
        console.warn('时长字段为空或无效，歌曲对象:', song)
        return '0:00'
      }
      
      const seconds = Math.floor(milliseconds / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.playlist-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 90px; /* 不覆盖播放器区域（播放器高度约80px + 间距） */
  z-index: 1000;
  pointer-events: none;
  background: transparent;
}

.playlist-drawer.show {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5); /* 半透明遮罩背景 */
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 抽屉内容 */
.drawer-content {
  position: absolute;
  top: 92px; /* TitleBar(32px) + Navigation(60px) */
  right: 0;
  bottom: 10px; /* 距离底部间距 */
  width: 400px;
  background: var(--color-background);
  border-radius: 12px 0 0 12px; /* 左侧圆角 */
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border);
  border-right: none;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.playlist-drawer.show .drawer-content {
  transform: translateX(0);
}

/* 头部 */
.drawer-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.drawer-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text);
}

.song-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.close-btn {
  margin-left: auto;
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

.close-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

/* 播放列表内容 */
.playlist-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.playlist-item:hover {
  background: var(--color-background);
}

.playlist-item.active {
  background: var(--color-primary-light);
}

.playlist-item.active .song-name {
  color: var(--color-primary);
}

.play-indicator {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.song-index {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.playlist-item.active .play-indicator svg {
  color: var(--color-primary);
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: var(--font-size-sm);
  color: var(--color-text);
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

.song-duration {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.song-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.playlist-item:hover .song-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
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

.action-btn:hover {
  background: var(--color-background-light);
  color: var(--color-danger);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  gap: var(--spacing-md);
}

.empty-state p {
  margin: 0;
}

.hint {
  font-size: var(--font-size-xs);
  opacity: 0.6;
}

/* 底部操作 */
.drawer-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.footer-btn {
  width: 100%;
  height: 36px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.footer-btn:hover:not(:disabled) {
  background: var(--color-background);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 确认删除状态 */
.footer-btn.confirm-delete {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  border-color: #ff4757;
  color: white;
  font-weight: 500;
  animation: deleteWarning 0.3s ease-out;
}

.footer-btn.confirm-delete:hover {
  background: linear-gradient(135deg, #ff3838 0%, #ff5757 100%);
  border-color: #ff3838;
  color: white;
  transform: scale(1.02);
}

@keyframes deleteWarning {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* 滚动条样式 */
.playlist-content::-webkit-scrollbar {
  width: 6px;
}

.playlist-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.playlist-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}

/* 播放列表项过渡动画 */
.playlist-item-enter-active,
.playlist-item-leave-active {
  transition: all 0.3s ease;
}

.playlist-item-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.playlist-item-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.playlist-item-move {
  transition: transform 0.3s ease;
}

.playlist-list {
  position: relative;
}
</style>
