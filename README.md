# Secondary Screen Snap（Obsidian 副屏截图插件）

上网课时，Obsidian 在主屏、课程视频在副屏。按下快捷键即可**抓取副屏整屏画面**，自动存到附件文件夹并在**当前光标处**插入，全程不打断、不弹预览。

- 平台：**macOS 专用**（调用系统 `/usr/sbin/screencapture`）
- 抓取方式：整块显示器截图，原生分辨率，静音
- 插入位置：当前 Markdown 编辑器光标处

## 安装

1. 打开你的 vault 目录，进入 `.obsidian/plugins/`（没有就手动新建）。
2. 在其下新建文件夹 `secondary-screen-snap`（名字可自定）。
3. 把本目录的三个文件复制进去：
   - `main.js`
   - `manifest.json`
   - `styles.css`
   
   最终路径形如：
   ```
   <你的vault>/.obsidian/plugins/secondary-screen-snap/manifest.json
   <你的vault>/.obsidian/plugins/secondary-screen-snap/main.js
   <你的vault>/.obsidian/plugins/secondary-screen-snap/styles.css
   ```
4. 重启 Obsidian，或在 设置 → 第三方插件 里点“刷新”，然后**启用 “Secondary Screen Snap”**。

## 授予「屏幕录制」权限（关键）

首次抓屏必须授权，否则截图为空白或报 `could not create image from display`：

系统设置 → 隐私与安全性 → **屏幕录制** → 勾选 **Obsidian** → 完全退出并重启 Obsidian。

## 绑定快捷键

设置 → 快捷键 → 搜索 “Secondary Screen Snap”，为以下任一命令绑一个你顺手的组合键：

- **抓取副屏并插入到当前位置**（用设置里固定的显示器序号，网课推荐用这个）
- **抓取副屏（选择显示器）并插入**（临时弹层选屏）

例如设为 `⌥⇧4`（避开系统截图 `⌘⇧4`）。

## 设置说明

在 设置 → Secondary Screen Snap 中：

- **显示器序号**：`1` = 主屏，`2` = 第二块屏（一般是副屏/网课）。点右侧 **测试抓屏** 会逐块探测并提示每块分辨率，帮你确认副屏到底是第几块。
- **附件保存文件夹**：默认 `attachments/网课截图`，留空则存到 vault 根。
- **文件名格式**：默认 `网课截图 {{date:YYYY-MM-DD}} {{time:HH-mm-ss}}`，支持 `{{date:格式}}`、`{{time:格式}}`、`{{display}}`。
- **插入样式**：`内嵌 ![[…]]`（推荐）／`Markdown ![](…)`／`普通链接 […]`。
- **插入后换行**：在图片后补一个换行，方便接着写笔记。
- **截图提示音**：默认关闭（静音）。

## 工作原理与注意

- 命令执行时，Obsidian 窗口保持在前台激活状态，我们抓取的是**另一块显示器的整屏**，所以截到的是网课画面，不会拍到 Obsidian 自己。
- 截图先在系统临时目录生成 PNG，再读入写入 vault 附件，最后临时文件被清理。
- 若你的副屏是第 3、4 块，把序号改大即可；`测试抓屏` 会告诉你系统认到的最大屏号。

## 常见问题

- **插入的是空白图**：99% 是没给 Obsidian 屏幕录制权限，按上面重新授权并重启。
- **想抓到鼠标指针**：`screencapture` 整屏默认不含指针；如需要，可把序号对应屏幕后手动框选，或告诉我加参数。
- **Windows/Linux**：当前版本仅 macOS。需要跨平台可改用 Electron `desktopCapturer` 方案另做。
