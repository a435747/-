const CloudDatabase = require('../../utils/cloudDatabase.js');

Page({
  data: {
    loadingText: '正在加载…',
    error: ''
  },

  onLoad() {
    this.startup();
  },

  async startup() {
    this.setData({ loadingText: '正在初始化云能力…', error: '' });
    // 兜底超时：3秒后无论成功与否都跳转
    const timeoutId = setTimeout(() => this.safeEnterMap(), 3000);

    try {
      if (!wx.cloud) {
        this.setData({ error: '基础库过低或云能力不可用' });
        return;
      }

      // 确保云初始化（大多在 app.js 已调用，这里双保险）
      try {
        wx.cloud.init({
          env: getApp().globalData.envId,
          traceUser: true
        });
      } catch (_) {}

      this.setData({ loadingText: '正在同步云端数据…' });

      // 若本地已有缓存则加速通过
      const cachedTrees = wx.getStorageSync('allTrees') || [];
      const lastSync = wx.getStorageSync('lastCloudSync') || 0;
      const fresh = Date.now() - lastSync < 60 * 1000; // 1分钟内视为新鲜

      if (cachedTrees.length > 0 && fresh) {
        return this.safeEnterMap(timeoutId);
      }

      const res = await CloudDatabase.syncFromCloud();
      if (!res || res.success !== true) {
        this.setData({ error: res?.error || '同步失败，请重试' });
      }

      this.safeEnterMap(timeoutId);
    } catch (e) {
      console.error('启动同步失败:', e);
      this.setData({ error: e.message || '发生错误' });
    }
  },

  safeEnterMap(timeoutId) {
    if (timeoutId) clearTimeout(timeoutId);
    wx.reLaunch({ url: '/pages/map/map' });
  },

  onRetry() {
    this.setData({ error: '', loadingText: '正在重试…' });
    this.startup();
  },

  onSkip() {
    this.safeEnterMap();
  }
});

