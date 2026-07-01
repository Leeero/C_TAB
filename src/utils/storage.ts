/* eslint-disable @typescript-eslint/no-explicit-any */
import { Category, SavedLink } from '../types'

// ── 常量 ─────────────────────────────────────────────
const CHUNK_SIZE_LIMIT = 7000  // chrome.storage.sync 每项上限 8192，留 1KB 余量
const BACKUP_KEY = 'links_backup'

// ── 压缩 / 解压 ──────────────────────────────────────
const compressLink = (link: SavedLink): Partial<SavedLink> => ({
  id: link.id,
  title: link.title,
  url: link.url,
  categoryId: link.categoryId,
  isDocked: link.isDocked,
  icon: link.icon,
  order: link.order,
  timestamp: link.timestamp,
  description: link.description,
  tags: link.tags,
})

const decompressLink = (link: Partial<SavedLink>): SavedLink => ({
  id: link.id!,
  title: link.title!,
  url: link.url!,
  categoryId: link.categoryId!,
  timestamp: link.timestamp || Date.now(),
  isDocked: link.isDocked ?? false,
  icon: link.icon,
  order: link.order,
  description: link.description,
  tags: link.tags,
})

// ── 分块工具（按大小自动分块，防止单个 chunk 超限）───
const chunkLinks = (links: SavedLink[]): Array<Partial<SavedLink>[]> => {
  const compressed = links.map(compressLink)
  const chunks: Array<Partial<SavedLink>[]> = []
  let current: Partial<SavedLink>[] = []

  for (const link of compressed) {
    current.push(link)
    // 检查当前 chunk 的序列化大小
    if (JSON.stringify(current).length > CHUNK_SIZE_LIMIT) {
      // 弹出最后一条，单独处理
      current.pop()
      if (current.length > 0) chunks.push(current)
      current = [link]
    }
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

// ── 数据备份（写入 chrome.storage.local，不受 sync 限额影响）──
const backupLinks = async (links: SavedLink[]) => {
  try {
    const compressed = links.map(compressLink)
    await chrome.storage.local.set({ [BACKUP_KEY]: compressed })
  } catch {
    // 备份失败不影响主流程
  }
}

const restoreFromBackup = async (): Promise<SavedLink[]> => {
  try {
    // 1. 先检查新的备份 key
    const backup1 = await chrome.storage.local.get('ctab_backup_links')
    if (Array.isArray(backup1.ctab_backup_links) && backup1.ctab_backup_links.length > 0) {
      return backup1.ctab_backup_links.map(decompressLink)
    }

    // 2. 检查预写快照（最近一次写入前的备份）
    const snapshot = await chrome.storage.local.get('ctab_pre_write_snapshot')
    if (Array.isArray(snapshot.ctab_pre_write_snapshot) && snapshot.ctab_pre_write_snapshot.length > 0) {
      console.warn('从预写快照恢复链接数据')
      return snapshot.ctab_pre_write_snapshot.map(decompressLink)
    }

    // 3. 再检查旧的备份 key
    const backup2 = await chrome.storage.local.get(BACKUP_KEY)
    const data = backup2[BACKUP_KEY]
    if (Array.isArray(data) && data.length > 0) {
      return data.map(decompressLink)
    }
  } catch {
    // 忽略
  }
  return []
}

// ── 保存链接（先写后删，防止中途出错丢数据）─────────
export const saveLinks = async (links: SavedLink[]) => {
  try {
    // 0. 写入前备份快照（用于灾难恢复）
    try {
      const oldResult = await chrome.storage.sync.get('links_count')
      const oldCount = oldResult.links_count || 0
      if (oldCount > 0) {
        const oldKeys = Array.from({ length: oldCount }, (_, i) => `links_${i}`)
        const oldChunks = await chrome.storage.sync.get(oldKeys)
        const oldLinks = Object.values(oldChunks).flat()
        if (Array.isArray(oldLinks) && oldLinks.length > 0) {
          await chrome.storage.local.set({ ctab_pre_write_snapshot: oldLinks })
        }
      }
    } catch {
      // 快照失败不影响主流程
    }

    const chunks = chunkLinks(links)

    // 1. 获取旧分块数量
    const oldResult = await chrome.storage.sync.get('links_count')
    const oldCount = oldResult.links_count || 0

    // 2. 先写入所有新分块
    const newChunkKeys: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      const key = `links_${i}`
      newChunkKeys.push(key)
      await chrome.storage.sync.set({ [key]: chunks[i] })
    }

    // 3. 更新分块计数
    await chrome.storage.sync.set({ links_count: chunks.length })

    // 4. 删除多余的旧分块（新数量 < 旧数量时）
    if (oldCount > chunks.length) {
      const staleKeys = Array.from(
        { length: oldCount - chunks.length },
        (_, i) => `links_${chunks.length + i}`
      )
      await chrome.storage.sync.remove(staleKeys)
    }

    // 5. 异步备份到 local storage（不受 sync 限额约束）
    await backupLinks(links)
  } catch (error) {
    console.error('Save links error:', error)
    throw error
  }
}

// ── 加载链接（含 fallback 到备份数据）────────────────
export const loadLinks = async (): Promise<SavedLink[]> => {
  try {
    const result = await chrome.storage.sync.get('links_count')
    const count = result.links_count || 0

    if (count === 0) {
      // 尝试从备份恢复
      const backup = await restoreFromBackup()
      if (backup.length > 0) {
        console.warn('从备份恢复链接数据')
        await saveLinks(backup)
      }
      return backup
    }

    const keys = Array.from({ length: count }, (_, i) => `links_${i}`)
    const chunks = await chrome.storage.sync.get(keys)

    return Object.values(chunks)
      .flat()
      .map(decompressLink)
      .sort((a, b) => {
        if (a.categoryId === b.categoryId) {
          return (a.order ?? 0) - (b.order ?? 0)
        }
        return b.timestamp - a.timestamp
      })
  } catch (error) {
    console.error('Load links error:', error)
    // 尝试从备份恢复
    return restoreFromBackup()
  }
}

// ── 分类 ─────────────────────────────────────────────
export const saveCategories = async (categories: Category[]) => {
  await chrome.storage.sync.set({ categories })
}

export const loadCategories = async (): Promise<Category[]> => {
  const result = await chrome.storage.sync.get('categories')
  return result.categories || []
}

// ── 设置 ─────────────────────────────────────────────
export const saveSettings = async (settings: {
  searchEngine?: string
  backgroundColor?: string
  backgroundImageUrl?: string
  openInNewTab?: boolean
}) => {
  await chrome.storage.sync.set(settings)
}

export const loadSettings = async () => {
  const result = await chrome.storage.sync.get([
    'searchEngine',
    'backgroundColor',
    'backgroundImageUrl',
    'openInNewTab',
  ])
  return {
    searchEngine: result.searchEngine || 'google',
    backgroundColor: result.backgroundColor || '#f0f2f5',
    backgroundImageUrl: result.backgroundImageUrl || '',
    openInNewTab: result.openInNewTab ?? true,
  }
}

// ── 导出 ─────────────────────────────────────────────
export const exportData = async () => {
  const [links, categories, settings] = await Promise.all([
    loadLinks(),
    loadCategories(),
    loadSettings(),
  ])

  return {
    links,
    categories,
    settings,
    exportTime: new Date().toISOString(),
    version: '1.0.0',
  }
}

// ── 导入验证 ─────────────────────────────────────────
const validateImportData = (data: any) => {
  if (!data || typeof data !== 'object') {
    throw new Error('无效的数据格式')
  }
  if (!Array.isArray(data.links) || !Array.isArray(data.categories)) {
    throw new Error('缺少必要的数据字段')
  }

  data.categories = data.categories.map((category: any) => ({
    id: category.id || String(Date.now()),
    name: category.name || '未命名分类',
    icon: category.icon || 'FolderOutlined',
    isHome: Boolean(category.isHome),
    color: category.color || '#55998b',
  }))

  data.links = data.links.map((link: any) => ({
    id: link.id || String(Date.now()),
    title: link.title || '未命名链接',
    url: link.url || '#',
    categoryId: link.categoryId || 'home',
    timestamp: link.timestamp || Date.now(),
    isDocked: Boolean(link.isDocked),
    icon: link.icon || '',
    order: typeof link.order === 'number' ? link.order : undefined,
    description: link.description || undefined,
    tags: Array.isArray(link.tags) ? link.tags : undefined,
  }))

  if (!data.categories.some((c: any) => c.isHome)) {
    data.categories.unshift({
      id: 'home',
      name: '首页',
      icon: 'HomeOutlined',
      isHome: true,
    })
  }

  return data
}

// ── 导入 ─────────────────────────────────────────────
export const importData = async (data: any) => {
  try {
    const validatedData = validateImportData(data)

    await Promise.all([
      saveLinks(validatedData.links),
      saveCategories(validatedData.categories),
      saveSettings({
        searchEngine: validatedData.settings?.searchEngine || 'google',
        backgroundColor: validatedData.settings?.backgroundColor || '#f0f2f5',
        backgroundImageUrl: validatedData.settings?.backgroundImageUrl || '',
        openInNewTab: validatedData.settings?.openInNewTab ?? true,
      }),
    ])

    return true
  } catch (error) {
    console.error('Import data error:', error)
    throw error
  }
}

// ── 背景图（chrome.storage.local，容量更大）─────────
const BG_IMAGE_KEY = 'background_image'
const BG_OPACITY_KEY = 'background_opacity'

export const saveBackgroundImage = async (dataUrl: string) => {
  await chrome.storage.local.set({ [BG_IMAGE_KEY]: dataUrl })
}

export const loadBackgroundImage = async (): Promise<string> => {
  try {
    const result = await chrome.storage.local.get(BG_IMAGE_KEY)
    return result[BG_IMAGE_KEY] || ''
  } catch {
    return ''
  }
}

export const clearBackgroundImage = async () => {
  await chrome.storage.local.remove([BG_IMAGE_KEY, BG_OPACITY_KEY])
}

export const saveBackgroundOpacity = async (opacity: number) => {
  await chrome.storage.local.set({ [BG_OPACITY_KEY]: opacity })
}

export const loadBackgroundOpacity = async (): Promise<number> => {
  try {
    const result = await chrome.storage.local.get(BG_OPACITY_KEY)
    return typeof result[BG_OPACITY_KEY] === 'number' ? result[BG_OPACITY_KEY] : 100
  } catch {
    return 100
  }
}

// ── 导入模式 ────────────────────────────────────────
export type ImportMode = 'overwrite' | 'append' | 'merge'

export const importDataWithMode = async (data: any, mode: ImportMode) => {
  const validatedData = validateImportData(data)

  if (mode === 'overwrite') {
    // 直接覆盖
    await Promise.all([
      saveLinks(validatedData.links),
      saveCategories(validatedData.categories),
      saveSettings({
        searchEngine: validatedData.settings?.searchEngine || 'google',
        backgroundColor: validatedData.settings?.backgroundColor || '#f0f2f5',
        backgroundImageUrl: validatedData.settings?.backgroundImageUrl || '',
        openInNewTab: validatedData.settings?.openInNewTab ?? true,
      }),
    ])
    return { added: validatedData.links.length, updated: 0, categories: validatedData.categories.length }
  }

  // append 或 merge 模式
  const [existingLinks, existingCategories] = await Promise.all([loadLinks(), loadCategories()])

  if (mode === 'append') {
    // 追加：新增分类和链接，保留已有的
    const existingCatIds = new Set(existingCategories.map(c => c.id))
    const newCategories = [...existingCategories]
    let addedCats = 0
    for (const cat of validatedData.categories) {
      if (!existingCatIds.has(cat.id)) {
        newCategories.push(cat)
        addedCats++
      }
    }

    const existingLinkIds = new Set(existingLinks.map(l => `${l.url}_${l.categoryId}`))
    const newLinks = [...existingLinks]
    let addedLinks = 0
    for (const link of validatedData.links) {
      const key = `${link.url}_${link.categoryId}`
      if (!existingLinkIds.has(key)) {
        newLinks.push(link)
        addedLinks++
      }
    }

    await Promise.all([saveLinks(newLinks), saveCategories(newCategories)])
    return { added: addedLinks, updated: 0, categories: addedCats }
  }

  // merge 模式：按 URL 去重，保留最新版本
  const linkMap = new Map<string, typeof existingLinks[0]>()
  for (const link of existingLinks) {
    linkMap.set(link.url, link)
  }
  let updatedCount = 0
  let addedCount = 0
  for (const link of validatedData.links) {
    const existing = linkMap.get(link.url)
    if (existing) {
      if (link.timestamp > existing.timestamp) {
        linkMap.set(link.url, { ...existing, ...link })
        updatedCount++
      }
    } else {
      linkMap.set(link.url, link)
      addedCount++
    }
  }

  // 合并分类
  const catMap = new Map<string, typeof existingCategories[0]>()
  for (const cat of existingCategories) catMap.set(cat.id, cat)
  for (const cat of validatedData.categories) {
    if (!catMap.has(cat.id)) catMap.set(cat.id, cat)
  }

  const mergedLinks = Array.from(linkMap.values())
  const mergedCategories = Array.from(catMap.values())

  await Promise.all([saveLinks(mergedLinks), saveCategories(mergedCategories)])
  return { added: addedCount, updated: updatedCount, categories: mergedCategories.length }
}

export const previewImportData = (data: any, existingLinks: SavedLink[], existingCategories: Category[]) => {
  const validated = validateImportData(data)
  const existingLinkUrls = new Set(existingLinks.map(l => `${l.url}_${l.categoryId}`))
  const existingCatIds = new Set(existingCategories.map(c => c.id))

  const willAddLinks = validated.links.filter((l: any) => !existingLinkUrls.has(`${l.url}_${l.categoryId}`)).length
  const willUpdateLinks = validated.links.filter((l: any) => existingLinkUrls.has(`${l.url}_${l.categoryId}`)).length
  const willAddCats = validated.categories.filter((c: any) => !existingCatIds.has(c.id)).length

  return {
    totalImportLinks: validated.links.length,
    totalImportCategories: validated.categories.length,
    willAddLinks,
    willUpdateLinks,
    willAddCats,
  }
}
