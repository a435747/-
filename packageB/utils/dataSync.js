// 数据同步管理模块
// 用于统一管理浇水页面和我的树木页面之间的数据同步

const DataSync = {
  // 存储key定义
  STORAGE_KEYS: {
    MY_TREES: 'myTrees',
    ALL_TREES: 'allTrees', // 新增：所有可浇水的树木
    ALL_WATERING_RECORDS: 'allWateringRecords', 
    TREE_DATA_PREFIX: 'tree_data_',
    USER_ID: 'userId',
    CURRENT_TREE_ID: 'currentTreeId'
  },

  // 获取当前用户ID
  getCurrentUserId() {
    let userId = wx.getStorageSync(this.STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      wx.setStorageSync(this.STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  },

  // 获取当前树木ID
  getCurrentTreeId() {
    return wx.getStorageSync(this.STORAGE_KEYS.CURRENT_TREE_ID) || '';
  },

  // 更新树木数据（浇水后调用）
  updateTreeData(treeId, updatedData) {
    console.log('=== DataSync: 更新树木数据 ===', treeId, updatedData);
    
    // 1. 更新单棵树的详细数据
    const treeDataKey = this.STORAGE_KEYS.TREE_DATA_PREFIX + treeId;
    const currentTreeData = wx.getStorageSync(treeDataKey) || {};
    const newTreeData = { ...currentTreeData, ...updatedData };
    wx.setStorageSync(treeDataKey, newTreeData);
    
    // 2. 更新我的树木列表中对应的树木信息
    let myTrees = wx.getStorageSync(this.STORAGE_KEYS.MY_TREES) || [];
    const treeIndex = myTrees.findIndex(tree => tree.id === treeId);
    
    if (treeIndex >= 0) {
      // 更新现有树木
      myTrees[treeIndex] = {
        ...myTrees[treeIndex],
        ...updatedData,
        // 更新一些基本信息
        waterCount: updatedData.totalWateringCount || myTrees[treeIndex].waterCount,
        totalWater: updatedData.totalWateringAmount || myTrees[treeIndex].totalWater,
        stage: updatedData.stage || myTrees[treeIndex].stage,
        points: updatedData.points || myTrees[treeIndex].points,
        maxPoints: updatedData.maxPoints || myTrees[treeIndex].maxPoints
      };
    } else {
      // 如果树木不在列表中，添加它
    const newTree = {
        id: treeId,
      name: updatedData.name || '',
        species: updatedData.species || '银杏树',
      region: updatedData.region || '',
        emoji: updatedData.emoji || '🌳',
        stageName: this.getStageNameByLevel(updatedData.stage || 1),
        waterCount: updatedData.totalWateringCount || 0,
        totalWater: updatedData.totalWateringAmount || 0,
        stage: updatedData.stage || 1,
        points: updatedData.points || 0,
        maxPoints: updatedData.maxPoints || 100,
        ...updatedData
      };
      myTrees.push(newTree);
    }
    
    wx.setStorageSync(this.STORAGE_KEYS.MY_TREES, myTrees);
    console.log('树木列表已更新:', myTrees);
  },

  // 添加浇水记录（浇水后调用）
  addWateringRecord(record) {
    console.log('=== DataSync: 添加浇水记录 ===', record);
    
    const userId = this.getCurrentUserId();
    const now = new Date();

    // 根据 treeId 推断所属林区（名师林/校友林）
    const treeIdStr = String(record.treeId || '');
    const computedRegion = treeIdStr.indexOf('alumni-') === 0 ? '校友林' : (treeIdStr ? '名师林' : '');
    
    // 标准化浇水记录格式
    const standardRecord = {
      timestamp: record.timestamp || Date.now(),
      date: record.date || now.toISOString().split('T')[0],
      time: record.time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      name: record.name || '微信用户',
      userId: record.userId || userId,
      message: record.message || '',
      waterAmount: record.waterAmount || 1,
      growthValue: record.growthValue || 70,
      treeId: record.treeId,
      treeName: record.treeName || '',
      region: record.region || record.treeRegion || computedRegion,
      avatar: record.avatar || ''
    };

    // 1. 添加到全局浇水记录
    let allRecords = wx.getStorageSync(this.STORAGE_KEYS.ALL_WATERING_RECORDS) || [];
    
    // 检查是否已存在相同时间戳的记录，避免重复
    const existingIndex = allRecords.findIndex(r => r.timestamp === standardRecord.timestamp);
    if (existingIndex >= 0) {
      allRecords[existingIndex] = standardRecord; // 更新现有记录
    } else {
      allRecords.unshift(standardRecord); // 添加新记录到开头
    }
    
    // 只保留最近100条记录
    allRecords = allRecords.slice(0, 100);
    wx.setStorageSync(this.STORAGE_KEYS.ALL_WATERING_RECORDS, allRecords);

    // 2. 添加到对应树木的浇水记录
    const treeDataKey = this.STORAGE_KEYS.TREE_DATA_PREFIX + record.treeId;
    const treeData = wx.getStorageSync(treeDataKey) || {};
    const treeRecords = treeData.waterRecords || [];
    
    // 检查重复
    const treeExistingIndex = treeRecords.findIndex(r => r.timestamp === standardRecord.timestamp);
    if (treeExistingIndex >= 0) {
      treeRecords[treeExistingIndex] = standardRecord;
    } else {
      treeRecords.unshift(standardRecord);
    }
    
    // 只保留最近50条记录
    treeData.waterRecords = treeRecords.slice(0, 50);
    wx.setStorageSync(treeDataKey, treeData);

    console.log('浇水记录添加完成');
    return standardRecord;
  },

  // 获取所有浇水记录
  getAllWateringRecords() {
    return wx.getStorageSync(this.STORAGE_KEYS.ALL_WATERING_RECORDS) || [];
  },

  // 获取用户的浇水记录
  getMyWateringRecords() {
    const userId = this.getCurrentUserId();
    const allRecords = this.getAllWateringRecords();
    return allRecords.filter(record => record.userId === userId);
  },

  // 获取用户的树木（用户浇过水的树木）
  getMyTrees() {
    return wx.getStorageSync(this.STORAGE_KEYS.MY_TREES) || [];
  },

  // 获取所有可浇水的树木（全部树木列表）
  getAllTrees() {
    const allTrees = wx.getStorageSync(this.STORAGE_KEYS.ALL_TREES) || [];
    return allTrees;
  },

  // 初始化所有树木数据（禁用示例数据）
  initializeAllTreesData() { return []; },

  // 生成校友林树木数据的函数（禁用示例数据）
  generateAlumniForestTrees() { return []; },

  // 获取校友林的完整统计信息
  getAlumniForestStats() {
    return {
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
    };
  },

  // 不再使用示例树木数据，完全依赖数据库动态加载
  getLegacyTrees() {
    return [];
  },

  // 获取特定树木的详细数据
  getTreeData(treeId) {
    const treeDataKey = this.STORAGE_KEYS.TREE_DATA_PREFIX + treeId;
    return wx.getStorageSync(treeDataKey) || {};
  },

  // 根据阶段等级获取阶段名称
  getStageNameByLevel(stage) {
    const stageNames = {
      1: '破土萌芽',
      2: '稚嫩幼苗', 
      3: '抽枝展叶',
      4: '茁壮成长',
      5: '绿意盎然',
      6: '华盖初成',
      7: '枝干擎天',
      8: '冠盖如云',
      9: '根深叶茂',
      10: '擎天巨木'
    };
    return stageNames[stage] || '未知阶段';
  },

  // 通知页面数据已更新（可以通过事件系统实现）
  notifyDataUpdated(type = 'all') {
    console.log('=== DataSync: 通知数据更新 ===', type);
    
    // 可以在这里实现页面间的通信机制
    // 例如：使用全局事件、storage事件等
    wx.setStorageSync('dataUpdateFlag', Date.now());
  },

  // 完整的浇水操作同步（供浇水页面调用）
  syncWateringAction(treeId, wateringResult, formData = {}) {
    console.log('=== DataSync: 同步浇水操作 ===');
    
    const userId = this.getCurrentUserId();
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    // 1. 更新树木数据
    this.updateTreeData(treeId, {
      stage: wateringResult.newStage,
      points: wateringResult.newPoints,
      maxPoints: wateringResult.maxPoints,
      totalWateringCount: wateringResult.totalWateringCount,
      totalWateringAmount: wateringResult.totalWateringAmount,
      totalGrowthValue: wateringResult.totalGrowthValue,
      lastWatered: new Date().toISOString()
    });

    // 2. 添加浇水记录（使用真实用户信息）
    const waterRecord = this.addWateringRecord({
      treeId: treeId,
      treeName: wateringResult.treeName || '智慧之树',
      name: userInfo.nickName || formData.name || '微信用户',
      avatar: userInfo.avatarUrl || '/images/default-avatar.png',
      message: formData.message || '',
      waterAmount: wateringResult.wateringAmount || 1,
      growthValue: wateringResult.pointsGained || 70,
      userId: userId
    });

    // 3. 通知数据更新
    this.notifyDataUpdated('watering');

    console.log('浇水操作同步完成');
    return waterRecord;
  }
};

module.exports = DataSync;