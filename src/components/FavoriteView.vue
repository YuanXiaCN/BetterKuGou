<template>
  <div class="favorite-view">
    <div class="page-header">
      <h1 class="page-title">我喜欢的音乐</h1>
      <div class="header-actions">
        <button class="action-btn" @click="playAll">
          <svg viewBox="0 0 1024 1024" width="18" height="18" fill="currentColor">
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8zm-257.6 134V390.9L628.5 512 461.8 633.1z"/>
          </svg>
          播放全部
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="favoriteList.length === 0" class="empty-state">
      <svg viewBox="0 0 1024 1024" width="80" height="80" fill="currentColor" opacity="0.3">
        <path d="M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/>
      </svg>
      <p class="empty-text">还没有收藏的歌曲</p>
      <p class="empty-hint">去发现页面找些喜欢的音乐吧</p>
      <button class="primary-btn" @click="goToDiscover">
        去发现音乐
      </button>
    </div>

    <!-- 歌曲列表 -->
    <div v-else class="song-list">
      <div class="list-header">
        <div class="col-index">#</div>
        <div class="col-title">歌曲</div>
        <div class="col-artist">歌手</div>
        <div class="col-album">专辑</div>
        <div class="col-duration">时长</div>
      </div>

      <div 
        v-for="(song, index) in favoriteList" 
        :key="song.hash"
        class="song-item"
        :class="{ playing: currentSong && currentSong.hash === song.hash }"
        @dblclick="playSong(song)"
        @contextmenu.prevent.stop="showContextMenu($event, song)"
      >
        <div class="col-index">
          <span class="index-number">{{ index + 1 }}</span>
        </div>

        <div class="col-title">
          <img v-if="song.cover" :src="song.cover.replace('{size}', '400')" class="song-cover" :alt="song.name" />
          <div class="song-info">
            <div class="song-name">
              {{ getSongName(song.name) }}
              <span v-if="song.relate_goods && song.relate_goods.some(g => g.level >= 5)" class="quality-badge">SQ</span>
            </div>
          </div>
        </div>

        <div class="col-artist">{{ getSingerNames(song.singerinfo) }}</div>
        <div class="col-album">{{ song.albuminfo?.name || song.remark || '-' }}</div>
        <div class="col-duration">
          {{ formatDuration(song.timelen) }}
          <div class="action-buttons">
            <button class="icon-btn play-btn-inline" @click.stop="playSong(song)" :title="currentSong && currentSong.hash === song.hash ? '暂停' : '播放'">
              <svg v-if="currentSong && currentSong.hash === song.hash" viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M304 176h80v672h-80zm336 0h80v672h-80z"/>
              </svg>
              <svg v-else viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z"/>
              </svg>
            </button>
            <button class="icon-btn favorite-btn active" @click.stop="removeFavorite(song)" title="取消收藏">
              <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                <path d="M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z"/>
              </svg>
            </button>
          </div>
        </div>
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
import { getUserPlaylists, getPlaylistTracks } from '../api/music.js'
import ContextMenu from './ContextMenu.vue'
import contextMenuManager from '../utils/contextMenuManager.js'

export default {
  name: 'FavoriteView',
  components: {
    ContextMenu
  },
  props: {
    currentSong: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      favoriteList: [],
      favoritePlaylistId: null, // 收藏歌单的 ID
      contextMenuVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      currentContextSong: null
    }
  },
  computed: {
    contextMenuItems() {
      if (!this.currentContextSong) return []
      
      const isFavorite = this.favoriteList.some(s => s.hash === this.currentContextSong.hash)
      
      return [
        {
          label: '播放',
          icon: 'M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8z',
          action: () => this.playSong(this.currentContextSong)
        },
        {
          label: '下一首播放',
          icon: 'M272.9 512l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L186.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H532c6.7 0 10.4-7.7 6.3-12.9L272.9 512zm304 0l265.4-339.1c4.1-5.2.4-12.9-6.3-12.9h-77.3c-4.9 0-9.6 2.3-12.6 6.1L490.8 492.3a31.99 31.99 0 000 39.5l255.3 326.1c3 3.9 7.7 6.1 12.6 6.1H836c6.7 0 10.4-7.7 6.3-12.9L576.9 512z',
          action: () => this.playNext(this.currentContextSong)
        },
        { divider: true },
        {
          label: isFavorite ? '取消收藏' : '收藏',
          icon: 'M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9z',
          action: () => this.toggleFavorite(this.currentContextSong)
        },
        {
          label: '下载',
          icon: 'M505.7 661a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z',
          action: () => this.downloadSong(this.currentContextSong)
        },
        {
          label: '分享',
          icon: 'M752 664c-28.5 0-54.8 10-75.4 26.7L469.4 540.8a160.68 160.68 0 000-57.6l207.2-149.9C697.2 350 723.5 360 752 360c66.2 0 120-53.8 120-120s-53.8-120-120-120-120 53.8-120 120c0 11.6 1.6 22.7 4.7 33.3L439.9 415.8C410.7 377.1 364.3 352 312 352c-88.4 0-160 71.6-160 160s71.6 160 160 160c52.3 0 98.7-25.1 127.9-63.8l196.8 142.5c-3.1 10.6-4.7 21.8-4.7 33.3 0 66.2 53.8 120 120 120s120-53.8 120-120-53.8-120-120-120zm0-476c28.7 0 52 23.3 52 52s-23.3 52-52 52-52-23.3-52-52 23.3-52 52-52zM312 600c-48.5 0-88-39.5-88-88s39.5-88 88-88 88 39.5 88 88-39.5 88-88 88zm440 236c-28.7 0-52-23.3-52-52s23.3-52 52-52 52 23.3 52 52-23.3 52-52 52z',
          action: () => this.shareSong(this.currentContextSong)
        },
        { divider: true },
        {
          label: '从播放列表中移除',
          icon: 'M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z',
          action: () => this.removeFromPlaylist(this.currentContextSong)
        },
        {
          label: '搜索',
          icon: 'M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z',
          action: () => this.searchSong(this.currentContextSong)
        }
      ]
    }
  },
  mounted() {
    this.loadFavorites()
  },
  methods: {
    // 加载收藏列表
    async loadFavorites() {
      this.loading = true
      try {
        // 检查登录状态
        const token = localStorage.getItem('kugou_token')
        const userid = localStorage.getItem('kugou_userid')
        console.log('Token:', token ? '存在' : '不存在')
        console.log('UserID:', userid)
        
        if (!token || !userid) {
          console.warn('未登录或缺少认证信息')
          this.loading = false
          return
        }
        
        // 1. 获取用户歌单列表
        const playlistRes = await getUserPlaylists(1, 100)
        console.log('用户歌单:', playlistRes)
        
        if (playlistRes.status === 1 && playlistRes.data) {
          const playlists = playlistRes.data.info || []
          
          // 2. 找到"我喜欢的音乐"歌单（通常是第一个，或者名称包含"喜欢"）
          const favoritePlaylist = playlists.find(p => 
            p.name === '我喜欢的音乐' || 
            p.name.includes('喜欢') || 
            p.list_id === '3' // 酷狗默认的收藏歌单 ID
          ) || playlists[0] // 如果找不到就用第一个
          
          if (favoritePlaylist) {
            this.favoritePlaylistId = favoritePlaylist.global_collection_id
            console.log('收藏歌单 ID:', this.favoritePlaylistId)
            
            // 3. 分页获取该歌单的所有歌曲
            let allSongs = []
            let page = 1
            const pageSize = 300 // 每页最多300首
            let totalCount = 0
            
            // 第一次请求获取总数
            const firstRes = await getPlaylistTracks(this.favoritePlaylistId, page, pageSize)
            console.log('第一页收藏歌曲:', firstRes)
            
            if (firstRes.status === 1 && firstRes.data) {
              totalCount = firstRes.data.count || 0
              allSongs = firstRes.data.songs || []
              console.log(`总共 ${totalCount} 首歌曲，已加载 ${allSongs.length} 首`)
              
              // 如果还有更多歌曲，继续分页获取
              const totalPages = Math.ceil(totalCount / pageSize)
              for (let i = 2; i <= totalPages; i++) {
                const pageRes = await getPlaylistTracks(this.favoritePlaylistId, i, pageSize)
                if (pageRes.status === 1 && pageRes.data && pageRes.data.songs) {
                  allSongs = allSongs.concat(pageRes.data.songs)
                  console.log(`已加载第 ${i} 页，当前共 ${allSongs.length} 首`)
                }
              }
              
              this.favoriteList = allSongs
              console.log(`最终加载完成：${this.favoriteList.length} / ${totalCount} 首歌曲`)
              
              if (this.favoriteList.length > 0) {
                console.log('第一首歌的数据:', this.favoriteList[0])
              }
              
              // 同时保存到 localStorage 作为备份
              localStorage.setItem('favorite_songs', JSON.stringify(this.favoriteList))
            }
          }
        }
      } catch (e) {
        console.error('加载收藏列表失败:', e)
        // 如果 API 失败，尝试从 localStorage 读取
        try {
          const favorites = localStorage.getItem('favorite_songs')
          if (favorites) {
            this.favoriteList = JSON.parse(favorites)
          }
        } catch (err) {
          console.error('从本地存储加载失败:', err)
        }
      } finally {
        this.loading = false
      }
    },
    
    // 格式化时长
    formatDuration(milliseconds) {
      if (!milliseconds) return '-'
      const seconds = Math.floor(milliseconds / 1000)
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    },
    
    // 获取歌手名称
    getSingerNames(singerinfo) {
      if (!singerinfo || !Array.isArray(singerinfo)) return '-'
      return singerinfo.map(s => s.name).join('、')
    },
    
    // 提取歌曲名称（去掉"歌手 - "前缀）
    getSongName(fullName) {
      if (!fullName) return '未知歌曲'
      // 如果包含 " - "，取后面的部分作为歌名
      const parts = fullName.split(' - ')
      if (parts.length > 1) {
        return parts.slice(1).join(' - ') // 处理歌名中也可能包含 " - " 的情况
      }
      return fullName
    },
    
    // 播放歌曲
    playSong(song) {
      console.log('播放歌曲:', song)
      this.$emit('play', song)
    },
    
    // 下一首播放
    playNext(song) {
      console.log('下一首播放:', song)
      this.$emit('play-next', song)
    },
    
    // 显示右键菜单
    showContextMenu(event, song) {
      // 先关闭所有其他菜单
      contextMenuManager.closeActiveMenu()
      
      // 然后关闭自己的旧菜单，防止瞬移
      this.contextMenuVisible = false
      
      // 使用 nextTick 确保旧菜单完全关闭后再打开新菜单
      this.$nextTick(() => {
        this.currentContextSong = song
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
    
    // 切换收藏状态
    toggleFavorite(song) {
      const isFavorite = this.favoriteList.some(s => s.hash === song.hash)
      if (isFavorite) {
        this.removeFavorite(song)
      } else {
        this.addFavorite(song)
      }
    },
    
    // 添加收藏
    addFavorite(song) {
      if (!this.favoriteList.some(s => s.hash === song.hash)) {
        this.favoriteList.push(song)
        localStorage.setItem('favorite_songs', JSON.stringify(this.favoriteList))
        console.log('已添加到收藏:', song.name)
      }
    },
    
    // 从播放列表移除
    removeFromPlaylist(song) {
      this.$emit('remove-from-playlist', song)
    },
    
    // 分享歌曲
    shareSong(song) {
      console.log('分享歌曲:', song)
      // TODO: 实现分享功能
      alert('分享功能开发中...')
    },
    
    // 搜索歌曲
    searchSong(song) {
      console.log('搜索歌曲:', song)
      this.$emit('search', song)
    },
    
    // 播放全部
    playAll() {
      if (this.favoriteList.length > 0) {
        console.log('播放全部')
        this.$emit('play-all', this.favoriteList)
      }
    },
    
    // 清空列表
    clearAll() {
      if (confirm('确定要清空所有收藏吗？')) {
        localStorage.removeItem('favorite_songs')
        this.favoriteList = []
      }
    },
    
    // 移除收藏
    removeFavorite(song) {
      const index = this.favoriteList.findIndex(s => s.hash === song.hash)
      if (index > -1) {
        this.favoriteList.splice(index, 1)
        localStorage.setItem('favorite_songs', JSON.stringify(this.favoriteList))
      }
    },
    
    // 添加到歌单
    addToPlaylist(song) {
      console.log('添加到歌单:', song)
      // TODO: 实现添加到歌单功能
    },
    
    // 下载歌曲
    downloadSong(song) {
      console.log('下载歌曲:', song)
      // TODO: 实现下载功能
    },
    
    // 去发现页面
    goToDiscover() {
      this.$emit('navigate', 'home')
    }
  }
}
</script>

<style scoped>
.favorite-view {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-text);
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.primary-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-top: var(--spacing-lg);
}

.primary-btn:hover {
  background: var(--color-primary-hover);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  text-align: center;
}

.empty-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: var(--spacing-md) 0 var(--spacing-sm);
}

.empty-hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* 歌曲列表 */
.song-list {
  background: var(--color-background-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.list-header,
.song-item {
  display: grid;
  grid-template-columns: 60px 1fr 200px 200px 120px;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
}

.list-header {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
}

.song-item {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
  cursor: pointer;
}

.song-item:last-child {
  border-bottom: none;
}

.song-item:hover {
  background: var(--color-background);
}

.song-item.playing {
  background: rgba(99, 102, 241, 0.1);
}

.song-item.playing .song-name {
  color: var(--color-primary);
}

/* 列样式 */
.col-index {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  justify-content: center;
}

.index-number {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.play-btn {
  display: none;
}

.col-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.song-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
  flex: 1;
}

.song-name {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.quality-badge {
  padding: 1px 4px;
  background: rgba(99, 102, 241, 0.2);
  color: var(--color-primary);
  font-size: 10px;
  border-radius: 2px;
  font-weight: 500;
  flex-shrink: 0;
  border: 1px solid var(--color-primary);
}

.col-artist,
.col-album {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-duration {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  opacity: 1;
}

.col-actions {
  display: flex;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.song-item:hover .col-actions {
  opacity: 1;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.icon-btn:hover {
  background: var(--color-background);
  color: var(--color-text);
}

.icon-btn.danger:hover {
  color: #ff4d4f;
}

.play-btn-inline {
  color: var(--color-text);
}

.play-btn-inline:hover {
  color: var(--color-primary);
  transform: scale(1.1);
}

.favorite-btn.active {
  color: #ff4d4f;
}

.favorite-btn.active:hover {
  color: #ff7875;
}
</style>
