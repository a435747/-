// map.js
let globalScreenInfo = null;
let globalImageInfo = null;
const treePoints = require('../../tree-points.js');
const CloudDatabase = require('../../utils/cloudDatabase.js');

Page({
  data: {
    // 地图相关
    mapImageWidth: 5362, // 地图像素宽度
    mapImageHeight: 3797, // 地图像素高度
    mapWidth: 750, // 地图显示宽度(rpx)
    mapHeight: 500, // 地图显示高度(rpx)
    mapScale: 7.5, // 初始缩放比例设置为7.5
    
    // 屏幕信息
    screenWidth: 0,
    screenHeight: 0,
    
    // 滚动位置
    scrollLeft: 0,
    scrollTop: 0,
    
    // 手势缩放相关
    touchStartDistance: 0,
    initialScale: 7.5, // 初始缩放比例
    
    // 区域显示控制
    hideRegions: false, // 控制是否隐藏区域标记
    showRegionSelection: false, // 控制是否显示区域选择（名师林/校友林）
    showForestSelectionModal: true, // 控制是否显示初始林区选择弹窗
    
    // 禁用缩放
    disableZoom: true, // 禁用缩放功能
    
    // 专注名师林 - 优先显示名师林
    regions: [
      {
        id: 'famous-teacher-forest',
        name: '名师林',
        emoji: '🌲',
        description: '名师守护参与区域',
        mapX: 150,
        mapY: 150,
        treeCount: 70,
        availableCount: 0,
        color: '#FF9800',
        priority: 1, // 优先级最高
        isActive: true
      },
      {
        id: 'alumni-forest',
        name: '校友林',
        emoji: '🌳',
        description: '校友参与区域',
        mapX: 300,
        mapY: 200,
        treeCount: 50,
        availableCount: 50,
        color: '#4CAF50',
        priority: 2,
        isActive: true // 开放校友林
      }
    ],
    
    // 当前选中区域
    selectedRegion: null,
    showRegionInfo: false,
    
    // 树木数据
    treeData: [],
    currentRegionTrees: [],
    
    // 选中树木和状态
    selectedTree: null,
    showTreeInfo: false,
    
    // 地图上显示的所有树木（增强版 - 显示更多树木）
    mapTrees: [],
    allMapTrees: [], // 存储所有区域的树木
    
    // GPS定位相关
    userLocation: null,
    locationPermission: false,
    showLocationBtn: true,
    
    // 成长阶段定义
    growthStages: [
      { level: 1, name: '种子萌芽', emoji: '🌱', minValue: 0, description: '嫩绿小芽' },
      { level: 2, name: '幼苗成长', emoji: '🌿', minValue: 500, description: '10cm细芽+2-3片小叶' },
      { level: 3, name: '枝展叶茂', emoji: '🌳', minValue: 1500, description: '树干长高，分枝3-4条' },
      { level: 4, name: '树干成型', emoji: '🌲', minValue: 3500, description: '1米高，树冠呈圆形' },
      { level: 5, name: '枝叶繁茂', emoji: '🌴', minValue: 6500, description: '2米高，枝叶繁盛' },
      { level: 6, name: '参天成荫', emoji: '🌳', minValue: 10000, description: '3米高，枝干粗壮' },
      { level: 7, name: '古树参天', emoji: '🌲', minValue: 15000, description: '5米+，枝叶茂盛' }
    ],
    
    // 树木详情弹窗
    showTreeDetail: false,
    treeDetailData: null,
    loading: true,
    imageLoaded: false,
    pointsLoaded: false,
    searchTreeId: '',
    ratio: 1, // 像素与rpx比例
    targetCoordinate: null,
    // 校友林选择器状态与统计
    showAlumniPicker: false,
    alumniSelection: { zoneIndex: 0, number: '' },
    alumniForestStats: {
      totalTrees: 2100,
      zones: [
        { zone: 'A', count: 328, era: '1955-1964', range: '1-328' },
        { zone: 'B', count: 360, era: '1965-1974', range: '329-688' },
        { zone: 'C', count: 357, era: '1975-1984', range: '689-1045' },
        { zone: 'D', count: 92, era: '1985-1994', range: '1046-1137' },
        { zone: 'E', count: 281, era: '1995-2004', range: '1138-1418' },
        { zone: 'F', count: 402, era: '2005-2014', range: '1419-1820' },
        { zone: 'G', count: 280, era: '2015-2025', range: '1821-2100' }
      ]
    }
  },
  
  // 开发者工具：批量导入地图上的所有树到云数据库
  async importAllTrees() {
    try {
      const points = treePoints || [];
      const trees = points.map(p => ({
        id: String(p.id),
        treeId: String(p.id),
        name: `树木 ${p.id}`,
        region: p.region,
        areaId: p.region === '名师林' ? 'famous-teacher-forest' : 'alumni-forest',
        originalX: Number(p.x),
        originalY: Number(p.y),
        emoji: p.region === '名师林' ? '🌲' : '🌳',
        species: p.region === '名师林' ? '雪松' : '银杏',
        stage: 1,
        points: 0,
        maxPoints: 7000,
        totalWateringCount: 0,
        totalWateringAmount: 0,
        totalGrowthValue: 0
      }));

      wx.showLoading({ title: '导入中...', mask: true });
      const res = await CloudDatabase.bulkUpsertTrees(trees);
      wx.hideLoading();
      if (res && res.success) {
        wx.showToast({ title: `导入完成(${res.data.count})`, icon: 'success' });
      } else {
        console.error('云函数导入失败，尝试本地直写:', res);
        await this.importAllTreesDirect(trees);
      }
    } catch (e) {
      wx.hideLoading();
      console.error('导入异常，尝试本地直写:', e);
      const points = treePoints || [];
      const trees = points.map(p => ({
        id: String(p.id),
        treeId: String(p.id),
        name: `树木 ${p.id}`,
        region: p.region,
        areaId: p.region === '名师林' ? 'famous-teacher-forest' : 'alumni-forest',
        originalX: Number(p.x),
        originalY: Number(p.y),
        emoji: p.region === '名师林' ? '🌲' : '🌳',
        species: p.region === '名师林' ? '雪松' : '银杏',
        stage: 1,
        points: 0,
        maxPoints: 7000,
        totalWateringCount: 0,
        totalWateringAmount: 0,
        totalGrowthValue: 0
      }));
      await this.importAllTreesDirect(trees);
    }
  },

  // 兜底：直接在小程序端写入云数据库（无需云函数）
  async importAllTreesDirect(trees) {
    try {
      const db = wx.cloud.database();
      const batchSize = 20;
      const now = new Date();
      for (let i = 0; i < trees.length; i += batchSize) {
        const slice = trees.slice(i, i + batchSize);
        // 并发写入当前批次
        await Promise.all(slice.map(async (raw) => {
          const id = String(raw.treeId || raw.id);
          const _id = `tree-${id}`;
          const data = {
            treeId: id,
            name: raw.name,
            region: raw.region,
            areaId: raw.areaId,
            originalX: raw.originalX,
            originalY: raw.originalY,
            emoji: raw.emoji,
            species: raw.species,
            stage: 1,
            points: 0,
            maxPoints: 7000,
            totalWateringCount: 0,
            totalWateringAmount: 0,
            totalGrowthValue: 0,
            createdAt: now,
            updatedAt: now
          };
          try {
            await db.collection('trees').doc(_id).set({ data });
          } catch (e) {
            await db.collection('trees').doc(_id).update({ data });
          }
        }));
        // 轻微节流
        await new Promise(r => setTimeout(r, 100));
      }
      wx.showToast({ title: `导入完成(${trees.length})`, icon: 'success' });
    } catch (err) {
      console.error('本地直写导入失败:', err);
      wx.showToast({ title: '导入失败', icon: 'none' });
    }
  },

  onLoad(options) {
    console.log('地图页面开始加载');
    
    // 设置页面标识，防止其他页面调用地图方法
    this.isMapPage = true;
    
    this.setData({
      loading: true,
      mapScale: 7.5 // 确保缩放比例为7.5
    });
    
    // 获取屏幕信息
    this.getScreenInfo();
    
    // 初始化坐标系
    this.initMapCoordinateSystem();
    
    // 加载树木点位数据
    this.loadTreePoints();
    
    // 申请定位权限
    this.requestLocationPermission();
    
    // 获取定位信息
    this.processLocationOptions(options);
    
    // 显示林区选择弹窗
    this.setData({
      showForestSelectionModal: true
    });
    
    console.log('地图页面初始化完成');
  },
  
  // 新方法：初始化地图坐标系统
  initMapCoordinateSystem() {
    // 获取设备信息（优先使用新API，兼容旧API）
    const info = (wx.getWindowInfo && typeof wx.getWindowInfo === 'function')
      ? wx.getWindowInfo()
      : wx.getSystemInfoSync();
    const screenWidth = info.windowWidth;
    const screenHeight = info.windowHeight;
    
    // 地图实际像素尺寸
    const mapPixelWidth = 5362;
    const mapPixelHeight = 3797;
    
    // 计算rpx到px的转换比例
    const rpxToPx = screenWidth / 750;
    
    // 计算像素坐标到rpx的转换比例
    const pixelToRpx = 750 / mapPixelWidth;
    
    this.setData({
      screenWidth: screenWidth,
      screenHeight: screenHeight,
      mapImageWidth: mapPixelWidth,
      mapImageHeight: mapPixelHeight,
      // 地图在rpx单位下的尺寸
      mapWidth: mapPixelWidth * pixelToRpx,
      mapHeight: mapPixelHeight * pixelToRpx,
      ratio: pixelToRpx,
      rpxToPx: rpxToPx
    });
    
    console.log('地图坐标系初始化完成', {
      屏幕尺寸: {width: screenWidth, height: screenHeight},
      地图像素尺寸: {width: mapPixelWidth, height: mapPixelHeight},
      地图rpx尺寸: {width: mapPixelWidth * pixelToRpx, height: mapPixelHeight * pixelToRpx},
      转换比例: {
        rpxToPx: rpxToPx,
        pixelToRpx: pixelToRpx
      }
    });
  },

  // 新方法：处理定位选项
  processLocationOptions(options) {
    // 1. 检查URL参数
    let targetLocation = null;
    
    if (options) {
      console.log('收到页面参数:', options);
      if (options.treeId || options.region || (options.x && options.y)) {
        targetLocation = {
          treeId: options.treeId,
          region: options.region,
          x: options.x ? parseFloat(options.x) : undefined,
          y: options.y ? parseFloat(options.y) : undefined
        };
      }
    }
    
    // 2. 如果URL参数中没有定位信息，则使用全局配置
    if (!targetLocation) {
      // 获取全局配置
      const app = getApp();
      if (app && app.getDefaultLocation) {
        targetLocation = app.getDefaultLocation();
        console.log('使用全局默认定位:', targetLocation);
      }
    }
    
    // 3. 如果还是没有定位信息，使用默认值 - 地图中心点
    if (!targetLocation) {
      targetLocation = {
        x: this.data.mapImageWidth / 2,
        y: this.data.mapImageHeight / 2,
        isPixelCoordinate: true
      };
      console.log('使用默认地图中心点定位:', targetLocation);
    }
    
    // 4. 保存定位目标
    this.setData({ targetCoordinate: targetLocation });
    
    // 5. 等待地图加载完成后进行定位
    this.waitForMapReadyAndLocate();
  },
  
  // 新方法：等待地图加载完成并进行定位
  waitForMapReadyAndLocate(retryCount = 0) {
    // 添加调用栈信息，便于调试
    const stack = new Error().stack;
    console.log(`waitForMapReadyAndLocate 被调用，重试次数: ${retryCount}，调用栈:`, stack);
    
    // 检查当前页面是否仍然是地图页面
    if (!this.isMapPage) {
      console.log('当前不在地图页面，停止定位等待');
      return;
    }
    
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    if (currentPage.route !== 'pages/map/map') {
      console.log('当前不在地图页面，停止定位等待');
      return;
    }
    
    // 添加最大重试次数，避免无限循环
    const maxRetries = 50; // 最多重试50次，即5秒
    
    if (retryCount >= maxRetries) {
      console.log('地图加载超时，使用默认定位');
      this.centerMap();
      return;
    }
    
    if (this.data.imageLoaded && this.data.pointsLoaded) {
      console.log('地图已准备就绪，执行定位操作');
      this.locateToTarget();
    } else {
      console.log(`地图加载中，等待加载完成后定位 (${retryCount + 1}/${maxRetries})`);
      // 使用实例变量存储定时器，便于清理
      this.locationTimer = setTimeout(() => {
        this.waitForMapReadyAndLocate(retryCount + 1);
      }, 100);
    }
  },
  
  // 新方法：定位到目标位置
  locateToTarget() {
    const target = this.data.targetCoordinate;
    if (!target) {
      console.log('没有定位目标，显示地图中心');
      this.centerMap();
      return;
    }
    
    console.log('执行定位:', target);
    
    // 1. 如果有树木ID，优先定位到树木
    if (target.treeId) {
      const tree = this.findTreeById(target.treeId);
      if (tree) {
        console.log('定位到树木:', tree);
        // 使用固定位置定位
        this.centerMapToPixel(tree.mapX, tree.mapY, target.treeId);
        return;
      }
    }
    
    // 2. 如果有区域名称，定位到区域
    if (target.region) {
      this.centerMapToRegion(target.region);
      return;
    }
    
    // 3. 如果有坐标，直接定位到固定位置
    if (target.x !== undefined && target.y !== undefined) {
      // 无论是什么坐标，都使用固定位置定位
      this.centerMapToPixel(target.x, target.y, target.treeId);
      return;
    }
    
    // 4. 如果都没有，则居中显示整个地图
    this.centerMap();
  },
  
  // 新方法：定位到指定的像素坐标
  centerMapToPixel(pixelX, pixelY, treeId) {
    console.log('定位到像素坐标:', pixelX, pixelY, '树木ID:', treeId);
    
    // 使用固定缩放比例7.5
    const scale = 7.5;
    
    // 根据树木ID范围设置不同的滚动位置
    let scrollLeft = 870;
    let scrollTop = 500;
    
    // 如果提供了树木ID，根据ID范围设置不同的滚动位置
    if (treeId !== undefined) {
      const id = parseInt(treeId);
      if (id >= 1 && id <= 26) {
        scrollLeft = 870;
        scrollTop = 1500;
      } else if (id >= 27 && id <= 66) {
        scrollLeft = 870;
        scrollTop = 500;
      }
    }
    
    console.log('设置固定滚动位置:', {
      scrollLeft: scrollLeft,
      scrollTop: scrollTop,
      scale: scale
    });
    
    // 设置地图状态
    this.setData({
      mapScale: scale,
      scrollLeft: scrollLeft,
      scrollTop: scrollTop
    });
  },
  
  // 新方法：定位到指定的rpx坐标点
  centerMapToPoint(rpxX, rpxY) {
    console.log('定位到rpx坐标:', rpxX, rpxY, '缩放固定为7.5');
    
    // 使用固定缩放比例7.5
    const scale = 7.5;
    
    // 计算地图容器中心
    const containerWidth = this.data.screenWidth;
    const containerHeight = this.data.screenHeight;
    
    // 计算滚动位置，使目标点位于视口中心
    // 注意：rpx到px的转换
    const rpxToPx = this.data.rpxToPx;
    const targetPxX = rpxX * rpxToPx;
    const targetPxY = rpxY * rpxToPx;
    
    // 计算滚动位置（像素）
    const scrollLeftPx = (targetPxX * scale) - (containerWidth / 2);
    const scrollTopPx = (targetPxY * scale) - (containerHeight / 2);
    
    // 转换回rpx
    let scrollLeft = scrollLeftPx / rpxToPx;
    let scrollTop = scrollTopPx / rpxToPx;
    
    // 添加边界检查，确保滚动位置不会过大
    const maxScrollLeft = 10000; // 设置一个合理的最大滚动值
    const maxScrollTop = 10000;
    
    if (scrollLeft > maxScrollLeft) scrollLeft = maxScrollLeft;
    if (scrollTop > maxScrollTop) scrollTop = maxScrollTop;
    if (scrollLeft < 0) scrollLeft = 0;
    if (scrollTop < 0) scrollTop = 0;
    
    console.log('设置滚动位置和固定缩放7.5:', {
      scrollLeft: scrollLeft,
      scrollTop: scrollTop,
      scale: scale
    });
    
    // 设置地图状态
    this.setData({
      mapScale: scale,
      scrollLeft: scrollLeft,
      scrollTop: scrollTop
    });
  },
  
  // 新方法：定位到指定区域
  centerMapToRegion(regionId) {
    console.log('定位到区域:', regionId);
    
    let targetX, targetY;
    
    if (regionId === 'famous-teacher-forest' || regionId === '名师林') {
      // 名师林中心点像素坐标
      targetX = 2700;
      targetY = 1900;
    } else if (regionId === 'alumni-forest' || regionId === '校友林') {
      // 校友林中心点像素坐标
      targetX = 3100;
      targetY = 2700;
    } else {
      // 未知区域，显示地图中心
      this.centerMap();
      return;
    }
    
    // 使用像素坐标定位，保持固定缩放比例7.5
    this.centerMapToPixel(targetX, targetY, null);
    
    // 更新选中区域状态
    const selectedRegion = this.data.regions.find(r => r.id === regionId || r.name === regionId);
    if (selectedRegion) {
      wx.setNavigationBarTitle({
        title: selectedRegion.name
      });
    }
  },
  
  // 新方法：居中显示整个地图
  centerMap() {
    console.log('居中显示整个地图');
    
    // 使用固定缩放比例和固定位置
    const scale = 7.5;
    const scrollLeft = 870;
    const scrollTop = 500; // 默认使用27-66号树木的位置
    
    this.setData({
      mapScale: scale,
      scrollLeft: scrollLeft,
      scrollTop: scrollTop
    });
  },
  
  // 新方法：根据ID查找树木
  findTreeById(treeId) {
    if (!this.data.mapTrees || this.data.mapTrees.length === 0) {
      console.log('树木数据尚未加载完成');
      return null;
    }
    
    // 确保进行字符串比较
    const tree = this.data.mapTrees.find(t => String(t.id) === String(treeId));
    if (tree) {
      return tree;
    }
    
    console.log('未找到ID为', treeId, '的树木');
    return null;
  },

  // 获取屏幕信息
  getScreenInfo() {
    wx.getSystemInfo({
      success: (res) => {
        globalScreenInfo = { width: res.windowWidth, height: res.windowHeight };
        this.setData({
          screenWidth: res.windowWidth,
          screenHeight: res.windowHeight
        });
      }
    });
  },

  // 新方法：加载树木点位数据
  loadTreePoints() {
    // 使用tree-points.js中定义的树木点位
    const allPoints = treePoints;
    
    // 处理树木点位数据
    const mapTrees = allPoints.map(item => {
      return {
        id: item.id,
        name: `${item.id}`,
        emoji: item.region === '名师林' ? '🌲' : '🌳',
        mapX: parseFloat(item.x), // 原始像素X坐标
        mapY: parseFloat(item.y), // 原始像素Y坐标
        canInteract: true,
        isDecorative: false,
        region: item.region, // 区域名称
        areaId: item.region === '名师林' ? 'famous-teacher-forest' : 'alumni-forest'
      };
    });
    
    console.log('加载树木点位数据完成，共', mapTrees.length, '个点位');
    console.log('样本点位:', mapTrees.slice(0, 3));
    
    this.setData({
      allMapTrees: mapTrees,
      mapTrees: mapTrees,
      pointsLoaded: true
    });
  },

  // 图片加载完成后的处理
  onImageLoad(e) {
    console.log('地图图片加载完成:', e.detail.width, 'x', e.detail.height);
    
    // 确保使用准确的图片尺寸
    const imgWidth = e.detail.width;  // 5362像素
    const imgHeight = e.detail.height; // 3797像素
    
    // 保存图片信息
    globalImageInfo = { width: imgWidth, height: imgHeight };
    
    // 计算比例系数
    const pixelToRpx = 750 / imgWidth;
    
    this.setData({
      mapImageWidth: imgWidth,
      mapImageHeight: imgHeight,
      ratio: pixelToRpx,
      imageLoaded: true,
      loading: false
    });
    
    console.log('地图图片信息更新完成:', {
      尺寸: {width: imgWidth, height: imgHeight},
      比例系数: pixelToRpx,
      地图rpx尺寸: {width: 750, height: imgHeight * pixelToRpx}
    });
    
    // 更新树木点位的rpx坐标
    this.updateTreeCoordinates();
  },
  
  // 新方法：更新树木坐标为rpx单位
  updateTreeCoordinates() {
    if (!this.data.allMapTrees || this.data.allMapTrees.length === 0) {
      console.log('没有树木点位数据，无需更新坐标');
      return;
    }
    
    const pixelToRpx = this.data.ratio;
    
    // 转换所有树木坐标
    const updatedTrees = this.data.allMapTrees.map(tree => {
      // 保存原始像素坐标
      const pixelX = tree.mapX;
      const pixelY = tree.mapY;
      
      // 转换为rpx坐标
      const rpxX = pixelX * pixelToRpx;
      const rpxY = pixelY * pixelToRpx;
      
      return {
        ...tree,
        originalX: pixelX,  // 保存原始像素坐标
        originalY: pixelY,
        mapX: rpxX,  // 使用rpx坐标
        mapY: rpxY
      };
    });
    
    console.log('树木坐标更新完成，共', updatedTrees.length, '个点位');
    console.log('更新后样本点位:', updatedTrees.slice(0, 3));
    
    this.setData({
      mapTrees: updatedTrees,
      allMapTrees: updatedTrees
    });
  },

  // 图片加载错误处理
  onImageError(e) {
    console.error('地图图片加载失败:', e);
    wx.showToast({
      title: '地图加载失败，请重试',
      icon: 'none',
      duration: 2000
    });
    
    this.setData({
      loading: false
    });
    
    // 提示用户刷新
    setTimeout(() => {
      wx.showModal({
        title: '提示',
        content: '地图加载失败，是否重新加载？',
        success: (res) => {
          if (res.confirm) {
            this.onLoad();
          }
        }
      });
    }, 1000);
  },

  // 树木点击事件
  onMapTreeTap(e) {
    const treeId = e.currentTarget.dataset.treeId;
    const tree = this.data.mapTrees.find(t => t.id === treeId);
    if (!tree) return;
    
    console.log('点击树木:', tree);
    
    // 设置当前选中的树木
    this.setData({
      selectedTree: tree
    });
    
    // 定位到树木，传递树木ID
    this.centerMapToPixel(tree.mapX, tree.mapY, tree.id);
    
    // 显示树木详情
    this.showTreeDetailModal(tree);
  },

  // 显示树木详情弹窗
  showTreeDetailModal(tree) {
    const treeId = String(tree.id);
    const base = {
      ...tree,
      type: tree.region === '名师林' ? '雪松' : '银杏',
      region: tree.region
    };

    // 先显示基础信息，随后填充统计数据
    this.setData({ showTreeDetail: true, treeDetailData: base });

    // 异步加载统计（强制从云数据库获取最新数据）
    this.loadTreeStats(treeId, base);
  },

  async loadTreeStats(treeId, base) {
    try {
      console.log('开始加载树木统计，treeId:', treeId);
      
      const db = wx.cloud.database();
      // 读取全局记录
      const pageSize = 100;
      let total = 0;
      try {
        const countRes = await db.collection('wateringRecords').where({ treeId }).count();
        total = countRes.total || 0;
        console.log('该树的浇水记录总数:', total);
      } catch (e) {
        // 兼容无 count 权限或规则，退化为只拉一页
        total = pageSize;
        console.log('无法获取记录总数，使用默认分页:', pageSize);
      }

      let fetched = 0;
      let all = [];
      while (fetched < total) {
        const res = await db.collection('wateringRecords')
          .where({ treeId })
          .skip(fetched)
          .limit(pageSize)
          .get();
        all = all.concat(res.data || []);
        if (!res.data || res.data.length < pageSize) break;
        fetched += res.data.length;
      }

      console.log('获取到的浇水记录:', all.length);

      // 聚合全局
      const totalWaterAmountGlobal = all.reduce((s, r) => s + (Number(r.waterAmount) || 1), 0);
      const totalGrowthValueGlobal = all.reduce((s, r) => s + (Number(r.growthValue) || 70), 0);

      // 我的
      let myOpenId = '';
      try { myOpenId = (await CloudDatabase.getOpenId())?.openid || ''; } catch (e) {}
      const myRecords = myOpenId ? all.filter(r => r.userId === myOpenId) : [];
      const myWaterAmount = myRecords.reduce((s, r) => s + (Number(r.waterAmount) || 1), 0);
      const myGrowthValue = myRecords.reduce((s, r) => s + (Number(r.growthValue) || 70), 0);

      // 真实的最近浇水时间：取该树的最新一条浇水记录时间
      const lastTimestamp = all.reduce((max, r) => {
        const t = Number(r.timestamp) || (r.createdAt ? new Date(r.createdAt).getTime() : 0)
        return t > max ? t : max
      }, 0)
      const lastWateredDisplay = lastTimestamp ? new Date(lastTimestamp).toLocaleString('zh-CN') : '暂无'

      const updatedData = {
        ...base,
        totalWaterAmountGlobal,
        totalGrowthValueGlobal,
        myWaterAmount,
        myGrowthValue,
        lastWatered: lastWateredDisplay
      };

      console.log('更新树木详情数据:', updatedData);

      this.setData({
        treeDetailData: updatedData
      });
    } catch (err) {
      console.error('加载树木统计失败:', err);
    }
  },

  // 关闭树木详情弹窗
  closeTreeDetail() {
    this.setData({
      showTreeDetail: false,
      treeDetailData: null
    });
  },

  // 直接浇水
  waterTreeFromDetail() {
    const tree = this.data.treeDetailData;
    if (!tree) return;
    wx.navigateTo({
      url: `/packageA/pages/watering/watering?treeId=${tree.id}`
    });
    this.closeTreeDetail();
  },

  // 切换区域选择显示状态
  toggleRegionSelection() {
    const currentState = this.data.showRegionSelection;
    this.setData({
      showRegionSelection: !currentState,
      mapTrees: this.data.allMapTrees // 显示所有树木
    });
  },

  // 隐藏区域选择面板
  hideRegionSelection() {
    this.setData({
      showRegionSelection: false
    });
  },

  // 打开/关闭校友林选择器
  openAlumniPicker() {
    this.setData({ showAlumniPicker: true, showRegionSelection: false });
  },
  closeAlumniPicker() {
    this.setData({ showAlumniPicker: false });
  },
  confirmAlumniSelection() {
    const { zoneIndex, number } = this.data.alumniSelection;
    
    if (!number || number.trim() === '') {
      wx.showToast({ title: '请输入编号', icon: 'none' });
      return;
    }
    
    const selectedZone = this.data.alumniForestStats.zones[zoneIndex];
    if (!selectedZone) {
      wx.showToast({ title: '请选择年代', icon: 'none' });
      return;
    }
    
    // 验证编号是否在范围内
    const [min, max] = selectedZone.range.split('-').map(Number);
    const treeNumber = Number(number);
    
    if (treeNumber < min || treeNumber > max) {
      wx.showToast({ 
        title: `编号需在${min}-${max}范围内`, 
        icon: 'none' 
      });
      return;
    }
    
    // 生成完整的树ID
    const treeId = `alumni-${selectedZone.zone}-${String(treeNumber).padStart(4, '0')}`;
    
    this.setData({ showAlumniPicker: false });
    
    // 跳转到浇水页面
    wx.navigateTo({
      url: `/packageA/pages/watering/watering?treeId=${treeId}&region=校友林`
    });
  },

  // 校友林选择器事件处理
  onAlumniZoneChange(e) {
    const zoneIndex = Number(e.detail.value);
    this.setData({
      'alumniSelection.zoneIndex': zoneIndex,
      'alumniSelection.number': '' // 清空编号
    });
  },

  onAlumniNumberInput(e) {
    const number = e.detail.value;
    this.setData({
      'alumniSelection.number': number
    });
  },

  // 阻止事件冒泡
  stopPropagation(e) {
    // 阻止事件冒泡，防止点击面板内部时触发hideRegionSelection
    return;
  },

  // 放大地图 - 保持固定缩放比例
  zoomIn() {
    console.log('已禁用缩放，保持固定比例7.5');
  },

  // 缩小地图 - 保持固定缩放比例
  zoomOut() {
    console.log('已禁用缩放，保持固定比例7.5');
  },

  // 重置缩放 - 保持固定缩放比例
  resetZoom() {
    console.log('重置地图缩放为固定比例7.5');
    this.setData({ 
      mapScale: 7.5
    }, () => {
      this.centerMap();
    });
  },

  

  // 区域点击
  onRegionTap(e) {
    const regionId = e.currentTarget.dataset.region;
    const region = this.data.regions.find(r => r.id === regionId);
    if (region) {
      const regionName = region.name;
      this.centerMapToRegion(regionId);
    }
  },

  // 请求定位权限
  requestLocationPermission() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          locationPermission: true
        });
      },
      fail: () => {
        this.setData({
          locationPermission: false
        });
      }
    });
  },

  // 定位用户（模拟定位到名师林）
  locateUser() {
    if (!this.data.locationPermission) {
      wx.showToast({
        title: '请先授权定位',
        icon: 'none'
      });
      return;
    }
    
    // 模拟定位到名师林
    this.centerMapToRegion('famous-teacher-forest');
    wx.showToast({
      title: '已定位到名师林',
      icon: 'success'
    });
  },

  // 搜索树木
  onInputTreeId(e) {
    this.setData({
      searchTreeId: e.detail.value
    });
  },
  
  onSearchTree() {
    const treeId = this.data.searchTreeId;
    if (!treeId) {
      wx.showToast({
        title: '请输入树木编号',
        icon: 'none'
      });
      return;
    }
    
    console.log('搜索树木:', treeId);
    
    // 在所有树木中查找
    const tree = this.findTreeById(treeId);
    if (tree) {
      console.log('找到树木:', tree);
      
      // 定位到树木
      this.centerMapToPixel(tree.mapX, tree.mapY, tree.id);
      
      // 高亮树木
      this.setData({ 
        searchTreeId: treeId 
      });
      
      // 显示树木详情
        this.showTreeDetailModal(tree);
    } else {
      wx.showToast({
        title: '未找到该编号的树木',
        icon: 'none'
      });
    }
  },
  
  // 跳转到我的树木页面
  goToMyTrees() {
    wx.navigateTo({
      url: '/packageB/pages/my-trees/my-trees'
    });
  },

  // 选择林区
  selectForest(e) {
    const selectedForest = e.currentTarget.dataset.forest;
    
    if (selectedForest) {
      this.centerMapToRegion(selectedForest);
      
      // 保存用户选择到全局配置
      const app = getApp();
      if (app && app.setDefaultLocation) {
        app.setDefaultLocation({
          x: selectedForest === 'famous-teacher-forest' ? 2700 : 3100,
          y: selectedForest === 'famous-teacher-forest' ? 1900 : 2700,
          isPixelCoordinate: true
        });
      }
      
      // 关闭弹窗
      this.setData({
        showForestSelectionModal: false,
        showRegionSelection: false
      });
      
      // 提示用户可以在左下角切换
      setTimeout(() => {
        wx.showToast({
          title: '可在左下角"🏠"图标切换林区',
          icon: 'none',
          duration: 3000
        });
      }, 1500);
    }
  },

  // 页面卸载时清理资源
  onUnload() {
    console.log('地图页面卸载，清理资源');
    this.isMapPage = false;
    
    // 清理所有定时器
    if (this.locationTimer) {
      clearTimeout(this.locationTimer);
      this.locationTimer = null;
    }
  },

  // 页面隐藏时暂停定位等待
  onHide() {
    console.log('地图页面隐藏，暂停定位等待');
    this.isMapPage = false;
  },

  // 页面显示时恢复定位等待
  onShow() {
    console.log('地图页面显示，恢复定位等待');
    this.isMapPage = true;
  }
});