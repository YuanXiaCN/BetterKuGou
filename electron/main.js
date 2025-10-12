// 引入 Electron 模块
const { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell, Tray, Menu, nativeImage } = require('electron')
// 解决 Windows 控制台中文/emoji 乱码: 尝试切换到 UTF-8 代码页 (仅开发态且是 win32)
if (process.platform === 'win32' && !process.env.BK_SKIP_CHCP && !app.isPackaged) {
  try {
    const { execSync } = require('child_process')
    execSync('chcp 65001 >NUL')
    process.env.BK_CONSOLE_UTF8 = '1'
  } catch (_) {
    // 忽略
  }
}
const path = require('path')
const { spawn } = require('child_process')
const {
  initSettingsStore,
  getSettings,
  setSettings,
  getDefaultSettings,
  getDefaultPaths,
  onSettingsChange,
  exportSettings,
  importSettings,
  ensureCacheDirectory
} = require('./settingsStore')

// 检查是否在开发环境中（手动检测，避免 ESM 依赖问题）
const isDev = !app.isPackaged

// 禁用 GPU 缓存以避免权限错误
app.commandLine.appendSwitch('disable-http-cache')
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// 禁用硬件加速（可选，如果仍有 GPU 相关错误）
// app.disableHardwareAcceleration()

let mainWindow
let loadingWindow = null
let desktopLyricWindow = null
let backendProcess = null
let tray = null
// 当前播放信息(由渲染进程通过 IPC 推送)
let currentTrack = {
  title: '暂无播放',
  cover: null // 可以是文件路径或 dataURL/base64
}
let isPlaying = false
// 桌面歌词与灵动岛歌词
let desktopLyricEnabled = false
let islandLyricEnabled = false
// 若窗口尚未准备好, 暂存需要发送的播放器控制指令
const pendingPlayerControls = []

function broadcastPlayerControl(action) {
  const wins = BrowserWindow.getAllWindows().filter(w => !w.isDestroyed())
  if (wins.length === 0) {
    pendingPlayerControls.push(action)
    console.log('🕒 窗口未就绪, 已缓存控制指令:', action)
    return
  }
  console.log('📤 广播播放器控制指令:', action)
  wins.forEach(w => w.webContents.send('player:control', action))
}

function resolveIcon(p) {
  if (!p) return null
  try {
    if (p.startsWith('data:')) {
      return nativeImage.createFromDataURL(p)
    }
    return nativeImage.createFromPath(p)
  } catch (e) {
    return null
  }
}

function getAppTrayIcon() {
  // 开发与生产路径不同
  const devIcon = path.join(__dirname, 'logo.png')
  if (isDev) return devIcon
  // 生产时放在 resources 根目录或 app.asar.unpacked 内, 这里尝试多个
  const candidates = [
    path.join(process.resourcesPath, 'logo.png'),
    path.join(process.resourcesPath, 'assets/logo.png'),
    devIcon
  ]
  for (const c of candidates) {
    try { if (require('fs').existsSync(c)) return c } catch (_) {}
  }
  return devIcon
}

function updateTrayMenu() {
  if (!tray) return
  const coverImg = resolveIcon(currentTrack.cover) || nativeImage.createFromPath(getAppTrayIcon())
  // 缩小封面
  const albumImg = coverImg.isEmpty() ? null : coverImg.resize({ width: 16, height: 16 })
  const playPauseLabel = isPlaying ? '暂停' : '播放'
  const desktopLyricLabel = `${desktopLyricEnabled ? '禁用' : '启用'}桌面歌词`
  const islandLyricLabel = `${islandLyricEnabled ? '禁用' : '启用'}灵动岛歌词`

  const contextMenu = Menu.buildFromTemplate([
    { label: currentTrack.title, icon: albumImg, enabled: false, tooltip: currentTrack.title },
    { type: 'separator' },
    { label: playPauseLabel, click: () => {
        broadcastPlayerControl(isPlaying ? 'pause' : 'play')
      }
    },
    { label: '上一首', click: () => { broadcastPlayerControl('prev') } },
    { label: '下一首', click: () => { broadcastPlayerControl('next') } },
    { type: 'separator' },
    { label: desktopLyricLabel, click: () => {
        console.log('🎵 托盘菜单：桌面歌词切换')
        if (desktopLyricEnabled && desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
          console.log('🎵 关闭桌面歌词窗口')
          desktopLyricWindow.close()
          desktopLyricEnabled = false
        } else {
          console.log('🎵 打开桌面歌词窗口')
          createDesktopLyricWindow()
          desktopLyricEnabled = true
        }
        updateTrayMenu()
      }
    },
    { label: islandLyricLabel, click: () => {
        islandLyricEnabled = !islandLyricEnabled
        updateTrayMenu()
      }
    },
    { type: 'separator' },
    { label: '显示主界面', click: () => {
        if (!mainWindow) {
          createWindow()
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.show(); mainWindow.focus()
        }
      }
    },
    { label: '退出应用', click: () => { 
        // 强制退出应用，无视托盘设置
        app.quit() 
      } 
    }
  ])
  tray.setContextMenu(contextMenu)
  tray.setToolTip(`BetterKugou\n${currentTrack.title}${isPlaying ? '' : ' (已暂停)'}`)
}

function createTray() {
  if (tray) return tray
  const iconPath = getAppTrayIcon()
  tray = new Tray(iconPath)
  tray.on('click', () => {
    // 左键单击显示/隐藏窗口
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show(); mainWindow.focus()
      }
    } else {
      createWindow()
    }
  })
  updateTrayMenu()
  return tray
}

// 创建桌面歌词窗口
function createDesktopLyricWindow() {
  if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
    return desktopLyricWindow
  }
  
  console.log('🎵 创建桌面歌词窗口...')
  
  desktopLyricWindow = new BrowserWindow({
    width: 800,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: false, // 防止抢夺焦点
    show: false, // 创建时先不显示
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    }
  })

  // 加载桌面歌词HTML文件
  const desktopLyricPath = path.join(__dirname, 'desktopLyric.html')
  desktopLyricWindow.loadFile(desktopLyricPath)

  // 窗口事件处理
  desktopLyricWindow.on('closed', () => {
    console.log('🎵 桌面歌词窗口已关闭')
    desktopLyricWindow = null
    desktopLyricEnabled = false
    updateTrayMenu()
  })

  desktopLyricWindow.on('ready-to-show', () => {
    console.log('🎵 桌面歌词窗口准备就绪')
    desktopLyricWindow.show()
    // 发送当前歌曲信息和歌词数据
    if (currentTrack.title !== '暂无播放') {
      desktopLyricWindow.webContents.send('desktop-lyric:song-update', currentTrack)
    }
  })

  // 开发环境下打开调试工具
  if (isDev) {
    desktopLyricWindow.webContents.openDevTools()
  }

  desktopLyricEnabled = true
  updateTrayMenu()
  
  return desktopLyricWindow
}
// 存储已注册的全局快捷键映射: accelerator -> action
const registeredShortcuts = new Map()
// 内存清理定时器
let memoryCleanupTimer = null

// 创建加载窗口
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  loadingWindow.loadFile(path.join(__dirname, 'loading.html'))
  
  loadingWindow.on('closed', () => {
    loadingWindow = null
  })

  return loadingWindow
}

// 更新加载进度
function updateLoadingProgress(progress, status, step) {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.send('loading-progress', {
      progress,
      status,
      step
    })
  }
}

// 关闭加载窗口
function closeLoadingWindow() {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.close()
    loadingWindow = null
  }
}

// 内存清理函数
function performMemoryCleanup() {
  console.log('🧹 执行内存清理...')
  
  try {
    // 获取清理前的内存使用情况
    const beforeMemory = process.memoryUsage()
    console.log('清理前内存使用:', {
      rss: `${(beforeMemory.rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(beforeMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(beforeMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(beforeMemory.external / 1024 / 1024).toFixed(2)} MB`
    })
    
    // 主进程垃圾回收
    if (global.gc) {
      global.gc()
      console.log('✅ 主进程 GC 已执行')
    } else {
      console.log('⚠️ 主进程 GC 不可用 (需要使用 --expose-gc 标志启动)')
    }
    
    // 清理所有窗口的渲染进程内存
    const allWindows = BrowserWindow.getAllWindows()
    allWindows.forEach((window, index) => {
      if (!window.isDestroyed()) {
        // 触发渲染进程的垃圾回收
        window.webContents.session.clearCache()
        
        // 通知渲染进程执行内存清理
        window.webContents.send('memory-cleanup')
        
        console.log(`✅ 窗口 ${index + 1} 内存清理已触发`)
      }
    })
    
    // 获取清理后的内存使用情况
    setTimeout(() => {
      const afterMemory = process.memoryUsage()
      const savedMemory = (beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024
      
      console.log('清理后内存使用:', {
        rss: `${(afterMemory.rss / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(afterMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        external: `${(afterMemory.external / 1024 / 1024).toFixed(2)} MB`
      })
      
      if (savedMemory > 0) {
        console.log(`💾 释放了约 ${savedMemory.toFixed(2)} MB 内存`)
      }
    }, 1000)
    
  } catch (error) {
    console.error('❌ 内存清理失败:', error)
  }
}

// 启动内存清理定时器
function startMemoryCleanup() {
  // 每30分钟执行一次内存清理
  const CLEANUP_INTERVAL = 30 * 60 * 1000 // 30分钟
  
  console.log('🔧 启动内存自动清理功能 (每30分钟)')
  
  // 清除已存在的定时器
  if (memoryCleanupTimer) {
    clearInterval(memoryCleanupTimer)
  }
  
  // 设置新的定时器
  memoryCleanupTimer = setInterval(() => {
    performMemoryCleanup()
  }, CLEANUP_INTERVAL)
  
  // 启动后1小时执行首次清理
  setTimeout(() => {
    console.log('⏰ 首次定时内存清理')
    performMemoryCleanup()
  }, 60 * 60 * 1000) // 1小时后
}

// 停止内存清理定时器
function stopMemoryCleanup() {
  if (memoryCleanupTimer) {
    clearInterval(memoryCleanupTimer)
    memoryCleanupTimer = null
    console.log('🛑 内存自动清理已停止')
  }
}

// 启动后端服务器
function startBackendServer() {
  updateLoadingProgress(10, '正在启动后端服务...', 'backend')
  
  let backendPath, backendCwd, nodeExecutable
  
  if (isDev) {
    // 开发环境 - 使用系统Node.js
    backendPath = path.join(__dirname, '../KuGouMusicApi/app.js')
    backendCwd = path.join(__dirname, '../KuGouMusicApi')
    nodeExecutable = 'node'
  } else {
    // 生产环境 - 使用内置Node.js
    backendPath = path.join(process.resourcesPath, 'backend/app.js')
    backendCwd = path.join(process.resourcesPath, 'backend')
    nodeExecutable = path.join(process.resourcesPath, 'nodejs/node.exe')
  }
  
  console.log('🚀 启动后端服务器...')
  console.log('📁 后端文件路径:', backendPath)
  console.log('📁 工作目录:', backendCwd)
  console.log('🔧 环境:', isDev ? '开发环境' : '生产环境')
  console.log('💻 Node.js可执行文件:', nodeExecutable)
  
  // 检查文件是否存在
  const fs = require('fs')
  if (!fs.existsSync(backendPath)) {
    console.error('❌ 错误: 后端文件不存在:', backendPath)
    console.error('💡 解决方案: 请检查后端文件是否正确打包')
    return
  }
  
  if (!fs.existsSync(backendCwd)) {
    console.error('❌ 错误: 后端目录不存在:', backendCwd)
    return
  }
  
  // 检查Node.js可执行文件
  if (!fs.existsSync(nodeExecutable) && !isDev) {
    console.error('❌ 错误: 内置Node.js不存在:', nodeExecutable)
    console.error('💡 解决方案: 应用可能未正确打包，请重新构建')
    return
  }
  
  console.log('✅ 后端文件验证成功')
  
  // 验证Node.js
  const { execSync } = require('child_process')
  try {
    let nodeVersion
    if (isDev) {
      nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim()
    } else {
      nodeVersion = execSync(`"${nodeExecutable}" --version`, { encoding: 'utf8' }).trim()
    }
    console.log('✅ Node.js版本:', nodeVersion)
    console.log('🎯 使用:', isDev ? '系统Node.js' : '内置Node.js运行时')
  } catch (error) {
    console.error('❌ 错误: Node.js验证失败:', error.message)
    if (isDev) {
      console.error('💡 解决方案: 请在系统中安装Node.js')
    } else {
      console.error('💡 解决方案: 内置Node.js损坏，请重新安装应用')
    }
    return
  }
  
  // 设置环境变量，指定端口为6500
  const env = { ...process.env, PORT: '6500', HOST: 'localhost' }
  
  console.log('🔄 正在启动Node.js进程...')
  console.log('📝 启动命令:', `"${nodeExecutable}" "${backendPath}"`)
  console.log('📁 工作目录:', backendCwd)
  console.log('🌍 环境变量:', { PORT: env.PORT, HOST: env.HOST, NODE_ENV: env.NODE_ENV })
  
  // 在开发环境中，直接使用'node'让系统从PATH查找
  // 在生产环境中，使用绝对路径
  const absoluteNodePath = isDev ? nodeExecutable : path.resolve(nodeExecutable)
  const absoluteBackendPath = path.resolve(backendPath)
  
  console.log('📍 Node路径:', absoluteNodePath)
  console.log('📍 Backend路径:', absoluteBackendPath)
  
  backendProcess = spawn(absoluteNodePath, [absoluteBackendPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: backendCwd,
    env: env
  })
  
  backendProcess.stdout.on('data', (data) => {
    const message = data.toString().trim()
    console.log(`📤 [后端输出] ${message}`)
    
    // 检查关键启动信息
    if (message.includes('listening') || message.includes('started') || message.includes('6500')) {
      console.log('✅ 后端服务器启动成功！')
      updateLoadingProgress(40, '后端服务已启动', 'backend')
      // 发送成功通知到渲染进程
      if (mainWindow) {
        mainWindow.webContents.send('backend-status', { status: 'running', port: 6500 })
      }
    }
  })
  
  backendProcess.stderr.on('data', (data) => {
    const error = data.toString().trim()
    console.error(`📥 [后端错误] ${error}`)
    
    // 提供常见错误的解决方案
    if (error.includes('EADDRINUSE')) {
      console.error('💡 解决方案: 端口6500已被占用，请关闭占用端口的程序')
    } else if (error.includes('Cannot find module')) {
      console.error('💡 解决方案: 后端依赖缺失，请重新构建应用')
    } else if (error.includes('ENOENT')) {
      console.error('💡 解决方案: Node.js或文件未找到，请确保系统已安装Node.js')
    }
  })
  
  backendProcess.on('close', (code) => {
    console.log(`🔚 后端进程退出，退出代码: ${code}`)
    if (code !== 0) {
      console.error('❌ 后端异常退出')
    }
    backendProcess = null
  })
  
  backendProcess.on('error', (err) => {
    console.error('❌ 启动后端进程失败:', err)
    console.error('📝 错误详情:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      path: err.path,
      syscall: err.syscall,
      spawnfile: err.spawnfile
    })
    
    // 针对常见错误提供解决方案
    if (err.code === 'ENOENT') {
      console.error('💡 解决方案: Node.js可执行文件未找到')
      if (isDev) {
        console.error('🔍 开发环境: 请确保系统已安装Node.js并添加到PATH环境变量')
        console.error('🔍 使用命令:', nodeExecutable)
      } else {
        console.error('🔍 生产环境: 请检查路径:', nodeExecutable)
        // 尝试备用启动方式
        tryAlternativeBackendStart()
      }
    } else if (err.code === 'EACCES') {
      console.error('💡 解决方案: 权限不足，请以管理员身份运行')
    }
    
    // 发送错误通知到渲染进程
    if (mainWindow) {
      mainWindow.webContents.send('backend-status', { status: 'error', error: err.message })
    }
  })
  
  // 检查后端是否启动成功
  setTimeout(() => {
    if (backendProcess && backendProcess.pid) {
      console.log('🎯 后端进程启动成功，PID:', backendProcess.pid)
      updateLoadingProgress(60, '后端进程运行中...', 'backend')
      // 测试后端连接
      testBackendConnection()
    } else {
      console.error('❌ 后端进程启动失败')
      updateLoadingProgress(30, '后端启动失败', 'backend')
      // 尝试备用启动方式
      tryAlternativeBackendStart()
    }
  }, 2000)
}

// 备用后端启动方式
function tryAlternativeBackendStart() {
  console.log('🔄 尝试备用启动方式...')
  
  if (isDev) {
    console.log('开发环境，跳过备用启动')
    return
  }
  
  const { exec } = require('child_process')
  const nodeExe = path.join(process.resourcesPath, 'nodejs/node.exe')
  const backendApp = path.join(process.resourcesPath, 'backend/app.js')
  
  // 使用exec命令启动
  const command = `"${nodeExe}" "${backendApp}"`
  console.log('🔧 备用命令:', command)
  
  const alternativeProcess = exec(command, {
    cwd: path.join(process.resourcesPath, 'backend'),
    env: { ...process.env, PORT: '6500', HOST: 'localhost' }
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ 备用启动也失败:', error)
      return
    }
    console.log('📤 备用启动输出:', stdout)
    if (stderr) console.error('📥 备用启动错误:', stderr)
  })
  
  alternativeProcess.stdout.on('data', (data) => {
    console.log('📤 [备用后端] ' + data.toString().trim())
  })
  
  alternativeProcess.stderr.on('data', (data) => {
    console.error('📥 [备用后端错误] ' + data.toString().trim())
  })
}

// 测试后端连接
function testBackendConnection() {
  console.log('🔍 测试后端连接...')
  updateLoadingProgress(70, '后端服务就绪', 'backend')
  
  setTimeout(() => {
    const http = require('http')
    const options = {
      hostname: 'localhost',
      port: 6500,
      path: '/',
      method: 'GET',
      timeout: 5000
    }
    
    const req = http.request(options, (res) => {
      console.log('✅ 后端连接测试成功，状态码:', res.statusCode)
      if (mainWindow) {
        mainWindow.webContents.send('backend-status', { status: 'connected', port: 6500 })
      }
    })
    
    req.on('error', (err) => {
      console.error('❌ 后端连接测试失败:', err.message)
      if (mainWindow) {
        mainWindow.webContents.send('backend-status', { status: 'disconnected', error: err.message })
      }
    })
    
    req.on('timeout', () => {
      console.error('⏱️  后端连接超时')
      req.destroy()
    })
    
    req.end()
  }, 1000)
}

// 停止后端服务器
function stopBackendServer() {
  if (backendProcess) {
    console.log('正在关闭后端服务器...')
    backendProcess.kill('SIGTERM')
    backendProcess = null
  }
}

// 创建浏览器窗口
function createWindow() {
  updateLoadingProgress(75, '正在加载前端界面...', 'frontend')
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 480,
    frame: false,
    show: false, // 先不显示,等加载完成后再显示
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // 禁用开发者工具中的某些功能以减少警告
      devTools: isDev
    }
  })

  // 监听窗口最大化/还原事件，通知渲染进程
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-is-maximized')
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-is-unmaximized')
  })

  // 加载应用的URL或本地文件
  const urlLocation = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(urlLocation)

  // 页面加载完成后的处理
  mainWindow.webContents.on('did-finish-load', () => {
    updateLoadingProgress(90, '准备就绪', 'login')
    // 冲刷之前缓存的播放器控制指令
    if (pendingPlayerControls.length) {
      console.log('🚀 发送缓存的播放器控制指令: ', pendingPlayerControls)
      pendingPlayerControls.splice(0).forEach(action => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('player:control', action)
        }
      })
    }
    
    // 立即显示主窗口并关闭加载窗口
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show()
        mainWindow.focus()
      }
      closeLoadingWindow()
      
      // 启动内存自动清理
      startMemoryCleanup()
    }, 300)
  })

  // 在开发环境中打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // 窗口关闭时的处理
  mainWindow.on('close', (event) => {
    // 检查设置，决定是隐藏到托盘还是真正关闭
    const settings = getSettings()
    if (settings.software?.minimizeToTray) {
      // 阻止默认关闭行为
      event.preventDefault()
      // 隐藏窗口到托盘
      mainWindow.hide()
      console.log('🔽 应用已最小化到系统托盘')
    }
    // 如果设置为false，则允许正常关闭
  })
  
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪时创建窗口
app.whenReady().then(async () => {
  // 首先创建加载窗口
  createLoadingWindow()
  updateLoadingProgress(5, '正在初始化...', 'backend')
  // 创建系统托盘
  createTray()
  
  try {
    await initSettingsStore(app)
    await ensureCacheDirectory()
    updateLoadingProgress(15, '配置加载完成', 'backend')
  } catch (err) {
    console.error('❌ 初始化设置存储失败:', err)
  }

  onSettingsChange((nextSettings) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('settings:updated', nextSettings)
    })
  })

  // 启动后端服务器
  startBackendServer()
  
  // 立即创建主窗口(不等待后端完全启动)
  setTimeout(() => {
    createWindow()
  }, 1500)

  // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，通常会重新创建一个窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 窗口控制相关 ipcMain 事件
ipcMain.on('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.minimize()
})
ipcMain.on('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win && !win.isMaximized()) win.maximize()
})
ipcMain.on('window-unmaximize', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win && win.isMaximized()) win.unmaximize()
})
ipcMain.on('window-close', () => {
  const win = BrowserWindow.getFocusedWindow()
  if (win) {
    // 检查设置，决定是隐藏到托盘还是真正关闭
    const settings = getSettings()
    if (settings.software?.minimizeToTray) {
      // 隐藏窗口到托盘
      win.hide()
      console.log('🔽 应用已最小化到系统托盘')
    } else {
      // 正常关闭
      win.close()
    }
  }
})

// 设置相关 IPC 事件
ipcMain.handle('settings:get', async () => {
  return getSettings()
})

ipcMain.handle('settings:get-defaults', async () => {
  return getDefaultSettings()
})

ipcMain.handle('settings:get-default-paths', async () => {
  return getDefaultPaths()
})

ipcMain.handle('settings:set', async (_event, payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid settings payload')
  }
  const updated = await setSettings(payload, { merge: false })
  await ensureCacheDirectory()
  return updated
})

ipcMain.handle('settings:export', async (_event, targetPath) => {
  if (!targetPath) {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: '导出设置',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: 'BetterKugouSettings.json'
    })
    if (canceled || !filePath) {
      return { canceled: true }
    }
    await exportSettings(filePath)
    return { canceled: false, path: filePath }
  }
  await exportSettings(targetPath)
  return { canceled: false, path: targetPath }
})

ipcMain.handle('settings:import', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '导入设置',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (canceled || !filePaths || filePaths.length === 0) {
    return { canceled: true }
  }
  const imported = await importSettings(filePaths[0])
  await ensureCacheDirectory()
  return { canceled: false, settings: imported }
})

ipcMain.handle('settings:choose-directory', async (_event, options = {}) => {
  const dialogOptions = {
    title: options.title || '选择文件夹',
    defaultPath: options.defaultPath || undefined,
    properties: ['openDirectory', 'createDirectory', 'promptToCreate']
  }
  if (options.message) {
    dialogOptions.message = options.message
  }
  if (options.buttonLabel) {
    dialogOptions.buttonLabel = options.buttonLabel
  }

  const result = await dialog.showOpenDialog(dialogOptions)
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { canceled: true }
  }
  return { canceled: false, path: result.filePaths[0] }
})

// 全局快捷键相关 IPC 事件
ipcMain.handle('shortcut:register', async (_event, accelerator, action) => {
  try {
    console.log(`🎹 注册全局快捷键: ${accelerator} -> ${action}`)
    
    // 检查快捷键格式是否有效
    if (!accelerator || typeof accelerator !== 'string') {
      console.error('❌ 无效的快捷键格式:', accelerator)
      return { success: false, error: 'Invalid accelerator format' }
    }
    
    // 如果快捷键已经注册,先注销
    if (registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator)
      console.log(`🔄 已注销旧的快捷键: ${accelerator}`)
    }
    
    // 尝试注册全局快捷键
    const success = globalShortcut.register(accelerator, () => {
      console.log(`⚡ 全局快捷键触发: ${accelerator} -> ${action}`)
      // 向渲染进程发送快捷键触发事件
      const allWindows = BrowserWindow.getAllWindows()
      allWindows.forEach(win => {
        win.webContents.send('shortcut:triggered', action)
      })
    })
    
    if (success) {
      registeredShortcuts.set(accelerator, action)
      console.log(`✅ 全局快捷键注册成功: ${accelerator}`)
      return { success: true }
    } else {
      console.error(`❌ 全局快捷键注册失败: ${accelerator}`)
      return { success: false, error: 'Failed to register shortcut' }
    }
  } catch (err) {
    console.error(`❌ 注册快捷键异常: ${accelerator}`, err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('shortcut:unregister', async (_event, accelerator) => {
  try {
    console.log(`🗑️  注销全局快捷键: ${accelerator}`)
    
    if (registeredShortcuts.has(accelerator)) {
      globalShortcut.unregister(accelerator)
      registeredShortcuts.delete(accelerator)
      console.log(`✅ 快捷键注销成功: ${accelerator}`)
      return { success: true }
    } else {
      console.log(`⚠️  快捷键未注册: ${accelerator}`)
      return { success: true, warning: 'Shortcut was not registered' }
    }
  } catch (err) {
    console.error(`❌ 注销快捷键异常: ${accelerator}`, err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('shortcut:test', async (_event, accelerator) => {
  try {
    // 测试快捷键是否可以注册(不实际注册)
    console.log(`🧪 测试快捷键: ${accelerator}`)
    
    if (!accelerator || typeof accelerator !== 'string') {
      return { canRegister: false, error: 'Invalid accelerator format' }
    }
    
    // 检查是否已被其他应用占用
    const isRegistered = globalShortcut.isRegistered(accelerator)
    
    if (isRegistered && !registeredShortcuts.has(accelerator)) {
      // 被其他应用占用
      console.log(`⚠️  快捷键已被占用: ${accelerator}`)
      return { canRegister: false, error: 'Shortcut is already registered by another application' }
    }
    
    console.log(`✅ 快捷键可用: ${accelerator}`)
    return { canRegister: true }
  } catch (err) {
    console.error(`❌ 测试快捷键异常: ${accelerator}`, err)
    return { canRegister: false, error: err.message }
  }
})

// 外部链接打开处理器
ipcMain.handle('open-external', async (_event, url) => {
  try {
    console.log(`🌐 打开外部链接: ${url}`)
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('❌ 打开外部链接失败:', error)
    return { success: false, error: error.message }
  }
})

// 桌面歌词相关 IPC 事件处理
ipcMain.handle('desktop-lyric:toggle', async () => {
  try {
    console.log('🎵 桌面歌词切换操作...')
    if (desktopLyricEnabled && desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
      console.log('🎵 关闭桌面歌词窗口')
      desktopLyricWindow.close()
      desktopLyricEnabled = false
    } else {
      console.log('🎵 打开桌面歌词窗口')
      createDesktopLyricWindow()
      desktopLyricEnabled = true
    }
    updateTrayMenu()
    return desktopLyricEnabled
  } catch (error) {
    console.error('❌ 桌面歌词切换失败:', error)
    return false
  }
})

ipcMain.handle('desktop-lyric:show', async () => {
  try {
    console.log('🎵 显示桌面歌词')
    if (!desktopLyricWindow || desktopLyricWindow.isDestroyed()) {
      createDesktopLyricWindow()
    } else {
      desktopLyricWindow.show()
    }
    desktopLyricEnabled = true
    updateTrayMenu()
    return true
  } catch (error) {
    console.error('❌ 显示桌面歌词失败:', error)
    return false
  }
})

ipcMain.handle('desktop-lyric:hide', async () => {
  try {
    console.log('🎵 隐藏桌面歌词')
    if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
      desktopLyricWindow.close()
    }
    desktopLyricEnabled = false
    updateTrayMenu()
    return true
  } catch (error) {
    console.error('❌ 隐藏桌面歌词失败:', error)
    return false
  }
})

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 注销所有全局快捷键
  console.log('🗑️  注销所有全局快捷键...')
  globalShortcut.unregisterAll()
  registeredShortcuts.clear()
  
  // 停止内存清理定时器
  stopMemoryCleanup()
  
  // 关闭桌面歌词窗口
  if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
    console.log('🗑️  关闭桌面歌词窗口...')
    desktopLyricWindow.close()
    desktopLyricWindow = null
  }
  
  // 关闭后端服务器
  stopBackendServer()
  if (tray) {
    try { tray.destroy() } catch (_) {}
    tray = null
  }
  
  // 在 macOS 上，除非用户明确退出，否则应用及其菜单栏会保持活动状态
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前的清理
app.on('before-quit', () => {
  // 注销所有全局快捷键
  console.log('🗑️  应用退出前清理快捷键...')
  globalShortcut.unregisterAll()
  registeredShortcuts.clear()
  
  // 停止内存清理定时器
  stopMemoryCleanup()
  
  // 关闭桌面歌词窗口
  if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
    console.log('🗑️  应用退出前关闭桌面歌词窗口...')
    desktopLyricWindow.close()
    desktopLyricWindow = null
  }
  
  stopBackendServer()
  if (tray) {
    try { tray.destroy() } catch (_) {}
    tray = null
  }
})

// 应用失去焦点时的处理(可选,用于调试)
app.on('browser-window-blur', () => {
  console.log('📴 应用失去焦点 (全局快捷键仍然有效)')
})

app.on('browser-window-focus', () => {
  console.log('📳 应用获得焦点')
})

// ============ 播放器相关 IPC (供渲染进程调用) ============
// 更新当前歌曲信息: { title, cover }
ipcMain.on('player:track-update', (_event, payload) => {
  if (payload && typeof payload === 'object') {
    if (typeof payload.title === 'string') currentTrack.title = payload.title || '未知歌曲'
    if (payload.cover) currentTrack.cover = payload.cover
    if (typeof payload.artist === 'string') currentTrack.artist = payload.artist
    updateTrayMenu()
    
    // 转发歌曲信息到桌面歌词窗口
    if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
      console.log('🎵 转发歌曲信息到桌面歌词:', payload)
      desktopLyricWindow.webContents.send('desktop-lyric:song-update', payload)
    }
  }
})

// 更新播放状态: playing | paused
ipcMain.on('player:playback-state', (_event, state) => {
  isPlaying = state === 'playing'
  updateTrayMenu()
})

// 接收并转发歌词数据
ipcMain.on('player:lyric-update', (_event, lyrics) => {
  console.log('📡 主进程接收到歌词数据:', lyrics ? lyrics.length : 0, '行')
  if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
    console.log('🎵 转发歌词数据到桌面歌词窗口')
    desktopLyricWindow.webContents.send('desktop-lyric:lyric-update', lyrics)
  }
})

// 接收并转发播放时间
ipcMain.on('player:time-update', (_event, time) => {
  if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
    // 减少日志频率，避免刷屏
    if (typeof time === 'number' && Math.floor(time / 1000) % 5 === 0) {
      console.log('⏱️ 转发播放时间到桌面歌词:', Math.floor(time / 1000) + 's')
    }
    desktopLyricWindow.webContents.send('desktop-lyric:time-update', time)
  }
})

// 桌面歌词窗口内部事件处理
ipcMain.on('desktop-lyric:close', () => {
  console.log('🎵 桌面歌词请求关闭')
  if (desktopLyricWindow && !desktopLyricWindow.isDestroyed()) {
    desktopLyricWindow.close()
  }
})

ipcMain.on('desktop-lyric:size-changed', (_event, size) => {
  console.log('🎵 桌面歌词字体大小变更:', size)
  // 这里可以保存到设置中
})

ipcMain.on('desktop-lyric:theme-changed', (_event, theme) => {
  console.log('🎵 桌面歌词主题变更:', theme)
  // 这里可以保存到设置中
})
