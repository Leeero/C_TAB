/*
 * @Author       : leroli
 * @Date         : 2024-12-23 11:12:53
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-23 19:42:40
 * @Description  : 
 */
import React, { useState, useEffect } from 'react'
import { Layout, Modal, message, Input, Radio, Upload, Button, Row, Col, Menu } from 'antd'
import { EditOutlined, DeleteOutlined, StarOutlined, StarFilled, UploadOutlined, PlusOutlined, ColumnHeightOutlined } from '@ant-design/icons'
import SearchBox from './components/SearchBox'
import CategoryDock from './components/CategoryDock'
import LinkCard from './components/LinkCard'
import DockBar from './components/DockBar'
import { Category, SavedLink } from './types'
import { getMatchingIcon } from './utils/iconUtils'
import './App.css'
import { RcFile } from 'antd/es/upload'
import { getSearchUrl } from './config/searchEngines'
import styles from './App.css?inline'

const { Content } = Layout

function App() {
  const [messageApi, contextHolder] = message.useMessage()
  const [categories, setCategories] = useState<Category[]>([])
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [selectedSearchEngine, setSelectedSearchEngine] = useState<string>('google')
  const [dockedLinks, setDockedLinks] = useState<SavedLink[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isEditLinkModalVisible, setIsEditLinkModalVisible] = useState(false)
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null)
  const [editLinkTitle, setEditLinkTitle] = useState('')
  const [editLinkUrl, setEditLinkUrl] = useState('')
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false)
  const [renamingCategory, setRenamingCategory] = useState<Category | null>(null)
  const [newName, setNewName] = useState('')
  const [isAddLinkModalVisible, setIsAddLinkModalVisible] = useState(false)
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const result = await chrome.storage.sync.get(['categories', 'savedLinks'])
      let loadedCategories = result.categories || []
      
      // 如果没有分类，创建首页分类
      if (loadedCategories.length === 0) {
        const homeCategory: Category = {
          id: 'home',
          name: '首页',
          icon: 'HomeOutlined',
          isHome: true
        }
        loadedCategories = [homeCategory]
        await chrome.storage.sync.set({ categories: loadedCategories })
      }
      
      setCategories(loadedCategories)
      setSavedLinks(result.savedLinks || [])
      setSelectedCategoryId(loadedCategories[0].id)
    }
    loadData()
  }, [])

  // 更新固定链接
  useEffect(() => {
    const dockedItems = savedLinks.filter(link => link.isDocked)
    setDockedLinks(dockedItems)
  }, [savedLinks])

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      const result = await chrome.storage.sync.get(['searchEngine'])
      if (result.searchEngine) {
        setSelectedSearchEngine(result.searchEngine)
      }
    }
    loadSettings()
  }, [])

  // 搜索处理
  const handleKeyPress = () => {
    if (!searchText.trim()) return
    const searchUrl = getSearchUrl(selectedSearchEngine, searchText)
    window.open(searchUrl, '_blank')
  }

  // 分类菜单项
  const getCategoryMenuItems = (category: Category) => {
    if (category.isHome) return []

    return [
      {
        key: 'rename',
        label: '重命名',
        icon: <EditOutlined />,
        onClick: () => handleOpenRename(category)
      },
      {
        key: 'delete',
        label: '删除',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteCategory(category.id)
      }
    ]
  }

  // 修改链接菜单项
  const getLinkMenuItems = (link: SavedLink) => [
    {
      key: 'dock',
      label: link.isDocked ? '取消固定' : '固定到底栏',
      icon: link.isDocked ? <StarFilled /> : <StarOutlined />,
      onClick: () => handleToggleDock(link)
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: () => handleEditLink(link)
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteLink(link)
    }
  ]

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category?.isHome) {
      messageApi.error('首页分类不能删除')
      return
    }

    const updatedCategories = categories.filter(c => c.id !== categoryId)
    const updatedLinks = savedLinks.filter(link => link.categoryId !== categoryId)
    
    await chrome.storage.sync.set({
      categories: updatedCategories,
      savedLinks: updatedLinks
    })
    
    setCategories(updatedCategories)
    setSavedLinks(updatedLinks)
    setSelectedCategoryId(updatedCategories[0].id)
    messageApi.success('删除成功')
  }

  // 切换固定状态
  const handleToggleDock = async (link: SavedLink) => {
    const updatedLinks = savedLinks.map(item =>
      item.id === link.id ? { ...item, isDocked: !item.isDocked } : item
    )
    await chrome.storage.sync.set({ savedLinks: updatedLinks })
    setSavedLinks(updatedLinks)
  }

  // 链接分组
  const groupedLinks = React.useMemo(() => {
    return savedLinks.reduce((acc, link) => {
      if (!acc[link.categoryId]) {
        acc[link.categoryId] = []
      }
      acc[link.categoryId].push(link)
      return acc
    }, {} as { [key: string]: SavedLink[] })
  }, [savedLinks])

  // 处理添加分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      messageApi.error('请输入分类名称')
      return
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      icon: getMatchingIcon(newCategoryName),
      isHome: false
    }

    try {
      const updatedCategories = [...categories, newCategory]
      await chrome.storage.sync.set({ categories: updatedCategories })
      setCategories(updatedCategories)
      setNewCategoryName('')
      setIsModalVisible(false)
      messageApi.success('添加成功')
    } catch (error) {
      console.error('Add category error:', error)
      messageApi.error('添加失败')
    }
  }

  // 处理编辑链接
  const handleEditLink = (link: SavedLink) => {
    setEditingLink(link)
    setEditLinkTitle(link.title)
    setEditLinkUrl(link.url)
    setIsEditLinkModalVisible(true)
  }

  // 处理保存链接
  const handleSaveLink = async () => {
    if (!editLinkTitle.trim() || !editLinkUrl.trim()) {
      messageApi.error('请填写完整信息')
      return
    }

    if (!editingLink) return

    try {
      const updatedLinks = savedLinks.map(link =>
        link.id === editingLink.id
          ? {
              ...link,
              title: editLinkTitle.trim(),
              url: editLinkUrl.trim(),
              timestamp: Date.now()
            }
          : link
      )

      await chrome.storage.sync.set({ savedLinks: updatedLinks })
      setSavedLinks(updatedLinks)
      setIsEditLinkModalVisible(false)
      messageApi.success('保存成功')
    } catch (error) {
      console.error('Save link error:', error)
      messageApi.error('保存失败')
    }
  }

  // 处理删除链接
  const handleDeleteLink = async (link: SavedLink) => {
    try {
      const updatedLinks = savedLinks.filter(item => item.id !== link.id)
      await chrome.storage.sync.set({ savedLinks: updatedLinks })
      setSavedLinks(updatedLinks)
      messageApi.success('删除成功')
    } catch (error) {
      console.error('Delete link error:', error)
      messageApi.error('删除失败')
    }
  }

  // 处理导入数据
  const handleImport = async (file: RcFile) => {
    const maxCategories = 50
    const maxLinks = 1000

    try {
      const content = await file.text()
      const data = JSON.parse(content)

      if (!data.categories || !data.links) {
        throw new Error('Invalid data format')
      }

      const newCategories = data.categories.filter((cat: Category) =>
        !categories.find(c => c.id === cat.id)
      )

      const newLinks = data.links.filter((link: SavedLink) =>
        !savedLinks.find(l => l.id === link.id)
      )

      if (categories.length + newCategories.length > maxCategories) {
        messageApi.error(`分类数量超出限制 (最大 ${maxCategories} 个)`)
        return
      }

      if (savedLinks.length + newLinks.length > maxLinks) {
        messageApi.error(`链接数量超出限制 (最大 ${maxLinks} 个)`)
        return
      }

      const trimmedCategories = [...categories, ...newCategories].slice(0, maxCategories)

      messageApi.loading('正在导入数据...', 0)
      
      try {
        await chrome.storage.sync.set({
          categories: trimmedCategories,
          savedLinks: [...savedLinks, ...newLinks]
        })

        setCategories(trimmedCategories)
        setSavedLinks([...savedLinks, ...newLinks])
        messageApi.success(`导入成功：${newCategories.length} 个分类，${newLinks.length} 个链接`)
        setIsSettingsVisible(false)
      } catch (error) {
        console.error('Save error:', error)
        messageApi.error('导入失败：数据量超出限制')
      } finally {
        messageApi.destroy()
      }

    } catch (error) {
      console.error('Import error:', error)
      messageApi.error('导入失败，请检查文件格式')
    }
  }

  // 添加保存设置函数
  const handleSaveSettings = async () => {
    await chrome.storage.sync.set({ searchEngine: selectedSearchEngine })
    messageApi.success('设置保存成功')
    setIsSettingsVisible(false)
  }

  // 处理重命名
  const handleRenameCategory = async () => {
    if (!renamingCategory || !newName.trim()) return

    const updatedCategories = categories.map(cat => 
      cat.id === renamingCategory.id ? { ...cat, name: newName.trim() } : cat
    )

    try {
      await chrome.storage.sync.set({ categories: updatedCategories })
      setCategories(updatedCategories)
      messageApi.success('分类重命名成功')
      setIsRenameModalVisible(false)
      setRenamingCategory(null)
      setNewName('')
    } catch (error) {
      messageApi.error('重命名失败')
    }
  }

  // 打开重命名模态框
  const handleOpenRename = (category: Category) => {
    setRenamingCategory(category)
    setNewName(category.name)
    setIsRenameModalVisible(true)
  }

  // 获取网站 favicon
  const getFavicon = async (url: string): Promise<string> => {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      
      // 尝试不同的 favicon 路径
      const faviconUrls = [
        `${urlObj.origin}/favicon.ico`,
        `${urlObj.origin}/favicon.png`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`, // Google 的 favicon 服务
      ]

      // 检查图标是否可访问
      for (const faviconUrl of faviconUrls) {
        try {
          const response = await fetch(faviconUrl)
          if (response.ok) {
            return faviconUrl
          }
        } catch (error) {
          continue
        }
      }

      // 如果都失败了，返回 Google 的 favicon 服务
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch (error) {
      console.error('获取 favicon 失败:', error)
      return '' // 返回空字符串表示使用默认图标
    }
  }

  // 修改添加链接的处理函数
  const handleAddLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      messageApi.error('请填写完整信息')
      return
    }

    try {
      const newUrl = newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`
      
      // 获取网站标题（如果用户没有输入标题）
      let title = newLinkTitle.trim()
      if (!title) {
        try {
          const response = await fetch(newUrl)
          const html = await response.text()
          const doc = new DOMParser().parseFromString(html, 'text/html')
          title = doc.title || newUrl
        } catch (error) {
          title = newUrl
        }
      }

      // 获取网站图标
      const icon = await getFavicon(newUrl)

      const newLink: SavedLink = {
        id: Date.now().toString(),
        title,
        url: newUrl,
        categoryId: selectedCategoryId,
        timestamp: Date.now(),
        isDocked: false,
        icon,
        size: { cols: 1, rows: 1 } // 添加默认大小
      }

      const updatedLinks = [...savedLinks, newLink]
      await chrome.storage.sync.set({ savedLinks: updatedLinks })
      setSavedLinks(updatedLinks)
      setIsAddLinkModalVisible(false)
      setNewLinkTitle('')
      setNewLinkUrl('')
      messageApi.success('添加成功')
    } catch (error) {
      messageApi.error('添加失败')
    }
  }

  return (
    <div className="app-layout">
      <style>{styles}</style>
      {contextHolder}
      
      <SearchBox
        searchText={searchText}
        onSearch={setSearchText}
        onKeyPress={handleKeyPress}
        searchEngine={selectedSearchEngine}
      />

      <CategoryDock
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onAddCategory={() => setIsModalVisible(true)}
        onOpenSettings={() => setIsSettingsVisible(true)}
        getCategoryMenuItems={getCategoryMenuItems}
      />

      <Content className="app-content">
        <div className="content-scroll">
          {selectedCategoryId && (
            <div className="category-section slide-up">
              <div className="category-header">
                <h2>{categories.find(c => c.id === selectedCategoryId)?.name}</h2>
              </div>
              <Row gutter={[16, 16]} className="links-grid">
                {(groupedLinks[selectedCategoryId] || []).map((link, index) => (
                  <Col key={link.id}>
                    <LinkCard
                      link={link}
                      menuItems={getLinkMenuItems(link)}
                      className={`fade-in delay-${index % 3 + 1}`}
                    />
                  </Col>
                ))}
                <Col>
                  <div 
                    className="link-card add-link-card"
                    onClick={() => setIsAddLinkModalVisible(true)}
                  >
                    <div className="link-content">
                      <div className="link-icon">
                        <PlusOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
                      </div>
                      <div className="link-title">添加链接</div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Content>

      <DockBar links={dockedLinks} />

      {/* 添加分类 Modal */}
      <Modal
        title="添加分类"
        open={isModalVisible}
        onOk={handleAddCategory}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          placeholder="分类名称"
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
        />
      </Modal>

      {/* 编辑链接 Modal */}
      <Modal
        title="编辑链接"
        open={isEditLinkModalVisible}
        onOk={handleSaveLink}
        onCancel={() => setIsEditLinkModalVisible(false)}
      >
        <div className="edit-link-form">
          <Input
            placeholder="链接标题"
            value={editLinkTitle}
            onChange={e => setEditLinkTitle(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Input
            placeholder="链接地址"
            value={editLinkUrl}
            onChange={e => setEditLinkUrl(e.target.value)}
          />
        </div>
      </Modal>

      {/* 设置 Modal */}
      <Modal
        title="设置"
        open={isSettingsVisible}
        onOk={handleSaveSettings}
        onCancel={() => setIsSettingsVisible(false)}
      >
        <div className="settings-section">
          <h3>默认搜索引擎</h3>
          <Radio.Group
            value={selectedSearchEngine}
            onChange={e => setSelectedSearchEngine(e.target.value)}
          >
            <Radio.Button value="google">Google</Radio.Button>
            <Radio.Button value="baidu">百度</Radio.Button>
            <Radio.Button value="bing">Bing</Radio.Button>
          </Radio.Group>
        </div>

        <div className="settings-section">
          <h3>数据导入</h3>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImport(file)
              return false
            }}
          >
            <Button icon={<UploadOutlined />}>
              选择文件导入
            </Button>
          </Upload>
          <div className="import-tip">
            支持导入 iTab 数据
          </div>
        </div>
      </Modal>

      {/* 重命名分类 Modal */}
      <Modal
        title="重命名分类"
        open={isRenameModalVisible}
        onOk={handleRenameCategory}
        onCancel={() => {
          setIsRenameModalVisible(false)
          setRenamingCategory(null)
          setNewName('')
        }}
      >
        <Input
          placeholder="分类名称"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          maxLength={10}
        />
      </Modal>

      {/* 新增链接 Modal */}
      <Modal
        title="新增链接"
        open={isAddLinkModalVisible}
        onOk={handleAddLink}
        onCancel={() => {
          setIsAddLinkModalVisible(false)
          setNewLinkTitle('')
          setNewLinkUrl('')
        }}
      >
        <div className="edit-link-form">
          <Input
            placeholder="链接标题"
            value={newLinkTitle}
            onChange={e => setNewLinkTitle(e.target.value)}
            style={{ marginBottom: 16 }}
            maxLength={20}
          />
          <Input
            placeholder="链接地址"
            value={newLinkUrl}
            onChange={e => setNewLinkUrl(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}

export default App
