<template>
  <div class="title-bar" :class="{ 'lyric-mode': isLyricViewVisible }">
    <div class="drag-area">
      <!-- 可拖动区域 -->
    </div>
    <div class="window-controls">
      <!-- 用户信息或登录按钮 -->
      <div v-if="userLoggedIn && userInfo" ref="userInfoBtn" class="user-info" @click.stop="handleUserClick">
        <div class="user-avatar">
          <img v-if="userInfo.avatar" :src="userInfo.avatar" alt="头像" />
          <svg v-else class="default-avatar" viewBox="0 0 1024 1024">
            <path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="currentColor" opacity=".2"></path>
            <path d="M512 640c-70.692 0-128-57.308-128-128s57.308-128 128-128 128 57.308 128 128-57.308 128-128 128z m0-192c-35.346 0-64 28.654-64 64s28.654 64 64 64 64-28.654 64-64-28.654-64-64-64z m256 448H256c-17.673 0-32-14.327-32-32 0-123.514 100.486-224 224-224h96c123.514 0 224 100.486 224 224 0 17.673-14.327 32-32 32z m-479.967-64h447.935c-13.547-77.612-81.232-137.036-159.968-137.036h-96c-78.736 0-146.421 59.424-159.967 137.036z" fill="currentColor"></path>
          </svg>
        </div>
        <span class="user-name">{{ userInfo.username || '用户' }}</span>
      </div>
      <button v-else class="control-btn login-btn" @click="handleLogin" title="登录">
        <svg class="icon" viewBox="0 0 1024 1024" width="18" height="18">
          <path d="M512 512m-512 0a512 512 0 1 0 1024 0 512 512 0 1 0-1024 0Z" fill="currentColor" opacity=".2"></path>
          <path d="M512 640c-70.692 0-128-57.308-128-128s57.308-128 128-128 128 57.308 128 128-57.308 128-128 128z m0-192c-35.346 0-64 28.654-64 64s28.654 64 64 64 64-28.654 64-64-28.654-64-64-64z m256 448H256c-17.673 0-32-14.327-32-32 0-123.514 100.486-224 224-224h96c123.514 0 224 100.486 224 224 0 17.673-14.327 32-32 32z m-479.967-64h447.935c-13.547-77.612-81.232-137.036-159.968-137.036h-96c-78.736 0-146.421 59.424-159.967 137.036z" fill="currentColor"></path>
        </svg>
      </button>
      

      
      <!-- 窗口控制按钮 -->
      <button class="control-btn minimize" @click="minimizeWindow" title="最小化">
        <img :src="icons.minimize" alt="最小化" class="icon" />
      </button>
      <button class="control-btn maximize" @click="toggleMaximize" :title="isMaximized ? '还原' : '最大化'">
        <img :src="isMaximized ? icons.restore : icons.maximize" alt="最大化" class="icon" />
      </button>
      <button class="control-btn close" @click="closeWindow" title="关闭">
        <img :src="icons.close" alt="关闭" class="icon" />
      </button>
    </div>

    <!-- 用户菜单 -->
    <UserMenu
      :visible="showUserMenu"
      :userInfo="userInfo"
      :position="userMenuPosition"
      @close="showUserMenu = false"
      @edit-profile="handleEditProfile"
      @open-settings="handleSettings"
      @logout="handleLogout"
    />
  </div>
</template>

<script>
// 动态导入图标文件
import minimizeIcon from '../icon/minimize.svg'
import maximizeIcon from '../icon/full_screen_maximize.svg'
import restoreIcon from '../icon/full_screen_minimize.svg'
import closeIcon from '../icon/close.svg'
import UserMenu from './UserMenu.vue'

export default {
  name: 'TitleBar',
  components: {
    UserMenu
  },
  props: {
    userLoggedIn: {
      type: Boolean,
      default: false
    },
    userInfo: {
      type: Object,
      default: null
    },
    isLyricViewVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isMaximized: false,
      showUserMenu: false,
      userMenuPosition: { top: 0, right: 0 },
      // 图标路径配置 - 如需替换图标,只需修改这里的路径
      icons: {
        minimize: minimizeIcon,
        maximize: maximizeIcon,
        restore: restoreIcon,
        close: closeIcon
      }
    }
  },
  watch: {
    isLyricViewVisible(newVal) {
      console.log('📺 TitleBar: 歌词界面状态 =', newVal)
    }
  },
  mounted() {
    console.log('TitleBar mounted')
    console.log('electronAPI available:', !!window.electronAPI)
    
    // 监听窗口最大化状态
    if (window.electronAPI) {
      window.electronAPI.onMaximized(() => {
        console.log('Window maximized')
        this.isMaximized = true
      })
      window.electronAPI.onUnmaximized(() => {
        console.log('Window unmaximized')
        this.isMaximized = false
      })
    } else {
      console.warn('electronAPI not available')
    }
  },
  methods: {
    handleLogin() {
      console.log('Login clicked')
      // 发射登录事件到父组件
      this.$emit('show-login')
    },
    handleUserClick() {
      console.log('User info clicked')
      // 计算菜单位置（在用户按钮下方）
      if (this.$refs.userInfoBtn) {
        const rect = this.$refs.userInfoBtn.getBoundingClientRect()
        this.userMenuPosition = {
          top: rect.bottom + 8, // 按钮下方 8px
          right: window.innerWidth - rect.right // 右对齐
        }
      }
      // 切换菜单显示状态
      this.showUserMenu = !this.showUserMenu
    },
    handleEditProfile() {
      console.log('Edit profile clicked')
      // TODO: 实现编辑资料功能
      this.$emit('edit-profile')
    },
    handleSettings() {
      console.log('Settings clicked')
      this.$emit('open-settings')
    },
    handleLogout() {
      console.log('Logout clicked')
      this.$emit('logout')
    },
    minimizeWindow() {
      console.log('Minimize clicked')
      if (window.electronAPI) {
        window.electronAPI.minimize()
      }
    },
    toggleMaximize() {
      console.log('Toggle maximize clicked, current state:', this.isMaximized)
      if (window.electronAPI) {
        if (this.isMaximized) {
          window.electronAPI.unmaximize()
        } else {
          window.electronAPI.maximize()
        }
      }
    },
    closeWindow() {
      console.log('Close clicked')
      if (window.electronAPI) {
        window.electronAPI.close()
      }
    }
  }
}
</script>

<style scoped>
.title-bar {
  height: var(--titlebar-height);
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  user-select: none;
  position: relative;
  z-index: 9997;
  transition: all 0.3s ease;
}

/* 歌词模式：完全透明 */
.title-bar.lyric-mode {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.drag-area {
  flex: 1;
  height: 100%;
}

.window-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.control-btn {
  width: var(--titlebar-btn-width);
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--titlebar-icon-color);
  cursor: pointer;
  transition: all var(--transition-base);
}

.control-btn svg {
  transition: all var(--transition-base);
  transform: scale(1);
}

.control-btn .icon {
  width: 18px;
  height: 18px;
  transition: all var(--transition-base);
  transform: scale(1);
  filter: brightness(0) saturate(100%) invert(55%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(88%);
}

.control-btn:hover .icon {
  transform: scale(1.15);
  filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

.control-btn.close:hover {
  color: white;
}

.control-btn.close:hover .icon {
  transform: scale(1.2);
  filter: brightness(0) saturate(100%) invert(23%) sepia(98%) saturate(7426%) hue-rotate(356deg) brightness(93%) contrast(117%);
}

/* 登录按钮样式 */
.login-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0 var(--spacing-md);
  min-width: auto;
  width: auto;
}

.login-btn .icon {
  width: 16px;
  height: 16px;
}

.login-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: color var(--transition-base);
}

.login-btn:hover .login-text {
  color: var(--color-text);
}

.login-btn:hover .icon {
  transform: scale(1.1);
  filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-base);
  border-radius: var(--radius-sm);
  margin-right: var(--spacing-xs);
  -webkit-app-region: no-drag;
}

.user-info:hover {
  background: var(--titlebar-btn-hover);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-lighter);
  border: 2px solid var(--color-border);
  transition: all var(--transition-base);
}

.user-info:hover .user-avatar {
  border-color: var(--color-primary);
  transform: scale(1.05);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar .default-avatar {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-base);
}

.user-info:hover .user-name {
  color: var(--color-text);
}

/* 垂直分割线 */
.divider-vertical {
  width: 1px;
  height: 60%;
  background-color: var(--color-border);
  margin: 0 var(--spacing-sm);
}
</style>