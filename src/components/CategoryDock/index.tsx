import React, { useState } from 'react'
import { Dropdown } from 'antd'
import { PlusOutlined, SettingOutlined, SaveOutlined } from '@ant-design/icons'
import { Category } from '../../types'
import { renderIcon } from '../../utils/iconUtils'
import './index.css'

interface CategoryDockProps {
  categories: Category[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
  onAddCategory: () => void
  onOpenSettings: () => void
  onOpenSessions?: () => void
  getCategoryMenuItems: (category: Category) => Array<{key: string; label: string; icon?: React.ReactNode; danger?: boolean; onClick?: () => void}>
  onDropLinkToCategory?: (linkId: string, targetCategoryId: string) => void
}

const CategoryDock: React.FC<CategoryDockProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onOpenSettings,
  onOpenSessions,
  getCategoryMenuItems,
  onDropLinkToCategory,
}) => {
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)

  const handleCategoryDragOver = (e: React.DragEvent, categoryId: string) => {
    if (!onDropLinkToCategory) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCategoryId(categoryId)
  }

  const handleCategoryDragLeave = () => {
    setDragOverCategoryId(null)
  }

  const handleCategoryDrop = (e: React.DragEvent, categoryId: string) => {
    if (!onDropLinkToCategory) return
    e.preventDefault()
    const linkId = e.dataTransfer.getData('text/plain')
    if (linkId) {
      onDropLinkToCategory(linkId, categoryId)
    }
    setDragOverCategoryId(null)
  }

  return (
    <div className="category-dock">
      <div className="category-dock-content">
        <div className="category-list">
          {categories.map(category => {
            const menuItems = getCategoryMenuItems(category)
            const isDragOver = dragOverCategoryId === category.id
            const content = (
              <button
                className={`category-item ${selectedCategoryId === category.id ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
                onClick={() => onSelectCategory(category.id)}
                title={category.name}
                onDragOver={(e) => handleCategoryDragOver(e, category.id)}
                onDragLeave={handleCategoryDragLeave}
                onDrop={(e) => handleCategoryDrop(e, category.id)}
              >
                <div
                  className="category-icon"
                  style={category.color ? {
                    background: category.color,
                    boxShadow: `0 2px 8px ${category.color}40`
                  } : undefined}
                >
                  {renderIcon(category.icon)}
                </div>
                <div className="category-name">{category.name}</div>
              </button>
            )

            return menuItems.length > 0 ? (
              <Dropdown
                key={category.id}
                menu={{ items: menuItems }}
                trigger={['contextMenu']}
                placement="rightTop"
              >
                {content}
              </Dropdown>
            ) : (
              <div key={category.id}>{content}</div>
            )
          })}
        </div>
        {onOpenSessions && (
          <button className="sessions-btn" onClick={onOpenSessions} title="标签页会话">
            <SaveOutlined />
          </button>
        )}
        <button className="settings-btn" onClick={onOpenSettings}>
          <SettingOutlined />
        </button>
        <button className="add-category-btn" onClick={onAddCategory}>
          <PlusOutlined />
        </button>
      </div>
    </div>
  )
}

export default CategoryDock
