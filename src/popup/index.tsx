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
import 'antd/dist/reset.css'

const Popup = () => {
  const handleSave = async (title: string, url: string, icon: string) => {
    try {
      // 获取当前存储的数据
      const result = await chrome.storage.sync.get(['savedLinks', 'categories'])
      const savedLinks = result.savedLinks || []
      const categories = result.categories || []

      // 如果没有分类，创建默认分类
      if (categories.length === 0) {
        const homeCategory = {
          id: 'home',
          name: '首页',
          icon: 'HomeOutlined',
          isHome: true
        }
        await chrome.storage.sync.set({ categories: [homeCategory] })
      }

      // 创建新链接
      const newLink = {
        id: Date.now().toString(),
        title: title.trim(),
        url: url.trim(),
        icon,
        categoryId: categories[0]?.id || 'home',
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

  return (
    <ConfigProvider>
      <PopupComponent onSave={handleSave} />
    </ConfigProvider>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
const root = ReactDOM.createRoot(container)
root.render(<Popup />) 