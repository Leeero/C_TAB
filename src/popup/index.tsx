/*
 * @Description  : Popup 入口 — 保存当前页面到 C_TAB
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, message } from 'antd'
import PopupComponent from './PopupComponent'
import { Category } from '../types'
import { getMatchingIcon } from '../utils/iconUtils'
import 'antd/dist/reset.css'
import {
  saveLinks,
  loadLinks,
  saveCategories,
  loadCategories,
} from '../utils/storage'

// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
  const handleSave = async (title: string, url: string, icon: string, categoryId: string) => {
    try {
      const existingLinks = await loadLinks()

      // 检查是否已存在相同 URL 的链接
      const duplicate = existingLinks.find(link => link.url === url && link.categoryId === categoryId)
      if (duplicate) {
        message.warning('该链接已在当前分类中')
        return
      }

      const newLink = {
        id: Date.now().toString(),
        title: title.trim(),
        url: url.trim(),
        icon,
        categoryId,
        timestamp: Date.now(),
        isDocked: false,
      }

      await saveLinks([...existingLinks, newLink])

      // 通知主页刷新数据
      chrome.runtime.sendMessage({ type: 'LINK_SAVED', data: newLink }).catch(() => {})

      message.success('保存成功')
      setTimeout(() => window.close(), 1000)
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  const handleAddCategory = async (name: string): Promise<Category> => {
    try {
      const categories = await loadCategories()

      const newCategory: Category = {
        id: Date.now().toString(),
        name: name.trim(),
        icon: getMatchingIcon(name),
        isHome: false,
      }

      await saveCategories([...categories, newCategory])
      return newCategory
    } catch (error) {
      console.error('添加分类失败:', error)
      throw error
    }
  }

  return (
    <ConfigProvider>
      <PopupComponent onSave={handleSave} onAddCategory={handleAddCategory} />
    </ConfigProvider>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
const root = ReactDOM.createRoot(container)
root.render(<App />)
