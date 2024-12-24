/* eslint-disable @typescript-eslint/no-explicit-any */
import { Category, SavedLink } from '../types'

// 减小每个块的大小
const LINKS_PER_CHUNK = 20 // 从 100 减少到 20

// 压缩链接数据，只保存必要字段
const compressLink = (link: SavedLink): Partial<SavedLink> => ({
  id: link.id,
  title: link.title,
  url: link.url,
  categoryId: link.categoryId,
  isDocked: link.isDocked,
  icon: link.icon,
  // 不存储 timestamp，在加载时重新生成
})

// 还原链接数据
const decompressLink = (link: Partial<SavedLink>): SavedLink => ({
  ...link,
  id: link.id!,
  title: link.title!,
  url: link.url!,
  categoryId: link.categoryId!,
  isDocked: link.isDocked ?? false,
  timestamp: Date.now(), // 使用当前时间
  icon: link.icon
})

// 将链接数组分块
const chunkLinks = (links: SavedLink[]): Array<Partial<SavedLink>[]> => {
  const compressedLinks = links.map(compressLink)
  const chunks: Array<Partial<SavedLink>[]> = []
  for (let i = 0; i < compressedLinks.length; i += LINKS_PER_CHUNK) {
    chunks.push(compressedLinks.slice(i, i + LINKS_PER_CHUNK))
  }
  return chunks
}

// 保存链接
export const saveLinks = async (links: SavedLink[]) => {
  try {
    const chunks = chunkLinks(links)
    
    // 清理旧数据
    const oldResult = await chrome.storage.sync.get('links_count')
    const oldCount = oldResult.links_count || 0
    const oldKeys = Array.from({ length: oldCount }, (_, i) => `links_${i}`)
    await chrome.storage.sync.remove(oldKeys)

    // 分批保存新数据
    for (let i = 0; i < chunks.length; i++) {
      await chrome.storage.sync.set({
        [`links_${i}`]: chunks[i]
      })
    }

    // 保存分块数量
    await chrome.storage.sync.set({ links_count: chunks.length })
  } catch (error) {
    console.error('Save links error:', error)
    throw error
  }
}

// 加载链接
export const loadLinks = async (): Promise<SavedLink[]> => {
  try {
    const result = await chrome.storage.sync.get('links_count')
    const count = result.links_count || 0
    
    if (count === 0) return []
    
    const keys = Array.from({ length: count }, (_, i) => `links_${i}`)
    const chunks = await chrome.storage.sync.get(keys)
    
    return Object.values(chunks)
      .flat()
      .map(decompressLink)
      .sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Load links error:', error)
    return []
  }
}

// 保存分类
export const saveCategories = async (categories: Category[]) => {
  await chrome.storage.sync.set({ categories })
}

// 加载分类
export const loadCategories = async (): Promise<Category[]> => {
  const result = await chrome.storage.sync.get('categories')
  return result.categories || []
}

// 保存设置
export const saveSettings = async (settings: { 
  searchEngine?: string,
  backgroundColor?: string,
  backgroundImageUrl?: string
}) => {
  await chrome.storage.sync.set(settings)
}

// 加载设置
export const loadSettings = async () => {
  const result = await chrome.storage.sync.get([
    'searchEngine',
    'backgroundColor',
    'backgroundImageUrl'
  ])
  return {
    searchEngine: result.searchEngine || 'google',
    backgroundColor: result.backgroundColor || '#f0f2f5',
    backgroundImageUrl: result.backgroundImageUrl || ''
  }
}

// 导出所有数据
export const exportData = async () => {
  const [links, categories, settings] = await Promise.all([
    loadLinks(),
    loadCategories(),
    loadSettings()
  ])

  return {
    links,
    categories,
    settings,
    exportTime: new Date().toISOString(),
    version: '1.0.0'  // 数据版本号，用于后续兼容性处理
  }
}

// 验证数据格式
const validateImportData = (data: any) => {
  // 基本结构检查
  if (!data || typeof data !== 'object') {
    throw new Error('无效的数据格式')
  }

  // 检查必要字段
  if (!Array.isArray(data.links) || !Array.isArray(data.categories)) {
    throw new Error('缺少必要的数据字段')
  }

  // 验证分类数据
  data.categories = data.categories.map((category: any) => ({
    id: category.id || String(Date.now()),
    name: category.name || '未命名分类',
    icon: category.icon || 'FolderOutlined',
    isHome: Boolean(category.isHome),
    color: category.color || '#55998b'
  }))

  // 验证链接数据
  data.links = data.links.map((link: any) => ({
    id: link.id || String(Date.now()),
    title: link.title || '未命名链接',
    url: link.url || '#',
    categoryId: link.categoryId || 'home',
    timestamp: link.timestamp || Date.now(),
    isDocked: Boolean(link.isDocked),
    icon: link.icon || ''
  }))

  // 确保有首页分类
  if (!data.categories.some((c: any) => c.isHome)) {
    data.categories.unshift({
      id: 'home',
      name: '首页',
      icon: 'HomeOutlined',
      isHome: true
    })
  }

  return data
}

// 修改导入数据函数
export const importData = async (data: any) => {
  try {
    // 验证和清理数据
    const validatedData = validateImportData(data)
    console.log("❗️ ~ importData ~ validatedData:", validatedData);

    // 保存所有数据
    await Promise.all([
      saveLinks(validatedData.links),
      saveCategories(validatedData.categories),
      saveSettings({
        searchEngine: validatedData.settings?.searchEngine || 'google',
        backgroundColor: validatedData.settings?.backgroundColor || '#f0f2f5',
        backgroundImageUrl: validatedData.settings?.backgroundImageUrl || ''
      })
    ])

    return true
  } catch (error) {
    console.error('Import data error:', error)
    throw error
  }
} 