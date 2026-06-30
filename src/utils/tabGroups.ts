import { loadLinks, loadCategories } from './storage'

// 在 Chrome 标签组中打开分类
export const openCategoryAsTabGroup = async (categoryId: string): Promise<number> => {
  const [links, categories] = await Promise.all([loadLinks(), loadCategories()])
  const category = categories.find(c => c.id === categoryId)
  const categoryLinks = links.filter(l => l.categoryId === categoryId)

  if (categoryLinks.length === 0) return 0

  // 创建标签
  const tabIds: number[] = []
  for (const link of categoryLinks) {
    const tab = await chrome.tabs.create({ url: link.url, active: false })
    if (tab.id) tabIds.push(tab.id)
  }

  // 如果只有一个标签，不需要分组
  if (tabIds.length <= 1) return tabIds.length

  try {
    // 创建标签组
    const groupId = await chrome.tabs.group({ tabIds })
    // 设置标签组标题和颜色
    await chrome.tabGroups.update(groupId, {
      title: category?.name || 'C_TAB',
      color: 'blue',
      collapsed: false,
    })
    return tabIds.length
  } catch (error) {
    console.error('创建标签组失败:', error)
    return tabIds.length
  }
}

// 获取当前窗口的标签组信息
export const getCurrentTabGroups = async () => {
  try {
    const groups = await chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT })
    return groups.map(g => ({
      id: g.id,
      title: g.title,
      color: g.color,
      collapsed: g.collapsed,
      tabCount: g.tabIds?.length || 0,
    }))
  } catch {
    return []
  }
}
