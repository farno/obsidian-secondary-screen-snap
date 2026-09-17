# 发布到 Obsidian 社区目录（Publishing — 2025 新流程）

> 重要变化：收录**不再**是向 `obsidianmd/obsidian-releases` 提 PR 改 `community-plugins.json`。现在走官方门户 **community.obsidian.md**：用 Obsidian 账号登录 → 关联 GitHub → “Add a plugin” 认领你的仓库 → 自动审核。权威文档：https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin

## 前置文件（仓库根目录，缺一不可）

- `README.md`：说明插件用途与用法（门户列表页会展示节选，相对图片链接会自动指向仓库）。
- `LICENSE`：许可证（本仓库为 MIT）。
- `manifest.json`：插件清单。`version` 用语义化 `x.y.z`；`id` 全局唯一且**不能包含 “obsidian”**（本插件 id=`secondary-screen-snap` ✓）。
- 遵循 Developer policies 与插件提交要求。

## Step 1：发布到 GitHub ✅（已完成）

仓库：https://github.com/farno/obsidian-secondary-screen-snap （公开，含 main.js / manifest.json / styles.css / README.md / LICENSE）。

## Step 2：创建 GitHub Release ✅（已完成）

- `manifest.json` 的 `version` = `1.0.0`，Release 的 **tag 必须等于该版本号** → 已建 tag `1.0.0`。
- Release 资产（binary attachments）已上传：`main.js`、`manifest.json`、`styles.css`。
- 查看：https://github.com/farno/obsidian-secondary-screen-snap/releases/tag/1.0.0

> 用户安装时，Obsidian 会去 GitHub 找**与 manifest 里 version 同名 tag** 的 Release，下载这三个文件。所以以后每次更新：改 manifest 的 version → 打对应 tag 的新 Release。

## Step 3：在门户提交（需要你本人操作）

1. 打开 https://community.obsidian.md → 右上角 **Sign in**，用你的 **Obsidian 账号**（邮箱+密码）登录。没有就点 “Create an account”。
2. 进入个人/账户设置，**Link GitHub account**（授权 Obsidian 门户访问你的 GitHub，用于校验仓库归属——要关联到拥有该仓库的 `farno` 账号）。
3. 选择 **Add a plugin / Claim**，填入仓库 `farno/obsidian-secondary-screen-snap`，认领。
4. 门户会读取默认分支 HEAD 的 `manifest.json` 并做**自动审核**，列出需要修正的问题。

## Step 4：处理审核反馈

- 按门户提示改仓库；需要新版本时，递增 `manifest.json` 的 version 并再打一个同名 tag 的 Release。
- 你可以随时编辑描述并点 **Publish**，但在自动审核的 error 清零前，插件在 Obsidian 内不可安装。

## 通过后

在论坛 Share & showcase 和 Discord `#updates`（需 developer 角色）公告你的插件。

---

### 备注：本仓库现状

- 平台限制：macOS-only（调用 `/usr/sbin/screencapture`），`isDesktopOnly: true`。README/描述里已注明，避免误装。
- 隐私：截图仅写入本地 vault，不联网。
- 你（作者）显示名 `farnolee`，GitHub 账号 `farno`；门户关联 GitHub 时请用 `farno`。
