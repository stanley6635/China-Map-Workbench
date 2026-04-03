# Third-Party Notices

本项目包含第三方代码和数据，请在使用、再分发或二次开发前一并阅读其原始许可与说明。

## 1. Apache ECharts

- 本地文件: `assets/vendor/echarts.min.js`
- 上游项目: https://github.com/apache/echarts
- 官方站点: https://echarts.apache.org/
- 许可: Apache License 2.0

## 2. echarts-countries-js

- 本地文件:
  - `assets/data/china.geojson`
  - `assets/data/china.data.js`
  - `assets/data/china-cities.js`
  - `assets/data/cities.json`
  - `assets/data/cities.data.js`
- 上游项目: https://github.com/echarts-maps/echarts-countries-js
- 许可: ODC Open Database License (ODbL) 1.0
- 说明:
  - 本仓库公开版中的 `cities.json` 和 `cities.data.js` 只保留了从 `china-cities.js` 整理出的城市级条目
  - 如果你继续基于这些数据做再分发或数据库衍生，请注意 ODbL 的署名和共享要求

## 3. 未继续公开分发的数据来源

在 2026 年 4 月 3 日核对时，项目早期私有开发版曾参考过如下仓库：

- 仓库: https://github.com/pfinal/city
- README 中说明的数据来源包括民政部、国家统计局，以及百度地图相关坐标映射参考

但在核对当日，该仓库页面未看到明确的开源许可证标识，因此本公开仓库不再继续分发从该来源整理出的县区级回落数据。

## 4. GitHub 仓库可见性说明

如果你要把当前仓库从私有切换为公开，可参考 GitHub 官方文档：

- https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories
