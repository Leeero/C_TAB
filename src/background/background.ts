/*
 * @Description  : Background Service Worker
 */

// ── 右键菜单（每次 service worker 启动都注册，防止丢失）──
function createContextMenus() {
  if (!chrome.contextMenus) return
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-to-ctab',
      title: '保存到 C_TAB',
      contexts: ['page', 'link'],
    })
    console.log('C_TAB: context menu (re)registered')
  })
}

// 安装 / 更新时注册
chrome.runtime.onInstalled.addListener(() => {
  createContextMenus()
})

// service worker 被唤醒时也注册
createContextMenus()

// ── 右键菜单点击 → 向 content script 发消息 ──────
if (chrome.contextMenus?.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'save-to-ctab' || !tab?.id) return
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: 'OPEN_SAVE_DIALOG',
        data: {
          url: info.linkUrl || tab.url || '',
          title: info.selectionText || tab.title || '',
          favIconUrl: tab.favIconUrl || '',
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn('C_TAB: content script 未响应', chrome.runtime.lastError.message)
        }
      }
    )
  })
}

// ── 快捷键 ─────────────────────────────────────────
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'open-search') {
    chrome.tabs.query({ url: chrome.runtime.getURL('index.html') }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id!, { active: true })
        chrome.windows.update(tabs[0].windowId!, { focused: true })
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
      }
    })
  }

  if (command === 'quick-save') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.id) return
      chrome.tabs.sendMessage(tab.id, {
        type: 'OPEN_SAVE_DIALOG',
        data: { url: tab.url || '', title: tab.title || '', favIconUrl: tab.favIconUrl || '' },
      }).catch(() => {
        chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
      })
    })
  }
})

// ── 消息路由 ────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0] || null)
    })
    return true
  }

  if (message.type === 'SAVE_LINK_FROM_CONTEXT') {
    const { title, url, icon, categoryId } = message.data
    saveLinkFromContext(title, url, icon, categoryId)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }))
    return true
  }

  if (message.type === 'NOTIFY_TABS_UPDATED' || message.type === 'LINK_SAVED') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'DATA_REFRESHED' }).catch(() => {})
        }
      }
    })
    sendResponse({ ok: true })
    return false
  }

  return false
})

// ── 保存链接 ────────────────────────────────────────
async function saveLinkFromContext(title: string, url: string, icon: string, categoryId: string = 'home') {
  const result = await chrome.storage.sync.get('links_count')
  const count = result.links_count || 0

  const newLink = {
    id: Date.now().toString(),
    title,
    url,
    categoryId,
    isDocked: false,
    icon: icon || '',
  }

  const lastChunkKey = count > 0 ? `links_${count - 1}` : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastChunk: any[] = []
  if (lastChunkKey) {
    const data = await chrome.storage.sync.get(lastChunkKey)
    lastChunk = data[lastChunkKey] || []
  }

  const LINKS_PER_CHUNK = 20

  if (lastChunk.length < LINKS_PER_CHUNK) {
    lastChunk.push(newLink)
    await chrome.storage.sync.set({ [lastChunkKey!]: lastChunk })
  } else {
    await chrome.storage.sync.set({ [`links_${count}`]: [newLink] })
    await chrome.storage.sync.set({ links_count: count + 1 })
  }

  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'DATA_REFRESHED' }).catch(() => {})
      }
    }
  })
}
