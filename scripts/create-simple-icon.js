const fs = require('fs')
const path = require('path')

// 创建一个简单的32x32像素的ICO文件结构
// 这是一个最基础的ICO文件，包含一个蓝色正方形图标

const icoHeader = Buffer.from([
  0x00, 0x00, // Reserved
  0x01, 0x00, // Type (1 = ICO)
  0x01, 0x00  // Number of images
])

const iconDirEntry = Buffer.from([
  32,    // Width
  32,    // Height  
  0x00,  // Color count
  0x00,  // Reserved
  0x01, 0x00, // Color planes
  0x20, 0x00, // Bits per pixel (32)
  0x80, 0x02, 0x00, 0x00, // Size of image data (640 bytes)
  0x16, 0x00, 0x00, 0x00  // Offset to image data
])

// 创建一个简单的32x32蓝色图标的位图数据
const bitmapInfoHeader = Buffer.from([
  0x28, 0x00, 0x00, 0x00, // Header size (40)
  0x20, 0x00, 0x00, 0x00, // Width (32)
  0x40, 0x00, 0x00, 0x00, // Height (64 = 32*2 for icon)
  0x01, 0x00,             // Planes
  0x20, 0x00,             // Bits per pixel (32)
  0x00, 0x00, 0x00, 0x00, // Compression
  0x00, 0x00, 0x00, 0x00, // Image size
  0x00, 0x00, 0x00, 0x00, // X pixels per meter
  0x00, 0x00, 0x00, 0x00, // Y pixels per meter
  0x00, 0x00, 0x00, 0x00, // Colors used
  0x00, 0x00, 0x00, 0x00  // Important colors
])

// 创建像素数据 (32x32 pixels, BGRA format)
const pixelData = Buffer.alloc(32 * 32 * 4)
for (let i = 0; i < 32 * 32; i++) {
  const offset = i * 4
  // 创建一个蓝紫色渐变图标
  const x = i % 32
  const y = Math.floor(i / 32)
  
  // 渐变色计算
  const centerX = 16, centerY = 16
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
  const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2)
  const factor = Math.max(0, 1 - distance / maxDistance)
  
  // BGRA format
  pixelData[offset] = Math.floor(234 * factor + 50)     // B
  pixelData[offset + 1] = Math.floor(126 * factor + 30) // G  
  pixelData[offset + 2] = Math.floor(180 * factor + 75) // R
  pixelData[offset + 3] = Math.floor(255 * factor)      // A
}

// AND掩码 (全透明)
const andMask = Buffer.alloc(32 * 32 / 8)

// 合并所有部分
const icoData = Buffer.concat([
  icoHeader,
  iconDirEntry,
  bitmapInfoHeader,
  pixelData,
  andMask
])

// 保存文件
const iconPath = path.join(__dirname, '../public/icon.ico')
fs.writeFileSync(iconPath, icoData)

console.log('简单ICO图标已创建:', iconPath)
console.log('图标大小:', icoData.length, 'bytes')