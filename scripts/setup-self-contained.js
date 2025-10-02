const fs = require('fs-extra')
const path = require('path')
const https = require('https')
const { exec, execSync } = require('child_process')
const { pipeline } = require('stream')
const { promisify } = require('util')
const streamPipeline = promisify(pipeline)

// Node.js 版本配置
const NODE_VERSION = '20.18.0' // LTS 版本
const NODE_PLATFORM = 'win-x64' // Windows 64位
const NODE_DOWNLOAD_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${NODE_PLATFORM}.zip`

async function downloadAndSetupNodejs() {
  try {
    console.log('🚀 开始创建完全自包含的BetterKugou应用...')
    console.log('📦 Node.js版本:', NODE_VERSION)
    console.log('💻 目标平台:', NODE_PLATFORM)
    
    const projectRoot = path.join(__dirname, '..')
    const resourcesDir = path.join(projectRoot, 'resources')
    const nodeDir = path.join(resourcesDir, 'nodejs')
    const nodeZipPath = path.join(resourcesDir, `node-v${NODE_VERSION}-${NODE_PLATFORM}.zip`)
    
    // 确保资源目录存在
    await fs.ensureDir(resourcesDir)
    await fs.ensureDir(nodeDir)
    
    // 检查是否已经下载过
    if (await fs.pathExists(path.join(nodeDir, 'node.exe'))) {
      console.log('✅ Node.js运行时已存在，跳过下载')
    } else {
      console.log('⬇️  正在下载Node.js运行时...')
      console.log('🔗 下载链接:', NODE_DOWNLOAD_URL)
      
      // 下载Node.js
      await downloadFile(NODE_DOWNLOAD_URL, nodeZipPath)
      console.log('✅ Node.js下载完成')
      
      // 解压Node.js
      console.log('📂 正在解压Node.js...')
      await extractZip(nodeZipPath, resourcesDir)
      
      // 移动文件到正确位置
      const extractedDir = path.join(resourcesDir, `node-v${NODE_VERSION}-${NODE_PLATFORM}`)
      if (await fs.pathExists(extractedDir)) {
        console.log('📁 正在整理Node.js文件...')
        await fs.copy(extractedDir, nodeDir)
        await fs.remove(extractedDir)
      }
      
      // 清理下载的zip文件
      await fs.remove(nodeZipPath)
      
      console.log('✅ Node.js运行时设置完成')
    }
    
    // 验证Node.js安装
    const nodeExePath = path.join(nodeDir, 'node.exe')
    if (await fs.pathExists(nodeExePath)) {
      console.log('🔍 验证Node.js安装...')
      
      try {
        const version = execSync(`"${nodeExePath}" --version`, { encoding: 'utf8' }).trim()
        console.log('✅ Node.js版本:', version)
        
        const npmPath = path.join(nodeDir, 'npm.cmd')
        if (await fs.pathExists(npmPath)) {
          const npmVersion = execSync(`"${npmPath}" --version`, { encoding: 'utf8' }).trim()
          console.log('✅ npm版本:', npmVersion)
        }
      } catch (error) {
        console.error('❌ Node.js验证失败:', error.message)
        throw error
      }
    } else {
      throw new Error('Node.js可执行文件不存在')
    }
    
    // 现在设置后端
    console.log('🔧 正在设置后端...')
    await setupBackend(nodeDir)
    
    console.log('🎉 完全自包含应用准备完成!')
    console.log('📊 资源统计:')
    
    // 计算各部分大小
    const nodeSize = await getDirSize(nodeDir)
    const backendDir = path.join(projectRoot, 'backend')
    const backendSize = await fs.pathExists(backendDir) ? await getDirSize(backendDir) : 0
    
    console.log(`   • Node.js运行时: ${(nodeSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   • 后端应用: ${(backendSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   • 总计: ${((nodeSize + backendSize) / 1024 / 1024).toFixed(2)} MB`)
    
  } catch (error) {
    console.error('❌ 设置自包含应用失败:', error)
    process.exit(1)
  }
}

// 下载文件
async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination)
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject)
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，状态码: ${response.statusCode}`))
        return
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10)
      let downloadedSize = 0
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length
        if (totalSize) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1)
          process.stdout.write(`\r⬇️  下载进度: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`)
        }
      })
      
      response.pipe(file)
      
      file.on('finish', () => {
        file.close()
        console.log('\n✅ 下载完成')
        resolve()
      })
      
      file.on('error', (err) => {
        fs.unlink(destination, () => {})
        reject(err)
      })
    }).on('error', reject)
  })
}

// 解压ZIP文件
async function extractZip(zipPath, extractDir) {
  return new Promise((resolve, reject) => {
    // 使用PowerShell解压（Windows内置）
    const command = `powershell -command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('解压错误:', error)
        reject(error)
        return
      }
      
      if (stderr) {
        console.log('解压警告:', stderr)
      }
      
      console.log('✅ 解压完成')
      resolve()
    })
  })
}

// 设置后端
async function setupBackend(nodeDir) {
  console.log('📋 正在配置后端...')
  
  const projectRoot = path.join(__dirname, '..')
  
  // 先运行便携版后端脚本
  console.log('🔧 运行便携版后端脚本...')
  await new Promise((resolve, reject) => {
    exec('node scripts/create-portable-backend.js', { cwd: projectRoot }, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      console.log(stdout)
      if (stderr) console.log(stderr)
      resolve()
    })
  })
  
  console.log('✅ 后端配置完成')
}

// 计算目录大小
async function getDirSize(dir) {
  let size = 0
  
  try {
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
  } catch (error) {
    console.warn('计算目录大小时出错:', dir, error.message)
  }
  
  return size
}

// 运行脚本
if (require.main === module) {
  downloadAndSetupNodejs()
}