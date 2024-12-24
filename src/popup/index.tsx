/*
 * @Author       : leroli
 * @Date         : 2024-12-23 12:07:04
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 20:13:32
 * @Description  : 
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, message } from 'antd'
import PopupComponent from './PopupComponent'
import { Category } from '../types'
import { getMatchingIcon } from '../utils/iconUtils'
import 'antd/dist/reset.css'

const Popup = () => {
  const handleSave = async (title: string, url: string, icon: string, categoryId: string) => {
    try {
      // 获取当前存储的数据
      const result = await chrome.storage.sync.get(['savedLinks'])
      const savedLinks = result.savedLinks || []

      // 创建新链接
      const newLink = {
        id: Date.now().toString(),
        title: title.trim(),
        url: url.trim(),
        icon,
        categoryId,
        timestamp: Date.now(),
        isDocked: false
      }

      // 更新存储
      await chrome.storage.sync.set({
        savedLinks: [...savedLinks, newLink]
      })

      message.success('保存成功')
      setTimeout(() => window.close(), 1000)
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    }
  }

  const handleAddCategory = async (name: string): Promise<Category> => {
    try {
      const result = await chrome.storage.sync.get(['categories'])
      const categories = result.categories || []

      const newCategory: Category = {
        id: Date.now().toString(),
        name: name.trim(),
        icon: getMatchingIcon(name),
        isHome: false
      }

      await chrome.storage.sync.set({
        categories: [...categories, newCategory]
      })

      return newCategory
    } catch (error) {
      console.error('添加分类失败:', error)
      throw error
    }
  }

  return (
    <ConfigProvider>
      <PopupComponent 
        onSave={handleSave}
        onAddCategory={handleAddCategory}
      />
    </ConfigProvider>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
const root = ReactDOM.createRoot(container)
root.render(<Popup />) 