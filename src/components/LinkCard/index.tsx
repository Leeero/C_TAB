/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Dropdown } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import { SavedLink } from '../../types'
import './index.css'

interface LinkCardProps {
  link: SavedLink
  menuItems: any[]
  className?: string
  openInNewTab: boolean
  draggable?: boolean
  isDragging?: boolean
  isDragOver?: boolean
  isJustDropped?: boolean
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void
}

const LinkCard: React.FC<LinkCardProps> = ({
  link,
  menuItems,
  className,
  openInNewTab,
  draggable,
  isDragging,
  isDragOver,
  isJustDropped,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const dragClasses = [
    isDragging ? 'dragging' : '',
    isDragOver ? 'drag-over' : '',
    isJustDropped ? 'just-dropped' : '',
  ].filter(Boolean).join(' ')

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      <div
        className={`link-card ${className || ''} ${dragClasses}`}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        <a
          href={link.url}
          className="link-content"
          target={openInNewTab ? "_blank" : "_self"}
          rel={openInNewTab ? "noopener noreferrer" : ""}
        >
          <div className="link-icon">
            {link.icon ? (
              <img src={link.icon} alt="" className="favicon" />
            ) : (
              <LinkOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
            )}
          </div>
          <div className="link-title">{link.title}</div>
          {link.tags && link.tags.length > 0 && (
            <div className="link-tags">
              {link.tags.slice(0, 2).map((tag, i) => (
                <span key={i} className="link-tag">{tag}</span>
              ))}
              {link.tags.length > 2 && (
                <span className="link-tag link-tag-more">+{link.tags.length - 2}</span>
              )}
            </div>
          )}
        </a>
      </div>
    </Dropdown>
  )
}

export default LinkCard
