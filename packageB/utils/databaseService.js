// 数据库服务模块 - 用于与MongoDB数据库交互
// 适配微信云开发数据库和传统REST API

const DatabaseService = {
  // 配置信息
  config: {
    apiBaseUrl: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com/api',
    collections: {
      trees: 'trees',
      wateringRecords: 'watering_records', 
      users: 'users',
      certificates: 'certificates'
    }
  },

  // 通用请求方法
  async request(endpoint, options = {}) {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      }
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      url
    };

    try {
      console.log('数据库请求:', requestOptions);
      
      const response = await new Promise((resolve, reject) => {
        wx.request({
          ...requestOptions,
          success: resolve,
          fail: reject
        });
      });

      console.log('数据库响应:', response);

      if (response.statusCode === 200) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error(`HTTP ${response.statusCode}: ${response.data?.message || '请求失败'}`);
      }
    } catch (error) {
      console.error('数据库请求失败:', error);
      return {
        success: false,
        error: error.message || '网络请求失败'
      };
    }
  },

  // 用户相关操作
  async createOrUpdateUser(userData) {
    const endpoint = '/users';
    return await this.request(endpoint, {
      method: 'POST',
      data: {
        userId: userData.userId,
        nickName: userData.nickName || '微信用户',
        avatarUrl: userData.avatarUrl || '',
        totalWateringCount: userData.totalWateringCount || 0,
        totalGrowthValue: userData.totalGrowthValue || 0,
        lastActiveTime: new Date().toISOString(),
        ...userData
      }
    });
  },

  async getUserInfo(userId) {
    const endpoint = `/users/${userId}`;
    return await this.request(endpoint);
  },

  // 树木相关操作
  async getAllTrees() {
    const endpoint = '/trees';
    return await this.request(endpoint);
  },

  async getTreeById(treeId) {
    const endpoint = `/trees/${treeId}`;
    return await this.request(endpoint);
  },

  async createTree(treeData) {
    const endpoint = '/trees';
    return await this.request(endpoint, {
      method: 'POST',
      data: {
        treeId: treeData.treeId || `tree-${Date.now()}`,
        name: treeData.name || '',
        species: treeData.species || '银杏树',
        region: treeData.region || '',
        stage: treeData.stage || 1,
        points: treeData.points || 0,
        maxPoints: treeData.maxPoints || 100,
        totalWateringCount: treeData.totalWateringCount || 0,
        totalWateringAmount: treeData.totalWateringAmount || 0,
        totalGrowthValue: treeData.totalGrowthValue || 0,
        emoji: treeData.emoji || '🌳',
        stageName: treeData.stageName || '破土萌芽',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...treeData
      }
    });
  },

  async updateTree(treeId, updateData) {
    const endpoint = `/trees/${treeId}`;
    return await this.request(endpoint, {
      method: 'PUT',
      data: {
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  },

  // 浇水记录相关操作
  async getAllWateringRecords(page = 1, limit = 50) {
    const endpoint = `/watering-records?page=${page}&limit=${limit}&sort=-timestamp`;
    return await this.request(endpoint);
  },

  async getUserWateringRecords(userId, page = 1, limit = 50) {
    const endpoint = `/watering-records?userId=${userId}&page=${page}&limit=${limit}&sort=-timestamp`;
    return await this.request(endpoint);
  },

  async getTreeWateringRecords(treeId, page = 1, limit = 50) {
    const endpoint = `/watering-records?treeId=${treeId}&page=${page}&limit=${limit}&sort=-timestamp`;
    return await this.request(endpoint);
  },

  async createWateringRecord(recordData) {
    const endpoint = '/watering-records';
    return await this.request(endpoint, {
      method: 'POST',
      data: {
        recordId: recordData.recordId || `record-${Date.now()}`,
        userId: recordData.userId,
        treeId: recordData.treeId,
        treeName: recordData.treeName || '',
        userName: recordData.userName || '微信用户',
        userAvatar: recordData.userAvatar || '',
        message: recordData.message || '',
        waterAmount: recordData.waterAmount || 1,
        growthValue: recordData.growthValue || 70,
        region: recordData.region || '',
        timestamp: recordData.timestamp || Date.now(),
        date: recordData.date || new Date().toISOString().split('T')[0],
        time: recordData.time || new Date().toTimeString().split(' ')[0].slice(0, 5),
        createdAt: new Date().toISOString(),
        ...recordData
      }
    });
  },

  // 数据同步相关
  async syncWateringAction(actionData) {
    console.log('=== 同步浇水操作到数据库 ===');
    
    try {
      // 1. 创建浇水记录
      const recordResult = await this.createWateringRecord({
        userId: actionData.userId,
        treeId: actionData.treeId,
        treeName: actionData.treeName,
        userName: actionData.userName,
        userAvatar: actionData.userAvatar,
        message: actionData.message,
        waterAmount: actionData.waterAmount,
        growthValue: actionData.growthValue,
        region: actionData.region
      });

      if (!recordResult.success) {
        throw new Error('保存浇水记录失败: ' + recordResult.error);
      }

      // 2. 更新树木状态
      const treeUpdateResult = await this.updateTree(actionData.treeId, {
        stage: actionData.newStage,
        points: actionData.newPoints,
        maxPoints: actionData.maxPoints,
        totalWateringCount: actionData.totalWateringCount,
        totalWateringAmount: actionData.totalWateringAmount,
        totalGrowthValue: actionData.totalGrowthValue,
        lastWatered: new Date().toISOString()
      });

      if (!treeUpdateResult.success) {
        console.warn('更新树木状态失败:', treeUpdateResult.error);
      }

      // 3. 更新用户统计
      const userUpdateResult = await this.createOrUpdateUser({
        userId: actionData.userId,
        nickName: actionData.userName,
        avatarUrl: actionData.userAvatar,
        totalWateringCount: actionData.userTotalWateringCount,
        totalGrowthValue: actionData.userTotalGrowthValue
      });

      if (!userUpdateResult.success) {
        console.warn('更新用户统计失败:', userUpdateResult.error);
      }

      console.log('浇水操作同步到数据库成功');
      return {
        success: true,
        data: {
          record: recordResult.data,
          tree: treeUpdateResult.data,
          user: userUpdateResult.data
        }
      };

    } catch (error) {
      console.error('同步浇水操作失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 从数据库同步数据到本地存储
  async syncFromDatabase() {
    console.log('=== 从数据库同步数据到本地 ===');
    
    try {
      // 获取当前用户ID
      const userId = wx.getStorageSync('userId');
      if (!userId) {
        throw new Error('用户ID不存在');
      }

      // 1. 同步树木数据
      const treesResult = await this.getAllTrees();
      if (treesResult.success && treesResult.data) {
        wx.setStorageSync('myTrees', treesResult.data.trees || []);
        console.log('树木数据同步完成:', treesResult.data.trees?.length || 0);
      }

      // 2. 同步浇水记录
      const recordsResult = await this.getAllWateringRecords(1, 100);
      if (recordsResult.success && recordsResult.data) {
        wx.setStorageSync('allWateringRecords', recordsResult.data.records || []);
        console.log('浇水记录同步完成:', recordsResult.data.records?.length || 0);
      }

      // 3. 同步用户信息
      const userResult = await this.getUserInfo(userId);
      if (userResult.success && userResult.data) {
        wx.setStorageSync('userInfo', userResult.data.user || {});
        console.log('用户信息同步完成');
      }

      return {
        success: true,
        message: '数据同步完成'
      };

    } catch (error) {
      console.error('数据同步失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 备份本地数据到数据库
  async backupToDatabase() {
    console.log('=== 备份本地数据到数据库 ===');
    
    try {
      const userId = wx.getStorageSync('userId');
      if (!userId) {
        throw new Error('用户ID不存在');
      }

      // 1. 备份树木数据
      const localTrees = wx.getStorageSync('myTrees') || [];
      for (const tree of localTrees) {
        await this.createTree(tree);
      }

      // 2. 备份浇水记录
      const localRecords = wx.getStorageSync('allWateringRecords') || [];
      for (const record of localRecords) {
        await this.createWateringRecord(record);
      }

      // 3. 备份用户信息
      const localUserInfo = wx.getStorageSync('userInfo') || {};
      await this.createOrUpdateUser({
        userId: userId,
        ...localUserInfo
      });

      return {
        success: true,
        message: '数据备份完成'
      };

    } catch (error) {
      console.error('数据备份失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 数据统计
  async getUserStatistics(userId) {
    const endpoint = `/users/${userId}/statistics`;
    return await this.request(endpoint);
  },

  async getGlobalStatistics() {
    const endpoint = '/statistics';
    return await this.request(endpoint);
  }
};

module.exports = DatabaseService;