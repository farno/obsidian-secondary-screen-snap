/*
 * Secondary Screen Snap — Obsidian 桌面端插件
 * 快捷键抓取指定显示器（默认副屏）画面，写入附件文件夹并在当前光标处插入。
 * macOS: /usr/sbin/screencapture -x -D <displayIndex> <outfile>
 */

'use strict';

const obsidian = require('obsidian');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { Plugin, PluginSettingTab, Setting, Notice, TFile, moment } = obsidian;

const DEFAULT_SETTINGS = {
  displayIndex: 2,                                  // 1=主屏, 2=第二块屏, 3=第三块屏...
  attachmentFolder: 'attachments/网课截图',
  fileNameFormat: '网课截图 {{date:YYYY-MM-DD}} {{time:HH-mm-ss}}',
  insertStyle: 'embed',                             // embed: ![[..]]  |  link: [..]  |  markdown: ![](..)
  insertNewline: false,                             // 插入后是否补一个换行
  captureCursorArea: false,                         // true=只截光标所在区域? 否（保留字段，暂未使用）
  sound: false,                                     // 是否播放截图声（-x 去掉声音）
  skipDockTile: false,                              // 预留
  maxDisplayProbe: 4,                               // 测试时探测到第几块屏
};

/* ---------------- 工具函数 ---------------- */

function sanitizeFileName(name) {
  // 去掉 macOS / Obsidian 不允许的字符
  return name
    .replace(/[\/\\:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderFileName(fmt, displayIndex) {
  let out = String(fmt || '截图 {{date}}');
  out = out.replace(/{{\s*(date|time)\s*(?::\s*([^}]+?)\s*)?}}/g, function (_m, kind, f) {
    const m = moment();
    if (kind === 'time') return m.format(f || 'HH-mm-ss');
    return m.format(f || 'YYYY-MM-DD');
  });
  out = out.replace(/{{\s*display\s*}}/g, String(displayIndex));
  return sanitizeFileName(out);
}

// 读取 PNG 头部宽高（IHDR）
function pngSize(buf) {
  // PNG 签名 8 字节, 之后 4 字节长度 + 'IHDR' + width(4) + height(4)
  if (buf.length < 24) return null;
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  return { width: w, height: h };
}

function bufferToArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/* ---------------- 主插件 ---------------- */

class SecondaryScreenSnapPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'capture-secondary-screen-and-insert',
      name: '抓取副屏并插入到当前位置',
      callback: () => this.captureAndInsert(),
    });

    this.addCommand({
      id: 'capture-secondary-screen-pick',
      name: '抓取副屏（选择显示器）并插入',
      callback: () => this.captureWithPicker(),
    });

    this.addSettingTab(new SecondaryScreenSnapSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /* 通过 screencapture 抓某块屏，返回 PNG Buffer */
  captureDisplay(displayIndex) {
    return new Promise((resolve, reject) => {
      if (process.platform !== 'darwin') {
        reject(new Error('当前插件仅支持 macOS（使用系统 screencapture）。'));
        return;
      }
      const tmp = path.join(os.tmpdir(), 'obs-sssnap-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.png');
      const args = [];
      if (!this.settings.sound) args.push('-x');   // 静音
      args.push('-D', String(displayIndex));        // 指定显示器：1=主屏
      args.push('-t', 'png');
      args.push(tmp);

      execFile('/usr/sbin/screencapture', args, { encoding: 'buffer' }, async (err, _stdout, stderr) => {
        let buf = null;
        try {
          if (fs.existsSync(tmp)) {
            buf = fs.readFileSync(tmp);
          }
        } catch (e) { /* ignore */ }
        finally {
          try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) { /* 清理我们自己的临时文件 */ }
        }

        if (err) {
          const msg = (stderr && stderr.toString()) || err.message;
          reject(new Error('screencapture 失败：' + msg));
          return;
        }
        if (!buf || buf.length === 0) {
          reject(new Error('截图为空。请确认该显示器序号是否存在。'));
          return;
        }
        resolve(buf);
      });
    });
  }

  /* 确保附件文件夹存在，返回规范化后的文件夹路径（不以 / 开头/结尾） */
  async ensureFolder(folder) {
    let f = (folder || '').replace(/^\/+/, '').replace(/\/+$/, '').trim();
    if (!f) return '';
    const parts = f.split('/');
    let cur = '';
    for (const p of parts) {
      cur = cur ? cur + '/' + p : p;
      if (!this.app.vault.getAbstractFileByPath(cur)) {
        try { await this.app.vault.createFolder(cur); } catch (e) { /* 已存在则忽略 */ }
      }
    }
    return f;
  }

  buildEmbedText(relPath) {
    const style = this.settings.insertStyle;
    if (style === 'link') return '[' + relPath + ']';
    if (style === 'markdown') {
      const url = relPath.split('/').map(encodeURIComponent).join('/');
      return '![](' + url + ')';
    }
    return '![' + '[' + relPath + ']' + ']'; // embed wiki: ![[path]]
  }

  insertIntoEditor(text) {
    const leaves = this.app.workspace.getLeavesOfType('markdown');
    const leaf = this.app.workspace.getActiveViewOfType && this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
    let editor = null;
    if (leaf && leaf.editor) editor = leaf.editor;
    else if (leaves && leaves.length) {
      const ed = leaves[0].view && leaves[0].view.editor;
      if (ed) editor = ed;
    }
    if (!editor) {
      new Notice('没有可写入的编辑器（请先聚焦到一个 Markdown 笔记）。');
      return false;
    }
    let ins = text;
    if (this.settings.insertNewline) ins += '\n';
    editor.replaceSelection(ins);
    return true;
  }

  /* 主流程：抓屏 -> 存库 -> 插入 */
  async captureAndInsert(displayIndexArg) {
    const displayIndex = displayIndexArg || this.settings.displayIndex;
    try {
      new Notice('正在抓取第 ' + displayIndex + ' 块显示器…');
      const buf = await this.captureDisplay(displayIndex);

      const folder = await this.ensureFolder(this.settings.attachmentFolder);
      const baseName = renderFileName(this.settings.fileNameFormat, displayIndex);
      const dirPart = folder ? folder + '/' : '';
      const wanted = dirPart + baseName + '.png';
      const finalPath = this.app.vault.getAvailablePath ? this.app.vault.getAvailablePath(wanted, 'png') : wanted;

      let created = this.app.vault.getAbstractFileByPath(finalPath);
      if (created instanceof TFile) {
        await this.app.vault.modifyBinary(created, bufferToArrayBuffer(buf));
      } else {
        created = await this.app.vault.createBinary(finalPath, bufferToArrayBuffer(buf));
      }

      const ok = this.insertIntoEditor(this.buildEmbedText(created.path));
      if (ok) {
        const sz = pngSize(buf);
        new Notice('已插入：' + created.name + (sz ? '（' + sz.width + '×' + sz.height + '）' : ''));
      } else {
        new Notice('截图已保存到 ' + created.path + '，但未能插入（无活动编辑器）。');
      }
    } catch (e) {
      this.showError(e);
    }
  }

  /* 用一个简易弹层让用户临时选屏幕：这里用 FuzzySuggest 更专业，暂以序号快选实现 */
  captureWithPicker() {
    // 动态生成候选：1..maxDisplayProbe
    const view = new DisplaySuggestModal(this.app, this);
    view.open();
  }

  showError(e) {
    const msg = (e && e.message) ? e.message : String(e);
    let hint = '';
    if (/could not create image|Not permitted|permission|Operation not permitted|Screen Recording|Invalid display/i.test(msg)) {
      hint = '\n请授予 Obsidian「屏幕录制」权限：系统设置 → 隐私与安全性 → 屏幕录制 → 勾选 Obsidian 并重启 Obsidian；同时确认“显示器序号”在该机存在的范围内（如本机为 1~2）。';
    } else if (/仅支持 macOS/.test(msg)) {
      hint = '';
    }
    new Notice('抓屏失败：' + msg + hint);
    console.error('[Secondary Screen Snap]', e);
  }
}

/* 简易显示器选择弹层 */
class DisplaySuggestModal extends obsidian.FuzzySuggestModal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.setPlaceholder('选择要抓取的显示器（序号越大分辨率越准，回车确认）');
  }
  getItems() {
    const items = [];
    const n = Math.max(1, this.plugin.settings.maxDisplayProbe || 4);
    for (let i = 1; i <= n; i++) {
      items.push({ index: i, label: (i === 1 ? '第 1 块（主屏）' : '第 ' + i + ' 块（副屏 #' + i + '）') });
    }
    return items;
  }
  getItemText(item) { return item.label; }
  onChooseItem(item) {
    this.plugin.captureAndInsert(item.index);
  }
}

/* ---------------- 设置面板 ---------------- */

class SecondaryScreenSnapSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Secondary Screen Snap 设置' });

    new Setting(containerEl)
      .setName('显示器序号')
      .setDesc('1 = 主屏，2 = 第二块屏（通常是副屏 / 网课窗口）。可点右侧“测试”按钮探测每块屏的分辨率。')
      .addText(t => t
        .setValue(String(this.plugin.settings.displayIndex))
        .onChange(async (v) => {
          const n = parseInt(v, 10);
          this.plugin.settings.displayIndex = isNaN(n) || n < 1 ? 2 : n;
          await this.plugin.saveSettings();
        }))
      .addButton(b => b
        .setButtonText('测试抓屏')
        .setCta()
        .onClick(() => this.runTest()));

    new Setting(containerEl)
      .setName('附件保存文件夹')
      .setDesc('相对 vault 根目录，例如 attachments/网课截图。留空则存到 vault 根。')
      .addText(t => t
        .setPlaceholder('attachments/网课截图')
        .setValue(this.plugin.settings.attachmentFolder)
        .onChange(async (v) => {
          this.plugin.settings.attachmentFolder = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('文件名格式')
      .setDesc('支持 {{date:格式}}、{{time:格式}}、{{display}}。默认按日期时间命名。')
      .addText(t => t
        .setValue(this.plugin.settings.fileNameFormat)
        .onChange(async (v) => {
          this.plugin.settings.fileNameFormat = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('插入样式')
      .setDesc('embed=内嵌预览 ![[..]]，markdown=外链 ![](..) ，link=普通链接 [..]')
      .addDropdown(d => d
        .addOption('embed', '内嵌 ![[…]]（推荐）')
        .addOption('markdown', 'Markdown ![](…)')
        .addOption('link', '普通链接 […]')
        .setValue(this.plugin.settings.insertStyle)
        .onChange(async (v) => {
          this.plugin.settings.insertStyle = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('插入后换行')
      .setDesc('在插入内容后补一个换行，方便继续记笔记。')
      .addToggle(t => t
        .setValue(this.plugin.settings.insertNewline)
        .onChange(async (v) => {
          this.plugin.settings.insertNewline = v;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('截图提示音')
      .setDesc('开启后保留系统“咔嚓”声（关闭=静音，推荐上网课时静音）。')
      .addToggle(t => t
        .setValue(this.plugin.settings.sound)
        .onChange(async (v) => {
          this.plugin.settings.sound = v;
          await this.plugin.saveSettings();
        }));

    containerEl.createEl('p', {
      text: '提示：首次使用请授予 Obsidian「屏幕录制」权限（系统设置 → 隐私与安全性 → 屏幕录制），否则截图可能为空白。',
      cls: 'sssnap-hint',
    });
  }

  async runTest() {
    new Notice('测试抓屏中…');
    const n = Math.max(1, this.plugin.settings.maxDisplayProbe || 4);
    (async () => {
      for (let i = 1; i <= n; i++) {
        try {
          const buf = await this.plugin.captureDisplay(i);
          const sz = pngSize(buf);
          new Notice('第 ' + i + ' 块屏' + (sz ? '：' + sz.width + '×' + sz.height : '：已捕获') + (i === this.plugin.settings.displayIndex ? '（当前设置项）' : ''));
        } catch (e) {
          // 静默跳过不存在的屏，只对目标序号报错
          if (i === this.plugin.settings.displayIndex) {
            this.plugin.showError(e);
          }
        }
      }
    })();
  }
}

module.exports = SecondaryScreenSnapPlugin;
module.exports.default = SecondaryScreenSnapPlugin;
