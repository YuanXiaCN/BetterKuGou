<template>
  <teleport to="body">
    <div 
      v-if="visible" 
      ref="menu"
      class="context-menu"
      :style="menuStyle"
      @click.stop
      @contextmenu.prevent
    >
      <div 
        v-for="(item, index) in items" 
        :key="index"
        :class="['menu-item', { 'divider': item.divider, 'disabled': item.disabled }]"
        @click="handleItemClick(item)"
      >
        <template v-if="!item.divider">
          <svg v-if="item.icon" class="menu-icon" viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
            <path :d="item.icon"/>
          </svg>
          <span class="menu-label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
        </template>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: 'ContextMenu',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      adjustedPosition: { x: 0, y: 0 }
    }
  },
  computed: {
    menuStyle() {
      return {
        left: this.adjustedPosition.x + 'px',
        top: this.adjustedPosition.y + 'px'
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.adjustMenuPosition()
        })
      }
    },
    position: {
      handler() {
        if (this.visible) {
          this.$nextTick(() => {
            this.adjustMenuPosition()
          })
        }
      },
      deep: true
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside)
    window.addEventListener('resize', this.handleClickOutside)
    window.addEventListener('scroll', this.handleClickOutside, true)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
    window.removeEventListener('resize', this.handleClickOutside)
    window.removeEventListener('scroll', this.handleClickOutside, true)
  },
  methods: {
    handleItemClick(item) {
      if (!item.divider && !item.disabled && item.action) {
        item.action()
        this.$emit('close')
      }
    },
    handleClickOutside(event) {
      // 如果点击的是菜单内部，不关闭
      if (this.$el && this.$el.contains(event.target)) {
        return
      }
      this.$emit('close')
    },
    adjustMenuPosition() {
      if (!this.$refs.menu) {
        this.adjustedPosition = { ...this.position }
        return
      }

      const menu = this.$refs.menu
      const menuRect = menu.getBoundingClientRect()
      const menuWidth = menuRect.width || 180 // 默认宽度
      const menuHeight = menuRect.height || 200 // 默认高度
      
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      let x = this.position.x
      let y = this.position.y
      
      // 检查右边界
      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10 // 留10px边距
      }
      
      // 检查左边界
      if (x < 0) {
        x = 10
      }
      
      // 检查下边界
      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10 // 留10px边距
      }
      
      // 检查上边界
      if (y < 0) {
        y = 10
      }
      
      this.adjustedPosition = { x, y }
    }
  }
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  min-width: 180px;
  background: rgba(30, 30, 30, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  padding: 4px;
  z-index: 10000;
  backdrop-filter: blur(10px);
  animation: menuFadeIn 0.15s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  border-radius: 4px;
  transition: all 0.15s ease;
  gap: 10px;
  user-select: none;
}

.menu-item:not(.divider):not(.disabled):hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-item.divider {
  height: 1px;
  padding: 0;
  margin: 4px 8px;
  background: rgba(255, 255, 255, 0.1);
  cursor: default;
}

.menu-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

.menu-label {
  flex: 1;
  white-space: nowrap;
}

.menu-shortcut {
  font-size: 11px;
  opacity: 0.5;
  margin-left: auto;
}
</style>
