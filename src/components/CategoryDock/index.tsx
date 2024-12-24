/*
 * @Author       : leroli
 * @Date         : 2024-12-23 18:34:29
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-24 14:42:35
 * @Description  : 
 */
import React from 'react'
import { Dropdown } from 'antd'
import { PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { Category } from '../../types'
import { renderIcon } from '../../utils/iconUtils'
import './index.css'

interface CategoryDockProps {
  categories: Category[]
  selectedCategoryId: string
  onSelectCategory: (id: string) => void
  onAddCategory: () => void
  onOpenSettings: () => void
  getCategoryMenuItems: (category: Category) => any[]
}

const CategoryDock: React.FC<CategoryDockProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onAddCategory,
  onOpenSettings,
  getCategoryMenuItems
}) => {
  return (
    <div className="category-dock">
      <div className="category-dock-content">
        <div className="category-list">
          {categories.map(category => {
            const menuItems = getCategoryMenuItems(category)
            const content = (
              <button
                className={`category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
                onClick={() => onSelectCategory(category.id)}
                title={category.name}
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