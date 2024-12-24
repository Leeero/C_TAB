import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { rm } from 'fs/promises'
import archiver from 'archiver'

const execAsync = promisify(exec)

async function testBuild() {
  try {
    // 1. 清理之前的构建
    console.log('Cleaning previous builds...')
    await rm('dist', { recursive: true, force: true })
    await rm('c-tab.zip', { force: true })

    // 2. 构建扩展
    console.log('Building extension...')
    await execAsync('npm run build:extension')

    // 3. 创建 zip
    console.log('Creating zip file...')
    const output = createWriteStream(join(process.cwd(), 'c-tab.zip'))
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    output.on('close', () => {
      console.log(`✅ Archive created: ${archive.pointer()} total bytes`)
      console.log('Build completed successfully!')
    })

    archive.on('error', (err) => {
      throw err
    })

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Warning:', err)
      } else {
        throw err
      }
    })

    archive.pipe(output)
    archive.directory('dist/', false)
    await archive.finalize()

  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

testBuild() 