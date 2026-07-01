/*
 * @Author       : leroli
 * @Date         : 2024-12-23 11:12:53
 * @Description  : 首页
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Layout, Modal, Drawer, message, Input, Radio, Row, Col, Select,
  Button, Form, Space, Upload, Switch, Tag, Popconfirm,
} from "antd";
import {
  EditOutlined, DeleteOutlined, StarOutlined, StarFilled,
  PlusOutlined, PictureOutlined,
} from "@ant-design/icons";
import SearchBox from "./components/SearchBox";
import CategoryDock from "./components/CategoryDock";
import LinkCard from "./components/LinkCard";
import DockBar from "./components/DockBar";
import CategoryForm from "./components/CategoryForm";
import BackgroundEditor from "./components/BackgroundEditor";
import SessionManager from "./components/SessionManager";
import ErrorBoundary from "./components/ErrorBoundary";
import { Category, SavedLink, SearchEngine } from "./types";
import "./App.css";
import { getSearchUrl, builtinSearchEngines } from "./config/searchEngines";
import styles from "./App.css?inline";
import { saveLinks, saveCategories, loadLinks, loadCategories } from "./utils/storage";
import { importFromBookmarks, exportToBookmarks } from "./utils/bookmarks";
import { checkAllLinks } from "./utils/linkHealth";
import { openCategoryAsTabGroup } from "./utils/tabGroups";
import { AppstoreOutlined } from "@ant-design/icons";
import { useCategories } from "./hooks/useCategories";
import { useLinks } from "./hooks/useLinks";
import { useSettings } from "./hooks/useSettings";
import { useBackground } from "./hooks/useBackground";
import { useSessions } from "./hooks/useSessions";

const { Content } = Layout;

function AppInner() {
  const [messageApi, contextHolder] = message.useMessage();
  const notify = useCallback(
    (type: "success" | "error", msg: string) => {
      if (type === "success") messageApi.success(msg);
      else messageApi.error(msg);
    },
    [messageApi]
  );

  const cat = useCategories(notify);
  const links = useLinks(notify);
  const settings = useSettings(notify);
  const bg = useBackground(notify);
  const sessions = useSessions(notify);

  const [searchText, setSearchText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 自定义引擎管理状态
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);
  const [newEngineName, setNewEngineName] = useState("");
  const [newEngineUrl, setNewEngineUrl] = useState("");

  // ── 初始化 ────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const loadedCategories = await cat.initCategories();
      await links.loadAllLinks();
      await settings.initSettings();
      await bg.initBackground();
      await sessions.initSessions();

      const allLinks = links.savedLinks;
      if (allLinks.length > 0 || loadedCategories.length > 1) {
        chrome.storage.local
          .set({
            ctab_backup_links: allLinks.map((l) => ({
              id: l.id, title: l.title, url: l.url, categoryId: l.categoryId,
              isDocked: l.isDocked, icon: l.icon, order: l.order, timestamp: l.timestamp,
            })),
            ctab_backup_categories: loadedCategories,
          })
          .catch(() => {});
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === "DATA_REFRESHED") {
        links.loadAllLinks();
        loadCategories().then((cats) => {
          cat.setCategories(cats);
          if (cats.length > 0 && !cat.selectedCategoryId) {
            cat.setSelectedCategoryId(cats[0].id);
          }
        });
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat.selectedCategoryId]);

  // ── 搜索 ──────────────────────────────────────────
  const handleKeyPress = useCallback(() => {
    if (!searchText.trim()) return;
    const searchUrl = getSearchUrl(settings.selectedSearchEngine, searchText, settings.customEngines);
    window.open(searchUrl, "_blank");
  }, [searchText, settings.selectedSearchEngine, settings.customEngines]);

  // ── Favicon 三级 fallback ─────────────────────────
  const getFavicon = useCallback(async (url: string): Promise<string> => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      // 优先尝试 origin/favicon
      const localUrls = [
        `${urlObj.origin}/favicon.ico`,
        `${urlObj.origin}/favicon.png`,
      ];
      for (const faviconUrl of localUrls) {
        try {
          const response = await fetch(faviconUrl);
          if (response.ok) return faviconUrl;
        } catch { continue; }
      }
      // Google Favicon 服务
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch { return ""; }
  }, []);

  // ── 标签组 ────────────────────────────────────────
  const handleOpenAsTabGroup = useCallback(async (categoryId: string) => {
    const count = await openCategoryAsTabGroup(categoryId);
    if (count > 0) {
      notify("success", `已在标签组中打开 ${count} 个标签页`);
    } else {
      notify("error", "该分类下没有链接");
    }
  }, [notify]);

  // ── 菜单项 ────────────────────────────────────────
  const getCategoryMenuItems = useCallback(
    (category: Category) => {
      if (category.isHome) return [];
      return [
        { key: "rename", label: "重命名", icon: <EditOutlined />, onClick: () => cat.openRename(category) },
        {
          key: "tabgroup", label: "在标签组中打开", icon: <AppstoreOutlined />,
          onClick: () => handleOpenAsTabGroup(category.id),
        },
        {
          key: "delete", label: "删除", icon: <DeleteOutlined />, danger: true,
          onClick: () => cat.deleteCategory(category.id, links.savedLinks).then((updated) => {
            if (updated) links.setSavedLinks(updated);
          }),
        },
      ];
    },
    [cat, links, handleOpenAsTabGroup]
  );

  const getLinkMenuItems = useCallback(
    (link: SavedLink) => [
      {
        key: "dock", label: link.isDocked ? "取消固定" : "固定到底栏",
        icon: link.isDocked ? <StarFilled /> : <StarOutlined />,
        onClick: () => links.toggleDock(link),
      },
      { key: "edit", label: "编辑", icon: <EditOutlined />, onClick: () => links.openEditLink(link) },
      { key: "delete", label: "删除", icon: <DeleteOutlined />, danger: true, onClick: () => links.deleteLink(link) },
    ],
    [links]
  );



  // ── 书签同步 ──────────────────────────────────────
  const [isSyncingBookmarks, setIsSyncingBookmarks] = useState(false);

  const handleImportFromBookmarks = useCallback(async () => {
    setIsSyncingBookmarks(true);
    try {
      const { categories: newCats, links: newLinks } = await importFromBookmarks();
      if (newCats.length === 0 && newLinks.length === 0) {
        notify("success", "没有发现新的书签数据");
        setIsSyncingBookmarks(false);
        return;
      }
      Modal.confirm({
        title: "确认导入书签",
        content: (
          <div>
            <p>发现以下可导入的书签数据：</p>
            <p style={{ margin: "8px 0" }}>
              <b>{newLinks.length}</b> 个书签链接
              {newCats.length > 0 && <>, <b>{newCats.length}</b> 个文件夹</>}
            </p>
            {newCats.length > 0 && (
              <p style={{ fontSize: 12, color: "#8c8c8c" }}>
                文件夹：{newCats.map(c => c.name).join("、")}
              </p>
            )}
            <p style={{ fontSize: 12, color: "#8c8c8c" }}>已存在的书签不会重复导入。</p>
          </div>
        ),
        okText: "确认导入",
        cancelText: "取消",
        onOk: async () => {
          const existingLinks = await loadLinks();
          const existingCats = await loadCategories();
          await saveLinks([...existingLinks, ...newLinks]);
          await saveCategories([...existingCats, ...newCats]);
          await links.loadAllLinks();
          await cat.initCategories();
          notify("success", `导入 ${newLinks.length} 个书签，${newCats.length} 个文件夹`);
        },
      });
    } catch (error) {
      console.error("Bookmarks import error:", error);
      notify("error", "书签导入失败");
    } finally {
      setIsSyncingBookmarks(false);
    }
  }, [links, cat, notify]);

  const handleExportToBookmarks = useCallback(async () => {
    try {
      await exportToBookmarks();
      notify("success", "已导出到 Chrome 书签栏 'C_TAB Bookmarks' 文件夹");
    } catch (error) {
      console.error("Bookmarks export error:", error);
      notify("error", "书签导出失败");
    }
  }, [notify]);

  // ── 链接健康检测 ──────────────────────────────────
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [checkProgress, setCheckProgress] = useState({ checked: 0, total: 0 });

  const handleCheckLinks = useCallback(async () => {
    setIsCheckingLinks(true);
    setCheckProgress({ checked: 0, total: 0 });
    try {
      await checkAllLinks((checked, total) => {
        setCheckProgress({ checked, total });
      });
      notify("success", "链接检测完成");
    } catch (error) {
      console.error("Link check error:", error);
      notify("error", "链接检测失败");
    } finally {
      setIsCheckingLinks(false);
    }
  }, [notify]);

  // ── 自定义引擎管理 ────────────────────────────────
  const handleAddEngine = useCallback(() => {
    if (!newEngineName.trim() || !newEngineUrl.trim()) {
      notify("error", "请填写引擎名称和搜索 URL");
      return;
    }
    if (!newEngineUrl.includes("{keyword}")) {
      notify("error", "搜索 URL 必须包含 {keyword} 占位符");
      return;
    }
    const engine: SearchEngine = {
      id: `custom_${Date.now()}`,
      name: newEngineName.trim(),
      searchUrl: newEngineUrl.trim(),
      isBuiltin: false,
    };
    settings.addEngine(engine);
    setNewEngineName("");
    setNewEngineUrl("");
    setIsEngineModalOpen(false);
  }, [newEngineName, newEngineUrl, settings, notify]);

  // 合并引擎列表
  const allEngines = [...builtinSearchEngines, ...settings.customEngines];

  return (
    <div className="app-layout" style={{ backgroundColor: bg.backgroundColor || "#f0f2f5" }}>
      {bg.backgroundImageUrl && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${bg.backgroundImageUrl})`,
          backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
          opacity: bg.bgOpacity / 100, pointerEvents: "none", zIndex: 0,
        }} />
      )}
      <style>{styles}</style>
      {contextHolder}

      <SearchBox
        searchText={searchText} onSearch={setSearchText} onKeyPress={handleKeyPress}
        searchEngine={settings.selectedSearchEngine} savedLinks={links.savedLinks}
        customEngines={settings.customEngines}
        onToggleDock={links.toggleDock}
      />

      <CategoryDock
        categories={cat.categories} selectedCategoryId={cat.selectedCategoryId}
        onSelectCategory={cat.setSelectedCategoryId}
        onAddCategory={() => cat.setIsModalVisible(true)}
        onOpenSettings={() => settings.setIsSettingsVisible(true)}
        onOpenSessions={() => sessions.setIsSessionManagerOpen(true)}
        getCategoryMenuItems={getCategoryMenuItems}
        onDropLinkToCategory={links.moveLinkToCategory}
      />

      <Content className="app-content">
        <div className="content-scroll">
          {cat.selectedCategoryId && (
            <div className="category-section slide-up">
              <Row gutter={[16, 16]} className="links-grid">
                {(links.groupedLinks[cat.selectedCategoryId] || []).map((link, index) => (
                  <Col
                    key={link.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (links.draggingLinkId && links.draggingLinkId !== link.id) {
                        links.setDragOverLinkId(link.id);
                      }
                    }}
                    onDragLeave={() => links.setDragOverLinkId(null)}
                    onDrop={(event) => {
                      event.preventDefault();
                      links.setDragOverLinkId(null);
                      if (!links.draggingLinkId) return;
                      links.reorderLinksInCategory(links.draggingLinkId, link.id, cat.selectedCategoryId);
                      links.setDraggingLinkId(null);
                    }}
                  >
                    <LinkCard
                      link={link} menuItems={getLinkMenuItems(link)}
                      openInNewTab={settings.openInNewTab}
                      className={`fade-in delay-${(index % 3) + 1}`}
                      draggable isDragging={links.draggingLinkId === link.id}
                      isDragOver={links.dragOverLinkId === link.id}
                      isJustDropped={links.justDroppedLinkId === link.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", link.id);
                        e.dataTransfer.effectAllowed = "move";
                        links.setDraggingLinkId(link.id);
                      }}
                      onDragEnd={() => { links.setDraggingLinkId(null); links.setDragOverLinkId(null); }}
                    />
                  </Col>
                ))}
                <Col>
                  <div className="link-card add-link-card" onClick={() => links.setIsAddLinkModalVisible(true)}>
                    <div className="link-content">
                      <div className="link-icon">
                        <PlusOutlined style={{ fontSize: "24px", color: "#8c8c8c" }} />
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
      {links.dockedLinks.length > 0 && (
        <DockBar openInNewTab={settings.openInNewTab} links={links.dockedLinks} getMenuItems={getLinkMenuItems} />
      )}

      {/* ── 添加分类 ── */}
      <Modal title="添加分类" open={cat.isModalVisible} onOk={() => form.submit()}
        onCancel={() => { form.resetFields(); cat.setIsModalVisible(false); }}>
        <CategoryForm form={form} onFinish={cat.addCategory} />
      </Modal>

      {/* ── 编辑链接（含备注 + 标签）── */}
      <Modal title="编辑链接" open={links.isEditLinkModalVisible} onOk={links.saveEditedLink}
        onCancel={() => links.setIsEditLinkModalVisible(false)}>
        <div className="edit-link-form">
          <Input placeholder="链接标题" value={links.editLinkTitle}
            onChange={(e) => links.setEditLinkTitle(e.target.value)} style={{ marginBottom: 16 }} maxLength={50} />
          <Input placeholder="链接地址" value={links.editLinkUrl}
            onChange={(e) => links.setEditLinkUrl(e.target.value)} style={{ marginBottom: 16 }} />
          <Select style={{ width: "100%" }} value={links.editLinkCategory}
            onChange={(v) => links.setEditLinkCategory(v)} placeholder="选择分类">
            {cat.categories.map((category) => (
              <Select.Option key={category.id} value={category.id}>{category.name}</Select.Option>
            ))}
          </Select>
          <Input.TextArea placeholder="备注（可选）" value={links.editLinkDescription}
            onChange={(e) => links.setEditLinkDescription(e.target.value)}
            style={{ marginTop: 16 }} rows={2} maxLength={200} showCount />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>标签（回车添加）</div>
            <TagInput tags={links.editLinkTags} onChange={links.setEditLinkTags} />
          </div>
        </div>
      </Modal>

      {/* ── 设置 ── */}
      <Drawer title="设置" placement="right" width={420} className="settings-drawer"
        open={settings.isSettingsVisible}
        onClose={() => settings.setIsSettingsVisible(false)}
        extra={<Button type="primary" onClick={settings.saveCurrentSettings}>保存</Button>}
        styles={{ body: { overflowY: "auto" } }}>
        <div className="settings-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>默认搜索引擎</h3>
            <Button size="small" type="link" onClick={() => setIsEngineModalOpen(true)}>
              <PlusOutlined /> 管理引擎
            </Button>
          </div>
          <Radio.Group value={settings.selectedSearchEngine}
            onChange={(e) => settings.setSelectedSearchEngine(e.target.value)}
            style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {allEngines.map((engine) => (
              <Radio.Button key={engine.id} value={engine.id}>{engine.name}</Radio.Button>
            ))}
          </Radio.Group>
        </div>
        <div className="settings-section">
          <h3>页面打开方式</h3>
          <Switch checked={settings.openInNewTab} onChange={settings.setOpenInNewTab}
            checkedChildren="新标签页打开" unCheckedChildren="当前页打开" />
        </div>
        <div className="settings-section">
          <h3>背景设置</h3>
          <div className="background-preview">
            {bg.backgroundImageUrl ? (
              <div className="current-background"><img src={bg.backgroundImageUrl} alt="当前背景" /></div>
            ) : (
              <div className="current-background solid-background" style={{ backgroundColor: bg.backgroundColor }} />
            )}
            <div className="background-actions">
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) bg.uploadBackground(file); e.target.value = ""; }} />
              <Button icon={<PictureOutlined />} onClick={() => fileInputRef.current?.click()}>上传背景图</Button>
              {bg.backgroundImageUrl && <Button onClick={bg.removeBackground}>恢复默认</Button>}
            </div>
            <div className="color-presets">
              {["#f0f2f5","#ffffff","#141414","#e6f4ff","#f6ffed","#fff7e6","#fff1f0","#f9f0ff"].map((color) => (
                <div key={color} className={`color-preset ${bg.backgroundColor === color ? "active" : ""}`}
                  style={{ backgroundColor: color }} onClick={() => bg.selectColor(color)} title={color} />
              ))}
            </div>
          </div>
        </div>
        <div className="settings-section">
          <h3>书签同步</h3>
          <Space wrap>
            <Button onClick={handleImportFromBookmarks} loading={isSyncingBookmarks}>
              从 Chrome 书签导入
            </Button>
            <Button onClick={handleExportToBookmarks}>
              导出到 Chrome 书签
            </Button>
          </Space>
          <div className="settings-tip">导入书签栏中的文件夹会自动转为分类</div>
        </div>

        <div className="settings-section">
          <h3>链接健康检测</h3>
          <Space>
            <Button onClick={handleCheckLinks} loading={isCheckingLinks}>
              {isCheckingLinks ? `检测中 ${checkProgress.checked}/${checkProgress.total}` : "一键检测所有链接"}
            </Button>
          </Space>
          <div className="settings-tip">检测链接可达性，每次间隔不少于 24 小时</div>
        </div>

        <div className="settings-section">
          <h3>数据管理</h3>
          <Space wrap>
            <Button onClick={settings.handleExportData}>导出数据</Button>
            <Upload accept=".json" showUploadList={false} beforeUpload={(file) => {
              Modal.confirm({
                title: "选择导入模式",
                content: (
                  <div>
                    <p>请选择导入方式：</p>
                    <p style={{ fontSize: 12, color: "#8c8c8c" }}>
                      <b>覆盖</b>：替换所有现有数据<br/>
                      <b>追加</b>：仅新增不重复的数据<br/>
                      <b>合并</b>：按链接去重，保留最新版本
                    </p>
                  </div>
                ),
                okText: "覆盖导入",
                cancelText: "追加导入",
                onOk: () => settings.importWithMode(file, "overwrite"),
                onCancel: () => {
                  Modal.confirm({
                    title: "追加还是合并？",
                    content: "追加：不修改已有数据 | 合并：按URL去重保留最新",
                    okText: "追加导入",
                    cancelText: "合并导入",
                    onOk: () => settings.importWithMode(file, "append"),
                    onCancel: () => settings.importWithMode(file, "merge"),
                  });
                },
              });
              return false;
            }}>
              <Button>导入数据</Button>
            </Upload>
          </Space>
          <div className="settings-tip">导出的数据包含所有分类、链接和设置信息</div>
        </div>
      </Drawer>

      {/* ── 编辑分类 ── */}
      <Modal title="编辑分类" open={cat.isRenameModalVisible}
        onOk={() => editForm.submit()}
        onCancel={() => { editForm.resetFields(); cat.setIsRenameModalVisible(false); }}>
        <CategoryForm form={editForm} initialValues={cat.renamingCategory} onFinish={cat.renameCategory} />
      </Modal>

      {/* ── 新增链接 ── */}
      <Modal title="新增链接" onOk={() => links.addNewLink(cat.selectedCategoryId, getFavicon)}
        open={links.isAddLinkModalVisible} cancelText="取消" okText="保存"
        onCancel={() => { links.setIsAddLinkModalVisible(false); links.setNewLinkTitle(""); links.setNewLinkUrl(""); }}>
        <div className="edit-link-form">
          <Input placeholder="链接标题" value={links.newLinkTitle}
            onChange={(e) => links.setNewLinkTitle(e.target.value)} style={{ marginBottom: 16 }} maxLength={20} />
          <Input placeholder="链接地址" value={links.newLinkUrl}
            onChange={(e) => links.setNewLinkUrl(e.target.value)} />
        </div>
      </Modal>

      {/* ── 背景图编辑器 ── */}
      <BackgroundEditor open={bg.editorOpen} imageUrl={bg.editorImageUrl} opacity={bg.bgOpacity}
        onSave={bg.editorSave} onCancel={bg.editorCancel} />

      {/* ── 标签页会话管理 ── */}
      <SessionManager open={sessions.isSessionManagerOpen} onClose={() => sessions.setIsSessionManagerOpen(false)} />

      {/* ── 自定义搜索引擎管理 ── */}
      <Modal title="管理搜索引擎" open={isEngineModalOpen}
        onCancel={() => setIsEngineModalOpen(false)} footer={null} width={480}>
        <div style={{ marginBottom: 16 }}>
          <Space.Compact style={{ width: "100%" }}>
            <Input placeholder="引擎名称" value={newEngineName}
              onChange={(e) => setNewEngineName(e.target.value)} style={{ width: 120 }} />
            <Input placeholder="搜索 URL（含 {keyword}）" value={newEngineUrl}
              onChange={(e) => setNewEngineUrl(e.target.value)} style={{ flex: 1 }} />
            <Button type="primary" onClick={handleAddEngine}>添加</Button>
          </Space.Compact>
          <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
            示例: https://github.com/search?q={"{keyword}"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 300, overflowY: "auto" }}>
          {builtinSearchEngines.map((e) => (
            <div key={e.id} className="engine-item" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <span><Tag color="blue" style={{ margin: 0 }}>{e.name}</Tag></span>
              <span style={{ fontSize: 11, color: "#8c8c8c" }}>内置</span>
            </div>
          ))}
          {settings.customEngines.map((e) => (
            <div key={e.id} className="engine-item" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0,0,0,0.06)",
            }}>
              <span><Tag style={{ margin: 0 }}>{e.name}</Tag></span>
              <Popconfirm title="确认删除？" onConfirm={() => settings.removeEngine(e.id)}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

// ── 标签输入组件 ──────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState("");
  const handleClose = (removedTag: string) => onChange(tags.filter(t => t !== removedTag));
  const handleInputConfirm = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInputValue("");
  };
  return (
    <div className="tag-input-wrapper">
      {tags.map(tag => (
        <Tag key={tag} closable onClose={() => handleClose(tag)} color="blue">{tag}</Tag>
      ))}
      <Input size="small" style={{ width: 100 }} value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleInputConfirm} onPressEnter={handleInputConfirm} placeholder="标签" />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;
