import { exec } from 'child_process'
import { watch } from 'fs'
import { copyFile, mkdir } from 'fs/promises'
import { resolve } from 'path'

const DIST_DIR = 'dist'
const SRC_DIR = 'src'

// 确保目录存在
async function ensureDirectories() {
  try {
    await mkdir(DIST_DIR, { recursive: true })
    await mkdir(resolve(DIST_DIR, 'assets'), { recursive: true })
  } catch (err) {
    console.error('Error creating directories:', err)
  }
}

// 复制文件到 dist 目录
async function copyFiles() {
  try {
    await ensureDirectories()
    
    // 复制文件
    await Promise.all([
      copyFile('public/manifest.json', resolve(DIST_DIR, 'manifest.json')),
      copyFile('public/popup.html', resolve(DIST_DIR, 'popup.html')),
      // 如果有其他文件需要复制，在这里添加
    ])
    
    console.log('Files copied to dist/')
  } catch (err) {
    console.error('Error copying files:', err)
  }
}

// 监听文件变化
function setupWatchers() {
  // 监听 public 目录下的特定文件
  const publicFiles = ['manifest.json', 'popup.html']
  publicFiles.forEach(file => {
    const filePath = resolve('public', file)
    watch(filePath, async (eventType) => {
      if (eventType === 'change') {
        await copyFiles()
      }
    })
  })

  // 监听 src 目录
  try {
    watch(SRC_DIR, { recursive: true }, async (eventType, filename) => {
      if (filename && filename.endsWith('.css') && eventType === 'change') {
        console.log('CSS file changed:', filename)
        await copyFiles()
      }
    })
  } catch (err) {
    console.error('Error watching src directory:', err)
  }
}

// 启动 vite build --watch
const buildProcess = exec('npm run dev:extension')
buildProcess.stdout?.pipe(process.stdout)
buildProcess.stderr?.pipe(process.stderr)

// 初始化
async function init() {
  try {
    await ensureDirectories()
    await copyFiles()
    setupWatchers()
    console.log('Development server started...')
  } catch (err) {
    console.error('Initialization error:', err)
  }
}

init()

// 处理进程退出
process.on('SIGINT', () => {
  buildProcess.kill()
  process.exit()
}) 