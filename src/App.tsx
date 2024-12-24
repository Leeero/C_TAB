/*
 * @Author       : leroli
 * @Date         : 2024-12-23 11:12:53
 * @LastEditors  : leroli
 * @LastEditTime : 2024-12-24 16:34:30
 * @Description  : 首页
 */
import React, { useState, useEffect } from "react";
import {
  Layout,
  Modal,
  message,
  Input,
  Radio,
  Row,
  Col,
  Select,
  Button,
  Form,
  Space,
  Upload,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  PlusOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import SearchBox from "./components/SearchBox";
import CategoryDock from "./components/CategoryDock";
import LinkCard from "./components/LinkCard";
import DockBar from "./components/DockBar";
import CategoryForm from "./components/CategoryForm";
import { Category, SavedLink } from "./types";
import { BingImage } from "./utils/bingImages";
import "./App.css";
import { getSearchUrl } from "./config/searchEngines";
import styles from "./App.css?inline";
import { getBingImages } from "./utils/bingImages";
import {
  saveLinks,
  loadLinks,
  saveCategories,
  loadCategories,
  loadSettings,
  saveSettings,
  exportData,
  importData,
} from "./utils/storage";

const { Content } = Layout;

function App() {
  const [messageApi, contextHolder] = message.useMessage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [selectedSearchEngine, setSelectedSearchEngine] =
    useState<string>("google");
  const [dockedLinks, setDockedLinks] = useState<SavedLink[]>([]);
  const [isEditLinkModalVisible, setIsEditLinkModalVisible] = useState(false);
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null);
  const [editLinkTitle, setEditLinkTitle] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState<Category | null>(
    null
  );
  const [isAddLinkModalVisible, setIsAddLinkModalVisible] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [editLinkCategory, setEditLinkCategory] = useState<string>("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("#f0f2f5");
  const [bingImages, setBingImages] = useState<BingImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      let loadedCategories = await loadCategories();

      // 如果没有分类，创建首页分类
      if (loadedCategories.length === 0) {
        const homeCategory: Category = {
          id: "home",
          name: "首页",
          icon: "HomeOutlined",
          isHome: true,
        };
        loadedCategories = [homeCategory];
        await saveCategories(loadedCategories);
      }

      const loadedLinks = await loadLinks();
      setCategories(loadedCategories);
      setSavedLinks(loadedLinks);
      setSelectedCategoryId(loadedCategories[0].id);
    };
    loadData();
  }, []);

  // 更新固定链接
  useEffect(() => {
    const dockedItems = savedLinks.filter((link) => link.isDocked);
    setDockedLinks(dockedItems);
  }, [savedLinks]);

  // 加载设置
  useEffect(() => {
    const loadAppSettings = async () => {
      const settings = await loadSettings();
      setSelectedSearchEngine(settings.searchEngine);
      setBackgroundColor(settings.backgroundColor);
      setBackgroundImageUrl(settings.backgroundImageUrl);
    };
    loadAppSettings();
  }, []);

  // 修改加载背景图片的 useEffect
  useEffect(() => {
    const loadBackground = async () => {
      try {
        const result = await chrome.storage.sync.get([
          "backgroundImageUrl",
          "backgroundColor",
        ]);
        if (result.backgroundImageUrl) {
          setBackgroundImageUrl(result.backgroundImageUrl);
        }
        if (result.backgroundColor) {
          setBackgroundColor(result.backgroundColor);
        }
      } catch (error) {
        console.error("加载背景设置失败:", error);
      }
    };
    loadBackground();
  }, []);

  // 搜索处理
  const handleKeyPress = () => {
    if (!searchText.trim()) return;
    const searchUrl = getSearchUrl(selectedSearchEngine, searchText);
    window.open(searchUrl, "_blank");
  };

  // 分类菜单项
  const getCategoryMenuItems = (category: Category) => {
    if (category.isHome) return [];

    return [
      {
        key: "rename",
        label: "重命名",
        icon: <EditOutlined />,
        onClick: () => handleOpenRename(category),
      },
      {
        key: "delete",
        label: "删除",
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleDeleteCategory(category.id),
      },
    ];
  };

  // 修改链接菜单项
  const getLinkMenuItems = (link: SavedLink) => [
    {
      key: "dock",
      label: link.isDocked ? "取消固定" : "固定到底栏",
      icon: link.isDocked ? <StarFilled /> : <StarOutlined />,
      onClick: () => handleToggleDock(link),
    },
    {
      key: "edit",
      label: "编辑",
      icon: <EditOutlined />,
      onClick: () => handleEditLink(link),
    },
    {
      key: "delete",
      label: "删除",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDeleteLink(link),
    },
  ];

  // 删除分类
  const handleDeleteCategory = async (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category?.isHome) {
      messageApi.error("首页分类不能删除");
      return;
    }

    const updatedCategories = categories.filter((c) => c.id !== categoryId);
    const updatedLinks = savedLinks.filter(
      (link) => link.categoryId !== categoryId
    );

    await Promise.all([
      saveCategories(updatedCategories),
      saveLinks(updatedLinks),
    ]);

    setCategories(updatedCategories);
    setSavedLinks(updatedLinks);
    setSelectedCategoryId(updatedCategories[0].id);
    messageApi.success("删除成功");
  };

  // 切换固定状态
  const handleToggleDock = async (link: SavedLink) => {
    const updatedLinks = savedLinks.map((item) =>
      item.id === link.id ? { ...item, isDocked: !item.isDocked } : item
    );
    await saveLinks(updatedLinks);
    setSavedLinks(updatedLinks);
  };

  // 链接分组
  const groupedLinks = React.useMemo(() => {
    return savedLinks.reduce((acc, link) => {
      if (!acc[link.categoryId]) {
        acc[link.categoryId] = [];
      }
      acc[link.categoryId].push(link);
      return acc;
    }, {} as { [key: string]: SavedLink[] });
  }, [savedLinks]);

  // 处理添加分类
  const handleAddCategory = async (values: {
    name: string;
    icon: string;
    color?: string;
  }) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: values.name.trim(),
      icon: values.icon,
      color: values.color, // 已经是十六进制字符串
      isHome: false,
    };

    const updatedCategories = [...categories, newCategory];
    await chrome.storage.sync.set({ categories: updatedCategories });
    setCategories(updatedCategories);
    setIsModalVisible(false);
    messageApi.success("添加成功");
  };

  // 处理编辑链接
  const handleEditLink = (link: SavedLink) => {
    setEditingLink(link);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
    setEditLinkCategory(link.categoryId);
    setIsEditLinkModalVisible(true);
  };

  // 保存编辑的链接
  const handleSaveLink = async () => {
    if (!editingLink || !editLinkTitle.trim() || !editLinkUrl.trim()) {
      messageApi.error("请填写完整信息");
      return;
    }

    try {
      const updatedLinks = savedLinks.map((link) =>
        link.id === editingLink.id
          ? {
              ...link,
              title: editLinkTitle.trim(),
              url: editLinkUrl.trim(),
              categoryId: editLinkCategory,
              timestamp: Date.now(),
            }
          : link
      );

      await saveLinks(updatedLinks);
      setSavedLinks(updatedLinks);
      setIsEditLinkModalVisible(false);
      messageApi.success("修改成功");
    } catch (error) {
      console.error("Edit link error:", error);
      messageApi.error("修改失败");
    }
  };

  // 处理删除链接
  const handleDeleteLink = async (link: SavedLink) => {
    try {
      const updatedLinks = savedLinks.filter((item) => item.id !== link.id);
      await saveLinks(updatedLinks);
      setSavedLinks(updatedLinks);
      messageApi.success("删除成功");
    } catch (error) {
      console.error("Delete link error:", error);
      messageApi.error("删除失败");
    }
  };

  // 添加保存设置函数
  const handleSaveSettings = async () => {
    await saveSettings({ searchEngine: selectedSearchEngine });
    messageApi.success("设置保存成功");
    setIsSettingsVisible(false);
  };

  // 处理重命名
  const handleRenameCategory = async (values: {
    name: string;
    icon: string;
    color?: string;
  }) => {
    if (!renamingCategory) return;

    const updatedCategories = categories.map((category) =>
      category.id === renamingCategory.id
        ? {
            ...category,
            name: values.name.trim(),
            icon: values.icon,
            color: values.color,
          }
        : category
    );

    await saveCategories(updatedCategories);
    setCategories(updatedCategories);
    setIsRenameModalVisible(false);
    setRenamingCategory(null);
    messageApi.success("修改成功");
  };

  // 打开重命名模态框
  const handleOpenRename = (category: Category) => {
    setRenamingCategory(category);
    setIsRenameModalVisible(true);
  };

  // 获取网站 favicon
  const getFavicon = async (url: string): Promise<string> => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // 尝试不同的 favicon 路径
      const faviconUrls = [
        `${urlObj.origin}/favicon.ico`,
        `${urlObj.origin}/favicon.png`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`, // Google 的 favicon 服务
      ];

      // 检查图标是否可访问
      for (const faviconUrl of faviconUrls) {
        try {
          const response = await fetch(faviconUrl);
          if (response.ok) {
            return faviconUrl;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          continue;
        }
      }

      // 如果都失败了，返回 Google 的 favicon 服务
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (error) {
      console.error("获取 favicon 失败:", error);
      return ""; // 返回空字符串表示使用默认图标
    }
  };

  // 修改添加链接的处理函数
  const handleAddLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      messageApi.error("请填写完整信息");
      return;
    }

    try {
      const newUrl = newLinkUrl.startsWith("http")
        ? newLinkUrl
        : `https://${newLinkUrl}`;

      // 获取网站标题（如果用户没有输入标题）
      let title = newLinkTitle.trim();
      if (!title) {
        try {
          const response = await fetch(newUrl);
          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, "text/html");
          title = doc.title || newUrl;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          title = newUrl;
        }
      }

      // 获取网站图标
      const icon = await getFavicon(newUrl);

      const newLink: SavedLink = {
        id: Date.now().toString(),
        title,
        url: newUrl,
        categoryId: selectedCategoryId,
        timestamp: Date.now(),
        isDocked: false,
        icon,
      };

      const updatedLinks = [...savedLinks, newLink];
      await saveLinks(updatedLinks);
      setSavedLinks(updatedLinks);
      setIsAddLinkModalVisible(false);
      setNewLinkTitle("");
      setNewLinkUrl("");
      messageApi.success("添加成功");
    } catch (error) {
      console.log("❗️ ~ handleAddLink ~ error:", error);
      messageApi.error("添加失败");
    }
  };

  // 修改选择图片的函数
  const handleSelectBingImage = async (url: string) => {
    await saveSettings({
      backgroundImageUrl: url,
      backgroundColor: "", // 清除背景色
    });
    setBackgroundImageUrl(url);
    setBackgroundColor("");
    messageApi.success("背景设置成功");
  };

  // 修改选择纯色背景的函数
  const handleSelectColor = async (color: string) => {
    await saveSettings({
      backgroundColor: color,
      backgroundImageUrl: "", // 清除背景图
    });
    setBackgroundColor(color);
    setBackgroundImageUrl("");
    messageApi.success("背景设置成功");
  };

  // 添加加载 Bing 图片的函数
  const loadBingImages = async () => {
    try {
      setLoadingImages(true);
      const images = await getBingImages();
      setBingImages(images);
    } catch (error) {
      console.log("❗️ ~ loadBingImages ~ error:", error);
      messageApi.error("获取 Bing 图片失败");
    } finally {
      setLoadingImages(false);
    }
  };

  // 添加导入导出相关函数
  const handleExportData = async () => {
    try {
      const data = await exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `c-tab-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      messageApi.success('导出成功')
    } catch (error) {
      console.error('Export error:', error)
      messageApi.error('导出失败')
    }
  }

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      
      // 重新加载数据
      const [loadedCategories, loadedLinks, settings] = await Promise.all([
        loadCategories(),
        loadLinks(),
        loadSettings()
      ])

      // 确保有数据再设置状态
      if (loadedCategories.length > 0) {
        setCategories(loadedCategories)
        setSelectedCategoryId(loadedCategories[0].id)
      }
      
      if (loadedLinks) {
        setSavedLinks(loadedLinks)
      }

      if (settings) {
        setSelectedSearchEngine(settings.searchEngine || 'google')
        setBackgroundColor(settings.backgroundColor || '#f0f2f5')
        setBackgroundImageUrl(settings.backgroundImageUrl || '')
      }

      messageApi.success('导入成功')
    } catch (error) {
      console.error('Import error:', error)
      messageApi.error('导入失败：' + (error as Error).message)
    }
  }

  return (
    <div
      className="app-layout"
      style={
        backgroundImageUrl
          ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }
          : {
              backgroundColor,
            }
      }
    >
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
              <Row gutter={[16, 16]} className="links-grid">
                {(groupedLinks[selectedCategoryId] || []).map((link, index) => (
                  <Col key={link.id}>
                    <LinkCard
                      link={link}
                      menuItems={getLinkMenuItems(link)}
                      className={`fade-in delay-${(index % 3) + 1}`}
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
                        <PlusOutlined
                          style={{ fontSize: "24px", color: "#8c8c8c" }}
                        />
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
      {dockedLinks.length > 0 && <DockBar links={dockedLinks} />}

      {/* 添加分类 Modal */}
      <Modal
        title="添加分类"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          form.resetFields();
          setIsModalVisible(false);
        }}
      >
        <CategoryForm form={form} onFinish={handleAddCategory} />
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
            onChange={(e) => setEditLinkTitle(e.target.value)}
            style={{ marginBottom: 16 }}
            maxLength={50}
          />
          <Input
            placeholder="链接地址"
            value={editLinkUrl}
            onChange={(e) => setEditLinkUrl(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Select
            style={{ width: "100%" }}
            value={editLinkCategory}
            onChange={setEditLinkCategory}
            placeholder="选择分类"
          >
            {categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>
                {category.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* 设置 Modal */}
      <Modal
        title="设置"
        open={isSettingsVisible}
        onOk={handleSaveSettings}
        onCancel={() => setIsSettingsVisible(false)}
        cancelText="取消"
        okText="保存"
      >
        <div className="settings-section">
          <h3>默认搜索引擎</h3>
          <Radio.Group
            value={selectedSearchEngine}
            onChange={(e) => setSelectedSearchEngine(e.target.value)}
          >
            <Radio.Button value="google">Google</Radio.Button>
            <Radio.Button value="baidu">百度</Radio.Button>
            <Radio.Button value="bing">Bing</Radio.Button>
          </Radio.Group>
        </div>

        <div className="settings-section">
          <h3>背景设置</h3>
          <div className="background-preview">
            {backgroundImageUrl ? (
              <div className="current-background">
                <img src={backgroundImageUrl} alt="当前背景" />
              </div>
            ) : (
              <div
                className="current-background solid-background"
                style={{ backgroundColor }}
              />
            )}
            <div className="background-actions">
              <Button
                icon={<PictureOutlined />}
                onClick={loadBingImages}
                loading={loadingImages}
              >
                选择 Bing 图片
              </Button>
              <div className="color-presets">
                {[
                  "#f0f2f5", // 默认浅灰
                  "#ffffff", // 纯白
                  "#141414", // 深色
                  "#e6f4ff", // 浅蓝
                  "#f6ffed", // 浅绿
                  "#fff7e6", // 浅橙
                  "#fff1f0", // 浅红
                  "#f9f0ff", // 浅紫
                ].map((color) => (
                  <div
                    key={color}
                    className={`color-preset ${
                      backgroundColor === color ? "active" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleSelectColor(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="bing-images">
              {bingImages.map((image, index) => (
                <div
                  key={index}
                  className="bing-image-item"
                  onClick={() => handleSelectBingImage(image.url)}
                >
                  <img src={image.thumbnailUrl} alt={image.title} />
                  <div className="image-info">
                    <div className="image-title">{image.title}</div>
                    <div className="image-copyright">{image.copyright}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>数据管理</h3>
          <Space>
            <Button onClick={handleExportData}>
              导出数据
            </Button>
            <Upload
              accept=".json"
              showUploadList={false}
              beforeUpload={(file) => {
                handleImportData(file)
                return false
              }}
            >
              <Button>导入数据</Button>
            </Upload>
          </Space>
          <div className="settings-tip">
            导出的数据包含所有分类、链接和设置信息
          </div>
        </div>
      </Modal>

      {/* 重命名分类 Modal */}
      <Modal
        title="编辑分类"
        open={isRenameModalVisible}
        onOk={() => editForm.submit()}
        onCancel={() => {
          editForm.resetFields();
          setIsRenameModalVisible(false);
          setRenamingCategory(null);
        }}
      >
        <CategoryForm
          form={editForm}
          initialValues={renamingCategory}
          onFinish={handleRenameCategory}
        />
      </Modal>

      {/* 新增链接 Modal */}
      <Modal
        title="新增链接"
        open={isAddLinkModalVisible}
        onOk={handleAddLink}
        cancelText="取消"
        okText="保存"
        onCancel={() => {
          setIsAddLinkModalVisible(false);
          setNewLinkTitle("");
          setNewLinkUrl("");
        }}
      >
        <div className="edit-link-form">
          <Input
            placeholder="链接标题"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            style={{ marginBottom: 16 }}
            maxLength={20}
          />
          <Input
            placeholder="链接地址"
            value={newLinkUrl}
            onChange={(e) => setNewLinkUrl(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

export default App;
