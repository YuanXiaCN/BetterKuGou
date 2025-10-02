<template>
  <div class="sidebar">
    <!-- 主页按钮 -->
    <div class="sidebar-item" :class="{ active: activeItem === 'home' }" @click="handleItemClick('home')" title="主页">
      <svg class="sidebar-icon" viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
        <path d="M946.5 505L560.1 118.8l-25.9-25.9a31.5 31.5 0 00-44.4 0L77.5 505a63.9 63.9 0 00-18.8 46c.4 35.2 29.7 63.3 64.9 63.3h42.5V940h691.8V614.3h43.4c17.1 0 33.2-6.7 45.3-18.8a63.6 63.6 0 0018.7-45.3c0-17-6.7-33.1-18.8-45.2zM568 868H456V664h112v204zm217.9-325.7V868H632V640c0-22.1-17.9-40-40-40H432c-22.1 0-40 17.9-40 40v228H238.1V542.3h-96l370-369.7 23.1 23.1L882 542.3h-96.1z"/>
      </svg>
    </div>

    <!-- 收藏歌单按钮 -->
    <div 
      class="sidebar-item" 
      :class="{ active: activeItem === 'favorite', disabled: !userLoggedIn }" 
      @click="handleItemClick('favorite')" 
      :title="userLoggedIn ? '收藏的歌单' : '收藏的歌单（需要登录）'"
    >
      <svg class="sidebar-icon" viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
        <path d="M923 283.6a260.04 260.04 0 00-56.9-82.8 264.4 264.4 0 00-84-55.5A265.34 265.34 0 00679.7 125c-49.3 0-97.4 13.5-139.2 39-10 6.1-19.5 12.8-28.5 20.1-9-7.3-18.5-14-28.5-20.1-41.8-25.5-89.9-39-139.2-39-35.5 0-69.9 6.8-102.4 20.3-31.4 13-59.7 31.7-84 55.5a258.44 258.44 0 00-56.9 82.8c-13.9 32.3-21 66.6-21 101.9 0 33.3 6.8 68 20.3 103.3 11.3 29.5 27.5 60.1 48.2 91 32.8 48.9 77.9 99.9 133.9 151.6 92.8 85.7 184.7 144.9 188.6 147.3l23.7 15.2c10.5 6.7 24 6.7 34.5 0l23.7-15.2c3.9-2.5 95.7-61.6 188.6-147.3 56-51.7 101.1-102.7 133.9-151.6 20.7-30.9 37-61.5 48.2-91 13.5-35.3 20.3-70 20.3-103.3.1-35.3-7-69.6-20.9-101.9zM512 814.8S156 586.7 156 385.5C156 283.6 240.3 201 344.3 201c73.1 0 136.5 40.8 167.7 100.4C543.2 241.8 606.6 201 679.7 201c104 0 188.3 82.6 188.3 184.5 0 201.2-356 429.3-356 429.3z"/>
      </svg>
      <div v-if="!userLoggedIn" class="login-badge">
        <svg viewBox="0 0 1024 1024" width="12" height="12" fill="currentColor">
          <path d="M832 464h-68V240c0-70.7-57.3-128-128-128H388c-70.7 0-128 57.3-128 128v224h-68V240c0-108.1 87.9-196 196-196h248c108.1 0 196 87.9 196 196v224zM540 701v53c0 4.4-3.6 8-8 8h-40c-4.4 0-8-3.6-8-8v-53a48.01 48.01 0 1156 0z m-198-128h384c35.3 0 64 28.7 64 64v200c0 35.3-28.7 64-64 64H342c-35.3 0-64-28.7-64-64V637c0-35.3 28.7-64 64-64z"/>
        </svg>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="sidebar-divider"></div>

    <!-- 用户歌单列表（仅登录后显示）-->
    <div class="sidebar-playlists" v-if="userLoggedIn && playlists && playlists.length > 0">
      <div 
        v-for="playlist in playlists" 
        :key="playlist.id"
        class="sidebar-item" 
        :class="{ active: activeItem === `playlist-${playlist.id}` }" 
        @click="handleItemClick(`playlist-${playlist.id}`, playlist)"
        :title="playlist.name"
      >
        <svg class="sidebar-icon" viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
          <path d="M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656zM492 400h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 144h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zm0 144h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H492c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8zM340 368a40 40 0 1080 0 40 40 0 10-80 0zm0 144a40 40 0 1080 0 40 40 0 10-80 0zm0 144a40 40 0 1080 0 40 40 0 10-80 0z"/>
        </svg>
      </div>
    </div>

    <!-- 新建歌单按钮（仅登录后显示）-->
    <div 
      v-if="userLoggedIn"
      class="sidebar-item sidebar-create" 
      @click="handleCreatePlaylist" 
      title="新建歌单"
    >
      <svg class="sidebar-icon" viewBox="0 0 1024 1024" width="24" height="24" fill="currentColor">
        <path d="M482 152h60q8 0 8 8v704q0 8-8 8h-60q-8 0-8-8V160q0-8 8-8z"/>
        <path d="M176 474h672q8 0 8 8v60q0 8-8 8H176q-8 0-8-8v-60q0-8 8-8z"/>
      </svg>
    </div>
    
  </div>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    playlists: {
      type: Array,
      default: () => []
    },
    currentView: {
      type: String,
      default: 'home'
    },
    userLoggedIn: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeItem: 'home'
    }
  },
  watch: {
    currentView: {
      immediate: true,
      handler(newVal) {
        this.activeItem = newVal
      }
    }
  },
  methods: {
    handleItemClick(itemId, playlist = null) {
      console.log('Sidebar item clicked:', itemId, playlist)
      
      // 如果未登录且点击需要登录的功能，不执行导航
      if (!this.userLoggedIn && itemId === 'favorite') {
        console.log('需要登录才能访问收藏功能')
        return
      }
      
      this.activeItem = itemId
      
      if (itemId === 'home') {
        this.$emit('navigate', 'home')
      } else if (itemId === 'favorite') {
        this.$emit('navigate', 'favorite')
      } else if (itemId.startsWith('playlist-')) {
        this.$emit('navigate', 'playlist', playlist)
      }
    },
    handleCreatePlaylist() {
      if (!this.userLoggedIn) {
        console.log('需要登录才能创建歌单')
        return
      }
      console.log('Create playlist clicked')
      this.$emit('create-playlist')
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: calc(100vh - var(--titlebar-height));
  background: var(--color-background);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md) 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 自定义滚动条 */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.sidebar-item {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
  color: var(--color-text-secondary);
}

.sidebar-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--color-primary);
  border-radius: 0 2px 2px 0;
  transition: height var(--transition-base);
}

.sidebar-item:hover {
  background: var(--color-background-light);
  color: var(--color-text);
}

.sidebar-item.active {
  color: var(--color-primary);
}

.sidebar-item.active::before {
  height: 24px;
}

.sidebar-icon {
  transition: all var(--transition-base);
}

.sidebar-item:hover .sidebar-icon {
  transform: scale(1.1);
}

.sidebar-item.active .sidebar-icon {
  transform: scale(1.15);
}

/* 禁用状态 */
.sidebar-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  position: relative;
}

.sidebar-item.disabled:hover {
  background: transparent;
  color: var(--color-text-secondary);
}

.sidebar-item.disabled .sidebar-icon {
  transform: none !important;
}

/* 登录徽章 */
.login-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
  background: rgba(255, 193, 7, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffc107;
}

/* 未登录提示 */
.sidebar-login-hint {
  margin-top: auto;
  padding: var(--spacing-lg) var(--spacing-md);
  text-align: center;
}

.hint-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-divider {
  width: 32px;
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-sm) auto;
}

.sidebar-playlists {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin: var(--spacing-xs) 0;
}

/* 歌单列表滚动条 */
.sidebar-playlists::-webkit-scrollbar {
  width: 4px;
}

.sidebar-playlists::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-playlists::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

.sidebar-playlists::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

.sidebar-create {
  margin-top: auto;
  color: var(--color-text-tertiary);
  border-top: 1px solid var(--color-border);
}

.sidebar-create:hover {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.sidebar-create .sidebar-icon {
  transition: all var(--transition-base);
}

.sidebar-create:hover .sidebar-icon {
  transform: scale(1.2) rotate(90deg);
}
</style>
