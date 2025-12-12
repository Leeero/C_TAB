# C_TAB - 新标签页管理器

C_TAB 是一个 Chrome 扩展程序，提供美观且功能丰富的新标签页管理体验。它支持分类管理、快速搜索、自定义背景等功能，帮助用户更好地组织和访问常用网站。

## 主要功能

### 1. 分类管理
- 支持创建多个分类并自定义图标和颜色
- 首页分类默认固定
- 支持分类重命名和删除
- 左侧 Dock 栏分类导航

### 2. 链接管理
- 网格布局展示链接卡片
- 自动获取网站图标
- **支持拖拽排序，自定义链接顺序**
- 支持固定到底部快速访问栏
- 支持编辑和删除链接
- 可选择在新标签页或当前页面打开链接

### 3. 搜索功能
- 支持 Google、百度、Bing 搜索引擎
- 可设置默认搜索引擎
- 搜索框自动聚焦

### 4. 个性化设置
- 支持纯色背景
- 支持必应每日壁纸
- 深色模式自适应
- 响应式布局设计

### 5. 数据管理
- 支持数据导入导出
- 本地数据自动同步
- 支持从其他标签页管理器导入数据

## 开发指南

### 环境要求
- Node.js >= 18
- npm >= 8

### 安装依赖
```bash
npm install
```

### 开发命令
```bash
# 开发模式
npm run dev:extension

# 测试构建
npm run test:build

# 生产构建
npm run build:extension

# 打包 ZIP
npm run build:zip
```

### 目录结构
```
src/
├── components/        # 组件目录
├── utils/            # 工具函数
├── types/            # TypeScript 类型定义
├── styles/           # 全局样式
├── config/           # 配置文件
├── background/       # 后台脚本
├── content/          # 内容脚本
└── popup/            # 弹出窗口
```

## 发布流程

1. 更新版本号
```bash
# 更新 manifest.json 和 package.json 中的版本号
git tag v1.0.0
git push origin v1.0.0
```

2. 测试构建
```bash
npm run test:build
```

3. 检查清单
- 参考 `scripts/release-checklist.md`
- 确保所有功能正常工作
- 检查深色模式显示

4. 创建发布
- GitHub Actions 会自动构建和发布
- 生成 ZIP 文件供用户下载

## 安装方法

### 开发版本安装
1. 克隆仓库并安装依赖
2. 运行 `npm run build:extension`
3. 打开 Chrome 扩展管理页面
4. 开启开发者模式
5. 加载 `dist` 目录

### 发布版本安装
1. 从 [Releases](https://github.com/你的用户名/c-tab/releases) 下载最新版本
2. 解压 ZIP 文件
3. 在 Chrome 扩展管理页面加载解压目录

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License


