# Party Deck PWA · 你比划我猜

[![Build, test and deploy](https://github.com/blackSnack/charades/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/blackSnack/charades/actions/workflows/ci.yml)

[![Latest release](https://img.shields.io/github/v/release/blackSnack/charades)](https://github.com/blackSnack/charades/releases/latest)

## 在线体验

**[立即开始游戏 → https://blacksnack.github.io/charades/](https://blacksnack.github.io/charades/)**

无需安装或注册。手机推荐 Safari / Chrome；iPhone 可在 Safari 分享菜单中选择「添加到主屏幕」。首次联网加载游戏和题库，后续可使用本地缓存（浏览器可能清理缓存）。

实验室：从首页进入，分别打开卡牌实验（卡组、难度、翻牌及应用）或音频实验（12 套 EP、24 首背景音乐候选、主题音效试听、选择及反馈导出）。音频候选仅用于评审，正式游戏不播放；卡组主题独立保存在本机，不改变题库与存档。默认仍为经典桌游卡。

## 项目描述

Party Deck 是一款面向朋友聚会、家庭娱乐的中文卡牌猜词 PWA。设计目标是打开即玩、离线可用、规则清晰、维护简单，兼顾桌游的趣味性和手机操作体验。

## 当前状态

- V3.0 已发布：Solo、2–8 人轮换、每轮答题目标、换题额度、分类及字数筛选、四级难度、游戏进度存档。
- 3,290 道题目、18 个分类；题库独立版本维护。
- V3.1 实验方向：四级卡牌翻转、流光、粒子和火焰装饰；实验入口与正式游戏隔离。
- 构建状态以顶部 GitHub Actions 徽章及 [Actions 日志](https://github.com/blackSnack/charades/actions) 为准。iPhone 真机输入、PWA 冷启动、性能等仍需实际验收。

## 愿景与路线图

| 阶段 | 目标 |
| --- | --- |
| V3.0 | 可玩的静态 PWA，完善核心规则及响应式交互 |
| V3.1 | 实验性卡牌动效、性能预算、按需加载 |
| 后续 | 通过验收后接入正式游戏，音效与可选语音识别 |
| 长期 | 独立题库生态、轻量离线体验、可扩展卡牌主题 |

## 开发与验证

Node.js 22。首次开发：`npm install`。

```sh
npm run dev
npm run validate-bank
npm test
npm run build
npm run check:vfx-size
npx playwright install chromium
npm run test:e2e
```

开发地址为 http://localhost:5173/charades/。生产构建位于 dist/；GitHub Actions 在 main 构建及测试通过后发布 GitHub Pages。

## 正式版本与应用更新

- [GitHub Releases](https://github.com/blackSnack/charades/releases)：版本及更新日志。
- 每次正式发布须同时更新 `package.json` 和 `release-notes.json`，使用 SemVer（例如 3.1.0）。
- main 通过构建与测试后部署 Pages；部署成功才创建对应 Git Tag / Release。
- App 在启动、恢复前台、联网恢复及前台每 60 秒检查同源 `version.json` 和 Service Worker；无需直接轮询 GitHub API。
- 新 Service Worker 等待激活时显示更新提示；当前答题或输入期间延后至首页/结算页。点击「重启并更新」前保存进度，再激活新版并自动刷新。也可以稍后更新或手动检查。
- 离线时保留当前可用版本。题库仍采用独立版本，不要求每次题库刷新都重启。
- 版本元数据与 Pages 构建一起发布；GitHub Release 是部署成功后的公开发布记录。

## 技术与目录

React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Neobrutalism + Motion；PWA 使用 Workbox；IndexedDB 缓存题库。实验特效采用 cards-css 和 MetalFx，独立按需加载；元素火焰及粒子方案已撤回。正式游戏仍然不加载实验资源。

- src/core：独立游戏规则
- src/components/ui：上游基础组件
- src/components/effects：按需加载的实验特效
- src/services：题库更新、存档
- public/question-bank：独立 JSON 题库及 manifest
- tests/e2e：浏览器回归验证
- [第三方声明](THIRD_PARTY_NOTICES.md)

题库更新：维护分类 JSON，同时更新 manifest 的 count 和 bankVersion，运行题库校验后提交。游戏进行中使用已选题库快照。
