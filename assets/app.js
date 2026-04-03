/* global echarts */

(() => {
  "use strict";

  const STATUS_READY = {
    primary: "地图已加载",
    secondary: "省界、台湾、海南与城市标记已就绪",
  };
  const INLINE_GEO_KEY = "__CHINA_GEOJSON__";
  const INLINE_CITY_KEY = "__CITY_LOOKUP_DATA__";
  const INLINE_PINYIN_KEY = "__CITY_LABEL_PINYIN__";
  const CONFIG_SCHEMA_VERSION = 1;
  const DEFAULT_MARKER_TYPES = ["star", "dot", "flag"];
  const DRAG_START_THRESHOLD = 6;
  const DEFAULT_MAP_CENTER = [104.2, 35.8];
  const DEFAULT_MAP_ZOOM = 1;
  const STAR_SYMBOL_PATH =
    "path://M512 84L618 374L926 374L676 557L771 848L512 670L253 848L348 557L98 374L406 374Z";
  const COLOR_SWATCHES = buildMarkerColorMatrix();
  const MAP_THEMES = [
    {
      id: "sage",
      name: "松烟绿",
      land: "#DCE5CF",
      landEmphasis: "#EAF1DF",
      border: "#66765D",
      accent: "#90A37A",
      stageTop: "#F1F4E9",
      stageBottom: "#E2EAD4",
      grid: "rgba(94, 116, 84, 0.08)",
    },
    {
      id: "sand",
      name: "沙丘米",
      land: "#E5D7BF",
      landEmphasis: "#F1E7D5",
      border: "#8E745A",
      accent: "#C39D72",
      stageTop: "#F7F0E3",
      stageBottom: "#EEDFC6",
      grid: "rgba(142, 116, 90, 0.08)",
    },
    {
      id: "teal",
      name: "湖岸青",
      land: "#CDE3DD",
      landEmphasis: "#DDF0EB",
      border: "#527870",
      accent: "#6B9D93",
      stageTop: "#EDF7F4",
      stageBottom: "#D8EBE6",
      grid: "rgba(82, 120, 112, 0.08)",
    },
    {
      id: "slate",
      name: "云岫灰",
      land: "#D8DCE2",
      landEmphasis: "#E8ECF1",
      border: "#5D6674",
      accent: "#8A94A5",
      stageTop: "#F2F4F7",
      stageBottom: "#E1E6ED",
      grid: "rgba(93, 102, 116, 0.08)",
    },
    {
      id: "jade",
      name: "玉山青",
      land: "#D2E6D4",
      landEmphasis: "#E2F1E3",
      border: "#55755B",
      accent: "#7FA885",
      stageTop: "#EFF8F0",
      stageBottom: "#DDEFE0",
      grid: "rgba(85, 117, 91, 0.08)",
    },
    {
      id: "ink",
      name: "墨青蓝",
      land: "#D6DFE8",
      landEmphasis: "#E6EDF5",
      border: "#4E6179",
      accent: "#768CA6",
      stageTop: "#EFF4FA",
      stageBottom: "#DCE7F1",
      grid: "rgba(78, 97, 121, 0.08)",
    },
    {
      id: "rose",
      name: "烟岚粉",
      land: "#E8D8D6",
      landEmphasis: "#F3E8E5",
      border: "#8A6866",
      accent: "#C1958F",
      stageTop: "#FAF1EF",
      stageBottom: "#EFDCD8",
      grid: "rgba(138, 104, 102, 0.08)",
    },
    {
      id: "gold",
      name: "秋麦金",
      land: "#E7DFC8",
      landEmphasis: "#F3ECD9",
      border: "#8A7852",
      accent: "#C6AE6C",
      stageTop: "#F8F2E3",
      stageBottom: "#EDE3C8",
      grid: "rgba(138, 120, 82, 0.08)",
    },
  ];
  const RECORD_CHIP_CLASS = {
    star: "city-chip",
    dot: "city-chip city-chip-amber",
    flag: "city-chip city-chip-sky",
  };
  const elements = {};
  const appState = {
    defaults: {
      markerType: "star",
      color: "#e04f4f",
      size: 18,
      glow: 0.5,
      showLabels: true,
      labelLanguage: "zh",
      exportScale: 2,
      backgroundColor: "#E2EAD4",
      mapThemeId: "sage",
    },
    batchStyle: {
      markerType: "star",
      color: "#e04f4f",
      size: 18,
      glow: 0.5,
    },
    cities: createSeedCities(),
    selectedCityId: "city-shanghai",
    bulkSelection: new Set(),
    lookup: new Map(),
    lookupEntries: [],
    labelPinyin: {},
    geoJson: null,
    chart: null,
    chartReady: false,
    citySeq: 0,
    mapView: {
      zoom: DEFAULT_MAP_ZOOM,
      center: [...DEFAULT_MAP_CENTER],
    },
    dragState: {
      pointerDown: false,
      dragging: false,
      cityId: null,
      startX: null,
      startY: null,
    },
  };

  function createSeedCities() {
    return [
      {
        id: "city-beijing",
        name: "北京",
        province: "北京",
        city: "北京",
        label: "北京",
        markerType: "dot",
        color: "#e15454",
        size: 18,
        glow: 0.42,
        longitude: 116.4074,
        latitude: 39.9042,
        offsetX: 0,
        offsetY: 0,
        notes: "首都示例",
        locked: false,
      },
      {
        id: "city-shanghai",
        name: "上海",
        province: "上海",
        city: "上海",
        label: "上海",
        markerType: "star",
        color: "#ffbf47",
        size: 20,
        glow: 0.36,
        longitude: 121.4737,
        latitude: 31.2304,
        offsetX: 0,
        offsetY: 0,
        notes: "长三角示例",
        locked: false,
      },
      {
        id: "city-haikou",
        name: "海口",
        province: "海南",
        city: "海口",
        label: "海口",
        markerType: "flag",
        color: "#2f79d0",
        size: 18,
        glow: 0.34,
        longitude: 110.1983,
        latitude: 20.044,
        offsetX: 0,
        offsetY: 0,
        notes: "海南示例",
        locked: false,
      },
      {
        id: "city-taipei",
        name: "台北",
        province: "台湾",
        city: "台北",
        label: "台北",
        markerType: "dot",
        color: "#40a36a",
        size: 16,
        glow: 0.32,
        longitude: 121.5654,
        latitude: 25.033,
        offsetX: 0,
        offsetY: 0,
        notes: "台湾示例",
        locked: false,
      },
    ];
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function hslToHex(h, s, l) {
    const hue = ((h % 360) + 360) % 360;
    const saturation = clamp(s, 0, 100) / 100;
    const lightness = clamp(l, 0, 100) / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const segment = hue / 60;
    const x = chroma * (1 - Math.abs((segment % 2) - 1));
    let r = 0;
    let g = 0;
    let b = 0;

    if (segment >= 0 && segment < 1) {
      r = chroma;
      g = x;
    } else if (segment < 2) {
      r = x;
      g = chroma;
    } else if (segment < 3) {
      g = chroma;
      b = x;
    } else if (segment < 4) {
      g = x;
      b = chroma;
    } else if (segment < 5) {
      r = x;
      b = chroma;
    } else {
      r = chroma;
      b = x;
    }

    const match = lightness - chroma / 2;
    const toHex = (channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  function buildMarkerColorMatrix() {
    const hues = [0, 18, 32, 48, 96, 156, 210, 258];
    const tones = [
      [82, 30],
      [80, 36],
      [78, 42],
      [76, 48],
      [72, 54],
      [68, 60],
      [62, 68],
      [56, 76],
    ];

    return hues.flatMap((hue) => tones.map(([saturation, lightness]) => hslToHex(hue, saturation, lightness)));
  }

  function getMapTheme(themeId = appState.defaults.mapThemeId) {
    return MAP_THEMES.find((theme) => theme.id === themeId) || MAP_THEMES[0];
  }

  function stripEthnicSuffixes(value) {
    let result = String(value || "");
    const tailPattern =
      /(壮族|回族|维吾尔|藏族|蒙古族|苗族|彝族|侗族|土家族|土族|羌族|白族|傣族|黎族|傈僳族|佤族|哈尼族|拉祜族|纳西族|景颇族|阿昌族|普米族|怒族|独龙族|布依族|仡佬族|仫佬族|毛南族|撒拉族|保安族|裕固族|哈萨克|柯尔克孜|锡伯|塔吉克|塔塔尔|达斡尔|鄂温克|鄂伦春|赫哲|门巴|珞巴|基诺|朝鲜族|高山族)$/u;

    while (tailPattern.test(result)) {
      result = result.replace(tailPattern, "");
    }

    return result;
  }

  function collapseName(input) {
    const value = String(input || "").trim();
    if (!value) return "";
    return value.replace(/\s+/g, "");
  }

  function normalizeLooseName(input) {
    const value = collapseName(input);
    if (!value) return "";
    if (/(新区|林区|矿区|特区)$/u.test(value)) {
      return stripEthnicSuffixes(value);
    }

    return stripEthnicSuffixes(
      value
        .replace(/(特别行政区|自治区|自治州|地区|盟|市|县|区|林区|旗|苏木|乡|镇)$/u, "")
        .replace(/(北京市|天津市|上海市|重庆市)$/u, (match) => match.slice(0, 2))
    );
  }

  function normalizeScopedName(input) {
    const value = collapseName(input);
    if (!value) return "";

    return stripEthnicSuffixes(
      value
        .replace(/(特别行政区|自治区|自治州|地区|盟|市)$/u, "")
        .replace(/(北京市|天津市|上海市|重庆市)$/u, (match) => match.slice(0, 2))
    );
  }

  function normalizeScope(input) {
    const value = collapseName(input);
    if (!value) return "";

    return stripEthnicSuffixes(
      value
        .replace(/(省|市|自治区|特别行政区|壮族|回族|维吾尔|自治区|自治州|地区|盟)$/u, "")
        .replace(/^(北京市|天津市|上海市|重庆市)$/u, (match) => match.slice(0, 2))
    );
  }

  function createLookupKey(province, city, county) {
    const parts = [
      province ? normalizeScope(province) : "",
      city ? normalizeScopedName(city) : "",
      county ? normalizeScopedName(county) : "",
    ].filter(Boolean);
    return parts.join("::");
  }

  function registerLookup(lookup, key, entry) {
    if (!key) return;
    const normalizedKey = key.toLowerCase();
    if (!lookup.has(normalizedKey)) {
      lookup.set(normalizedKey, entry);
    }
  }

  function loadLocalJson(url) {
    return fetch(url, { cache: "no-store" }).then((response) => {
      if (!response.ok) {
        throw new Error(`请求失败：${url} (${response.status})`);
      }
      return response.json();
    });
  }

  function loadLocalData(url, inlineKey) {
    if (window[inlineKey]) {
      return Promise.resolve(window[inlineKey]);
    }

    return loadLocalJson(url);
  }

  function normalizeDefaultMarkerType(value, fallback) {
    const markerType = String(value || "").trim();
    if (DEFAULT_MARKER_TYPES.includes(markerType)) return markerType;
    return fallback;
  }

  function parseBooleanLike(value, fallback = false) {
    if (typeof value === "boolean") return value;
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return fallback;
    if (["true", "1", "yes", "y", "on", "显示", "是"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off", "隐藏", "否"].includes(normalized)) return false;
    return fallback;
  }

  function normalizeLabelLanguage(value, fallback = "zh") {
    return value === "en" ? "en" : fallback;
  }

  function formatPinyinLabel(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const normalized = raw
      .replace(/['’]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
    return normalized.replace(/^[a-z]/, (match) => match.toUpperCase());
  }

  function getCurrentDefaults() {
    return {
      markerType: normalizeDefaultMarkerType(appState.defaults.markerType, "star"),
      color: String(appState.defaults.color || "#e04f4f"),
      size: Number.isFinite(appState.defaults.size) ? appState.defaults.size : 18,
      glow: Number.isFinite(appState.defaults.glow) ? appState.defaults.glow : 0.5,
      showLabels: parseBooleanLike(appState.defaults.showLabels, true),
      labelLanguage: normalizeLabelLanguage(appState.defaults.labelLanguage, "zh"),
      exportScale: Number.isFinite(appState.defaults.exportScale) ? appState.defaults.exportScale : 2,
      backgroundColor: String(appState.defaults.backgroundColor || "#ede7d6"),
      mapThemeId: String(appState.defaults.mapThemeId || "sage"),
    };
  }

  function normalizeImportedDefaults(rawDefaults) {
    const current = getCurrentDefaults();
    const source = rawDefaults && typeof rawDefaults === "object" ? rawDefaults : {};

    return {
      markerType: normalizeDefaultMarkerType(
        source.markerType ?? source.defaultMarkerType,
        current.markerType
      ),
      color: String(source.color ?? source.defaultMarkerColor ?? current.color).trim() || current.color,
      size:
        parseOptionalNumber(source.size ?? source.defaultMarkerSize) ??
        current.size,
      glow:
        parseOptionalNumber(source.glow ?? source.defaultHaloStrength) ??
        current.glow,
      showLabels:
        parseBooleanLike(source.showLabels ?? source.showLabel, current.showLabels),
      labelLanguage:
        normalizeLabelLanguage(source.labelLanguage ?? source.labelLang, current.labelLanguage),
      exportScale:
        parseOptionalNumber(source.exportScale) ??
        current.exportScale,
      backgroundColor:
        String(source.backgroundColor ?? current.backgroundColor).trim() || current.backgroundColor,
      mapThemeId:
        MAP_THEMES.some((theme) => theme.id === source.mapThemeId) ? source.mapThemeId : current.mapThemeId,
    };
  }

  function normalizeSavedCity(record, defaults, index, usedIds) {
    const source = record && typeof record === "object" ? record : {};
    const idBase = String(source.id || `city-import-${index + 1}`).trim();
    let id = idBase;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${idBase}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);

    const name = String(source.name ?? source.label ?? `城市${index + 1}`).trim() || `城市${index + 1}`;
    const province = String(source.province ?? "").trim();
    const city = String(source.city ?? source.prefecture ?? source.parentCity ?? "").trim();
    const label = name;
    const markerType = normalizeDefaultMarkerType(source.markerType, defaults.markerType);
    const color = String(source.color ?? defaults.color).trim() || defaults.color;
    const size = parseOptionalNumber(source.size) ?? defaults.size;
    const glow = parseOptionalNumber(source.glow) ?? defaults.glow;
    const longitude = parseOptionalNumber(source.longitude ?? source.lon);
    const latitude = parseOptionalNumber(source.latitude ?? source.lat);
    const offsetX = parseOptionalNumber(source.offsetX) ?? 0;
    const offsetY = parseOptionalNumber(source.offsetY) ?? 0;
    const notes = String(source.notes ?? source.note ?? "").trim();
    const locked = source.locked === true || source.locked === "true" || source.locked === "是";

    return {
      id,
      name,
      province,
      city,
      label,
      markerType,
      color,
      size,
      glow,
      longitude,
      latitude,
      offsetX,
      offsetY,
      notes,
      locked,
    };
  }

  function getCitySeqFromId(cityId) {
    const match = /^city-new-(\d+)$/u.exec(String(cityId || ""));
    return match ? Number(match[1]) : 0;
  }

  function syncCitySequence(cities, importedCitySeq) {
    const maxExisting = cities.reduce((maxSeq, city) => Math.max(maxSeq, getCitySeqFromId(city.id)), 0);
    const importedSeq = Number.isFinite(importedCitySeq) ? importedCitySeq : 0;
    appState.citySeq = Math.max(maxExisting, importedSeq);
  }

  function serializeCity(record) {
    return {
      id: record.id,
      name: String(record.name ?? ""),
      province: String(record.province ?? ""),
      city: String(record.city ?? ""),
      label: String(record.name ?? record.label ?? ""),
      markerType: normalizeDefaultMarkerType(record.markerType, appState.defaults.markerType),
      color: String(record.color ?? appState.defaults.color),
      size: parseOptionalNumber(record.size) ?? appState.defaults.size,
      glow: parseOptionalNumber(record.glow) ?? appState.defaults.glow,
      longitude: parseOptionalNumber(record.longitude),
      latitude: parseOptionalNumber(record.latitude),
      offsetX: parseOptionalNumber(record.offsetX) ?? 0,
      offsetY: parseOptionalNumber(record.offsetY) ?? 0,
      notes: String(record.notes ?? ""),
      locked: Boolean(record.locked),
    };
  }

  function serializeCurrentConfig() {
    const defaults = getCurrentDefaults();
    return {
      version: CONFIG_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      defaults,
      mapView: {
        zoom: appState.mapView.zoom,
        center: appState.mapView.center,
      },
      selectedCityId: appState.selectedCityId,
      citySeq: appState.citySeq,
      cities: appState.cities.map((city) => serializeCity(city)),
    };
  }

  function createTimestampSlug(date = new Date()) {
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds()),
    ].join("");
  }

  function downloadTextFile(filename, text, mimeType = "text/plain;charset=utf-8") {
    const blob = new Blob([text], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function downloadDataUrl(filename, dataUrl) {
    const link = document.createElement("a");

    link.href = dataUrl;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function saveCurrentConfig() {
    const payload = serializeCurrentConfig();
    const filename = `china-map-workbench-${createTimestampSlug()}.json`;
    downloadTextFile(filename, `${JSON.stringify(payload, null, 2)}\n`, "application/json;charset=utf-8");
    setStatus("配置已保存", `已导出 ${payload.cities.length} 条城市记录`);
  }

  function resolveImportedCities(rawConfig) {
    if (Array.isArray(rawConfig)) {
      return { cities: rawConfig, defaults: null, selectedCityId: null, citySeq: null };
    }

    if (!rawConfig || typeof rawConfig !== "object") {
      throw new Error("配置文件格式不正确");
    }

    const cities = Array.isArray(rawConfig.cities)
      ? rawConfig.cities
      : Array.isArray(rawConfig.records)
        ? rawConfig.records
        : [];

    return {
      cities,
      defaults: rawConfig.defaults ?? rawConfig.defaultStyles ?? rawConfig.defaultStyle ?? null,
      mapView: rawConfig.mapView ?? rawConfig.view ?? null,
      selectedCityId: typeof rawConfig.selectedCityId === "string" ? rawConfig.selectedCityId : null,
      citySeq: Number.isFinite(rawConfig.citySeq) ? rawConfig.citySeq : null,
    };
  }

  function applyImportedConfig(rawConfig) {
    const imported = resolveImportedCities(rawConfig);
    if (!imported.cities.length) {
      throw new Error("配置文件中没有城市记录");
    }

    const defaults = normalizeImportedDefaults(imported.defaults);
    const usedIds = new Set();
    const normalizedCities = imported.cities.map((record, index) =>
      normalizeSavedCity(record, defaults, index, usedIds)
    );
    normalizedCities.forEach((record) => syncRecordFromLookup(record));
    const selectedCityId = normalizedCities.some((city) => city.id === imported.selectedCityId)
      ? imported.selectedCityId
      : normalizedCities[0]?.id || null;

    appState.defaults = defaults;
    const importedCenter =
      Array.isArray(imported.mapView?.center) && imported.mapView.center.length === 2
        ? imported.mapView.center.map((value) => Number(value))
        : null;
    appState.mapView = {
      zoom: clamp(Number(imported.mapView?.zoom) || DEFAULT_MAP_ZOOM, 1, 8),
      center: importedCenter && importedCenter.every(Number.isFinite) ? importedCenter : [...DEFAULT_MAP_CENTER],
    };
    appState.cities = normalizedCities;
    appState.selectedCityId = selectedCityId;
    appState.bulkSelection = new Set();
    syncCitySequence(normalizedCities, imported.citySeq);

    renderAll();
    if (selectedCityId) {
      selectCity(selectedCityId, { forceRerender: true });
    }

    setStatus("配置已载入", `已恢复 ${normalizedCities.length} 条城市记录`);
  }

  async function loadConfigFromFile(file) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    applyImportedConfig(parsed);
  }

  function getPointerPosition(pointerEvent) {
    const x = Number(pointerEvent?.offsetX ?? pointerEvent?.zrX ?? pointerEvent?.event?.offsetX);
    const y = Number(pointerEvent?.offsetY ?? pointerEvent?.zrY ?? pointerEvent?.event?.offsetY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }

  function updateCityFromPointer(cityId, pointerEvent) {
    if (!appState.chart || !cityId) return false;

    const record = appState.cities.find((city) => city.id === cityId);
    if (!record || record.locked) return false;

    const pointer = getPointerPosition(pointerEvent);
    if (!pointer) return false;

    const x = pointer.x - (parseOptionalNumber(record.offsetX) || 0);
    const y = pointer.y - (parseOptionalNumber(record.offsetY) || 0);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;

    const coords = appState.chart.convertFromPixel({ geoIndex: 0 }, [x, y]);
    if (!Array.isArray(coords) || coords.length < 2) return false;

    const [lon, lat] = coords.map((value) => Number(value));
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;

    record.longitude = lon;
    record.latitude = lat;

    return true;
  }

  function renderDraggedCity(cityId) {
    const record = appState.cities.find((city) => city.id === cityId);
    if (!record) return;

    renderCityList();
    renderCityForm(record);
    renderChart();
    updateTopCards();
  }

  function startDrag(cityId, pointerEvent) {
    if (!cityId) return;
    const record = appState.cities.find((city) => city.id === cityId);
    if (!record || record.locked) return;

    const pointer = getPointerPosition(pointerEvent);
    appState.dragState.pointerDown = true;
    appState.dragState.dragging = false;
    appState.dragState.cityId = cityId;
    appState.dragState.startX = pointer?.x ?? null;
    appState.dragState.startY = pointer?.y ?? null;
  }

  function stopDrag() {
    if (!appState.dragState.pointerDown && !appState.dragState.dragging) return;

    const cityId = appState.dragState.cityId;
    const wasDragging = appState.dragState.dragging;
    appState.dragState.pointerDown = false;
    appState.dragState.dragging = false;
    appState.dragState.cityId = null;
    appState.dragState.startX = null;
    appState.dragState.startY = null;
    if (elements.mapStage) {
      elements.mapStage.classList.remove("is-dragging");
    }

    if (cityId && wasDragging) {
      renderDraggedCity(cityId);
      const record = appState.cities.find((city) => city.id === cityId);
      if (record) {
        setStatus(
          "坐标已更新",
          `${getRecordDisplayName(record)} · ${Number(record.longitude).toFixed(4)}, ${Number(record.latitude).toFixed(4)}`
        );
      }
    }
  }

  function handleMapMouseMove(event) {
    if (!appState.dragState.pointerDown || !appState.dragState.cityId) return;

    const pointer = getPointerPosition(event);
    if (!pointer) return;

    if (!appState.dragState.dragging) {
      const distance = Math.hypot(
        pointer.x - Number(appState.dragState.startX ?? pointer.x),
        pointer.y - Number(appState.dragState.startY ?? pointer.y)
      );

      if (distance < DRAG_START_THRESHOLD) {
        return;
      }

      appState.dragState.dragging = true;
      if (elements.mapStage) {
        elements.mapStage.classList.add("is-dragging");
      }
      const record = appState.cities.find((city) => city.id === appState.dragState.cityId);
      if (record) {
        setStatus("正在调整坐标", `${getRecordDisplayName(record)} · 拖拽地图上的标记以微调位置`);
      }
    }

    if (updateCityFromPointer(appState.dragState.cityId, event)) {
      renderDraggedCity(appState.dragState.cityId);
    }
  }

  function handleMapMouseDown(params) {
    const recordId = params?.data?.recordId;
    if (!recordId) return;

    selectCity(recordId, { forceRerender: true });
    startDrag(recordId, params.event || params);
  }

  function handleMapMouseUp() {
    stopDrag();
  }

  function exportPng() {
    if (!appState.chart) {
      setStatus("无法导出 PNG", "地图尚未就绪");
      return;
    }

    const pixelRatio = parseOptionalNumber(appState.defaults.exportScale) || 2;
    const scatterData = buildScatterData(appState.cities, appState.lookup);
    const normalOption = buildChartOption(scatterData);
    const exportOption = buildChartOption(scatterData, { forExport: true });
    let dataUrl = "";

    try {
      appState.chart.setOption(exportOption, true);
      dataUrl = appState.chart.getDataURL({
        type: "png",
        pixelRatio,
        backgroundColor: "rgba(0,0,0,0)",
      });
    } finally {
      appState.chart.setOption(normalOption, true);
      renderMapControls();
      renderMapThemePalette();
      updateScaleBar();
      updateTopCards();
    }

    downloadDataUrl(`china-map-workbench-${createTimestampSlug()}.png`, dataUrl);
    setStatus("PNG 已导出", `已生成透明背景的 ${pixelRatio}x 地图图片`);
  }

  function buildLookup(entries) {
    const lookup = new Map();
    const aliasCounts = new Map();

    for (const entry of entries) {
      const aliases = new Set([
        entry.name,
        entry.province,
        entry.city,
        entry.county,
        ...(Array.isArray(entry.aliases) ? entry.aliases : []),
      ]);

      for (const alias of aliases) {
        const normalizedAlias = normalizeLooseName(alias);
        if (!normalizedAlias) continue;
        aliasCounts.set(normalizedAlias, (aliasCounts.get(normalizedAlias) || 0) + 1);
      }
    }

    for (const entry of entries) {
      const aliases = new Set([
        entry.name,
        entry.province,
        entry.city,
        entry.county,
        ...(Array.isArray(entry.aliases) ? entry.aliases : []),
      ]);

      for (const alias of aliases) {
        const normalizedAlias = normalizeLooseName(alias);
        if (!normalizedAlias) continue;
        if (aliasCounts.get(normalizedAlias) === 1) {
          registerLookup(lookup, normalizedAlias, entry);
        }
      }

      registerLookup(lookup, createLookupKey(entry.province, entry.city, entry.county), entry);
      registerLookup(lookup, `${normalizeScope(entry.province)}::${normalizeScopedName(entry.name)}`, entry);
      if (!entry.county) {
        registerLookup(lookup, createLookupKey(entry.province, entry.city), entry);
      }
    }

    return lookup;
  }

  function parseOptionalNumber(value) {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function extractNameFromLine(rawLine) {
    const line = String(rawLine ?? "")
      .replace(/^[\s\u2022\u25cf\u25e6\-*]+/u, "")
      .replace(/^\d+\s*[.)、]\s*/u, "")
      .trim();
    if (!line) return "";

    const firstCell = line
      .split(/[\t,，;；]/u)
      .map((part) => part.trim())
      .find(Boolean);

    return String(firstCell ?? "").trim();
  }

  function findLookupEntry(recordLike) {
    if (!appState.lookup || !appState.lookup.size) return null;
    const province = String(recordLike?.province ?? "").trim();
    const city = String(recordLike?.city ?? "").trim();
    const name = String(recordLike?.name ?? "").trim();
    if (!name) return null;

    const candidateKeys = [
      createLookupKey(province, city, name),
      createLookupKey(province, "", name),
      `${normalizeScope(province)}::${normalizeScopedName(name)}`,
      normalizeLooseName(name),
    ]
      .filter(Boolean)
      .map((value) => value.toLowerCase());

    for (const key of candidateKeys) {
      const match = appState.lookup.get(key);
      if (match) return match;
    }

    const normalizedName = normalizeLooseName(name);
    const normalizedProvince = normalizeScope(province);
    const normalizedCity = normalizeScopedName(city);
    const fallbackEntry = appState.lookupEntries.find((entry) => {
      const names = [
        entry.name,
        entry.city,
        entry.county,
        ...(Array.isArray(entry.aliases) ? entry.aliases : []),
      ];
      const nameMatched = names.some((alias) => normalizeLooseName(alias) === normalizedName);
      if (!nameMatched) return false;
      if (normalizedProvince && normalizeScope(entry.province) !== normalizedProvince) return false;
      if (normalizedCity && normalizeScopedName(entry.city) !== normalizedCity) return false;
      return true;
    });

    if (fallbackEntry) return fallbackEntry;

    const relaxedFallbackEntry = appState.lookupEntries.find((entry) => {
      const names = [
        entry.name,
        entry.city,
        entry.county,
        ...(Array.isArray(entry.aliases) ? entry.aliases : []),
      ];
      return names.some((alias) => normalizeLooseName(alias) === normalizedName);
    });

    if (relaxedFallbackEntry) return relaxedFallbackEntry;

    return null;
  }

  function syncRecordFromLookup(record) {
    if (!record) return;
    const trimmedName = String(record.name ?? "").trim();
    record.name = trimmedName;
    record.label = trimmedName;

    const match = findLookupEntry(record);
    if (!match) return;

    if (match.province) {
      record.province = match.province;
    }
    if (match.city) {
      record.city = match.city;
    } else if (!record.city && match.name) {
      record.city = match.name;
    }
  }

  function normalizeBulkMarkerType(value, fallback) {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return fallback;
    if (["dot", "circle", "point", "亮点", "圆点"].includes(normalized)) return "dot";
    if (["star", "asterisk", "星", "星标", "小星星"].includes(normalized)) return "star";
    if (["flag", "pin", "banner", "旗", "旗子", "旗标"].includes(normalized)) return "flag";
    return normalizeDefaultMarkerType(normalized, fallback);
  }

  function parseNameListInput(text) {
    const sourceText = String(text ?? "").trim();
    if (!sourceText) {
      throw new Error("请先粘贴城市名，一行一个");
    }

    const dataRows = sourceText
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
    const seenNames = new Set();
    const parsedCities = dataRows
      .map((line, rowIndex) => {
        const name = extractNameFromLine(line);
        if (!name) return null;
        const dedupeKey = normalizeLooseName(name) || name;
        if (seenNames.has(dedupeKey)) return null;
        seenNames.add(dedupeKey);

        const seq = appState.citySeq + rowIndex + 1;

        const record = {
          id: `city-new-${seq}`,
          name,
          province: "",
          city: "",
          label: name,
          markerType: appState.defaults.markerType,
          color: String(appState.defaults.color).trim() || "#e04f4f",
          size: appState.defaults.size,
          glow: appState.defaults.glow,
          longitude: null,
          latitude: null,
          offsetX: 0,
          offsetY: 0,
          notes: "",
          locked: false,
        };

        syncRecordFromLookup(record);
        return record;
      })
      .filter(Boolean);

    if (!parsedCities.length) {
      throw new Error("没有识别到有效的城市名");
    }

    return parsedCities;
  }

  function formatInputNumber(value) {
    return Number.isFinite(value) ? String(value) : "";
  }

  function getSelectedCity() {
    return appState.cities.find((city) => city.id === appState.selectedCityId) || null;
  }

  function getRecordDisplayName(record) {
    return String(record?.name || record?.label || "未命名城市").trim() || "未命名城市";
  }

  function getRecordLabelText(record) {
    const baseName = getRecordDisplayName(record);
    if (appState.defaults.labelLanguage !== "en") {
      return baseName;
    }

    const pinyin = appState.labelPinyin?.[baseName];
    return formatPinyinLabel(pinyin || baseName);
  }

  function getRecordSummary(record) {
    const province = String(record?.province || "").trim();
    const city = String(record?.city || "").trim();
    const note = String(record?.notes || "").trim();
    const resolved = resolveCityCoordinate(record, appState.lookup);
    const locationText = resolved
      ? `经纬度 ${resolved.lon.toFixed(2)}, ${resolved.lat.toFixed(2)}`
      : "待输入或匹配经纬度";

    const summaryParts = [province || "未填省份"];
    if (city) summaryParts.push(city);
    summaryParts.push(record?.markerType || "dot");
    if (note) summaryParts.push(note);
    summaryParts.push(locationText);
    return summaryParts.join(" · ");
  }

  function setStatus(primary, secondary = "") {
    if (!elements.statusBar) return;
    elements.statusBar.innerHTML = `<span>${escapeHtml(primary)}</span><span>${escapeHtml(secondary)}</span>`;
  }

  function updateTopCards() {
    if (elements.selectedCityName) {
      elements.selectedCityName.textContent = getRecordDisplayName(getSelectedCity()) || "等待选择";
    }
    if (elements.mapSourceLabel) {
      const theme = getMapTheme();
      elements.mapSourceLabel.textContent = appState.chartReady
        ? `${theme.name} · ${Math.round(appState.mapView.zoom * 100)}%`
        : "状态驱动渲染";
    }
    if (elements.mapLegendLabel) {
      const resolvedCount = appState.cities.filter((city) => resolveCityCoordinate(city, appState.lookup)).length;
      elements.mapLegendLabel.textContent = `${resolvedCount}/${appState.cities.length} 个点位已定位`;
    }
    if (elements.currentCityHint) {
      const selected = getSelectedCity();
      const cityScope = String(selected?.city || "").trim();
      elements.currentCityHint.textContent = selected
        ? `${getRecordDisplayName(selected)} · ${selected.province || "未填省份"}${cityScope ? ` / ${cityScope}` : ""}`
        : "等待选择记录";
    }
  }

  function getMarkerChipClass(type) {
    return RECORD_CHIP_CLASS[type] || RECORD_CHIP_CLASS.dot;
  }

  function getPaletteContext(scope) {
    if (scope === "defaults") {
      return {
        selectedColor: String(appState.defaults.color || "#e04f4f"),
        palette: elements.defaultColorPalette,
        preview: elements.defaultColorPreview,
      };
    }

    if (scope === "batch") {
      return {
        selectedColor: String(appState.batchStyle.color || appState.defaults.color || "#e04f4f"),
        palette: elements.bulkStyleColorPalette,
        preview: elements.bulkStyleColorPreview,
      };
    }

    const record = getSelectedCity();
    return {
      selectedColor: String(record?.color || appState.defaults.color || "#e04f4f"),
      palette: elements.cityColorPalette,
      preview: elements.cityColorPreview,
    };
  }

  function applyMapThemeToStage() {
    if (!elements.mapStage) return;
    const theme = getMapTheme();
    elements.mapStage.style.setProperty("--map-stage-top", theme.stageTop);
    elements.mapStage.style.setProperty("--map-stage-bottom", theme.stageBottom);
    elements.mapStage.style.setProperty("--map-stage-grid", theme.grid);
  }

  function renderColorPalette(scope) {
    const context = getPaletteContext(scope);
    if (!context.palette) return;

    const activeColor = context.selectedColor.toLowerCase();
    context.palette.innerHTML = COLOR_SWATCHES.map((color) => {
      const selected = color.toLowerCase() === activeColor;
      return `
        <button
          class="color-swatch${selected ? " is-active" : ""}"
          type="button"
          data-color-value="${color}"
          data-color-scope="${scope}"
          aria-label="选择颜色 ${color}"
          aria-pressed="${selected ? "true" : "false"}"
        ></button>
      `;
    }).join("");

    const swatches = context.palette.querySelectorAll("[data-color-value]");
    swatches.forEach((swatch) => {
      swatch.style.background = swatch.dataset.colorValue;
    });

    if (context.preview) {
      context.preview.style.background = context.selectedColor;
      context.preview.textContent = context.preview.classList.contains("compact-preview")
        ? ""
        : context.selectedColor.toUpperCase();
    }
  }

  function renderMapThemePalette() {
    if (!elements.mapThemePalette) return;
    const activeTheme = getMapTheme();

    elements.mapThemePalette.innerHTML = MAP_THEMES.map((theme) => {
      const selected = theme.id === activeTheme.id;
      return `
        <button
          class="theme-swatch${selected ? " is-active" : ""}"
          type="button"
          data-theme-id="${theme.id}"
          aria-label="选择地图主题 ${theme.name}"
          aria-pressed="${selected ? "true" : "false"}"
        >
          <span class="theme-swatch-land"></span>
          <span class="theme-swatch-border"></span>
        </button>
      `;
    }).join("");

    elements.mapThemePalette.querySelectorAll("[data-theme-id]").forEach((button) => {
      const theme = MAP_THEMES.find((item) => item.id === button.dataset.themeId);
      if (!theme) return;
      const land = button.querySelector(".theme-swatch-land");
      const border = button.querySelector(".theme-swatch-border");
      if (land) land.style.background = theme.land;
      if (border) border.style.background = theme.border;
    });

    if (elements.mapThemeName) {
      elements.mapThemeName.textContent = activeTheme.name;
    }

    applyMapThemeToStage();
  }

  function renderMapControls() {
    if (elements.mapZoomSlider) {
      elements.mapZoomSlider.value = String(appState.mapView.zoom.toFixed(2));
    }
    if (elements.mapZoomValue) {
      elements.mapZoomValue.textContent = `${Math.round(appState.mapView.zoom * 100)}%`;
    }
    if (elements.showLabelsSelect) {
      elements.showLabelsSelect.value = appState.defaults.showLabels ? "true" : "false";
    }
    if (elements.labelLanguageSelect) {
      elements.labelLanguageSelect.value = appState.defaults.labelLanguage === "en" ? "en" : "zh";
    }
  }

  function toRadians(value) {
    return (value * Math.PI) / 180;
  }

  function haversineKm(start, end) {
    const earthRadiusKm = 6371;
    const lat1 = toRadians(start[1]);
    const lat2 = toRadians(end[1]);
    const dLat = lat2 - lat1;
    const dLon = toRadians(end[0] - start[0]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
  }

  function chooseScaleDistance(kmForBaseline) {
    const niceSteps = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const target = kmForBaseline * 0.72;
    for (const step of niceSteps) {
      if (step >= target) return step;
    }
    return niceSteps[niceSteps.length - 1];
  }

  function updateScaleBar() {
    if (!appState.chart || !elements.mapScaleBar || !elements.mapScaleLabel || !elements.mapStage) return;

    const rect = elements.mapStage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const baselinePixels = 140;
    const sampleY = Math.max(32, rect.height - 56);
    const sampleStart = appState.chart.convertFromPixel({ geoIndex: 0 }, [36, sampleY]);
    const sampleEnd = appState.chart.convertFromPixel({ geoIndex: 0 }, [36 + baselinePixels, sampleY]);
    if (!Array.isArray(sampleStart) || !Array.isArray(sampleEnd)) return;

    const kmAcrossBaseline = haversineKm(sampleStart, sampleEnd);
    if (!Number.isFinite(kmAcrossBaseline) || kmAcrossBaseline <= 0) return;

    const niceKm = chooseScaleDistance(kmAcrossBaseline);
    const widthPx = clamp((niceKm / kmAcrossBaseline) * baselinePixels, 48, 180);
    elements.mapScaleBar.style.width = `${widthPx}px`;
    elements.mapScaleLabel.textContent = niceKm >= 1000 ? `${niceKm.toLocaleString("en-US")} km` : `${niceKm} km`;
  }

  function renderCityList() {
    if (!elements.recordList) return;

    if (!appState.cities.length) {
      elements.recordList.innerHTML = `
        <li class="city-list-empty">
          <p>当前还没有城市记录。</p>
          <span>点击“新增城市”或粘贴城市名清单开始。</span>
        </li>
      `;
      return;
    }

    elements.recordList.innerHTML = appState.cities
      .map((record) => {
        const selected = record.id === appState.selectedCityId;
        const bulkSelected = appState.bulkSelection.has(record.id);
        const chipClass = getMarkerChipClass(record.markerType);
        return `
          <li class="city-row-shell">
            <label class="city-row-check" aria-label="勾选 ${escapeHtml(getRecordDisplayName(record))} 用于批量样式">
              <input
                class="city-row-checkbox"
                type="checkbox"
                data-bulk-city-id="${escapeHtml(record.id)}"
                ${bulkSelected ? "checked" : ""}
              />
            </label>
            <button
              class="city-row${selected ? " is-active" : ""}"
              type="button"
              data-city-id="${escapeHtml(record.id)}"
              ${selected ? 'aria-current="true"' : ""}
            >
              <div>
                <strong>${escapeHtml(getRecordDisplayName(record))}</strong>
                <p>${escapeHtml(getRecordSummary(record))}</p>
              </div>
              <span class="${chipClass}">${escapeHtml(record.markerType || "dot")}</span>
            </button>
            <button
              class="city-row-delete"
              type="button"
              data-delete-city-id="${escapeHtml(record.id)}"
              aria-label="删除 ${escapeHtml(getRecordDisplayName(record))}"
            >
              删除
            </button>
          </li>
        `;
      })
      .join("");
  }

  function renderCityForm(record) {
    if (!elements.cityForm) return;

    if (!record) {
      const fieldNames = [
        "name",
        "province",
        "city",
        "markerType",
        "color",
        "size",
        "glow",
        "locked",
        "longitude",
        "latitude",
        "offsetX",
        "offsetY",
        "notes",
      ];
      for (const name of fieldNames) {
        const field = elements.cityForm.elements.namedItem(name);
        if (!field) continue;
        field.value = "";
      }
      renderColorPalette("city");
      return;
    }

    const fieldValues = {
      name: record.name ?? "",
      province: record.province ?? "",
      city: record.city ?? "",
      markerType: record.markerType ?? appState.defaults.markerType,
      color: record.color ?? appState.defaults.color,
      size: formatInputNumber(record.size ?? appState.defaults.size),
      glow: formatInputNumber(record.glow ?? appState.defaults.glow),
      locked: record.locked ? "是" : "否",
      longitude: formatInputNumber(record.longitude),
      latitude: formatInputNumber(record.latitude),
      offsetX: formatInputNumber(record.offsetX ?? 0),
      offsetY: formatInputNumber(record.offsetY ?? 0),
      notes: record.notes ?? "",
    };

    for (const [name, value] of Object.entries(fieldValues)) {
      const field = elements.cityForm.elements.namedItem(name);
      if (!field) continue;
      field.value = value;
    }

    renderColorPalette("city");
    updateTopCards();
  }

  function renderDefaultsForm() {
    if (!elements.defaultsForm) return;

    const defaults = appState.defaults;
    const fieldValues = {
      defaultMarkerType: defaults.markerType,
      defaultMarkerColor: defaults.color,
      defaultMarkerSize: formatInputNumber(defaults.size),
      defaultHaloStrength: formatInputNumber(defaults.glow),
      showLabels: defaults.showLabels ? "true" : "false",
      labelLanguage: defaults.labelLanguage ?? "zh",
      exportScale: formatInputNumber(defaults.exportScale),
    };

    for (const [name, value] of Object.entries(fieldValues)) {
      const field = elements.defaultsForm.elements.namedItem(name);
      if (!field) continue;
      field.value = value;
    }

    renderColorPalette("defaults");
  }

  function renderBatchStyleForm() {
    if (!elements.bulkStyleForm) return;

    const fieldValues = {
      markerType: appState.batchStyle.markerType,
      size: formatInputNumber(appState.batchStyle.size),
      glow: formatInputNumber(appState.batchStyle.glow),
      color: appState.batchStyle.color,
    };

    for (const [name, value] of Object.entries(fieldValues)) {
      const field = elements.bulkStyleForm.elements.namedItem(name);
      if (!field) continue;
      field.value = value;
    }

    renderColorPalette("batch");

    const selectedCount = getBulkSelectionCount();
    if (elements.bulkStyleHint) {
      elements.bulkStyleHint.textContent = selectedCount > 0 ? `已勾选 ${selectedCount} 个城市` : "全部城市";
    }
    if (elements.bulkStyleApplyBtn) {
      elements.bulkStyleApplyBtn.textContent = selectedCount > 0 ? "应用到勾选城市" : "应用到全部城市";
    }
  }

  function getBulkSelectionCount() {
    return Array.from(appState.bulkSelection).filter((cityId) =>
      appState.cities.some((city) => city.id === cityId)
    ).length;
  }

  function getBulkTargetIds() {
    const selectedIds = Array.from(appState.bulkSelection).filter((cityId) =>
      appState.cities.some((city) => city.id === cityId)
    );
    return selectedIds.length ? selectedIds : appState.cities.map((city) => city.id);
  }

  function setBulkSelection(cityId, checked) {
    if (!cityId) return;
    if (checked) {
      appState.bulkSelection.add(cityId);
    } else {
      appState.bulkSelection.delete(cityId);
    }
    renderCityList();
    renderBatchStyleForm();
  }

  function resolveCityCoordinate(record, lookup) {
    if (!record) return null;

    const explicitLon = parseOptionalNumber(record.longitude);
    const explicitLat = parseOptionalNumber(record.latitude);
    if (Number.isFinite(explicitLon) && Number.isFinite(explicitLat)) {
      return { lon: explicitLon, lat: explicitLat, matched: true, source: "explicit" };
    }

    const scopedKey = createLookupKey(record.province, record.city, record.name).toLowerCase();
    const directKey = `${normalizeScope(record.province)}::${normalizeScopedName(record.name)}`.toLowerCase();
    const looseKey = normalizeLooseName(record.name).toLowerCase();
    const match = lookup.get(scopedKey) || lookup.get(directKey) || lookup.get(looseKey);

    if (match && Number.isFinite(match.lon) && Number.isFinite(match.lat)) {
      return { lon: match.lon, lat: match.lat, matched: true, source: "lookup" };
    }

    return null;
  }

  function resolveMarkerSize(record) {
    const size = parseOptionalNumber(record?.size);
    if (Number.isFinite(size)) return size;
    return appState.defaults.size;
  }

  function resolveGlow(record) {
    const glow = parseOptionalNumber(record?.glow);
    if (Number.isFinite(glow)) return glow;
    return appState.defaults.glow;
  }

  function markerSymbol(type) {
    switch (type) {
      case "star":
        return STAR_SYMBOL_PATH;
      case "flag":
        return "pin";
      case "dot":
      default:
        return "circle";
    }
  }

  function buildScatterData(entries, lookup) {
    return entries
      .map((record) => {
        const resolved = resolveCityCoordinate(record, lookup);
        if (!resolved) return null;

        const size = resolveMarkerSize(record);
        const glow = resolveGlow(record);
        const selected = record.id === appState.selectedCityId;
        const labelText = getRecordLabelText(record);

        return {
          recordId: record.id,
          name: labelText,
          value: [resolved.lon, resolved.lat, size],
          symbol: markerSymbol(record.markerType),
          symbolSize: selected ? size + 2 : size,
          symbolOffset: [
            parseOptionalNumber(record.offsetX) || 0,
            parseOptionalNumber(record.offsetY) || 0,
          ],
          itemStyle: {
            color: record.color || appState.defaults.color,
            borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.6)",
            borderWidth: selected ? 2 : 1,
            shadowBlur: 14 + Math.round(glow * 16),
            shadowColor: record.color || appState.defaults.color,
          },
          label: {
            show: appState.defaults.showLabels !== false,
            position: "right",
            distance: 8,
            offset: [parseOptionalNumber(record.offsetX) || 0, parseOptionalNumber(record.offsetY) || 0],
            color: "#1f2f33",
            backgroundColor: "rgba(255, 255, 255, 0.76)",
            borderColor: "rgba(104, 86, 56, 0.12)",
            borderWidth: 1,
            borderRadius: 999,
            padding: [4, 8],
            formatter: labelText,
            fontWeight: selected ? 800 : 600,
            fontSize: 13,
          },
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 22,
            },
          },
        };
      })
      .filter(Boolean);
  }

  function buildChartOption(scatterData, options = {}) {
    const mapTheme = getMapTheme();
    const forExport = Boolean(options.forExport);
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        formatter: (params) => {
          if (!params?.data?.name) return "";
          const value = params.data.value || [];
          const record = appState.cities.find((city) => city.id === params.data.recordId);
          const note = record?.notes ? `<br/>备注：${escapeHtml(record.notes)}` : "";
          return [
            `<strong>${escapeHtml(params.data.name)}</strong>`,
            `经度：${Number(value[0]).toFixed(4)}`,
            `纬度：${Number(value[1]).toFixed(4)}`,
            `类型：${escapeHtml(record?.markerType || "dot")}`,
          ].join("<br/>") + note;
        },
      },
      geo: {
        map: "china-workbench",
        roam: true,
        center: appState.mapView.center,
        zoom: appState.mapView.zoom,
        scaleLimit: {
          min: 1,
          max: 8,
        },
        layoutCenter: ["50%", "50%"],
        layoutSize: "94%",
        label: {
          show: false,
        },
        itemStyle: {
          areaColor: mapTheme.land,
          borderColor: mapTheme.border,
          borderWidth: 1.25,
          shadowBlur: forExport ? 16 : 0,
          shadowColor: forExport ? "rgba(20, 28, 36, 0.18)" : "transparent",
          shadowOffsetX: 0,
          shadowOffsetY: forExport ? 6 : 0,
        },
        emphasis: {
          itemStyle: {
            areaColor: mapTheme.landEmphasis,
            borderColor: mapTheme.border,
          },
          label: {
            show: false,
          },
        },
        select: {
          itemStyle: {
            areaColor: "#d7e0c3",
          },
        },
        silent: false,
        regions: [
          {
            name: "台湾",
            itemStyle: {
              areaColor: mapTheme.land,
            },
          },
          {
            name: "海南",
            itemStyle: {
              areaColor: mapTheme.land,
            },
          },
        ],
      },
      series: [
        {
          name: "城市标注",
          type: "scatter",
          coordinateSystem: "geo",
          data: scatterData,
          zlevel: 2,
          z: 2,
        },
      ],
    };
  }

  function renderScatterLayer() {
    if (!appState.chart) return;
    const scatterData = buildScatterData(appState.cities, appState.lookup);
    appState.chart.setOption({
      series: [
        {
          data: scatterData,
        },
      ],
    });
    renderMapControls();
    updateScaleBar();
    updateTopCards();
  }

  function renderChart() {
    if (!appState.chart || !appState.geoJson) return;

    const scatterData = buildScatterData(appState.cities, appState.lookup);
    appState.chart.setOption(buildChartOption(scatterData), true);
    renderMapControls();
    renderMapThemePalette();
    updateScaleBar();
    updateTopCards();
  }

  function renderAll() {
    renderCityList();
    renderDefaultsForm();
    renderBatchStyleForm();
    renderMapThemePalette();
    renderMapControls();
    const selected = getSelectedCity() || appState.cities[0] || null;
    if (selected) {
      renderCityForm(selected);
    } else {
      renderCityForm(null);
    }
    renderChart();
    updateTopCards();
  }

  function selectCity(cityId, options = {}) {
    if (!cityId || appState.selectedCityId === cityId) {
      if (!options.forceRerender) return;
    }

    appState.selectedCityId = cityId;
    renderCityList();
    renderCityForm(getSelectedCity());
    renderChart();

    if (options.focusName && elements.cityForm) {
      const focusTarget = elements.cityForm.elements.namedItem("name");
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus();
        if (typeof focusTarget.select === "function") {
          focusTarget.select();
        }
      }
    }
  }

  function applyCityFieldChange(record, fieldName, rawValue) {
    switch (fieldName) {
      case "name":
      case "province":
      case "city":
      case "color":
      case "notes":
        record[fieldName] = rawValue;
        break;
      case "markerType":
        record.markerType = DEFAULT_MARKER_TYPES.includes(rawValue) ? rawValue : appState.defaults.markerType;
        break;
      case "size":
      case "glow":
      case "longitude":
      case "latitude":
      case "offsetX":
      case "offsetY":
        record[fieldName] = parseOptionalNumber(rawValue);
        break;
      case "locked":
        record.locked = rawValue === "是";
        break;
      default:
        break;
    }
  }

  function updateSelectedCityField(fieldName, rawValue) {
    const record = getSelectedCity();
    if (!record) return;

    applyCityFieldChange(record, fieldName, rawValue);
    if (fieldName === "name" || fieldName === "province" || fieldName === "city") {
      syncRecordFromLookup(record);
      if (elements.cityForm) {
        const nameField = elements.cityForm.elements.namedItem("name");
        const provinceField = elements.cityForm.elements.namedItem("province");
        const cityField = elements.cityForm.elements.namedItem("city");
        if (nameField) nameField.value = record.name ?? "";
        if (provinceField) provinceField.value = record.province ?? "";
        if (cityField) cityField.value = record.city ?? "";
      }
    }
    if (fieldName === "color") {
      const colorField = elements.cityForm?.elements.namedItem("color");
      if (colorField) colorField.value = record.color ?? appState.defaults.color;
      renderColorPalette("city");
    }
    renderCityList();
    renderChart();
    updateTopCards();
  }

  function updateDefaultsField(fieldName, rawValue) {
    switch (fieldName) {
      case "defaultMarkerType":
        appState.defaults.markerType = DEFAULT_MARKER_TYPES.includes(rawValue)
          ? rawValue
          : appState.defaults.markerType;
        break;
      case "defaultMarkerColor":
        appState.defaults.color = rawValue;
        renderColorPalette("defaults");
        break;
      case "defaultMarkerSize":
        appState.defaults.size = parseOptionalNumber(rawValue) ?? appState.defaults.size;
        break;
      case "defaultHaloStrength":
        appState.defaults.glow = parseOptionalNumber(rawValue) ?? appState.defaults.glow;
        break;
      case "showLabels":
        appState.defaults.showLabels = parseBooleanLike(rawValue, true);
        break;
      case "labelLanguage":
        appState.defaults.labelLanguage = normalizeLabelLanguage(rawValue, "zh");
        break;
      case "exportScale":
        appState.defaults.exportScale = parseOptionalNumber(rawValue) ?? appState.defaults.exportScale;
        break;
      case "backgroundColor":
        appState.defaults.backgroundColor = rawValue;
        break;
      default:
        break;
    }
  }

  function updateBatchStyleField(fieldName, rawValue) {
    switch (fieldName) {
      case "markerType":
        appState.batchStyle.markerType = normalizeBulkMarkerType(rawValue, appState.defaults.markerType);
        break;
      case "color":
        appState.batchStyle.color = String(rawValue || appState.defaults.color).trim() || appState.defaults.color;
        renderColorPalette("batch");
        break;
      case "size":
        appState.batchStyle.size = parseOptionalNumber(rawValue) ?? appState.batchStyle.size;
        break;
      case "glow":
        appState.batchStyle.glow = parseOptionalNumber(rawValue) ?? appState.batchStyle.glow;
        break;
      default:
        break;
    }
  }

  function setMapTheme(themeId) {
    const theme = MAP_THEMES.find((item) => item.id === themeId);
    if (!theme) return;
    appState.defaults.mapThemeId = theme.id;
    appState.defaults.backgroundColor = theme.stageBottom;
    renderMapThemePalette();
    renderChart();
  }

  function setMapZoom(zoom) {
    const nextZoom = clamp(Number(zoom) || DEFAULT_MAP_ZOOM, 1, 8);
    appState.mapView.zoom = nextZoom;
    renderChart();
  }

  function resetMapView() {
    appState.mapView.zoom = DEFAULT_MAP_ZOOM;
    appState.mapView.center = [...DEFAULT_MAP_CENTER];
    renderChart();
    setStatus("视图已重置", "地图缩放与中心位置已恢复默认");
  }

  function syncMapViewFromChart() {
    if (!appState.chart) return;
    const geoOption = appState.chart.getOption()?.geo?.[0];
    if (!geoOption) return;

    const optionZoom = Number(geoOption.zoom);
    if (Number.isFinite(optionZoom)) {
      appState.mapView.zoom = clamp(optionZoom, 1, 8);
    }

    if (Array.isArray(geoOption.center) && geoOption.center.length === 2) {
      const center = geoOption.center.map((value) => Number(value));
      if (center.every(Number.isFinite)) {
        appState.mapView.center = center;
      }
    }
  }

  function createCityFromDefaults() {
    const seq = ++appState.citySeq;
    return {
      id: `city-new-${seq}`,
      name: "新城市",
      province: "",
      city: "",
      label: "新城市",
      markerType: appState.defaults.markerType,
      color: appState.defaults.color,
      size: appState.defaults.size,
      glow: appState.defaults.glow,
      longitude: null,
      latitude: null,
      offsetX: 0,
      offsetY: 0,
      notes: "",
      locked: false,
    };
  }

  function addCity() {
    const city = createCityFromDefaults();
    appState.cities = [...appState.cities, city];
    selectCity(city.id, { forceRerender: true, focusName: true });
    renderCityList();
    renderChart();
    setStatus("已新增城市", "可直接在表单中输入名称、坐标或样式");
  }

  function deleteCity(cityId) {
    if (!cityId) return;
    const index = appState.cities.findIndex((city) => city.id === cityId);
    if (index === -1) return;

    const city = appState.cities[index];
    const shouldDelete =
      typeof window.confirm === "function"
        ? window.confirm(`确认删除“${getRecordDisplayName(city)}”吗？`)
        : true;
    if (!shouldDelete) return;

    const nextCandidate = appState.cities[index + 1] || appState.cities[index - 1] || null;
    appState.cities = appState.cities.filter((record) => record.id !== cityId);
    appState.bulkSelection.delete(cityId);
    appState.selectedCityId = nextCandidate?.id || null;
    renderAll();
    setStatus("城市已删除", `${getRecordDisplayName(city)} 已从列表中移除`);
  }

  function clearAllCities() {
    if (!appState.cities.length) {
      setStatus("没有可清空的城市", "当前列表已经是空的");
      return;
    }

    const shouldClear =
      typeof window.confirm === "function"
        ? window.confirm(`确认清空全部 ${appState.cities.length} 个城市吗？`)
        : true;
    if (!shouldClear) return;

    appState.cities = [];
    appState.bulkSelection = new Set();
    appState.selectedCityId = null;
    renderAll();
    setStatus("城市列表已清空", "可以重新批量导入或手动新增城市");
  }

  function importBulkCities() {
    if (!elements.bulkInput) return;

    const importedCities = parseNameListInput(elements.bulkInput.value);
    appState.citySeq += importedCities.length;
    appState.cities = [...appState.cities, ...importedCities];

    const firstImported = importedCities[0];
    if (firstImported) {
      selectCity(firstImported.id, { forceRerender: true });
    } else {
      renderAll();
    }

    const resolvedCount = importedCities.filter((city) => resolveCityCoordinate(city, appState.lookup)).length;
    setStatus(
      "批量导入完成",
      `新增 ${importedCities.length} 条记录，其中 ${resolvedCount} 条已自动定位`
    );
  }

  function clearBulkInput() {
    if (!elements.bulkInput) return;
    elements.bulkInput.value = "";
    setStatus("批量文本已清空", "可重新粘贴城市名，一行一个");
  }

  function applyBulkStyleToCities() {
    if (!appState.cities.length) {
      setStatus("无法批量应用", "当前还没有可修改的城市记录");
      return;
    }

    const targetIds = new Set(getBulkTargetIds());
    const nextMarkerType = normalizeBulkMarkerType(appState.batchStyle.markerType, appState.defaults.markerType);
    const nextColor = String(appState.batchStyle.color || appState.defaults.color).trim() || appState.defaults.color;
    const nextSize = parseOptionalNumber(appState.batchStyle.size) ?? appState.defaults.size;
    const nextGlow = parseOptionalNumber(appState.batchStyle.glow) ?? appState.defaults.glow;

    appState.cities = appState.cities.map((record) => {
      if (!targetIds.has(record.id)) return record;
      return {
        ...record,
        markerType: nextMarkerType,
        color: nextColor,
        size: nextSize,
        glow: nextGlow,
        label: String(record.name ?? record.label ?? "").trim(),
      };
    });

    renderAll();
    setStatus(
      "批量样式已应用",
      `已更新 ${targetIds.size} 个城市的标记样式${getBulkSelectionCount() ? "（按勾选范围）" : "（全部城市）"}`
    );
  }

  function bindEvents() {
    if (elements.recordList) {
      elements.recordList.addEventListener("change", (event) => {
        const checkbox = event.target.closest("[data-bulk-city-id]");
        if (!(checkbox instanceof HTMLInputElement)) return;
        setBulkSelection(checkbox.dataset.bulkCityId, checkbox.checked);
      });

      elements.recordList.addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-delete-city-id]");
        if (deleteButton) {
          deleteCity(deleteButton.dataset.deleteCityId);
          return;
        }
        const button = event.target.closest("button[data-city-id]");
        if (!button) return;
        selectCity(button.dataset.cityId, { forceRerender: true });
      });
    }

    if (elements.cityForm) {
      elements.cityForm.addEventListener("input", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLElement) || !input.name) return;
        updateSelectedCityField(input.name, input.value);
      });
    }

    if (elements.defaultsForm) {
      elements.defaultsForm.addEventListener("input", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLElement) || !input.name) return;
        updateDefaultsField(input.name, input.value);
        renderChart();
        updateTopCards();
      });
    }

    if (elements.bulkStyleForm) {
      elements.bulkStyleForm.addEventListener("input", (event) => {
        const input = event.target;
        if (!(input instanceof HTMLElement) || !input.name) return;
        updateBatchStyleField(input.name, input.value);
      });
    }

    if (elements.showLabelsSelect) {
      elements.showLabelsSelect.addEventListener("input", (event) => {
        const input = event.target;
        updateDefaultsField("showLabels", input.value);
        renderScatterLayer();
      });
    }

    if (elements.labelLanguageSelect) {
      elements.labelLanguageSelect.addEventListener("input", (event) => {
        const input = event.target;
        updateDefaultsField("labelLanguage", input.value);
        renderScatterLayer();
      });
    }

    const addButtons = [elements.addCityHeaderBtn, elements.addCityBtn].filter(Boolean);
    for (const button of addButtons) {
      button.addEventListener("click", () => addCity());
    }

    if (elements.clearAllCitiesBtn) {
      elements.clearAllCitiesBtn.addEventListener("click", () => clearAllCities());
    }

    const paletteContainers = [
      elements.cityColorPalette,
      elements.defaultColorPalette,
      elements.bulkStyleColorPalette,
    ].filter(Boolean);
    for (const palette of paletteContainers) {
      palette.addEventListener("click", (event) => {
        const button = event.target.closest("[data-color-value]");
        if (!button) return;
        const { colorScope, colorValue } = button.dataset;
        if (colorScope === "defaults") {
          updateDefaultsField("defaultMarkerColor", colorValue);
          renderDefaultsForm();
          renderChart();
          return;
        }
        if (colorScope === "batch") {
          updateBatchStyleField("color", colorValue);
          renderBatchStyleForm();
          return;
        }
        updateSelectedCityField("color", colorValue);
      });
    }

    if (elements.mapThemePalette) {
      elements.mapThemePalette.addEventListener("click", (event) => {
        const button = event.target.closest("[data-theme-id]");
        if (!button) return;
        setMapTheme(button.dataset.themeId);
      });
    }

    if (elements.mapZoomSlider) {
      elements.mapZoomSlider.addEventListener("input", (event) => {
        setMapZoom(event.target.value);
      });
    }

    if (elements.zoomInBtn) {
      elements.zoomInBtn.addEventListener("click", () => setMapZoom(appState.mapView.zoom + 0.2));
    }

    if (elements.zoomOutBtn) {
      elements.zoomOutBtn.addEventListener("click", () => setMapZoom(appState.mapView.zoom - 0.2));
    }

    if (elements.resetViewBtn) {
      elements.resetViewBtn.addEventListener("click", () => resetMapView());
    }

    if (elements.deleteCityBtn) {
      elements.deleteCityBtn.addEventListener("click", () => {
        deleteCity(appState.selectedCityId);
      });
    }

    if (elements.saveConfigBtn) {
      elements.saveConfigBtn.addEventListener("click", () => saveCurrentConfig());
    }

    if (elements.bulkImportBtn) {
      elements.bulkImportBtn.addEventListener("click", () => {
        try {
          importBulkCities();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          setStatus("批量导入失败", message);
        }
      });
    }

    if (elements.bulkClearBtn) {
      elements.bulkClearBtn.addEventListener("click", () => clearBulkInput());
    }

    if (elements.bulkStyleApplyBtn) {
      elements.bulkStyleApplyBtn.addEventListener("click", () => applyBulkStyleToCities());
    }

    if (elements.exportPngBtn) {
      elements.exportPngBtn.addEventListener("click", () => exportPng());
    }

    if (elements.loadConfigBtn && elements.loadConfigInput) {
      elements.loadConfigBtn.addEventListener("click", () => {
        elements.loadConfigInput.value = "";
        elements.loadConfigInput.click();
      });
    }

    if (elements.loadConfigInput) {
      elements.loadConfigInput.addEventListener("change", async (event) => {
        const input = event.target;
        const file = input.files?.[0];
        if (!file) return;

        try {
          await loadConfigFromFile(file);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          setStatus("载入配置失败", message);
        } finally {
          if (input) {
            input.value = "";
          }
        }
      });
    }
  }

  function bindMapInteractions() {
    if (!appState.chart) return;

    const zr = appState.chart.getZr();
    appState.chart.on("mousedown", handleMapMouseDown);
    appState.chart.on("georoam", () => {
      syncMapViewFromChart();
      renderMapControls();
      renderScatterLayer();
    });
    zr.on("mousemove", handleMapMouseMove);
    zr.on("mouseup", handleMapMouseUp);
    zr.on("globalout", handleMapMouseUp);
    window.addEventListener("mouseup", handleMapMouseUp, { passive: true });
  }

  function renderChartStatus() {
    const resolvedCount = appState.cities.filter((city) => resolveCityCoordinate(city, appState.lookup)).length;
    setStatus(
      STATUS_READY.primary,
      `${STATUS_READY.secondary} · ${appState.cities.length} 条记录，${resolvedCount} 条已定位`
    );
    updateTopCards();
  }

  function updateErrorState(message) {
    setStatus("地图加载失败", message);
    if (elements.mapStage) {
      elements.mapStage.innerHTML = `
        <div style="
          display:grid;
          place-items:center;
          height:100%;
          min-height: 680px;
          padding: 24px;
          color:#7e4141;
          text-align:center;
          background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,242,242,0.92));
        ">
          <div>
            <strong style="display:block;font-size:1.2rem;margin-bottom:8px;">地图资源未能加载</strong>
            <span style="display:block;line-height:1.6;">${escapeHtml(message)}</span>
          </div>
        </div>
      `;
    }
  }

  async function init() {
    elements.statusBar = document.getElementById("status-bar");
    elements.mapStage = document.getElementById("map-stage");
    elements.recordList = document.getElementById("record-list");
    elements.cityForm = document.getElementById("city-form");
    elements.defaultsForm = document.getElementById("defaults-form");
    elements.addCityHeaderBtn = document.getElementById("add-city-header-btn");
    elements.clearAllCitiesBtn = document.getElementById("clear-all-cities-btn");
    elements.addCityBtn = document.getElementById("add-city-btn");
    elements.mapSourceLabel = document.getElementById("map-source-label");
    elements.selectedCityName = document.getElementById("selected-city-name");
    elements.mapLegendLabel = document.getElementById("map-legend-label");
    elements.currentCityHint = document.getElementById("current-city-hint");
    elements.saveConfigBtn = document.getElementById("save-config-btn");
    elements.loadConfigBtn = document.getElementById("load-config-btn");
    elements.exportPngBtn = document.getElementById("export-png-btn");
    elements.loadConfigInput = document.getElementById("load-config-input");
    elements.zoomInBtn = document.getElementById("zoom-in-btn");
    elements.zoomOutBtn = document.getElementById("zoom-out-btn");
    elements.resetViewBtn = document.getElementById("reset-view-btn");
    elements.mapZoomSlider = document.getElementById("map-zoom-slider");
    elements.mapZoomValue = document.getElementById("map-zoom-value");
    elements.showLabelsSelect = document.getElementById("show-labels-select");
    elements.labelLanguageSelect = document.getElementById("label-language-select");
    elements.mapThemePalette = document.getElementById("map-theme-palette");
    elements.mapThemeName = document.getElementById("map-theme-name");
    elements.mapScaleBar = document.getElementById("map-scale-bar");
    elements.mapScaleLabel = document.getElementById("map-scale-label");
    elements.bulkInput = document.getElementById("bulk-input");
    elements.bulkImportBtn = document.getElementById("bulk-import-btn");
    elements.bulkClearBtn = document.getElementById("bulk-clear-btn");
    elements.bulkStyleForm = document.getElementById("bulk-style-form");
    elements.bulkStyleApplyBtn = document.getElementById("bulk-style-apply-btn");
    elements.bulkStyleColorPalette = document.getElementById("bulk-style-color-palette");
    elements.bulkStyleColorPreview = document.getElementById("bulk-style-color-preview");
    elements.bulkStyleHint = document.getElementById("bulk-style-hint");
    elements.deleteCityBtn = document.getElementById("delete-city-btn");
    elements.cityColorPalette = document.getElementById("city-color-palette");
    elements.cityColorPreview = document.getElementById("city-color-preview");
    elements.defaultColorPalette = document.getElementById("default-color-palette");
    elements.defaultColorPreview = document.getElementById("default-color-preview");

    if (!elements.mapStage) return;

    if (!window.echarts) {
      updateErrorState("ECharts 未加载，请检查 assets/vendor/echarts.min.js。");
      return;
    }

    renderCityList();
    renderDefaultsForm();
    renderBatchStyleForm();
    renderCityForm(getSelectedCity() || appState.cities[0]);
    setStatus("加载中", "正在读取中国地图与城市坐标索引");
    bindEvents();

    try {
      const [geoJson, cityLookupData, labelPinyinData] = await Promise.all([
        loadLocalData("./assets/data/china.geojson", INLINE_GEO_KEY),
        loadLocalData("./assets/data/cities.json", INLINE_CITY_KEY),
        loadLocalData("./assets/data/city-labels-pinyin.json", INLINE_PINYIN_KEY).catch(() => ({})),
      ]);

      const cityEntries = Array.isArray(cityLookupData)
        ? cityLookupData
        : Array.isArray(cityLookupData?.entries)
          ? cityLookupData.entries
          : [];

      appState.lookup = buildLookup(cityEntries);
      appState.lookupEntries = cityEntries;
      appState.labelPinyin = labelPinyinData && typeof labelPinyinData === "object" ? labelPinyinData : {};
      appState.geoJson = geoJson;
      echarts.registerMap("china-workbench", geoJson);
      appState.chart = echarts.init(elements.mapStage, null, {
        renderer: "canvas",
        useDirtyRect: true,
      });
      appState.chartReady = true;
      appState.chart.on("click", (params) => {
        if (params?.data?.recordId) {
          selectCity(params.data.recordId, { forceRerender: true });
        }
      });
      bindMapInteractions();
      window.addEventListener("resize", () => {
        appState.chart?.resize();
        updateScaleBar();
      }, { passive: true });

      renderAll();
      renderChartStatus();
    } catch (error) {
      updateErrorState(error instanceof Error ? error.message : String(error));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
