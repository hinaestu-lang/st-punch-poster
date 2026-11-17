# repo美化 · 打孔海报

SillyTavern 第三方扩展：从聊天中划线、点句、收藏文字，制作打孔海报、卡片和 CSS 主题排版图片。

## 一键安装

在 **SillyTavern → 扩展 → 安装扩展** 中输入仓库地址：

`https://github.com/hinaestu-lang/st-punch-poster`

安装后刷新 SillyTavern 页面，在魔棒菜单中打开「repo美化」。**22 份 CSS 模板已内置，安装后直接可以选择，不需要逐个导入。**

> 从「酒馆助手脚本」迁移：先禁用酒馆助手中的旧「打孔海报」脚本，避免重复注入。两版共用 `extensionSettings['punch-poster']` 设置数据；已有自定义 CSS 会优先于内置同 ID 模板。

## 目录

- `manifest.json`：SillyTavern 第三方扩展清单（必须放仓库根目录）
- `index.js`：扩展主程序和内置模板注册
- `style.css`：界面样式
- `templates/`：22 份独立 CSS 源文件，方便下载、修改和重新导入

## 使用与升级

第一次安装后刷新页面；以后在 SillyTavern 扩展管理中更新。内置模板不占用用户的自定义模板存储；需要修改时可在 repo美化界面另行导入同 ID CSS，自己的版本会优先显示。

注意：目前以 Chromium/WebKit 兼容性设计为基础，不能保证所有酒馆主题、正则和手机系统表现完全一致。

## 回归检查

使用 Node.js 运行以下检查，无需安装额外依赖：

```sh
node tests/paragraphs.cjs
node tests/dom-paragraphs.cjs
node tests/tags.cjs
node tests/upload.cjs
node tests/state.cjs
```

覆盖段落提取、跨段选区、头像导出序列化、规则开关持久化、配色撤销及输入法状态。
这些是逻辑回归检查；iOS 键盘、滚动和最终 PNG 的显示仍需在实际设备验证。

