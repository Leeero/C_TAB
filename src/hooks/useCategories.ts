import { useState, useCallback } from 'react'
import { Category } from '../types'
import { saveCategories, loadCategories, saveLinks } from '../utils/storage'

interface UseCategoriesReturn {
  categories: Category[]
  selectedCategoryId: string
  isModalVisible: boolean
  isRenameModalVisible: boolean
  renamingCategory: Category | null
  setSelectedCategoryId: (id: string) => void
  setCategories: (categories: Category[]) => void
  setCategoriesAsync: (categories: Category[]) => Promise<void>
  setIsModalVisible: (visible: boolean) => void
  setIsRenameModalVisible: (visible: boolean) => void
  addCategory: (values: { name: string; icon: string; color?: string }) => Promise<void>
  deleteCategory: (categoryId: string, savedLinks: Array<{categoryId: string}>) => Promise<void>
  renameCategory: (values: { name: string; icon: string; color?: string }) => Promise<void>
  openRename: (category: Category) => void
  initCategories: () => Promise<Category[]>
}

export function useCategories(notify: (type: 'success' | 'error', msg: string) => void): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [renamingCategory, setRenamingCategory] = useState<Category | null>(null)

  const initCategories = useCallback(async (): Promise<Category[]> => {
    let loaded = await loadCategories()
    if (loaded.length === 0) {
      const homeCategory: Category = {
        id: 'home',
        name: '首页',
        icon: 'HomeOutlined',
        isHome: true,
      }
      loaded = [homeCategory]
      await saveCategories(loaded)
    }
    setCategories(loaded)
    setSelectedCategoryId(loaded[0].id)
    return loaded
  }, [])

  const addCategory = useCallback(async (values: { name: string; icon: string; color?: string }) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: values.name.trim(),
      icon: values.icon,
      color: values.color,
      isHome: false,
    }
    const updated = [...categories, newCategory]
    await saveCategories(updated)
    setCategories(updated)
    setIsModalVisible(false)
    notify('success', '添加成功')
  }, [categories, notify])

  const deleteCategory = useCallback(async (categoryId: string, allLinks: Array<{categoryId: string}>) => {
    const category = categories.find(c => c.id === categoryId)
    if (category?.isHome) {
      notify('error', '首页分类不能删除')
      return
    }
    const updatedCategories = categories.filter(c => c.id !== categoryId)
    const updatedLinks = allLinks.filter(link => link.categoryId !== categoryId)
    await Promise.all([
      saveCategories(updatedCategories),
      saveLinks(updatedLinks),
    ])
    setCategories(updatedCategories)
    setSelectedCategoryId(updatedCategories[0].id)
    notify('success', '删除成功')
    return updatedLinks
  }, [categories, notify])

  const renameCategory = useCallback(async (values: { name: string; icon: string; color?: string }) => {
    if (!renamingCategory) return
    const updated = categories.map(category =>
      category.id === renamingCategory.id
        ? { ...category, name: values.name.trim(), icon: values.icon, color: values.color }
        : category
    )
    await saveCategories(updated)
    setCategories(updated)
    setIsRenameModalVisible(false)
    setRenamingCategory(null)
    notify('success', '修改成功')
  }, [categories, renamingCategory, notify])

  const openRename = useCallback((category: Category) => {
    setRenamingCategory(category)
    setIsRenameModalVisible(true)
  }, [])

  const setCategoriesAsync = useCallback(async (newCategories: Category[]) => {
    await saveCategories(newCategories)
    setCategories(newCategories)
  }, [])

  return {
    categories,
    selectedCategoryId,
    isModalVisible,
    isRenameModalVisible,
    renamingCategory,
    setSelectedCategoryId,
    setCategories,
    setCategoriesAsync,
    setIsModalVisible,
    setIsRenameModalVisible,
    addCategory,
    deleteCategory,
    renameCategory,
    openRename,
    initCategories,
  }
}
