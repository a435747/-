// 微信云开发数据库服务
const app = getApp();

const CloudDatabase = {
  // 获取数据库实例
  getDB() {
    if (!wx.cloud) {
      console.error('云开发未初始化');
      return null;
    }
    return wx.cloud.database();
  },

  // 获取用户openid
  async getOpenId() {
    try {
      const result = await wx.cloud.callFunction({
        name: 'login'
      });
      console.log('获取openid成功:', result.result);
      return result.result.openid;
    } catch (error) {
      console.error('获取openid失败:', error);
      return null;
    }
  },

  // 测试云数据库连接
  async testDatabaseConnection() {
    console.log('=== 测试云数据库连接 ===');
    
    try {
      const db = this.getDB();
      if (!db) {
        console.error('数据库未初始化');
        return { success: false, error: '数据库未初始化' };
      }
      
      console.log('数据库实例获取成功');
      
      // 测试获取openid
      const openid = await this.getOpenId();
      if (!openid) {
        console.error('获取openid失败');
        return { success: false, error: '获取openid失败' };
      }
      
      console.log('openid获取成功:', openid);
      
      // 测试查询集合
      try {
        const testResult = await db.collection('wateringRecords').limit(1).get();
        console.log('查询wateringRecords集合成功:', testResult);
      } catch (queryError) {
        console.error('查询wateringRecords集合失败:', queryError);
        return { success: false, error: '查询集合失败: ' + queryError.message };
      }
      
      // 测试写入权限（尝试写入一条测试记录）
      try {
        const testRecord = {
          userId: openid,
          treeId: 'test-tree',
          treeName: '测试树木',
          userName: '测试用户',
          userAvatar: '',
          message: '测试浇水记录',
          waterAmount: 1,
          growthValue: 70,
          region: '测试区域',
          timestamp: Date.now(),
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].slice(0, 5),
          createdAt: new Date(),
          isTestRecord: true // 标记为测试记录
        };
        
        console.log('准备写入测试记录:', testRecord);
        
        const writeResult = await db.collection('wateringRecords').add({
          data: testRecord
        });
        
        console.log('测试记录写入成功:', writeResult);
        
        // 立即删除测试记录
        try {
          await db.collection('wateringRecords').doc(writeResult._id).remove();
          console.log('测试记录删除成功');
        } catch (deleteError) {
          console.warn('删除测试记录失败:', deleteError);
        }
        
        return { success: true, message: '数据库连接和权限测试通过' };
      } catch (writeError) {
        console.error('写入测试记录失败:', writeError);
        return { success: false, error: '写入权限测试失败: ' + writeError.message };
      }
      
    } catch (error) {
      console.error('数据库连接测试失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 用户相关操作
  async createOrUpdateUser(userData) {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const openid = await this.getOpenId();
      if (!openid) throw new Error('获取用户openid失败');

      const userCollection = db.collection('users');

      // 统一的用户数据（禁止写 _openid/_id 字段）
      const userDoc = {
        nickName: userData.nickName || '微信用户',
        avatarUrl: userData.avatarUrl || '',
        totalWateringCount: Number(userData.totalWateringCount) || 0,
        totalGrowthValue: Number(userData.totalGrowthValue) || 0,
        totalWaterAmount: Number(userData.totalWaterAmount) || 0,
        joinDate: userData.joinDate || new Date().toISOString().split('T')[0],
        lastActiveTime: new Date().toISOString(),
        updatedAt: new Date()
      };

      // 优先尝试更新，若不存在再创建
      let result;
      try {
        result = await userCollection.doc(openid).update({ data: userDoc });
        console.log('用户信息已更新:', result);
      } catch (e) {
        result = await userCollection.doc(openid).set({
          data: { ...userDoc, createdAt: new Date(), userId: openid }
        });
        console.log('新用户创建成功:', result);
      }

      return {
        success: true,
        data: { user: userDoc }
      };
    } catch (error) {
      console.error('创建/更新用户失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getUserInfo() {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const openid = await this.getOpenId();
      if (!openid) throw new Error('获取用户openid失败');

      try {
        const result = await db.collection('users').doc(openid).get();
        
        if (result.data) {
          return {
            success: true,
            data: { user: result.data }
          };
        }
      } catch (docError) {
        // 如果文档不存在，尝试创建新用户
        if (docError.message.includes('cannot find document')) {
          console.log('用户不存在，尝试创建新用户:', openid);
          
          const newUser = {
            userId: openid,
            nickName: '微信用户',
            avatarUrl: '',
            totalWateringCount: 0,
            totalGrowthValue: 0,
            totalWaterAmount: 0,
            lastActiveTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          try {
            await db.collection('users').doc(openid).set({
              data: newUser
            });
            
            console.log('新用户创建成功');
            return {
              success: true,
              data: { user: newUser }
            };
          } catch (createError) {
            console.error('创建新用户失败:', createError);
            return {
              success: false,
              error: '创建新用户失败: ' + createError.message
            };
          }
        }
      }
      
      return {
        success: false,
        error: '用户不存在且创建失败'
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 树木相关操作
  async getAllTrees() {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const collection = db.collection('trees');
      // 先获取总数
      const countRes = await collection.count();
      const total = countRes.total || 0;
      const batchSize = 20; // 小程序端建议每次20条
      const times = Math.ceil(total / batchSize) || 1;

      const all = [];
      for (let i = 0; i < times; i++) {
        const res = await collection.skip(i * batchSize).limit(batchSize).get();
        if (res && Array.isArray(res.data)) {
          all.push(...res.data);
        }
      }

      return {
        success: true,
        data: { trees: all }
      };
    } catch (error) {
      console.error('获取树木列表失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getTreeById(treeId) {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const result = await db.collection('trees').doc(treeId).get();
      
      if (result.data) {
        return {
          success: true,
          data: { tree: result.data }
        };
      } else {
        return {
          success: false,
          error: '树木不存在'
        };
      }
    } catch (error) {
      console.error('获取树木详情失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async createOrUpdateTree(treeData) {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const treeCollection = db.collection('trees');
      const treeId = treeData.treeId || treeData._id;
      
      const treeDoc = {
        treeId: treeId,
        name: treeData.name || '',
        species: treeData.species || '银杏树',
        region: treeData.region || '',
        stage: treeData.stage || 1,
        points: treeData.points || 0,
        maxPoints: treeData.maxPoints || 100,
        totalWateringCount: treeData.totalWateringCount || 0,
        totalWateringAmount: treeData.totalWateringAmount || 0,
        totalGrowthValue: treeData.totalGrowthValue || 0,
        waterLevel: treeData.waterLevel || 0,
        emoji: treeData.emoji || '🌳',
        stageName: treeData.stageName || '',
        guardDate: treeData.guardDate || new Date().toISOString().split('T')[0],
        lastWatered: treeData.lastWatered || null,
        updatedAt: new Date()
      };

      let result;
      if (treeId) {
        // 更新现有树木
        result = await treeCollection.doc(treeId).update({
          data: treeDoc
        });
      } else {
        // 创建新树木
        treeDoc.createdAt = new Date();
        result = await treeCollection.add({
          data: treeDoc
        });
      }

      return {
        success: true,
        data: { tree: treeDoc }
      };
    } catch (error) {
      console.error('创建/更新树木失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 浇水记录相关操作
  async getAllWateringRecords(limit = 50) {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const result = await db.collection('wateringRecords')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return {
        success: true,
        data: { records: result.data }
      };
    } catch (error) {
      console.error('获取浇水记录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async getUserWateringRecords(limit = 50) {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const openid = await this.getOpenId();
      if (!openid) throw new Error('获取用户openid失败');

      // 先确保用户存在
      const userResult = await this.getUserInfo();
      if (!userResult.success) {
        console.warn('用户不存在，返回空记录列表');
        return {
          success: true,
          data: { records: [] }
        };
      }

      const result = await db.collection('wateringRecords')
        .where({
          userId: openid
        })
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return {
        success: true,
        data: { records: result.data }
      };
    } catch (error) {
      console.error('获取用户浇水记录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async createWateringRecord(recordData) {
    const db = this.getDB();
    if (!db) return { success: false, error: '数据库未初始化' };

    try {
      const openid = await this.getOpenId();
      if (!openid) throw new Error('获取用户openid失败');

      const recordDoc = {
        // 移除 _openid 字段，云开发会自动分配
        userId: openid, // 保留 userId 用于标识用户
        treeId: recordData.treeId,
        treeName: recordData.treeName || '',
        userName: recordData.userName || '',
        userAvatar: recordData.userAvatar || '',
        message: recordData.message || '',
        waterAmount: recordData.waterAmount || 1,
        growthValue: recordData.growthValue || 70,
        region: recordData.region || '',
        timestamp: recordData.timestamp || Date.now(),
        date: recordData.date || new Date().toISOString().split('T')[0],
        time: recordData.time || new Date().toTimeString().split(' ')[0].slice(0, 5),
        createdAt: new Date()
      };

      console.log('准备创建浇水记录:', recordDoc);

      const result = await db.collection('wateringRecords').add({
        data: recordDoc
      });

      console.log('浇水记录创建成功:', result);

      return {
        success: true,
        data: { record: { ...recordDoc, _id: result._id } }
      };
    } catch (error) {
      console.error('创建浇水记录失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 完整的浇水同步操作
  async syncWateringAction(actionData) {
    console.log('=== 云开发数据库同步浇水操作 ===');
    
    try {
      // 获取真实用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      const realUserName = userInfo.nickName || actionData.userName || '微信用户';
      const realUserAvatar = userInfo.avatarUrl || actionData.userAvatar || '';
      
      // 1. 创建浇水记录
      const recordResult = await this.createWateringRecord({
        treeId: actionData.treeId,
        treeName: actionData.treeName,
        userName: realUserName,
        userAvatar: realUserAvatar,
        message: actionData.message,
        waterAmount: actionData.waterAmount,
        growthValue: actionData.growthValue,
        region: actionData.region
      });

      if (!recordResult.success) {
        throw new Error('保存浇水记录失败: ' + recordResult.error);
      }

      // 2. 更新树木状态
      const treeUpdateResult = await this.createOrUpdateTree({
        treeId: actionData.treeId,
        stage: actionData.newStage,
        points: actionData.newPoints,
        maxPoints: actionData.maxPoints,
        totalWateringCount: actionData.totalWateringCount,
        totalWateringAmount: actionData.totalWateringAmount,
        totalGrowthValue: actionData.totalGrowthValue,
        waterLevel: actionData.newWaterLevel,
        lastWatered: new Date().toISOString()
      });

      if (!treeUpdateResult.success) {
        console.warn('更新树木状态失败:', treeUpdateResult.error);
      }

      // 3. 更新用户统计
      const userUpdateResult = await this.createOrUpdateUser({
        nickName: actionData.userName,
        avatarUrl: actionData.userAvatar,
        totalWateringCount: actionData.userTotalWateringCount,
        totalGrowthValue: actionData.userTotalGrowthValue,
        totalWaterAmount: actionData.userTotalWaterAmount
      });

      if (!userUpdateResult.success) {
        console.warn('更新用户统计失败:', userUpdateResult.error);
      }

      console.log('浇水操作同步到云数据库成功');
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

  // 从云数据库同步数据到本地
  async syncFromCloud() {
    console.log('=== 从云数据库同步数据到本地 ===');
    
    try {
      // 1. 优先使用云函数获取全量树木数据
      try {
        const cloudTreesResult = await wx.cloud.callFunction({
          name: 'dataManager',
          data: { action: 'getAllTrees' }
        });
        
        if (cloudTreesResult.result && cloudTreesResult.result.success) {
          const trees = cloudTreesResult.result.data.trees || [];
          wx.setStorageSync('allTrees', trees);
          console.log('云函数获取树木数据完成:', trees.length);
        } else {
          // 云函数失败，回退到客户端分页
          const treesResult = await this.getAllTrees();
          if (treesResult.success && treesResult.data) {
            wx.setStorageSync('allTrees', treesResult.data.trees || []);
            console.log('客户端分页获取树木数据完成:', treesResult.data.trees?.length || 0);
          }
        }
      } catch (cloudError) {
        console.warn('云函数获取树木数据失败，回退到客户端分页:', cloudError);
        const treesResult = await this.getAllTrees();
        if (treesResult.success && treesResult.data) {
          wx.setStorageSync('allTrees', treesResult.data.trees || []);
          console.log('客户端分页获取树木数据完成:', treesResult.data.trees?.length || 0);
        }
      }

      // 2. 同步浇水记录
      const allRecordsResult = await this.getAllWateringRecords(100);
      if (allRecordsResult.success && allRecordsResult.data) {
        wx.setStorageSync('allWateringRecords', allRecordsResult.data.records || []);
      }

      const myRecordsResult = await this.getUserWateringRecords(50);
      if (myRecordsResult.success && myRecordsResult.data) {
        // 将用户记录存储到本地，并更新全局记录
        const myRecords = myRecordsResult.data.records || [];
        console.log('浇水记录同步完成:', myRecords.length);
      }

      // 3. 同步用户信息
      const userResult = await this.getUserInfo();
      if (userResult.success && userResult.data) {
        wx.setStorageSync('userInfo', userResult.data.user || {});
        console.log('用户信息同步完成');
      }

      // 设置云数据库同步标记
      wx.setStorageSync('cloudSyncEnabled', true);
      wx.setStorageSync('lastCloudSync', Date.now());

      return {
        success: true,
        message: '云数据同步完成'
      };

    } catch (error) {
      console.error('云数据同步失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 不再初始化示例数据，完全依赖数据库动态加载
  async initCloudData() {
    console.log('=== 云数据库初始化完成 ===');
    return {
      success: true,
      message: '云数据库初始化完成'
    };
  },

  // 批量写入/更新树木
  async bulkUpsertTrees(trees) {
    try {
      if (!trees || !Array.isArray(trees)) {
        throw new Error('参数错误：trees 必须是数组')
      }
      const res = await wx.cloud.callFunction({
        name: 'dataManager',
        data: { action: 'bulkUpsertTrees', data: { trees } }
      })
      return res.result || { success: false, error: '云函数无返回' }
    } catch (error) {
      console.error('bulkUpsertTrees 调用失败:', error)
      return { success: false, error: error.message }
    }
  },

  // 统计功能
  async getUserStatistics() {
    try {
      const openid = await this.getOpenId();
      if (!openid) throw new Error('获取用户openid失败');

      const userResult = await this.getUserInfo();
      const recordsResult = await this.getUserWateringRecords(1000);

      if (userResult.success && recordsResult.success) {
        const user = userResult.data.user;
        const records = recordsResult.data.records;

        return {
          success: true,
          data: {
            totalWateringCount: user.totalWateringCount || records.length,
            totalWaterAmount: user.totalWaterAmount || records.reduce((sum, r) => sum + (r.waterAmount || 1), 0),
            totalGrowthValue: user.totalGrowthValue || records.reduce((sum, r) => sum + (r.growthValue || 70), 0),
            treesWatered: [...new Set(records.map(r => r.treeId))].length,
            joinDate: user.joinDate,
            lastActiveTime: user.lastActiveTime
          }
        };
      } else {
        // 如果获取失败，返回默认统计
        console.warn('获取统计数据失败，返回默认值');
        return {
          success: true,
          data: {
            totalWateringCount: 0,
            totalWaterAmount: 0,
            totalGrowthValue: 0,
            treesWatered: 0,
            joinDate: null,
            lastActiveTime: null
          }
        };
      }
    } catch (error) {
      console.error('获取用户统计失败:', error);
      // 返回默认统计而不是错误
      return {
        success: true,
        data: {
          totalWateringCount: 0,
          totalWaterAmount: 0,
          totalGrowthValue: 0,
          treesWatered: 0,
          joinDate: null,
          lastActiveTime: null
        }
      };
    }
  }
};

module.exports = CloudDatabase;
