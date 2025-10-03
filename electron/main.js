// 引入 Electron 模块
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
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
let backendProcess = null

// 启动后端服务器
function startBackendServer() {
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
      // 测试后端连接
      testBackendConnection()
    } else {
      console.error('❌ 后端进程启动失败')
      // 尝试备用启动方式
      tryAlternativeBackendStart()
    }
  }, 3000)
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
  }, 2000) // 等待2秒后测试连接
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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
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

  // 在开发环境中打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // 窗口关闭时的处理
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 应用准备就绪时创建窗口
app.whenReady().then(async () => {
  try {
    await initSettingsStore(app)
    await ensureCacheDirectory()
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
  
  // 等待一下让后端启动
  setTimeout(() => {
    createWindow()
  }, 2000)

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
  if (win) win.close()
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

// 当所有窗口都关闭时退出应用
app.on('window-all-closed', () => {
  // 关闭后端服务器
  stopBackendServer()
  
  // 在 macOS 上，除非用户明确退出，否则应用及其菜单栏会保持活动状态
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前的清理
app.on('before-quit', () => {
  stopBackendServer()
})