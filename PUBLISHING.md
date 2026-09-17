# 发布到 Obsidian 社区插件市场（Publishing）

发布本质是：把插件放进一个**公开 GitHub 仓库并打 Release**，再向 `obsidianmd/obsidian-releases` 提交一个 PR，把自己那一行加进 `community-plugins.json`。审核通过后即出现在 设置 → 第三方插件 浏览列表里。

## 前置：本地 manifest 合规

`manifest.json` 的必填字段（缺一即报错）：

- `id`：全局唯一，小写字母/数字/连字符，**发布后不可改**。这里为 `secondary-screen-snap`，GitHub 仓库名和 `.obsidian/plugins/` 下的文件夹名都用它。
- `name`：显示名，不要含 “Obsidian”“Plugin” 等冗余词。`Secondary Screen Snap` ✓
- `version`：语义化 `MAJOR.MINOR.PATCH`。`1.0.0` ✓
- `minAppVersion`：用到的 API 所需的最低 Obsidian 版本。`1.4.0` ✓
- `description`：1–2 句，突出功能。已给英文版本 ✓
- `author`：你的用户名/姓名。**把占位符 `YOUR_NAME` 换成真名。**
- `isDesktopOnly: true`：本插件用了 Node 的 `child_process`/`fs`，**必须** true。✓

可选：`authorUrl`（你的 GitHub 主页，占位符记得替换）、`fundingUrl`（赞助链接）。

> 用 `npx obsidian-plugin-validator` 或 `obsidianmd/obsidian-sample-plugin` 自带的 CI 可以本地先校验 manifest。

## 步骤一：建仓库

1. 新建**公开** GitHub 仓库，名如 `obsidian-secondary-screen-snap`。
2. 提交这些文件到根目录：`main.js`、`manifest.json`、`styles.css`、`README.md`、**`LICENSE`**（社区强烈要求，MIT 或 GPL 皆可）。
3. README 里写清：功能、动图/截图、**“所有截图只存本地 vault、不联网”**（隐私点，审核和用户都在意）、以及“需授予 Obsidian 屏幕录制权限”。
4. 建议 `.gitignore` 忽略 `.obsidian/`、`data.json`、`version-bump.json` 等本地文件。

可以直接用官方脚手架 `obsidianmd/obsidian-sample-plugin`（含发布用的 GitHub Action，自动同步版本号并打 Release），把源码丢进去更省事。

## 步骤二：打 GitHub Release

1. 建 tag `1.0.0`（或 `v1.0.0`）并发布 Release。
2. Release 的**资产(assets)**里上传：`main.js`、`manifest.json`、`styles.css`（部分审核也接受一个 zip，但三件套最稳）。Obsidian 更新器就是从最新 Release 拉这三个文件。

## 步骤三：提交收录 PR

1. Fork `obsidianmd/obsidian-releases`。
2. 编辑根目录 `community-plugins.json`，在数组里**按字母/按约定位置**追加一项（这是该文件的条目格式）：
   ```json
   {
     "id": "secondary-screen-snap",
     "name": "Secondary Screen Snap",
     "author": "YOUR_NAME",
     "desc": "Capture a secondary display (e.g. online course) with a hotkey and insert it at the cursor. macOS only.",
     "url": "https://github.com/YOUR_GITHUB_USERNAME/obsidian-secondary-screen-snap"
   }
   ```
3. 发 PR。会触发自动校验（obsidian-plugin-lint 等）；红色失败就按日志改，绿了再等人工审核。审核常提的点：命名/描述规范、无远程代码、无被废弃 API、README 与隐私说明清楚。

## 步骤四：后续更新

改代码 → 递增 `manifest.json` 的 `version` → 提交并打新 Release。用户端 Obsidian 会自动检测到新版本。（用 sample-plugin 的 Action 可自动完成 bump + release。）

## 针对本插件的提醒

- **macOS-only + 屏幕录制权限**：在 README 和 `description` 里明确，避免用户在 Windows 上装了报“仅支持 macOS”。审核偏好诚实描述平台限制。
- **调用了 `/usr/sbin/screencapture`**：这是调用系统本地二进制、不联网，属于允许范围；但要在 README 说清“不上传任何数据”。
- `isDesktopOnly` 必须保持 `true`，否则审核会要求你证明移动端可用（本插件用不了 Node API，移动端无解）。
