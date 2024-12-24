/* eslint-disable @typescript-eslint/no-explicit-any */
import { Category, SavedLink } from '../types'

const LINKS_PER_CHUNK = 100 // 每个分块存储的链接数量

// 将链接数组分块
const chunkLinks = (links: SavedLink[]): SavedLink[][] => {
  const chunks: SavedLink[][] = []
  for (let i = 0; i < links.length; i += LINKS_PER_CHUNK) {
    chunks.push(links.slice(i, i + LINKS_PER_CHUNK))
  }
  return chunks
}

// 保存链接
export const saveLinks = async (links: SavedLink[]) => {
  const chunks = chunkLinks(links)
  const storageData: { [key: string]: SavedLink[] } = {}
  
  chunks.forEach((chunk, index) => {
    storageData[`links_${index}`] = chunk
  })
  
  // 保存分块数量
  storageData['links_count'] = chunks.length as any
  
  await chrome.storage.sync.set(storageData)
}

// 加载链接
export const loadLinks = async (): Promise<SavedLink[]> => {
  const result = await chrome.storage.sync.get('links_count')
  const count = result.links_count || 0
  
  if (count === 0) return []
  
  const keys = Array.from({ length: count }, (_, i) => `links_${i}`)
  const chunks = await chrome.storage.sync.get(keys)
  
  return Object.values(chunks).flat()
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