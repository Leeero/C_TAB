import { useState, useCallback } from 'react'
import {
  loadSettings, saveSettings, exportData, importData,
  loadCategories, loadLinks,
  ImportMode, importDataWithMode,
} from '../utils/storage'
import {
  loadCustomEngines, addCustomEngine, removeCustomEngine,
} from '../utils/searchEnginesStorage'
import { Category, SavedLink, SearchEngine } from '../types'

interface UseSettingsReturn {
  selectedSearchEngine: string
  openInNewTab: boolean
  isSettingsVisible: boolean
  customEngines: SearchEngine[]
  setSelectedSearchEngine: (engine: string) => void
  setOpenInNewTab: (v: boolean) => void
  setIsSettingsVisible: (v: boolean) => void
  initSettings: () => Promise<void>
  saveCurrentSettings: () => Promise<void>
  handleExportData: () => Promise<void>
  handleImportData: (file: File) => Promise<{
    categories: Category[]
    links: SavedLink[]
    searchEngine: string
    backgroundColor: string
    backgroundImageUrl: string
  }>
  addEngine: (engine: SearchEngine) => Promise<void>
  removeEngine: (id: string) => Promise<void>
  importWithMode: (file: File, mode: ImportMode) => Promise<{
    categories: Category[]
    links: SavedLink[]
    searchEngine: string
    backgroundColor: string
    backgroundImageUrl: string
    result?: { added: number; updated: number; categories: number }
  }>
}

export function useSettings(notify: (type: 'success' | 'error', msg: string) => void): UseSettingsReturn {
  const [selectedSearchEngine, setSelectedSearchEngine] = useState<string>('google')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [customEngines, setCustomEngines] = useState<SearchEngine[]>([])

  const initSettings = useCallback(async () => {
    const settings = await loadSettings()
    setSelectedSearchEngine(settings.searchEngine)
    setOpenInNewTab(settings.openInNewTab)
    const custom = await loadCustomEngines()
    setCustomEngines(custom)
  }, [])

  const saveCurrentSettings = useCallback(async () => {
    await saveSettings({ searchEngine: selectedSearchEngine, openInNewTab })
    notify('success', '设置保存成功')
    setIsSettingsVisible(false)
  }, [selectedSearchEngine, openInNewTab, notify])

  const handleExportData = useCallback(async () => {
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `c-tab-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      notify('success', '导出成功')
    } catch (error) {
      console.error('Export error:', error)
      notify('error', '导出失败')
    }
  }, [notify])

  const handleImportData = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      const [loadedCategories, loadedLinks, settings] = await Promise.all([
        loadCategories(),
        loadLinks(),
        loadSettings(),
      ])
      if (loadedCategories.length > 0) {
        setSelectedSearchEngine(settings.searchEngine || 'google')
      }
      notify('success', '导入成功')
      return {
        categories: loadedCategories,
        links: loadedLinks,
        searchEngine: settings.searchEngine || 'google',
        backgroundColor: settings.backgroundColor || '#f0f2f5',
        backgroundImageUrl: settings.backgroundImageUrl || '',
      }
    } catch (error) {
      console.error('Import error:', error)
      notify('error', '导入失败：' + (error as Error).message)
      return { categories: [], links: [], searchEngine: 'google', backgroundColor: '#f0f2f5', backgroundImageUrl: '' }
    }
  }, [notify])

  const addEngine = useCallback(async (engine: SearchEngine) => {
    await addCustomEngine(engine)
    const updated = await loadCustomEngines()
    setCustomEngines(updated)
    notify('success', '引擎添加成功')
  }, [notify])

  const removeEngine = useCallback(async (id: string) => {
    await removeCustomEngine(id)
    const updated = await loadCustomEngines()
    setCustomEngines(updated)
    notify('success', '已删除')
  }, [notify])

  const importWithMode = useCallback(async (file: File, mode: ImportMode) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const result = await importDataWithMode(data, mode)
      const [loadedCategories, loadedLinks, settingsData] = await Promise.all([
        loadCategories(), loadLinks(), loadSettings(),
      ])
      if (loadedCategories.length > 0) {
        setSelectedSearchEngine(settingsData.searchEngine || 'google')
      }
      notify('success', `导入成功：新增 ${result.added} 条链接，${result.categories} 个分类`)
      return {
        categories: loadedCategories,
        links: loadedLinks,
        searchEngine: settingsData.searchEngine || 'google',
        backgroundColor: settingsData.backgroundColor || '#f0f2f5',
        backgroundImageUrl: settingsData.backgroundImageUrl || '',
        result,
      }
    } catch (error) {
      console.error('Import error:', error)
      notify('error', '导入失败：' + (error as Error).message)
      return { categories: [], links: [], searchEngine: 'google', backgroundColor: '#f0f2f5', backgroundImageUrl: '' }
    }
  }, [notify])

  return {
    selectedSearchEngine,
    openInNewTab,
    isSettingsVisible,
    customEngines,
    setSelectedSearchEngine,
    setOpenInNewTab,
    setIsSettingsVisible,
    initSettings,
    saveCurrentSettings,
    handleExportData,
    handleImportData,
    addEngine,
    removeEngine,
    importWithMode,
  }
}
