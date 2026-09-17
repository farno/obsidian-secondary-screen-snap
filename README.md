# Secondary Screen Snap

Capture a specific monitor (for example a **secondary display showing an online course**) with a single hotkey, save the screenshot into your vault, and **insert it at the current cursor position** — without ever leaving Obsidian.

Built for note-taking during lectures: keep Obsidian on your main monitor, the course on the second one, and snap the course screen straight into your notes.

> ⚠️ **Platform: macOS only.** It calls the system `screencapture` binary. `isDesktopOnly: true`.

## Features

- One hotkey grabs the whole image of a chosen display at native resolution.
- The screenshot is written into your vault (default `attachments/网课截图/`) and embedded at the cursor as `![[...]]`.
- Configurable display index, target folder, filename format, and embed style.
- Silent capture by default (no shutter sound), no preview dialog — fastest possible flow.
- **All screenshots stay in your local vault. Nothing is uploaded anywhere; the plugin makes no network requests.**

## Install

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/farno/obsidian-secondary-screen-snap/releases/latest).
2. Put them in your vault at `.obsidian/plugins/secondary-screen-snap/`.
3. In Obsidian: Settings → Community plugins → refresh → enable **Secondary Screen Snap**.

*(Or install it from the Obsidian Community plugin directory by searching “Secondary Screen Snap”.)*

### Required: Screen Recording permission

The first capture needs macOS to allow Obsidian to record the screen, otherwise you get a blank image or `could not create image from display`:

**System Settings → Privacy & Security → Screen Recording → enable Obsidian → fully quit and reopen Obsidian.**

## Usage

1. Focus a Markdown note and place the cursor where you want the image.
2. Press your bound hotkey (see below) — the secondary screen is captured and inserted instantly.

### Bind a hotkey

Settings → Hotkeys → search “Secondary Screen Snap” and assign a shortcut to:

- **Capture secondary screen and insert at cursor** — uses the display index from settings (recommended for lectures).
- **Capture secondary screen (pick display) and insert** — choose a display each time.

Suggested combo: `⌥⇧4` (avoids the system screenshot `⌘⇧4`).

## Settings

- **Display index** — `1` = main, `2` = second monitor (usually your course screen). Use the **Test capture** button to probe each display and see its resolution.
- **Attachment folder** — relative to the vault root, e.g. `attachments/网课截图`. Leave empty for the vault root.
- **File name format** — supports `{{date:format}}`, `{{time:format}}`, `{{display}}`.
- **Insert style** — `embed ![[…]]` (default), `markdown ![](…)`, or plain link.
- **Insert newline** — append a line break after the image.
- **Shutter sound** — keep the system click sound (off by default).

## How it works & notes

- Obsidian stays in the foreground; the plugin captures the **other** display, so your notes are never in the shot.
- The image is generated as a PNG in a temp file, copied into the vault, and the temp file is cleaned up.
- If your course monitor is the 3rd or 4th display, just raise the index; **Test capture** reports the highest display the system recognizes.

## FAQ

- **Blank image after inserting?** → 99% missing Screen Recording permission. Re-grant it and restart Obsidian.
- **Can it capture the mouse cursor?** → Full-display `screencapture` does not include the pointer by default.
- **Windows / Linux?** → Not in this version (macOS-only).

## Privacy

Screenshots are saved only inside your local vault. The plugin performs no network calls and does not transmit any data.

## License

MIT © farnolee

---

## 中文说明

用快捷键抓取指定显示器（例如**显示网课的副屏**）的画面，保存到 vault 并在**当前光标处**插入，全程不离开 Obsidian。

- **仅支持 macOS**（调用系统 `screencapture`），`isDesktopOnly: true`。
- 截图默认存到 `attachments/网课截图/`，以 `![[…]]` 内嵌；可设置显示器序号、文件夹、文件名格式与插入样式。
- 默认静音、无预览，最快记录。**所有截图只存本地 vault，不联网、不上传任何数据。**

安装：从 [最新 Release](https://github.com/farno/obsidian-secondary-screen-snap/releases/latest) 下载 `main.js`/`manifest.json`/`styles.css`，放入 `<vault>/.obsidian/plugins/secondary-screen-snap/`，在第三方插件里启用。

首次使用请授予权限：系统设置 → 隐私与安全性 → 屏幕录制 → 勾选 Obsidian 并重启，否则截图为空白。

用法：聚焦笔记、放好光标，按你绑定的快捷键即可。设置 → 快捷键 搜索 “Secondary Screen Snap”，推荐 `⌥⇧4`。

许可证：MIT © farnolee
