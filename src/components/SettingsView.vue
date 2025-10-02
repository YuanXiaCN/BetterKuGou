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
        <section class="settings-section" id="playback-section" ref="playback" data-section="playback">
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

  <section class="settings-section" id="download-section" ref="download" data-section="download">
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
              <button class="path-btn" type="button">更改目录</button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">默认缓存目录</div>
              <div class="setting-desc">临时缓存文件将存放在此目录</div>
            </div>
            <div class="setting-path">
              <input type="text" class="path-input" :value="localSettings.download.cachePath" readonly>
              <button class="path-btn" type="button">更改目录</button>
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

  <section class="settings-section" id="custom-section" ref="custom" data-section="custom">
          <header class="section-header">
            <h2 class="section-title">自定义功能</h2>
          </header>
          <div class="setting-actions">
            <button class="outline-btn" type="button">导出设置</button>
            <button class="outline-btn" type="button">导入设置</button>
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

  <section class="settings-section" id="shortcut-section" ref="shortcuts" data-section="shortcuts">
          <header class="section-header">
            <h2 class="section-title">快捷键</h2>
          </header>
          <div class="shortcut-grid">
            <div class="shortcut-card" v-for="shortcut in shortcuts" :key="shortcut.label">
              <div class="shortcut-label">{{ shortcut.label }}</div>
              <div class="shortcut-key">{{ shortcut.key }}</div>
            </div>
          </div>
        </section>

  <section class="settings-section" id="software-section" ref="software" data-section="software">
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
          </div>
          <div class="setting-item setting-item--center">
            <img class="software-logo" src="/logo.png" alt="BetterKugou Logo">
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  data() {
    return {
      sections: [
        { id: 'playback', label: '播放设置' },
        { id: 'download', label: '下载与缓存' },
        { id: 'custom', label: '自定义功能' },
        { id: 'shortcuts', label: '快捷键' },
        { id: 'software', label: '软件设置' }
      ],
      activeSection: 'playback',
      localSettings: {
        playback: {
          fullscreenLyrics: true,
          enqueueFullPlaylist: true
        },
        download: {
          downloadPath: 'C:/Users/BetterKugou/Downloads',
          cachePath: 'C:/Users/BetterKugou/AppData/Local/BetterKugou/Cache',
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
        }
      },
      containerPaddingTop: 0,
      scrollListener: null,
      resizeListener: null,
      scrollRafId: null,
      scrollContainer: null,
      shortcuts: [
        { label: '播放 / 暂停', key: 'Space' },
        { label: '下一首', key: 'Ctrl + →' },
        { label: '上一首', key: 'Ctrl + ←' },
        { label: '老板键', key: 'Ctrl + Alt + H' }
      ]
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.setupScrollTracking()
    })
  },
  beforeUnmount() {
    this.teardownScrollTracking()
  },
  computed: {
    cacheSizeOptions() {
      return [
        { value: 2048, label: '2048 MB' },
        { value: 4096, label: '4096 MB' },
        { value: 6144, label: '6144 MB' },
        { value: 8192, label: '8192 MB' },
        { value: 10240, label: '10240 MB' },
        { value: -1, label: '无限制' }
      ]
    },
    currentCacheSizeLabel() {
      const index = this.localSettings.download.cacheSizeIndex
      return this.cacheSizeOptions[index]?.label || '无限制'
    }
  },
  methods: {
    scrollToSection(sectionId) {
      this.activeSection = sectionId
      this.$nextTick(() => {
        const target = this.$refs[sectionId]
        const container = this.scrollContainer || this.$refs.settingsMain
        if (!target || !container) return

        const containerRect = container.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        const offset = targetRect.top - containerRect.top + container.scrollTop - this.containerPaddingTop

        container.scrollTo({ top: offset, behavior: 'smooth' })
      })
    },
    setupScrollTracking() {
      const localContainer = this.$refs.settingsMain
      if (!localContainer) return

      const scrollContainer = localContainer.closest('.main-content') || localContainer
      this.scrollContainer = scrollContainer

      const computedStyle = window.getComputedStyle(localContainer)
      this.containerPaddingTop = parseFloat(computedStyle.paddingTop) || 0

      this.scrollListener = () => {
        if (this.scrollRafId) {
          window.cancelAnimationFrame(this.scrollRafId)
        }
        this.scrollRafId = window.requestAnimationFrame(() => {
          this.updateActiveSection()
        })
      }

      scrollContainer.addEventListener('scroll', this.scrollListener, { passive: true })

      this.resizeListener = () => {
        this.updateActiveSection()
      }
      window.addEventListener('resize', this.resizeListener, { passive: true })

      this.updateActiveSection()
    },
    teardownScrollTracking() {
      if (this.scrollContainer && this.scrollListener) {
        this.scrollContainer.removeEventListener('scroll', this.scrollListener)
      }
      if (this.resizeListener) {
        window.removeEventListener('resize', this.resizeListener)
      }
      if (this.scrollRafId) {
        window.cancelAnimationFrame(this.scrollRafId)
        this.scrollRafId = null
      }
      this.scrollContainer = null
    },
    updateActiveSection() {
      const container = this.scrollContainer || this.$refs.settingsMain
      if (!container) return

      let closestId = null
      let closestDistance = Infinity

      this.sections.forEach(section => {
        const el = this.$refs[section.id]
        if (!el) return

        const containerRect = container.getBoundingClientRect()
        const targetRect = el.getBoundingClientRect()
        const relativeTop = targetRect.top - containerRect.top + container.scrollTop - this.containerPaddingTop
        const distance = Math.abs(relativeTop - container.scrollTop)

        if (distance < closestDistance) {
          closestDistance = distance
          closestId = section.id
        }
      })

      if (closestId) {
        this.activeSection = closestId
      }
    }
  }
}
</script>

<style scoped>
.settings-view {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  min-height: 0;
  padding: var(--spacing-xl);
  overflow: hidden;
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
  align-items: stretch;
  min-height: 0;
  gap: var(--spacing-xl);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-2xl);
}

.settings-sidebar {
  width: 260px;
  padding: var(--spacing-xl) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-xl);
  background: var(--color-background);
  border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  border-radius: calc(var(--radius-xl, 20px) * 1.1);
  box-shadow: 0 22px 55px rgba(15, 18, 32, 0.22);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  position: static;
  top: auto;
  height: auto;
  align-self: flex-start;
  overflow: hidden;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: calc(var(--radius-lg, 16px));
  background: color-mix(in srgb, var(--color-background) 65%, transparent);
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
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.sidebar-item:hover::before,
.sidebar-item.active::before {
  opacity: 1;
  transform: scaleY(1);
}

.sidebar-item.active {
  box-shadow: inset 4px 0 0 color-mix(in srgb, var(--color-primary) 65%, transparent);
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
  background: color-mix(in srgb, var(--color-background) 60%, transparent);
  border-radius: calc(var(--radius-lg, 16px));
}

.sidebar-logo img {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.35);
}

.sidebar-logo span {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-main {
  flex: 1;
  padding: var(--spacing-xl) var(--spacing-2xl);
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  background: var(--color-background-light);
  border-radius: calc(var(--radius-xl, 20px) * 1.05);
  border: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
  box-shadow: 0 24px 60px rgba(15, 18, 32, 0.18);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.settings-main::-webkit-scrollbar {
  width: 8px;
}

.settings-main::-webkit-scrollbar-track {
  background: var(--color-background);
}

.settings-main::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.settings-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl) calc(var(--spacing-xl) + 8px);
  border-radius: clamp(20px, var(--radius-xl, 22px) * 1.15, 32px);
  border: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
  background: var(--color-background-light);
  box-shadow: 0 25px 50px rgba(12, 18, 38, 0.18);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease, border-color 0.4s ease;
  z-index: 0;
}

.settings-section:hover {
  transform: translateY(-6px);
  box-shadow: 0 30px 65px rgba(16, 20, 40, 0.22);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: 999px;
  font-size: var(--font-size-lg);
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-text);
  margin: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.18) 0%, rgba(118, 75, 162, 0.28) 100%);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.section-title::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 0 16px rgba(102, 126, 234, 0.6);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-background-light);
  border: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
  border-radius: clamp(18px, var(--radius-lg, 18px) * 1.2, 28px);
  box-shadow: 0 12px 30px rgba(12, 18, 38, 0.12);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  position: relative;
  overflow: hidden;
  margin-bottom: var(--spacing-md);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.setting-item > * {
  position: relative;
  z-index: 1;
}
.setting-item:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
  box-shadow: 0 16px 36px rgba(12, 18, 38, 0.18);
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
  background: color-mix(in srgb, var(--color-background) 82%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  border-radius: calc(var(--radius-md, 14px));
  color: var(--color-text);
  font-size: var(--font-size-sm);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.path-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  white-space: nowrap;
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.35);
}

.path-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 14px 28px rgba(102, 126, 234, 0.42);
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
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%);
  border-radius: 999px;
  outline: none;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.setting-slider input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f7ff 0%, #dae0ff 100%);
  border: 3px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.setting-slider input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.08);
  box-shadow: 0 10px 24px rgba(102, 126, 234, 0.45);
}

.setting-slider input[type='range']::-moz-range-track {
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 0.6) 100%);
}

.setting-slider input[type='range']::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.6);
  background: linear-gradient(135deg, #f5f7ff 0%, #dae0ff 100%);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
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
  border: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
  border-radius: calc(var(--radius-md, 14px));
  background: color-mix(in srgb, var(--color-background) 85%, transparent);
  color: var(--color-text);
  font-size: var(--font-size-base);
  text-align: center;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.number-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
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
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.05) 0%, rgba(118, 75, 162, 0.08) 100%);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 10px 22px rgba(20, 24, 40, 0.15);
}

.outline-btn:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(102, 126, 234, 0.24);
}

.radio-group {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-background-light) 70%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 40%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
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
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.18) 0%, rgba(118, 75, 162, 0.22) 100%);
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
  border: 2px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
}

.radio-option__label {
  white-space: nowrap;
}

.radio-option:hover {
  transform: translateY(-1px);
}

.radio-option:hover .radio-option__dot {
  border-color: color-mix(in srgb, var(--color-primary) 45%, transparent);
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
  transform: scale(1.45);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.18), 0 12px 22px rgba(102, 126, 234, 0.25);
  background: radial-gradient(circle at center, #ffffff 0%, rgba(102, 126, 234, 0.6) 100%);
  animation: radio-pop 0.36s ease;
}

.radio-option input:checked + .radio-option__display .radio-option__label {
  transform: translateX(0);
}

@keyframes radio-pop {
  0% {
    transform: scale(0.6);
  }
  55% {
    transform: scale(1.35);
  }
  100% {
    transform: scale(1.1);
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
  background: rgba(102, 126, 234, 0.15);
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.shortcut-card {
  padding: var(--spacing-lg);
  background: color-mix(in srgb, var(--color-background-light) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border) 45%, transparent);
  border-radius: clamp(18px, var(--radius-lg, 18px) * 1.1, 26px);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  box-shadow: 0 14px 26px rgba(16, 20, 40, 0.16);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.shortcut-card:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.25);
}

.shortcut-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.shortcut-key {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.software-logo {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  box-shadow: 0 18px 36px rgba(102, 126, 234, 0.32);
  border: 2px solid rgba(255, 255, 255, 0.25);
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
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.18);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.35);
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
