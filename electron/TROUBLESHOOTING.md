# Electron 常见问题解决方案

## 当前已解决的问题

### 1. GPU 缓存错误
```
Unable to move the cache / Unable to create cache
```

**解决方案：**
- 在 `electron/main.js` 中添加了命令行开关来禁用缓存
- 在 `.gitignore` 中添加了缓存目录

### 2. DevTools Autofill 警告
```
Request Autofill.enable failed
```

**说明：**
- 这是 Electron 开发者工具的正常警告
- 不影响应用功能，可以安全忽略

## 其他可能的优化

### 如果仍然有 GPU 相关错误

取消注释 `electron/main.js` 中的这一行：
```javascript
app.disableHardwareAcceleration()
```

**注意：** 这会禁用硬件加速，可能影响性能，但可以解决 GPU 相关的错误。

### 完全禁用开发者工具警告

如果不需要开发者工具，可以在 `electron/main.js` 中移除或注释这一行：
```javascript
// mainWindow.webContents.openDevTools()
```

### 清理缓存

如果问题持续存在，可以手动清理 Electron 缓存：

**Windows:**
```powershell
Remove-Item -Recurse -Force "$env:APPDATA\betterkugou\*"
```

**macOS/Linux:**
```bash
rm -rf ~/Library/Application\ Support/betterkugou/*
```

## 性能优化建议

### 1. 减少内存占用
在 `electron/main.js` 中的 `webPreferences` 添加：
```javascript
webPreferences: {
  // ...existing options
  backgroundThrottling: false,
  offscreen: false
}
```

### 2. 优化启动速度
```javascript
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
app.commandLine.appendSwitch('disable-site-isolation-trials')
```

### 3. 减少日志输出
设置环境变量：
```powershell
$env:ELECTRON_ENABLE_LOGGING = 0
```

## 调试技巧

### 查看详细错误信息
```javascript
// 在 electron/main.js 顶部添加
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
```

### 监控内存使用
```javascript
setInterval(() => {
  const memoryUsage = process.memoryUsage()
  console.log('Memory:', Math.round(memoryUsage.heapUsed / 1024 / 1024), 'MB')
}, 10000)
```
