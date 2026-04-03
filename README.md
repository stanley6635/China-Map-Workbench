# China Map Workbench

一个纯前端的中国地图标注小工具，适合把城市清单快速落到地图上，再按需要调整标记样式、导出透明 PNG 用到汇报或 PPT 里。

## 功能

- 中国地图平面预览，包含省级边界、台湾和海南
- 输入城市名后自动匹配内置城市坐标
- 支持点、五角星、旗标三种标记
- 支持颜色、大小、光晕、标签显示与中英文切换
- 支持地图拖拽微调和表单直接修改坐标
- 支持保存配置、载入配置、导出透明背景 PNG

## 使用方式

这是一个纯静态页面项目，不需要后端。

1. 克隆或下载仓库
2. 直接打开 `index.html`
3. 如果浏览器对本地 `file://` 读取有限制，可以在项目目录启动一个简单静态服务，例如：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`

## 公开版数据说明

这个公开版仓库只保留了许可说明相对清楚的内置地图和城市数据：

- 地图底图来自 `echarts-countries-js`
- 内置城市坐标索引只保留了其城市级数据

此前私有开发版里曾使用过更大范围的行政区数据做县区级回落定位，但该来源在 2026 年 4 月 3 日核对时没有看到明确的开源许可证，所以没有继续放进公开仓库。

这意味着公开版的默认自动匹配更适合城市级名称。若你输入的是更细粒度的县区名称，可以继续通过手动经纬度、像素偏移和拖拽微调完成标注。

## 开源许可

本仓库中由项目作者新增的界面、交互和胶水代码采用 [MIT License](./LICENSE)。

仓库同时包含第三方代码和数据资产，它们不受 MIT 单独覆盖，请一并查看：

- [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)

## 第三方来源

- Apache ECharts: https://echarts.apache.org/
- echarts-countries-js: https://github.com/echarts-maps/echarts-countries-js
- GitHub 仓库可见性说明: https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories

## 项目结构

```text
.
├── index.html
├── assets/
│   ├── app.css
│   ├── app.js
│   ├── vendor/
│   │   └── echarts.min.js
│   └── data/
│       ├── china.geojson
│       ├── china.data.js
│       ├── china-cities.js
│       ├── cities.json
│       ├── cities.data.js
│       ├── city-labels-pinyin.json
│       └── city-labels-pinyin.data.js
└── THIRD_PARTY_NOTICES.md
```

## 后续建议

- 如果你要继续把它做成更完整的开源工具，建议下一步补一个更正式的截图和演示 GIF
- 如果你要恢复县区级更细的自动定位，建议先替换成许可证明确的数据源，再重新公开发布
