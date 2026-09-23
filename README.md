# 耳鸣频率测试

在线使用：<https://l-chris.github.io/tinnitus/>

用于耳鸣频率匹配测试的网页工具：播放纯音，通过滑块或数字输入调节频率与音量，找到与耳鸣声最接近的音调。

## 功能

- 多个音调同时播放，每个音调的频率、音量、波形、左右声道独立控制
- 每个音调可切换为窄带噪声，带宽预设 1/24、1/12、1/6、1/3（默认）、1/2、1 oct，支持自定义输入，并显示近似 Hz 带宽
- 声道切换：左耳 / 双耳 / 右耳（需佩戴耳机）
- 频率范围 20 Hz – 20 kHz，对数刻度滑块 + 数字输入 + ±1 / ±10 Hz 微调
- 四种波形：正弦 / 方波 / 锯齿 / 三角
- 独立音量 + 主音量，输出经限幅器防止爆音
- 设置自动保存到本地（localStorage），刷新不丢失；一键重置并清空缓存
- 基于 Web Audio API，无需后端

## 技术栈

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4

## 本地开发

```bash
npm install
npm run dev
```

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages（见 `.github/workflows/deploy.yml`）。
