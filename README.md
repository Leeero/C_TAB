# C_TAB - 简洁的标签页管理器

C_TAB 是一个 Chrome 扩展程序，帮助用户更好地管理和组织他们的网页收藏。它提供了类似 macOS Launchpad 的用户界面，让用户可以直观地管理自己的网页收藏。

## 功能特点

### 1. 快速保存
- 一键保存当前页面
- 自动获取网站图标和标题
- 支持手动编辑标题和 URL

### 2. 分类管理
- 支持创建多个分类
- 首页分类默认固定
- 右键菜单支持分类重命名和删除

### 3. 链接管理
- 网格布局展示所有链接
- 支持固定链接到底部 Dock 栏
- 右键菜单支持编辑和删除

### 4. 搜索功能
- 支持多搜索引擎（Google、百度、Bing）
- 可在设置中切换默认搜索引擎
- 搜索框显示当前搜索引擎

### 5. 其他特性
- 支持深色模式
- 响应式布局设计
- 数据本地存储
- 支持数据导入导出

## 技术栈

- React 18
- TypeScript
- Ant Design
- Vite
- Chrome Extension API

## 开发指南

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
npm install
```


### 开发模式

```bash
npm run dev:extension
```
### 构建生产版本
```bash
npm run build
```


### 加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 目录

## 安装方法

### 方法一：从 Release 安装
1. 访问 [Releases 页面](https://github.com/你的用户名/c-tab/releases)
2. 下载最新版本的 `c-tab.zip`
3. 打开 Chrome 浏览器，访问 `chrome://extensions/`
4. 开启"开发者模式"
5. 将下载的 zip 文件拖入浏览器窗口，或者解压后通过"加载已解压的扩展程序"加载

### 方法二：从源码构建
1. 克隆仓库
2. 运行 `npm install`
3. 运行 `npm run build`
4. 加载 `dist` 目录


