const fs = require('fs-extra')
const path = require('path')

async function copyBackendSimple() {
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
    
    // 复制后端文件（不安装依赖）
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
        
        if (shouldSkip && relativePath !== '') {
          console.log('跳过:', relativePath)
        }
        return !shouldSkip
      }
    })
    
    console.log('后端文件复制完成!')
    console.log('')
    console.log('⚠️  重要提示:')
    console.log('请手动在 backend 目录执行以下命令安装后端依赖:')
    console.log('cd backend && npm install --production')
    console.log('或者直接运行 npm run install-backend-deps')
    
  } catch (error) {
    console.error('复制后端文件失败:', error)
    process.exit(1)
  }
}

copyBackendSimple()