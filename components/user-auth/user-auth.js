// 用户授权组件
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    currentName: {
      type: String,
      value: '微信用户'
    },
    currentAvatar: {
      type: String,
      value: '/images/default-avatar.png'
    }
  },

  data: {
    showAuth: false
  },

  observers: {
    'show': function(show) {
      this.setData({ showAuth: show });
    }
  },

  methods: {
    // 处理授权
    async handleAuth() {
      try {
        const app = getApp();
        const userInfo = await app.getUserProfile();
        
        // 触发父组件事件
        this.triggerEvent('success', {
          userInfo: userInfo
        });
        
        this.setData({ showAuth: false });
        
        wx.showToast({
          title: '授权成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('授权失败:', error);
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    },

    // 跳过授权
    handleSkip() {
      this.triggerEvent('skip');
      this.setData({ showAuth: false });
    },

    // 阻止背景点击
    preventTap() {
      // 空函数，阻止事件冒泡
    }
  }
});