const fs = require('fs-extra')
const path = require('path')
const { exec, execSync } = require('child_process')

async function createPortableBackend() {
  try {
    console.log('🚀 创建便携版后端...')
    
    const sourceDir = path.join(__dirname, '../KuGouMusicApi')
    const targetDir = path.join(__dirname, '../backend')
    
    console.log('📁 源目录:', sourceDir)
    console.log('📁 目标目录:', targetDir)
    
    // 检查源目录是否存在
    if (!fs.existsSync(sourceDir)) {
      console.error('❌ 后端源目录不存在:', sourceDir)
      process.exit(1)
    }
    
    // 清空目标目录
    if (fs.existsSync(targetDir)) {
      console.log('🧹 清理旧的后端文件...')
      await fs.remove(targetDir)
    }
    
    // 创建目标目录
    await fs.ensureDir(targetDir)
    
    // 复制后端文件
    console.log('📋 正在复制后端文件...')
    await fs.copy(sourceDir, targetDir, {
      filter: (src) => {
        const relativePath = path.relative(sourceDir, src)
        const shouldSkip = relativePath.startsWith('node_modules') || 
                          relativePath.startsWith('.git') ||
                          relativePath.endsWith('.log') ||
                          relativePath.endsWith('.tmp') ||
                          relativePath.includes('bin/') ||
                          relativePath.includes('.DS_Store') ||
                          relativePath.includes('test/') ||
                          relativePath.includes('tests/')
        
        return !shouldSkip
      }
    })
    
    console.log('✅ 后端文件复制完成!')
    
    // 检查并创建简化的 package.json
    const packageJsonPath = path.join(targetDir, 'package.json')
    const packageJson = require(packageJsonPath)
    
    // 保留所有必需的依赖（基于原始KuGouMusicApi项目）
    const productionDeps = {
      "express": packageJson.dependencies.express || "^4.18.2",
      "axios": packageJson.dependencies.axios || "^1.1.3",
      "pako": packageJson.dependencies.pako || "^2.1.0",
      "qrcode": packageJson.dependencies.qrcode || "^1.5.3",
      "safe-decode-uri-component": packageJson.dependencies["safe-decode-uri-component"] || "^1.2.1",
      "dotenv": packageJson.dependencies.dotenv || "^16.4.5"
    }
    
    // 更新 package.json
    const newPackageJson = {
      ...packageJson,
      dependencies: productionDeps,
      devDependencies: {},
      scripts: {
        start: "node app.js"
      }
    }
    
    await fs.writeJson(packageJsonPath, newPackageJson, { spaces: 2 })
    console.log('📦 已优化 package.json')
    
    // 安装依赖
    console.log('⬇️ 正在安装后端依赖...')
    await new Promise((resolve, reject) => {
      const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
      const args = ['install', '--production', '--no-audit', '--no-fund']
      
      console.log('📝 执行命令:', command, args.join(' '))
      console.log('📁 工作目录:', targetDir)
      
      const child = exec(`${command} ${args.join(' ')}`, { 
        cwd: targetDir,
        env: { ...process.env, NODE_ENV: 'production' }
      })
      
      child.stdout.on('data', (data) => {
        console.log('📤 npm:', data.toString().trim())
      })
      
      child.stderr.on('data', (data) => {
        console.error('📥 npm错误:', data.toString().trim())
      })
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 后端依赖安装完成!')
          resolve()
        } else {
          console.error('❌ 依赖安装失败，退出代码:', code)
          reject(new Error(`npm install failed with code ${code}`))
        }
      })
      
      child.on('error', (err) => {
        console.error('❌ 执行npm命令失败:', err)
        reject(err)
      })
    })
    
    // 验证关键文件
    const keyFiles = ['app.js', 'server.js', 'package.json']
    for (const file of keyFiles) {
      const filePath = path.join(targetDir, file)
      if (!fs.existsSync(filePath)) {
        console.error(`❌ 关键文件缺失: ${file}`)
        process.exit(1)
      }
    }
    
    // 检查 node_modules
    const nodeModulesPath = path.join(targetDir, 'node_modules')
    if (!fs.existsSync(nodeModulesPath)) {
      console.error('❌ node_modules 目录不存在')
      process.exit(1)
    }
    
    const stats = fs.statSync(nodeModulesPath)
    console.log('📊 node_modules 大小:', (await getDirSize(nodeModulesPath) / 1024 / 1024).toFixed(2), 'MB')
    
    console.log('🎉 便携版后端创建完成!')
    console.log('📋 包含的主要依赖:')
    Object.keys(productionDeps).forEach(dep => {
      console.log(`   • ${dep}: ${productionDeps[dep]}`)
    })
    
  } catch (error) {
    console.error('❌ 创建便携版后端失败:', error)
    process.exit(1)
  }
}

// 计算目录大小
async function getDirSize(dir) {
  let size = 0
  const items = await fs.readdir(dir)
  
  for (const item of items) {
    const itemPath = path.join(dir, item)
    const stat = await fs.stat(itemPath)
    
    if (stat.isDirectory()) {
      size += await getDirSize(itemPath)
    } else {
      size += stat.size
    }
  }
  
  return size
}

createPortableBackend()