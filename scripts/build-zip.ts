import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { createWriteStream } from 'fs'
import archiver from 'archiver'

const execAsync = promisify(exec)

async function buildZip() {
  try {
    // 1. 构建项目
    console.log('Building project...')
    await execAsync('npm run build')

    // 2. 创建 zip
    console.log('Creating zip file...')
    const output = createWriteStream(join(__dirname, '../c-tab.zip'))
    const archive = archiver('zip', {
      zlib: { level: 9 } // 最高压缩级别
    })

    output.on('close', () => {
      console.log(`Archive created: ${archive.pointer()} total bytes`)
    })

    archive.on('error', (err) => {
      throw err
    })

    archive.pipe(output)

    // 3. 添加构建文件到 zip
    archive.directory('dist/', false)

    await archive.finalize()
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildZip() 