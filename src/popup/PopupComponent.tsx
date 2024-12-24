/*
 * @Author       : leroli
 * @Date         : 2024-12-23 12:11:00
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-24 16:08:10
 * @Description  : 
 */
import React, { useState, useEffect } from 'react'
import { Input, Button, Select, Space, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import './PopupComponent.css'
import { Category } from '../types'

const { Option } = Select

interface PopupProps {
  onSave: (title: string, url: string, icon: string, categoryId: string) => void
  onAddCategory: (name: string) => Promise<Category>
}

const PopupComponent: React.FC<PopupProps> = ({ onSave, onAddCategory }) => {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [icon, setIcon] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    // 获取当前标签页信息
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0]
      if (currentTab) {
        setTitle(currentTab.title || '')
        setUrl(currentTab.url || '')
        if (currentTab.favIconUrl) {
          setIcon(currentTab.favIconUrl)
        }
      }
    })

    // 加载分类列表
    chrome.storage.sync.get(['categories'], (result) => {
      if (result.categories) {
        setCategories(result.categories)
        // 默认选择第一个分类
        if (result.categories.length > 0) {
          setSelectedCategory(result.categories[0].id)
        }
      }
    })
  }, [])

  const handleSave = () => {
    if (!title.trim() || !url.trim()) {
      message.error('请填写完整信息')
      return
    }
    if (!selectedCategory) {
      message.error('请选择分类')
      return
    }
    onSave(title, url, icon, selectedCategory)
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      message.error('请输入分类名称')
      return
    }

    try {
      const newCategory = await onAddCategory(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setSelectedCategory(newCategory.id)
      setIsAddingCategory(false)
      setNewCategoryName('')
      message.success('添加分类成功')
    } catch (error) {
      console.log("❗️ ~ handleAddCategory ~ error:", error);
      message.error('添加分类失败')
    }
  }

  return (
    <div className="popup-container">
      <div className="site-info">
        <h3>保存到C_TAB</h3>
      </div>
      
      <div className="form-item">
        <label>标题</label>
        <Input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="输入标题"
          maxLength={50}
        />
      </div>

      <div className="form-item">
        <label>网址</label>
        <Input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="输入网址"
        />
      </div>

      <div className="form-item">
        <label>图标</label>
        {icon && <img src={icon} alt="" className="site-icon" />}
      </div>

      <div className="form-item">
        <label>分类</label>
        {isAddingCategory ? (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="输入新分类名称"
              maxLength={10}
            />
            <Button type="primary" onClick={handleAddCategory}>
              确定
            </Button>
            <Button onClick={() => {
              setIsAddingCategory(false)
              setNewCategoryName('')
            }}>
              取消
            </Button>
          </Space.Compact>
        ) : (
          <Space.Compact style={{ width: '100%' }}>
            <Select
              style={{ flex: 1 }}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="选择分类"
            >
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
            <Button 
              icon={<PlusOutlined />}
              onClick={() => setIsAddingCategory(true)}
            />
          </Space.Compact>
        )}
      </div>

      <Button type="primary" block onClick={handleSave} disabled={isAddingCategory}>
        保存
      </Button>
    </div>
  )
}

export default PopupComponent 