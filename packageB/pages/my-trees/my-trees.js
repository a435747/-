// pages/my-trees/my-trees.js
const DataSync = require('../../utils/dataSync');
const DatabaseService = require('../../utils/databaseService');
const CloudDatabase = require('../../../utils/cloudDatabase');

Page({
  data: {
    userInfo: {                                       
      avatarUrl: '',
      nickName: '微信用户',
      graduationYear: '',
      schoolName: '',
      adoptLevel: 0,
      lovePoints: 0
    },
    statistics: {
      treeCount: 0,
      totalAmount: 0,
      daysCount: 0,
      waterCount: 0,
      totalWater: 0,
      totalGrowth: 0
    },
    trees: [], // 用户浇过水的树木
    allTrees: [], // 所有可浇水的树木
    tabs: [
      { id: 'all', name: '全部记录', active: true, icon: '📋' },
      { id: 'my', name: '我的浇水', active: false, icon: '💧' },
      { id: 'trees', name: '树木列表', active: false, icon: '🌳' },
      { id: 'alumni', name: '校友林', active: false, icon: '🎓' },
      { id: 'master', name: '名师林', active: false, icon: '👨‍🏫' }
    ],
    activeTab: 'all',
    displayTrees: [],
    allWateringRecords: [], // 所有用户的浇水记录
    myWateringRecords: [], // 当前用户的浇水记录
    isRefreshing: false,
    showCertificate: false,
    currentCertificate: null,
    lastDataUpdateFlag: 0,
    // 新增UI状态
    showQuickActions: false,
    showDebug: false,
    debugExpanded: false,
    isLoading: false,
    // 校友林统计数据
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
    },
    // 校友林选择状态
    alumniSelection: {
      zoneIndex: 0,
      number: ''
    }
  },

  // 重置示例数据（开发调试用）
  resetData() {
    console.log('=== 重置示例数据 ===');
    // 清除所有相关存储
    wx.removeStorageSync('trees_initialized');
    wx.removeStorageSync('myTrees');
    wx.removeStorageSync('allWateringRecords');
    
    // 重新初始化数据
    this.initTreeData();
    this.loadMyTrees();
    this.loadAllTrees();
    this.loadAllWateringRecords();
    this.updateDisplayData();
    
    wx.showToast({
      title: '数据已重置',
      icon: 'success'
    });
  },

  // 校友林：选择年代
  onAlumniZoneChange(e) {
    const idx = Number(e.detail.value || 0);
    this.setData({ 'alumniSelection.zoneIndex': idx });
  },

  // 校友林：输入编号
  onAlumniNumberInput(e) {
    this.setData({ 'alumniSelection.number': e.detail.value });
  },

  // 校友林：确认选择，跳转树详情
  confirmAlumniSelection() {
    const zones = this.data.alumniForestStats.zones;
    const { zoneIndex, number } = this.data.alumniSelection;
    if (!number) {
      wx.showToast({ title: '请输入编号', icon: 'none' });
      return;
    }

    const rangeText = zones[zoneIndex].range; // 如 "329-688"
    const [start, end] = rangeText.split('-').map(v => Number(v));
    const num = Number(number);
    if (isNaN(num) || num < start || num > end) {
      wx.showToast({ title: `编号需在 ${rangeText} 范围内`, icon: 'none' });
      return;
    }

            wx.showToast({ title: '树木详情功能暂未开放', icon: 'none' });
  },

  // 新增UI交互方法
  showQuickActions() {
    this.setData({ showQuickActions: true });
  },

  hideQuickActions() {
    this.setData({ showQuickActions: false });
  },

  toggleDebug() {
    this.setData({ 
      debugExpanded: !this.data.debugExpanded 
    });
  },

  // 显示调试面板
  showDebugPanel() {
    this.setData({ 
      showDebug: true,
      debugExpanded: true
    });
  },

  // 隐藏调试面板
  hideDebugPanel() {
    this.setData({ 
      showDebug: false,
      debugExpanded: false
    });
  },

  // 快速操作
  goToWatering() {
          this.hideQuickActions();
      wx.navigateTo({
        url: '/packageA/pages/watering/watering'
      });
  },

  goToDonation() {
    this.hideQuickActions();
    wx.navigateTo({
      url: '/pages/my-trees/my-trees'
    });
  },

  shareProgress() {
    this.hideQuickActions();
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 查看树木详情
  viewTreeDetail(e) {
    const tree = e.currentTarget.dataset.tree;
    console.log('查看树木详情:', tree);
    // 可以导航到树木详情页面
    wx.showToast({
      title: `查看${tree.name}详情`,
      icon: 'none'
    });
  },

  // 云数据库相关操作
  async syncFromDatabase() {
    console.log('=== 从云数据库同步数据 ===');
    this.setData({ isLoading: true });
    
    try {
      const result = await CloudDatabase.syncFromCloud();
      
      if (result.success) {
        // 重新加载本地数据
        this.loadMyTrees();
        this.loadAllTrees();
        this.loadAllWateringRecords();
        this.updateDisplayData();
        
        wx.showToast({
          title: '云同步成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: `云同步失败: ${result.error}`,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('云同步失败:', error);
      wx.showToast({
        title: '云同步失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async backupToDatabase() {
    console.log('=== 初始化云数据库 ===');
    this.setData({ isLoading: true });
    
    try {
      const result = await CloudDatabase.initCloudData();
      
      if (result.success) {
        wx.showToast({
          title: '云初始化成功',
          icon: 'success'
        });
        // 同步数据到本地
        await this.syncFromDatabase();
      } else {
        wx.showToast({
          title: `云初始化失败: ${result.error}`,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('云初始化失败:', error);
      wx.showToast({
        title: '云初始化失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 新增：云统计功能
  async loadCloudStatistics() {
    try {
      const result = await CloudDatabase.getUserStatistics();
      if (result.success) {
        this.setData({
          'statistics.totalWater': result.data.totalWaterAmount,
          'statistics.totalGrowth': result.data.totalGrowthValue,
          'statistics.waterCount': result.data.totalWateringCount,
          'statistics.treeCount': result.data.treesWatered
        });
        console.log('云统计加载成功:', result.data);
      }
    } catch (error) {
      console.error('加载云统计失败:', error);
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    console.log('=== 加载用户信息 ===');
    
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && this.isValidUserInfo(userInfo)) {
      console.log('从本地存储获取用户信息:', userInfo);
      this.setData({
        'userInfo.avatarUrl': userInfo.avatarUrl,
        'userInfo.nickName': userInfo.nickName || '微信用户'
      });
      return;
    }
    
    // 尝试从全局获取
    const app = getApp();
    if (app.globalData.userInfo && this.isValidUserInfo(app.globalData.userInfo)) {
      console.log('从全局数据获取用户信息:', app.globalData.userInfo);
      this.setData({
        'userInfo.avatarUrl': app.globalData.userInfo.avatarUrl,
        'userInfo.nickName': app.globalData.userInfo.nickName || '微信用户'
      });
      return;
    }
    
    // 尝试自动获取用户信息
    console.log('未找到有效用户信息，尝试自动获取');
    
    try {
      const setting = await new Promise((resolve, reject) => {
        wx.getSetting({
          success: resolve,
          fail: reject
        });
      });
      
      if (setting.authSetting['scope.userInfo']) {
        // 已授权，直接获取
        try {
          const userRes = await new Promise((resolve, reject) => {
            wx.getUserInfo({
              success: resolve,
              fail: reject
            });
          });
          
          console.log('自动获取用户信息成功:', userRes.userInfo);
          this.setData({
            'userInfo.avatarUrl': userRes.userInfo.avatarUrl,
            'userInfo.nickName': userRes.userInfo.nickName
          });
          
          // 保存到本地和全局
          wx.setStorageSync('userInfo', userRes.userInfo);
          app.globalData.userInfo = {
            ...app.globalData.userInfo,
            ...userRes.userInfo
          };
          app.globalData.hasUserInfo = true;
          
        } catch (err) {
          console.error('自动获取用户信息失败:', err);
          console.log('尝试使用getUserProfile获取用户信息');
          this.showUserAuthPrompt();
        }
      } else {
        console.log('用户未授权，需要使用getUserProfile获取授权');
        this.showUserAuthPrompt();
      }
    } catch (error) {
      console.error('检查授权状态失败:', error);
      this.showUserAuthPrompt();
    }
  },
  
  // 判断用户信息是否有效
  isValidUserInfo(userInfo) {
    if (!userInfo) return false;
    
    // 检查头像有效性：排除临时路径和默认头像
    const hasValidAvatar = userInfo.avatarUrl && 
                          !userInfo.avatarUrl.startsWith('wx://') &&
                          !userInfo.avatarUrl.startsWith('http://tmp/') &&
                          !userInfo.avatarUrl.includes('tmp/') &&
                          !userInfo.avatarUrl.includes('default-avatar') &&
                          (userInfo.avatarUrl.includes('thirdwx.qlogo.cn') || 
                           userInfo.avatarUrl.includes('wx.qlogo.cn') ||
                           userInfo.avatarUrl.startsWith('http'));
    
    // 如果有非默认昵称，也认为是有效的
    const hasRealNickName = userInfo.nickName && 
                           userInfo.nickName !== '微信用户' && 
                           userInfo.nickName.trim() !== '';
    
    console.log('用户信息有效性检查:', {
      avatarUrl: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      hasValidAvatar,
      hasRealNickName,
      isValid: hasValidAvatar || hasRealNickName
    });
    
    // 只要有有效头像或真实昵称，就认为是有效的用户信息
    return hasValidAvatar || hasRealNickName;
  },

  // 显示用户授权提示
  showUserAuthPrompt() {
    console.log('显示用户授权提示');
    // 可以在这里显示一个授权提示，或者直接显示获取用户信息的按钮
  },

  // 选择头像（官方推荐方案）
  onChooseAvatar(e) {
    console.log('=== 选择头像 ===');
    const { avatarUrl } = e.detail;
    console.log('选择的头像URL:', avatarUrl);
    
    if (!avatarUrl) {
      console.error('未获取到头像URL');
      wx.showToast({
        title: '头像选择失败',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '保存头像中...',
      mask: true
    });
    
    // 处理临时文件路径问题
    if (avatarUrl.startsWith('wx://') || avatarUrl.startsWith('http://tmp/')) {
      // 如果是微信临时路径，保存到本地
      wx.saveFile({
        tempFilePath: avatarUrl,
        success: (res) => {
          console.log('头像保存成功:', res.savedFilePath);
          wx.hideLoading();
          this.updateAvatarUrl(res.savedFilePath);
        },
        fail: (err) => {
          console.error('头像保存失败:', err);
          wx.hideLoading();
          
          // 保存失败时，尝试使用临时路径
          console.log('尝试使用临时路径:', avatarUrl);
          this.updateAvatarUrl(avatarUrl);
          
          wx.showToast({
            title: '头像保存失败，但已应用',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } else if (avatarUrl.startsWith('http')) {
      // 如果是网络图片，直接使用
      wx.hideLoading();
      this.updateAvatarUrl(avatarUrl);
    } else {
      // 其他情况，尝试直接使用
      wx.hideLoading();
      this.updateAvatarUrl(avatarUrl);
    }
  },
  
  // 更新头像URL的通用方法
  updateAvatarUrl(avatarUrl) {
    // 更新页面数据
    this.setData({
      'userInfo.avatarUrl': avatarUrl
    });
    
    // 保存到本地存储
    const userInfo = wx.getStorageSync('userInfo') || {};
    userInfo.avatarUrl = avatarUrl;
    wx.setStorageSync('userInfo', userInfo);
    
    // 保存到全局数据
    const app = getApp();
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      avatarUrl: avatarUrl
    };
    app.globalData.hasUserInfo = true;
    
    console.log('头像已更新:', avatarUrl);
    wx.showToast({
      title: '头像更新成功',
      icon: 'success'
    });
  },
  
  // 头像加载错误处理
  onAvatarError(e) {
    console.error('头像加载失败:', e);
    
    // 检查当前头像URL
    const currentAvatarUrl = this.data.userInfo.avatarUrl;
    console.log('当前头像URL:', currentAvatarUrl);
    
    // 如果是临时路径或本地路径加载失败，清空头像
    if (currentAvatarUrl && (currentAvatarUrl.startsWith('wx://') || 
                            currentAvatarUrl.startsWith('http://tmp/') || 
                            currentAvatarUrl.includes('tmp/'))) {
      console.log('临时头像加载失败，重置为默认');
      
      // 清空头像URL，显示默认头像
      this.setData({
        'userInfo.avatarUrl': ''
      });
      
      // 同时清空存储中的头像
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.avatarUrl = '';
      wx.setStorageSync('userInfo', userInfo);
      
      wx.showToast({
        title: '头像加载失败，已重置',
        icon: 'none',
        duration: 2000
      });
    } else {
      console.log('网络头像加载失败，可能是网络问题');
      // 对于网络头像，不立即清空，可能是网络问题
    }
  },
  
  // 昵称输入（官方推荐方案）
  onNicknameChange(e) {
    console.log('=== 昵称输入 ===');
    const { value } = e.detail;
    console.log('输入的昵称:', value);
    
    // 更新页面数据
    this.setData({
      'userInfo.nickName': value || '微信用户'
    });
    
    // 保存到本地存储
    const userInfo = wx.getStorageSync('userInfo') || {};
    userInfo.nickName = value || '微信用户';
    wx.setStorageSync('userInfo', userInfo);
    
    // 保存到全局数据
    const app = getApp();
    app.globalData.userInfo = {
      ...app.globalData.userInfo,
      nickName: value || '微信用户'
    };
    app.globalData.hasUserInfo = true;
    
    console.log('昵称已更新:', value);
  },

  // 计算统计数据（基于用户浇水记录）
  calculateStatistics() {
    const myRecords = this.data.myWateringRecords;
    
    console.log('=== 计算统计数据 ===');
    console.log('用户浇水记录数量:', myRecords.length);
    console.log('用户浇水记录详情:', myRecords);
    
    // 统计用户浇过水的不同树木
    const wateredTreeIds = new Set();
    let totalWaterCount = 0; // 总浇水次数
    let totalAmount = 0; // 总支付金额
    let totalGrowthValue = 0; // 总成长值
    let earliestDate = null; // 最早浇水日期
    
    myRecords.forEach(record => {
      console.log('处理记录:', record);
      
      // 统计不同的树木ID
      if (record.treeId) {
        wateredTreeIds.add(record.treeId);
      }
      
      // 统计浇水次数
      totalWaterCount++;
      
      // 统计支付金额（每次浇水70元）
      totalAmount += record.waterAmount || record.amount || 70;
      
      // 统计成长值（兼容云数据库格式）
      const growthValue = record.growthValue || record.growth_value || record.waterAmount || record.amount || 70;
      console.log(`记录 ${record.id}: growthValue=${growthValue}, 累计=${totalGrowthValue + growthValue}`);
      totalGrowthValue += growthValue;
      
      // 找最早的浇水日期（兼容多种时间格式）
      let recordDate = null;
      if (record.timestamp) {
        recordDate = new Date(record.timestamp);
      } else if (record.createdAt) {
        recordDate = new Date(record.createdAt);
      } else if (record.date) {
        recordDate = new Date(record.date);
      }
      
      if (recordDate && (!earliestDate || recordDate < earliestDate)) {
        earliestDate = recordDate;
      }
    });
    
    // 计算守护天数
    let guardDays = 1;
    if (earliestDate) {
      const today = new Date();
      guardDays = Math.max(1, Math.floor((today - earliestDate) / (24 * 60 * 60 * 1000)));
    }
    
    const statistics = {
      treeCount: wateredTreeIds.size, // 守护的树木数量（浇过水的不同树木）
      waterCount: totalWaterCount, // 浇水次数（水桶数）
      totalAmount: totalAmount, // 总支付金额
      totalGrowth: totalGrowthValue, // 总成长值
      daysCount: guardDays // 守护天数
    };
    
    console.log('计算结果:', statistics);
    
    this.setData({
      'statistics.treeCount': statistics.treeCount,
      'statistics.waterCount': statistics.waterCount,
      'statistics.totalAmount': statistics.totalAmount,
      'statistics.totalGrowth': statistics.totalGrowth,
      'statistics.daysCount': statistics.daysCount
    });
  },

  onLoad(options) {
    console.log('=== 我的树木页面加载 ===');
    
    // 加载用户信息
    this.loadUserInfo();
    
    // 初始化树木数据
    this.initTreeData();
    
    // 获取我的树木数据
    this.loadMyTrees();
    
    // 加载所有浇水记录（优先从云数据库）
    this.loadAllWateringRecords();
    
    // 默认显示所有浇水记录
    this.updateDisplayData();
  },

  // 页面显示时刷新数据（增强实时同步）
  onShow() {
    console.log('=== 我的树木页面显示，检查数据同步 ===');
    
    // 每次显示都从云数据库重新加载最新数据
    console.log('从云数据库重新加载最新数据');
    
    // 加载用户信息
    this.loadUserInfo();
    
    // 加载所有浇水记录（优先从云数据库）
    this.loadAllWateringRecords();
    
    // 获取我的树木数据
    this.loadMyTrees();
    
    // 更新显示列表
    this.updateDisplayData();
    
    // 检查是否启用云数据库
    const cloudSyncEnabled = wx.getStorageSync('cloudSyncEnabled');
    if (cloudSyncEnabled) {
      console.log('云数据库已启用，加载云统计');
      this.loadCloudStatistics();
    }
    
    // 强制刷新页面显示
    this.setData({
      refreshKey: Date.now()
    });
    
    console.log('数据刷新完成');
  },
  
  // 初始化树木数据 - 不再使用示例数据
  initTreeData() {
    const hasInitialized = wx.getStorageSync('trees_initialized');
    if (!hasInitialized) {
      // 仅设置初始化标记，不写入任何示例数据
      wx.setStorageSync('trees_initialized', true);
    }
  },
  
  // 下拉刷新
  onRefresh() {
    this.setData({ isRefreshing: true });
    
    // 模拟加载延迟
    setTimeout(() => {
      this.loadMyTrees();
      this.loadAllWateringRecords();
      this.setData({ isRefreshing: false });
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    }, 1000);
  },

  // 加载所有可浇水的树木
  loadAllTrees() {
    console.log('=== 加载所有可浇水的树木 ===');
    
    const allTrees = DataSync.getAllTrees();
    console.log('加载的所有树木数量:', allTrees.length);
    
    this.setData({
      allTrees: allTrees
    });
  },
  
  // 加载所有浇水记录（使用DataSync）
  async loadAllWateringRecords() {
    console.log('=== 加载浇水记录（优先从云数据库） ===');
    
    try {
      // 获取所有记录（用于显示全部记录）
      const allRecordsResult = await CloudDatabase.getAllWateringRecords(100);
      // 获取我的记录（用于统计和我的记录显示）
      const myRecordsResult = await CloudDatabase.getUserWateringRecords(100);
      
      let allRecords = [];
      let myRecords = [];
      
      if (allRecordsResult.success && allRecordsResult.data) {
        allRecords = allRecordsResult.data.records || [];
        console.log('从云数据库获取所有浇水记录:', allRecords.length);
      } else {
        console.log('云数据库获取所有记录失败，使用本地数据');
        allRecords = DataSync.getAllWateringRecords();
      }
      
      if (myRecordsResult.success && myRecordsResult.data) {
        myRecords = myRecordsResult.data.records || [];
        console.log('从云数据库获取我的浇水记录:', myRecords.length);
        
        // 调试：打印我的记录详情
        console.log('我的记录详情:', myRecords.map(r => ({
          id: r._id,
          userId: r.userId,
          _openid: r._openid,
          userName: r.userName,
          isAnonymous: r.isAnonymous,
          treeId: r.treeId,
          amount: r.waterAmount,
          growthValue: r.growthValue
        })));
      } else {
        console.log('云数据库获取我的记录失败，使用本地数据');
        myRecords = DataSync.getMyWateringRecords();
      }
      
      // 同时更新本地存储
      wx.setStorageSync('allWateringRecords', allRecords);
      wx.setStorageSync('myWateringRecords', myRecords);
      
      console.log(`加载了 ${allRecords.length} 条浇水记录，其中 ${myRecords.length} 条是我的`);
      
      this.setData({
        allWateringRecords: allRecords,
        myWateringRecords: myRecords
      });

      // 重新计算统计数据
      this.calculateStatistics();
    } catch (error) {
      console.error('加载浇水记录失败:', error);
      // 出错时使用本地数据
      const allRecords = DataSync.getAllWateringRecords();
      const myRecords = DataSync.getMyWateringRecords();
      
      this.setData({
        allWateringRecords: allRecords,
        myWateringRecords: myRecords
      });
      this.calculateStatistics();
    }
  },
  
  // 加载我的树木（使用DataSync）
  loadMyTrees() {
    console.log('=== 使用DataSync加载我的树木数据 ===');
    
    // 使用统一的数据同步模块
    let myTrees = DataSync.getMyTrees();
    console.log('从DataSync获取的树木数据:', myTrees);
    
    // 如果本地没有数据，不再初始化示例数据，保持为空并依赖云端同步
    if (!myTrees || myTrees.length === 0) {
      console.log('树木数据为空，等待云端同步或用户后续产生记录');
    }
    
    // 为每棵树加载其当前的成长状态
    const updatedTrees = myTrees.map(tree => {
      // 根据树木ID获取其特定的成长数据
      const treeId = tree.id;
      const treeDataKey = `tree_data_${treeId}`;
      const treeGrowthData = wx.getStorageSync(treeDataKey);
      
      // 如果有特定的成长数据，更新树的成长等级和水分等级
      if (treeGrowthData) {
        console.log(`加载树木 ${treeId} 的成长数据:`, treeGrowthData);
        return {
          ...tree,
          growthLevel: treeGrowthData.stage || tree.growthLevel,
          waterLevel: treeGrowthData.waterLevel || tree.waterLevel || 0,
          lastWatered: treeGrowthData.lastWatered || tree.lastWatered,
          waterCount: treeGrowthData.wateringCount || tree.waterCount || 0,
          waterRecords: treeGrowthData.waterRecords || []
        };
      }
      return tree;
    });
    
    this.setData({
      trees: updatedTrees
    });
    // 统一用浇水记录计算总览，避免口径不一致
    this.calculateStatistics();
  },
  
  // 更新显示的数据
  updateDisplayData() {
    console.log('更新显示数据，当前标签:', this.data.activeTab);
    console.log('所有浇水记录数量:', this.data.allWateringRecords.length);
    console.log('我的浇水记录数量:', this.data.myWateringRecords.length);
    console.log('我浇过的树木数量:', this.data.trees.length);
    console.log('所有可浇水树木数量:', this.data.allTrees.length);
    
    let displayData = [];
    
    // 根据当前活动标签显示不同的数据
    switch (this.data.activeTab) {
      case 'all':
        // 全部记录：显示所有用户的浇水记录
        displayData = this.data.allWateringRecords;
        break;
        
      case 'my':
        // 我的浇水：显示当前用户的浇水记录
        displayData = this.data.myWateringRecords;
        break;
        
      case 'trees':
        // 树木列表：显示所有可浇水的树木
        displayData = this.data.allTrees;
        break;
        
      case 'alumni':
        // 校友林：筛选校友林的树木
        displayData = this.data.allTrees.filter(tree => 
          tree.region && tree.region.includes('校友林')
        );
        break;
        
      case 'master':
        // 名师林：筛选名师林的树木
        displayData = this.data.allTrees.filter(tree => 
          tree.region && tree.region.includes('名师林')
        );
        break;
        
      default:
        displayData = this.data.allTrees;
    }
    
    this.setData({
      displayTrees: displayData
    });
    
    console.log('更新后的显示数据数量:', displayData.length);
  },
  
  // 切换标签
  switchTab(e) {
    const tabId = e.currentTarget.dataset.id;
    
    // 更新标签激活状态
    const updatedTabs = this.data.tabs.map(tab => {
      return {
        ...tab,
        active: tab.id === tabId
      };
    });
    
    this.setData({
      tabs: updatedTabs,
      activeTab: tabId
    });
    
    // 更新显示的数据
    this.updateDisplayData();
  },
  
  // 跳转到树木详情
  goToTreeDetail(e) {
    // 获取树木ID，并确保是字符串类型
    const treeId = String(e.currentTarget.dataset.id || '');
    console.log(`跳转到树木详情，树木ID: ${treeId}，类型: ${typeof treeId}`);
    wx.showToast({ title: '树木详情功能暂未开放', icon: 'none' });
  },
  
  // 跳转到浇水页面
  goToWatering(e) {
    // 获取树木ID，并确保是字符串类型
    const treeId = String(e.currentTarget.dataset.id || '');
    console.log(`跳转到浇水页面，树木ID: ${treeId}，类型: ${typeof treeId}`);
    wx.navigateTo({
      url: `/packageA/pages/watering/watering?treeId=${treeId}`
    });
  },
  
  // 跳转到地图页面
  goToMap() {
    wx.navigateTo({
      url: '/pages/map/map'
    });
  },
  
  // 查看浇水证书
  viewCertificate(e) {
    wx.showToast({ title: '证书功能已下线', icon: 'none' });
  },
  
  // 保存证书到相册
  saveCertificate() {
    console.log('开始保存证书到相册');
    
    wx.showLoading({
      title: '正在保存证书',
      mask: true
    });
    
    // 创建临时canvas来生成图片
    const ctx = wx.createCanvasContext('tempCanvas');
    
    // 先获取图片信息
    wx.getImageInfo({
              src: '/images/certificate-bg.jpg',
      success: (imgInfo) => {
        const width = imgInfo.width;
        const height = imgInfo.height;
        
        // 绘制背景图
        ctx.drawImage(imgInfo.path, 0, 0, width, height);
        
        // 绘制证书编号
        ctx.setFillStyle('#333333');
        ctx.setFontSize(25);
        ctx.setTextAlign('right');
        ctx.fillText('NO.' + this.data.currentCertificate.certNumber, width * 0.85, height * 0.25);
        
        // 绘制用户名
        ctx.setFillStyle('#333333');
        ctx.setFontSize(30);
        ctx.setTextAlign('left');
        ctx.fillText(this.data.currentCertificate.name, width * 0.18, height * 0.45);
        
        // 绘制日期
        const year = this.data.currentCertificate.year;
        const month = this.data.currentCertificate.month;
        const day = this.data.currentCertificate.day;

        ctx.setTextAlign('center');
        const dateBottom = height * 0.75; // 整体上移，从0.78调整到0.75
        const dateWidth = width * 0.25;
        const dateRight = width * 0.85; // 右侧15%的位置
        const dateLeft = dateRight - dateWidth;

        // 年月日位置
        const yearX = dateLeft + dateWidth * 0.19; // 年份往右移
        const monthX = dateLeft + dateWidth * 0.60; // 月份再往右移一点
        const dayX = dateLeft + dateWidth * 0.73; // 日期往左移一点
        
        ctx.setFontSize(30);
        ctx.fillText(year, yearX, dateBottom);
        ctx.fillText(month, monthX, dateBottom);
        ctx.fillText(day, dayX, dateBottom);
        
        // 执行绘制
        ctx.draw(true, () => {
          setTimeout(() => {
            // 将canvas转为图片
            wx.canvasToTempFilePath({
              canvasId: 'tempCanvas',
              destWidth: width,
              destHeight: height,
              fileType: 'jpg',
              quality: 1,
              success: (res) => {
                // 保存图片到相册
                wx.saveImageToPhotosAlbum({
                  filePath: res.tempFilePath,
                  success: (result) => {
                    wx.hideLoading();
                    wx.showToast({
                      title: '证书已保存到相册',
                      icon: 'success',
                      duration: 2000
                    });
                    
                    // 3秒后自动关闭证书弹窗
                    setTimeout(() => {
                      this.closeCertificate();
                    }, 3000);
                  },
                  fail: (err) => {
                    console.error('保存到相册失败:', err);
                    wx.hideLoading();
                    
                    if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
                      wx.showModal({
                        title: '提示',
                        content: '需要您授权保存图片到相册',
                        confirmText: '去授权',
                        success: (res) => {
                          if (res.confirm) {
                            wx.openSetting({
                              success: (settingRes) => {
                                console.log('设置结果:', settingRes);
                              }
                            });
                          }
                        }
                      });
                    } else {
                      wx.showToast({
                        title: '保存失败，请重试',
                        icon: 'none'
                      });
                    }
                  }
                });
              },
              fail: (err) => {
                console.error('生成临时文件失败:', err);
                wx.hideLoading();
                wx.showToast({
                  title: '证书生成失败',
                  icon: 'none'
                });
              }
            });
          }, 1000);
        });
      },
      fail: (error) => {
        console.error('获取证书背景图片失败:', error);
        wx.hideLoading();
        wx.showToast({
          title: '证书背景加载失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 测试数据库连接
  async testDatabaseConnection() {
    console.log('=== 测试数据库连接 ===');
    
    try {
      const result = await CloudDatabase.testDatabaseConnection();
      console.log('数据库连接测试结果:', result);
      
      if (result.success) {
        wx.showToast({
          title: '数据库连接正常',
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showModal({
          title: '数据库连接失败',
          content: result.error,
          showCancel: false
        });
      }
    } catch (error) {
      console.error('测试数据库连接失败:', error);
      wx.showModal({
        title: '测试失败',
        content: error.message,
        showCancel: false
      });
    }
  },

  // 检查树木数据
  async checkTreeData() {
    console.log('=== 检查树木数据 ===');
    this.setData({ isLoading: true });
    
    try {
      // 获取云数据库中的树木数据
      const treesResult = await CloudDatabase.getAllTrees();
      
      if (treesResult.success && treesResult.data) {
        const trees = treesResult.data.trees || [];
        console.log('云数据库中的树木数据:', trees);
        
        // 显示前几棵树的数据
        const sampleTrees = trees.slice(0, 3);
        let message = '树木数据检查结果:\n';
        sampleTrees.forEach((tree, index) => {
          message += `树${index + 1}: ID=${tree.treeId}, 阶段=${tree.stage}, 成长值=${tree.points}, 最大值=${tree.maxPoints}\n`;
        });
        
        wx.showModal({
          title: '树木数据检查',
          content: message,
          showCancel: false
        });
      } else {
        wx.showToast({
          title: '获取树木数据失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('检查树木数据失败:', error);
      wx.showToast({
        title: '检查失败',
        icon: 'none'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 重置所有树木数据
  async resetAllTreesData() {
    console.log('=== 重置所有树木数据 ===');
    
    wx.showModal({
      title: '确认重置',
      content: '这将重置所有树木的成长值为0，确定要继续吗？',
      success: async (res) => {
        if (res.confirm) {
          this.setData({ isLoading: true });
          
          try {
            // 引入重置工具
            const { resetAllTreesData } = require('../../utils/resetTreeData.js');
            const result = await resetAllTreesData();
            
            if (result.success) {
              wx.showModal({
                title: '重置完成',
                content: `成功重置 ${result.successCount} 棵树，失败 ${result.errorCount} 棵`,
                showCancel: false
              });
              
              // 刷新数据
              this.onRefresh();
            } else {
              wx.showToast({
                title: '重置失败',
                icon: 'none'
              });
            }
          } catch (error) {
            console.error('重置树木数据失败:', error);
            wx.showToast({
              title: '重置失败',
              icon: 'none'
            });
          } finally {
            this.setData({ isLoading: false });
          }
        }
      }
    });
  },

  // 导出浇水报表数据
  exportWateringData() {
    console.log('导出浇水数据');
    // 这里仅为管理员准备导出数据，在微信小程序环境中无法直接导出文件
    // 可以将数据发送到服务器，或者显示一个管理员验证界面
    
    wx.showModal({
      title: '导出报表',
      content: '是否导出浇水数据报表？（仅管理员可用）',
      success: (res) => {
        if (res.confirm) {
          // 导出确认逻辑
          this.showAdminVerification();
        }
      }
    });
  },
  
  // 显示管理员验证界面
  showAdminVerification() {
    wx.showLoading({
      title: '准备数据中',
    });
    
    // 准备数据
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showModal({
        title: '管理员验证',
        content: '请输入管理员密码',
        editable: true,
        placeholderText: '请输入密码',
        success: (res) => {
          if (res.confirm) {
            const password = res.content;
            // 简单密码验证，实际应使用更安全的方法
            if (password === 'admin123') {
              this.prepareExportData();
            } else {
              wx.showToast({
                title: '密码错误',
                icon: 'error'
              });
            }
          }
        }
      });
    }, 1000);
  },
  
  // 准备导出数据
  prepareExportData() {
    wx.showLoading({
      title: '准备导出数据',
    });
    
    // 获取所有浇水记录
    const allRecords = this.data.allWateringRecords;
    
    // 生成CSV格式数据
    let csvContent = '树木ID,树木名称,区域,浇水人,日期,时间,水量,留言\n';
    
    allRecords.forEach(record => {
      const date = new Date(record.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      
      // 处理CSV中的特殊字符，确保引号包裹字段
      const escapeCsvField = (field) => {
        if (field === undefined || field === null) return '""';
        return `"${String(field).replace(/"/g, '""')}"`;
      };
      
      csvContent += [
        escapeCsvField(record.treeId),
        escapeCsvField(record.treeName),
        escapeCsvField(record.treeRegion),
        escapeCsvField(record.name),
        escapeCsvField(dateStr),
        escapeCsvField(timeStr),
        escapeCsvField(record.waterAmount || 1),
        escapeCsvField(record.message || '')
      ].join(',') + '\n';
    });
    
    // 在实际应用中，这里应该将csvContent发送到服务器
    console.log('CSV内容准备完成:', csvContent);
    
    // 显示管理员二维码或其他下载方式的指引
    wx.hideLoading();
    wx.showModal({
      title: '数据准备完成',
      content: '请登录管理后台下载数据报表',
      showCancel: false
    });
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          'userInfo.avatarUrl': res.userInfo.avatarUrl,
          'userInfo.nickName': res.userInfo.nickName
        });
        wx.setStorageSync('userInfo', res.userInfo);
      }
    });
  },

  // 关闭证书弹窗
  closeCertificate() {
    this.setData({
      showCertificate: false,
      currentCertificate: null
    });
  },
  
  // 防止弹窗滑动穿透
  preventTouchMove() {
    return false;
  }
}) 