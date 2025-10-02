const path = require('path')
const { spawn, exec } = require('child_process')
const fs = require('fs')

// 测试内置Node.js和后端
async function testSelfContained() {
  console.log('🧪 测试自包含版本的后端启动...')
  
  // 模拟生产环境路径
  const baseResourcesPath = path.join(__dirname, '../dist-electron/win-unpacked/resources')
  const nodeExe = path.join(baseResourcesPath, 'nodejs/node.exe')
  const backendPath = path.join(baseResourcesPath, 'backend/app.js')
  const backendCwd = path.join(baseResourcesPath, 'backend')
  
  console.log('📁 资源基础路径:', baseResourcesPath)
  console.log('💻 Node.js路径:', nodeExe)
  console.log('🖥️  后端文件路径:', backendPath)
  console.log('📁 工作目录:', backendCwd)
  
  // 检查文件存在性
  console.log('\n🔍 检查文件存在性...')
  
  if (!fs.existsSync(nodeExe)) {
    console.error('❌ Node.js可执行文件不存在:', nodeExe)
    return
  }
  console.log('✅ Node.js可执行文件存在')
  
  if (!fs.existsSync(backendPath)) {
    console.error('❌ 后端文件不存在:', backendPath)
    return
  }
  console.log('✅ 后端文件存在')
  
  if (!fs.existsSync(backendCwd)) {
    console.error('❌ 后端目录不存在:', backendCwd)
    return
  }
  console.log('✅ 后端目录存在')
  
  // 测试Node.js版本
  console.log('\n🔍 测试Node.js版本...')
  try {
    const { execSync } = require('child_process')
    const version = execSync(`"${nodeExe}" --version`, { encoding: 'utf8' }).trim()
    console.log('✅ Node.js版本:', version)
  } catch (error) {
    console.error('❌ Node.js版本测试失败:', error.message)
    return
  }
  
  // 检查后端依赖
  console.log('\n🔍 检查后端依赖...')
  const packageJsonPath = path.join(backendCwd, 'package.json')
  const nodeModulesPath = path.join(backendCwd, 'node_modules')
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    console.log('✅ package.json存在，依赖数量:', Object.keys(packageJson.dependencies || {}).length)
  }
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('✅ node_modules存在')
  } else {
    console.error('❌ node_modules不存在')
    return
  }
  
  // 测试启动后端
  console.log('\n🚀 测试启动后端服务器...')
  
  return new Promise((resolve) => {
    const backendProcess = spawn(nodeExe, [backendPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: backendCwd,
      env: { ...process.env, PORT: '6500', HOST: 'localhost' }
    })
    
    let hasOutput = false
    let startupTimer = setTimeout(() => {
      if (!hasOutput) {
        console.error('⏱️  启动超时 (10秒)')
        backendProcess.kill()
        resolve(false)
      }
    }, 10000)
    
    backendProcess.stdout.on('data', (data) => {
      hasOutput = true
      const message = data.toString().trim()
      console.log('📤 [后端输出]', message)
      
      if (message.includes('listening') || message.includes('started') || message.includes('6500')) {
        console.log('✅ 后端服务器启动成功！')
        clearTimeout(startupTimer)
        
        // 测试连接
        setTimeout(() => {
          testConnection().then(() => {
            backendProcess.kill()
            resolve(true)
          })
        }, 2000)
      }
    })
    
    backendProcess.stderr.on('data', (data) => {
      hasOutput = true
      console.error('📥 [后端错误]', data.toString().trim())
    })
    
    backendProcess.on('error', (err) => {
      console.error('❌ 进程启动失败:', err)
      clearTimeout(startupTimer)
      resolve(false)
    })
    
    backendProcess.on('close', (code) => {
      console.log('🔚 后端进程结束，退出代码:', code)
      clearTimeout(startupTimer)
      if (!hasOutput) {
        resolve(false)
      }
    })
  })
}

// 测试连接
function testConnection() {
  return new Promise((resolve) => {
    console.log('🔍 测试HTTP连接到 localhost:6500...')
    
    const http = require('http')
    const req = http.request({
      hostname: 'localhost',
      port: 6500,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      console.log('✅ 连接成功！状态码:', res.statusCode)
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        console.log('📄 响应内容长度:', data.length, '字符')
        resolve(true)
      })
    })
    
    req.on('error', (err) => {
      console.error('❌ 连接失败:', err.message)
      resolve(false)
    })
    
    req.on('timeout', () => {
      console.error('⏱️  连接超时')
      req.destroy()
      resolve(false)
    })
    
    req.end()
  })
}

// 主函数
async function main() {
  console.log('🧪 BetterKugou 自包含版本测试')
  console.log('='.repeat(50))
  
  const result = await testSelfContained()
  
  console.log('\n' + '='.repeat(50))
  if (result) {
    console.log('🎉 测试成功！自包含版本工作正常')
  } else {
    console.log('❌ 测试失败！需要检查配置')
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testSelfContained, testConnection }