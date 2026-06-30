/*
 * @Description  : Content Script
 *                 - 响应右键菜单"保存到 C_TAB"
 *                 - 弹窗支持分类选择
 *                 - 监听数据刷新通知
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_SAVE_DIALOG') {
    showSaveDialog(message.data)
    sendResponse({ ok: true })
  }
  if (message.type === 'DATA_REFRESHED') {
    sendResponse({ ok: true })
  }
  return false
})

function showSaveDialog(data: { url: string; title: string; favIconUrl: string }) {
  if (document.getElementById('ctab-save-dialog')) return

  const dark = isDarkMode()

  const overlay = document.createElement('div')
  overlay.id = 'ctab-save-dialog'
  overlay.innerHTML = `
    <style>
      #ctab-save-dialog {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4); z-index: 2147483647;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #ctab-save-dialog .box {
        background: ${dark ? '#1f1f1f' : '#fff'};
        color: ${dark ? 'rgba(255,255,255,0.85)' : '#1f1f1f'};
        border-radius: 12px; padding: 24px; width: 380px; max-width: 90vw;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      }
      #ctab-save-dialog h3 { margin: 0 0 16px; font-size: 16px; }
      #ctab-save-dialog label {
        display: block; font-size: 12px; margin-bottom: 4px;
        color: ${dark ? 'rgba(255,255,255,0.45)' : '#8c8c8c'};
      }
      #ctab-save-dialog input,
      #ctab-save-dialog select {
        width: 100%; padding: 8px 12px; border-radius: 6px; font-size: 14px;
        margin-bottom: 14px; box-sizing: border-box;
        background: ${dark ? '#333' : '#fff'};
        color: ${dark ? 'rgba(255,255,255,0.85)' : '#333'};
        border: 1px solid ${dark ? '#555' : '#d9d9d9'};
        outline: none;
      }
      #ctab-save-dialog input:focus,
      #ctab-save-dialog select:focus {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
      }
      #ctab-save-dialog select option {
        background: ${dark ? '#333' : '#fff'};
        color: ${dark ? 'rgba(255,255,255,0.85)' : '#333'};
      }
      #ctab-save-dialog .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
      #ctab-save-dialog button {
        padding: 6px 16px; border-radius: 6px; border: none;
        cursor: pointer; font-size: 14px;
      }
      #ctab-save-dialog .btn-cancel {
        background: ${dark ? '#444' : '#f0f0f0'};
        color: ${dark ? 'rgba(255,255,255,0.85)' : '#333'};
      }
      #ctab-save-dialog .btn-save { background: #1890ff; color: #fff; }
      #ctab-save-dialog .btn-save:hover { background: #40a9ff; }
      #ctab-save-dialog .toast {
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 8px 20px; border-radius: 8px; color: #fff;
        font-size: 14px; z-index: 2147483647;
        animation: ctabFadeOut 1.5s forwards;
      }
      @keyframes ctabFadeOut { 0%{opacity:1} 70%{opacity:1} 100%{opacity:0} }
    </style>
    <div class="box">
      <h3>📌 保存到 C_TAB</h3>
      <label>标题</label>
      <input id="ctab-title" value="${escapeHtml(data.title)}" />
      <label>网址</label>
      <input id="ctab-url" value="${escapeHtml(data.url)}" />
      <label>分类</label>
      <select id="ctab-category"><option value="">加载中...</option></select>
      <div class="row">
        <button class="btn-cancel" id="ctab-cancel">取消</button>
        <button class="btn-save" id="ctab-save">保存</button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  // 加载分类列表
  loadCategories().then((categories) => {
    const sel = document.getElementById('ctab-category') as HTMLSelectElement
    sel.innerHTML = categories.map(
      (c) => `<option value="${c.id}"${c.isHome ? ' selected' : ''}>${escapeHtml(c.name)}</option>`
    ).join('')
  })

  // 聚焦标题
  const titleInput = document.getElementById('ctab-title') as HTMLInputElement
  titleInput?.focus()
  titleInput?.select()

  // 取消
  document.getElementById('ctab-cancel')?.addEventListener('click', () => overlay.remove())
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove() })

  // ESC 关闭
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler) }
  }
  document.addEventListener('keydown', escHandler)

  // 保存
  document.getElementById('ctab-save')?.addEventListener('click', () => {
    const title = (document.getElementById('ctab-title') as HTMLInputElement).value.trim()
    const url = (document.getElementById('ctab-url') as HTMLInputElement).value.trim()
    const categoryId = (document.getElementById('ctab-category') as HTMLSelectElement).value

    if (!title || !url) { showToast('请填写标题和网址', 'error'); return }
    if (!categoryId) { showToast('请选择分类', 'error'); return }

    chrome.runtime.sendMessage({
      type: 'SAVE_LINK_FROM_CONTEXT',
      data: { title, url, icon: data.favIconUrl, categoryId },
    }, (response) => {
      if (response?.ok) {
        showToast('保存成功 ✓', 'success')
        overlay.remove()
      } else {
        showToast('保存失败，请重试', 'error')
      }
    })
  })
}

function loadCategories(): Promise<{ id: string; name: string; isHome?: boolean }[]> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['categories'], (result) => {
      resolve(result.categories || [])
    })
  })
}

function showToast(text: string, type: 'success' | 'error') {
  const t = document.createElement('div')
  t.className = 'toast'
  t.style.background = type === 'success' ? '#52c41a' : '#ff4d4f'
  t.textContent = text
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 1600)
}

function isDarkMode() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

function escapeHtml(str: string) {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}
