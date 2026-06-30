import { Category, SavedLink } from '../types'
import { loadLinks, loadCategories } from './storage'

// 从 Chrome 书签栏导入
export const importFromBookmarks = async (): Promise<{
  categories: Category[]
  links: SavedLink[]
}> => {
  const bookmarkTree = await chrome.bookmarks.getSubTree('1')
  const categories: Category[] = []
  const links: SavedLink[] = []

  const existingCategories = await loadCategories()
  const existingLinks = await loadLinks()
  const existingCatIds = new Set(existingCategories.map(c => c.id))

  const processNode = (node: chrome.BookmarkTreeNode, parentId: string) => {
    if (!node.children) return

    for (const child of node.children) {
      if (child.url) {
        const exists = existingLinks.some(l => l.url === child.url)
        if (!exists) {
          links.push({
            id: `bm_${child.id}`,
            title: child.title || child.url,
            url: child.url,
            categoryId: parentId,
            timestamp: child.dateAdded || Date.now(),
            isDocked: false,
            icon: '',
          })
        }
      } else if (child.id !== '1') {
        const catId = `bm_folder_${child.id}`
        if (!existingCatIds.has(catId)) {
          categories.push({
            id: catId,
            name: child.title || '未命名',
            icon: 'FolderOutlined',
            isHome: false,
          })
        }
        processNode(child, catId)
      }
    }
  }

  processNode(bookmarkTree[0], 'home')
  return { categories, links }
}

// 将 C_TAB 数据导出为 Chrome 书签
export const exportToBookmarks = async () => {
  const [links, categories] = await Promise.all([loadLinks(), loadCategories()])

  const roots = await chrome.bookmarks.getTree()
  const bookmarkBar = roots[0].children?.find(c => c.id === '1')
  if (!bookmarkBar) return

  let ctabFolder = bookmarkBar.children?.find(
    c => c.title === 'C_TAB Bookmarks' && !c.url
  )
  if (!ctabFolder) {
    ctabFolder = await chrome.bookmarks.create({
      parentId: '1',
      title: 'C_TAB Bookmarks',
    })
  }

  for (const category of categories) {
    let catFolder = ctabFolder.children?.find(c => c.title === category.name)
    if (!catFolder) {
      catFolder = await chrome.bookmarks.create({
        parentId: ctabFolder.id,
        title: category.name,
      })
    }

    const catLinks = links.filter(l => l.categoryId === category.id)
    for (const link of catLinks) {
      await chrome.bookmarks.create({
        parentId: catFolder.id,
        title: link.title,
        url: link.url,
      })
    }
  }
}

// 同步状态查询
export const getBookmarkSyncStatus = async () => {
  const roots = await chrome.bookmarks.getTree()
  const bookmarkBar = roots[0].children?.find(c => c.id === '1')
  const ctabFolder = bookmarkBar?.children?.find(
    c => c.title === 'C_TAB Bookmarks' && !c.url
  )
  return {
    hasBookmarksPermission: true,
    ctabFolderExists: !!ctabFolder,
    lastSyncKey: 'ctab_bookmark_last_sync',
  }
}
