/*
 * @Author       : leroli
 * @Date         : 2024-12-23 12:07:04
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-24 16:08:45
 * @Description  : 
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
  loadCategories 
} from '../utils/storage'

const Popup = () => {
  const handleSave = async (title: string, url: string, icon: string, categoryId: string) => {
    try {
      // 加载现有链接
      const existingLinks = await loadLinks()

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

      // 保存更新后的链接列表
      await saveLinks([...existingLinks, newLink])

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
        isHome: false
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