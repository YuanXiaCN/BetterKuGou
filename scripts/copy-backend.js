const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')

async function copyBackend() {
  try {
    const sourceDir = path.join(__dirname, '../KuGouMusicApi')
    const targetDir = path.join(__dirname, '../backend')
    
    console.log('源目录:', sourceDir)
    console.log('目标目录:', targetDir)
    
    // 检查源目录是否存在
    if (!fs.existsSync(sourceDir)) {
      console.error('后端源目录不存在:', sourceDir)
      process.exit(1)
    }
    
    // 清空目标目录
    if (fs.existsSync(targetDir)) {
      console.log('清理旧的后端文件...')
      await fs.remove(targetDir)
    }
    
    // 创建目标目录
    await fs.ensureDir(targetDir)
    
    // 复制后端文件
    console.log('正在复制后端文件...')
    await fs.copy(sourceDir, targetDir, {
      filter: (src) => {
        // 过滤掉不需要的文件和目录
        const relativePath = path.relative(sourceDir, src)
        const shouldSkip = relativePath.startsWith('node_modules') || 
                          relativePath.startsWith('.git') ||
                          relativePath.endsWith('.log') ||
                          relativePath.endsWith('.tmp') ||
                          relativePath.includes('bin/') ||
                          relativePath.includes('.DS_Store')
        
        if (shouldSkip) {
          console.log('跳过:', relativePath)
        }
        return !shouldSkip
      }
    })
    
    console.log('后端文件复制完成!')
    console.log('正在安装后端依赖...')
    
    // 安装后端依赖
    await new Promise((resolve, reject) => {
      const command = 'npm install --production --no-audit'
      
      console.log('执行命令:', command)
      console.log('工作目录:', targetDir)
      
      exec(command, { cwd: targetDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('安装依赖出错:', error)
          reject(error)
          return
        }
        
        if (stderr) {
          console.log('npm stderr:', stderr)
        }
        
        if (stdout) {
          console.log('npm stdout:', stdout)
        }
        
        console.log('后端依赖安装完成!')
        resolve()
      })
    })
    
  } catch (error) {
    console.error('复制后端文件失败:', error)
    process.exit(1)
  }
}

copyBackend()