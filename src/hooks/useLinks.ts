import { useState, useCallback, useMemo } from 'react'
import { SavedLink } from '../types'
import { saveLinks, loadLinks } from '../utils/storage'

interface UseLinksReturn {
  savedLinks: SavedLink[]
  dockedLinks: SavedLink[]
  groupedLinks: Record<string, SavedLink[]>
  isEditLinkModalVisible: boolean
  isAddLinkModalVisible: boolean
  editingLink: SavedLink | null
  editLinkTitle: string
  editLinkUrl: string
  editLinkCategory: string
  newLinkTitle: string
  newLinkUrl: string
  draggingLinkId: string | null
  dragOverLinkId: string | null
  justDroppedLinkId: string | null
  setSavedLinks: (links: SavedLink[]) => void
  loadAllLinks: () => Promise<SavedLink[]>
  setIsEditLinkModalVisible: (v: boolean) => void
  setIsAddLinkModalVisible: (v: boolean) => void
  setEditLinkTitle: (v: string) => void
  setEditLinkUrl: (v: string) => void
  setEditLinkCategory: (v: string) => void
  setNewLinkTitle: (v: string) => void
  setNewLinkUrl: (v: string) => void
  setDraggingLinkId: (v: string | null) => void
  setDragOverLinkId: (v: string | null) => void
  openEditLink: (link: SavedLink) => void
  saveEditedLink: () => Promise<void>
  deleteLink: (link: SavedLink) => Promise<void>
  toggleDock: (link: SavedLink) => Promise<void>
  addNewLink: (categoryId: string, getFavicon: (url: string) => Promise<string>) => Promise<void>
  moveLinkToCategory: (linkId: string, targetCategoryId: string) => Promise<void>
  reorderLinksInCategory: (sourceId: string, targetId: string, categoryId: string) => Promise<void>
}

export function useLinks(notify: (type: 'success' | 'error', msg: string) => void): UseLinksReturn {
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([])
  const [isEditLinkModalVisible, setIsEditLinkModalVisible] = useState(false)
  const [isAddLinkModalVisible, setIsAddLinkModalVisible] = useState(false)
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null)
  const [editLinkTitle, setEditLinkTitle] = useState('')
  const [editLinkUrl, setEditLinkUrl] = useState('')
  const [editLinkCategory, setEditLinkCategory] = useState('')
  const [editLinkDescription, setEditLinkDescription] = useState('')
  const [editLinkTags, setEditLinkTags] = useState<string[]>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [draggingLinkId, setDraggingLinkId] = useState<string | null>(null)
  const [dragOverLinkId, setDragOverLinkId] = useState<string | null>(null)
  const [justDroppedLinkId, setJustDroppedLinkId] = useState<string | null>(null)

  const dockedLinks = useMemo(
    () => savedLinks.filter(link => link.isDocked),
    [savedLinks]
  )

  const groupedLinks = useMemo(() => {
    const groups: Record<string, SavedLink[]> = {}
    for (const link of savedLinks) {
      if (!groups[link.categoryId]) groups[link.categoryId] = []
      groups[link.categoryId].push(link)
    }
    for (const categoryId of Object.keys(groups)) {
      groups[categoryId].sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER
        return orderA - orderB
      })
    }
    return groups
  }, [savedLinks])

  const loadAllLinks = useCallback(async (): Promise<SavedLink[]> => {
    const links = await loadLinks()
    setSavedLinks(links)
    return links
  }, [])

  const openEditLink = useCallback((link: SavedLink) => {
    setEditingLink(link)
    setEditLinkTitle(link.title)
    setEditLinkUrl(link.url)
    setEditLinkCategory(link.categoryId)
    setEditLinkDescription(link.description || '')
    setEditLinkTags(link.tags || [])
    setIsEditLinkModalVisible(true)
  }, [])

  const saveEditedLink = useCallback(async () => {
    if (!editingLink || !editLinkTitle.trim() || !editLinkUrl.trim()) {
      notify('error', '请填写完整信息')
      return
    }
    try {
      const updated = savedLinks.map(link =>
        link.id === editingLink.id
          ? {
              ...link,
              title: editLinkTitle.trim(),
              url: editLinkUrl.trim(),
              categoryId: editLinkCategory,
              description: editLinkDescription.trim() || undefined,
              tags: editLinkTags.length > 0 ? editLinkTags : undefined,
              timestamp: Date.now(),
            }
          : link
      )
      await saveLinks(updated)
      setSavedLinks(updated)
      setIsEditLinkModalVisible(false)
      notify('success', '修改成功')
    } catch (error) {
      console.error('Edit link error:', error)
      notify('error', '修改失败')
    }
  }, [editingLink, editLinkTitle, editLinkUrl, editLinkCategory, editLinkDescription, editLinkTags, savedLinks, notify])

  const deleteLink = useCallback(async (link: SavedLink) => {
    try {
      const updated = savedLinks.filter(item => item.id !== link.id)
      await saveLinks(updated)
      setSavedLinks(updated)
      notify('success', '删除成功')
    } catch (error) {
      console.error('Delete link error:', error)
      notify('error', '删除失败')
    }
  }, [savedLinks, notify])

  const toggleDock = useCallback(async (link: SavedLink) => {
    const updated = savedLinks.map(item =>
      item.id === link.id ? { ...item, isDocked: !item.isDocked } : item
    )
    await saveLinks(updated)
    setSavedLinks(updated)
  }, [savedLinks])

  const addNewLink = useCallback(async (
    categoryId: string,
    getFavicon: (url: string) => Promise<string>
  ) => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      notify('error', '请填写完整信息')
      return
    }
    try {
      const newUrl = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`
      let title = newLinkTitle.trim()
      if (!title) {
        try {
          const response = await fetch(newUrl)
          const html = await response.text()
          const doc = new DOMParser().parseFromString(html, 'text/html')
          title = doc.title || newUrl
        } catch {
          title = newUrl
        }
      }
      const icon = await getFavicon(newUrl)
      const newLink: SavedLink = {
        id: Date.now().toString(),
        title,
        url: newUrl,
        categoryId,
        timestamp: Date.now(),
        isDocked: false,
        icon,
      }
      const updated = [...savedLinks, newLink]
      await saveLinks(updated)
      setSavedLinks(updated)
      setIsAddLinkModalVisible(false)
      setNewLinkTitle('')
      setNewLinkUrl('')
      notify('success', '添加成功')
    } catch (error) {
      console.error('Add link error:', error)
      notify('error', '添加失败')
    }
  }, [savedLinks, newLinkTitle, newLinkUrl, notify])

  const moveLinkToCategory = useCallback(async (linkId: string, targetCategoryId: string) => {
    const link = savedLinks.find(l => l.id === linkId)
    if (!link || link.categoryId === targetCategoryId) return

    const updated = savedLinks.map(l =>
      l.id === linkId ? { ...l, categoryId: targetCategoryId, order: undefined } : l
    )
    await saveLinks(updated)
    setSavedLinks(updated)
    notify('success', '已移动到目标分类')
  }, [savedLinks, notify])

  const reorderLinksInCategory = useCallback(async (
    sourceId: string,
    targetId: string,
    categoryId: string
  ) => {
    if (!sourceId || !targetId || sourceId === targetId) return

    const categoryLinks = savedLinks.filter(link => link.categoryId === categoryId)
    const sourceIndex = categoryLinks.findIndex(link => link.id === sourceId)
    const targetIndex = categoryLinks.findIndex(link => link.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return

    const reordered = [...categoryLinks]
    const [moved] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    const updated = savedLinks.map(link => {
      if (link.categoryId !== categoryId) return link
      const idx = reordered.findIndex(item => item.id === link.id)
      if (idx === -1) return link
      return { ...link, order: idx }
    })

    await saveLinks(updated)
    setSavedLinks(updated)

    setJustDroppedLinkId(sourceId)
    setTimeout(() => setJustDroppedLinkId(null), 400)
    notify('success', '排序已保存')
  }, [savedLinks, notify])

  return {
    savedLinks,
    dockedLinks,
    groupedLinks,
    isEditLinkModalVisible,
    isAddLinkModalVisible,
    editingLink,
    editLinkTitle,
    editLinkUrl,
    editLinkCategory,
    editLinkDescription,
    editLinkTags,
    setEditLinkDescription,
    setEditLinkTags,
    newLinkTitle,
    newLinkUrl,
    draggingLinkId,
    dragOverLinkId,
    justDroppedLinkId,
    setSavedLinks,
    loadAllLinks,
    setIsEditLinkModalVisible,
    setIsAddLinkModalVisible,
    setEditLinkTitle,
    setEditLinkUrl,
    setEditLinkCategory,
    setNewLinkTitle,
    setNewLinkUrl,
    setDraggingLinkId,
    setDragOverLinkId,
    openEditLink,
    saveEditedLink,
    deleteLink,
    toggleDock,
    addNewLink,
    moveLinkToCategory,
    reorderLinksInCategory,
  }
}
