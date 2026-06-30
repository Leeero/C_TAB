import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveLinks, loadLinks, saveCategories, loadCategories,
  loadSettings, exportData,
} from '../utils/storage'

describe('storage', () => {
  beforeEach(() => {
    // Reset mock storage
    chrome.storage.sync.set({})
  })

  it('saveLinks and loadLinks should round-trip', async () => {
    const links = [
      { id: '1', title: 'Test', url: 'https://test.com', categoryId: 'home', timestamp: Date.now(), isDocked: false },
    ]
    await saveLinks(links)
    const loaded = await loadLinks()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].title).toBe('Test')
    expect(loaded[0].url).toBe('https://test.com')
  })

  it('saveCategories and loadCategories should round-trip', async () => {
    const cats = [
      { id: 'home', name: '首页', icon: 'HomeOutlined', isHome: true },
    ]
    await saveCategories(cats)
    const loaded = await loadCategories()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].name).toBe('首页')
  })

  it('saveSettings and loadSettings should have defaults', async () => {
    const settings = await loadSettings()
    expect(settings.searchEngine).toBe('google')
    expect(settings.openInNewTab).toBe(true)
  })

  it('exportData should include all fields', async () => {
    await saveLinks([
      { id: '1', title: 'A', url: 'https://a.com', categoryId: 'home', timestamp: 1, isDocked: false },
    ])
    await saveCategories([{ id: 'home', name: '首页', icon: 'HomeOutlined', isHome: true }])
    const data = await exportData()
    expect(data.links).toHaveLength(1)
    expect(data.categories).toHaveLength(1)
    expect(data.exportTime).toBeDefined()
  })
})
