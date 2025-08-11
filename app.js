// app.js
App({
  globalData: {
    // 通过云托管API获取图片（推荐方式）
    BASE_IMAGE_URL: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/images',
    
    // 默认定位设置
    defaultLocation: {
      // 使用更合理的坐标值
      x: 1000,
      y: 1000,
      isPixelCoordinate: true,
      // 不再使用树木ID和区域定位
      // treeId: "5", 
      // region: "名师林"
    },
    
    // 其他全局数据
    userInfo: null,
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'),
    
    // 云开发环境ID
    envId: 'cloudbase-8geef97fbe06f6f1'
  },
  
  onLaunch() {
    // 微信登录获取openid
    this.wxLogin();
    
    // 判断小程序的API，回调，参数，组件等是否在当前版本可用
    if (wx.getUserProfile) {
      this.globalData.canIUseGetUserProfile = true;
    }
    
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true
      });
    }
    
    console.log('小程序启动');
  },
  
  // 获取默认定位设置
  getDefaultLocation() {
    return this.globalData.defaultLocation;
  },
  
  // 设置默认定位
  setDefaultLocation(location) {
    this.globalData.defaultLocation = location;
  },
  
  // 获取图片URL（通过云托管API代理）
  getImageUrl(path) {
    if (!path) {
      return this.globalData.BASE_IMAGE_URL + '/images/default-avatar.png';
    }
    // 如果已经是完整URL，直接返回
    if (path.startsWith('http')) {
      return path;
    }
    // 通过云托管API获取图片
    // path如果以/开头，直接拼接；否则添加/
    const imagePath = path.startsWith('/') ? path.substring(1) : path;
    return this.globalData.BASE_IMAGE_URL + '/' + imagePath;
  },

  // 微信登录获取openid
  wxLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          console.log('登录成功，code:', res.code);
          // 发送code到后端换取openid
          wx.request({
            url: this.globalData.BASE_IMAGE_URL.replace('/api/images', '') + '/api/auth/login',
            method: 'POST',
            data: {
              code: res.code
            },
            success: (response) => {
              console.log('获取openid响应:', response);
              if (response.data && response.data.code === 0) {
                this.globalData.userInfo = {
                  openId: response.data.data.openid
                };
                console.log('openid获取成功:', response.data.data.openid);
                
                // 获取用户信息
                this.getUserInfo();
              } else {
                console.error('获取openid失败:', response.data);
              }
            },
            fail: (error) => {
              console.error('登录请求失败:', error);
            }
          });
        } else {
          console.error('微信登录失败:', res.errMsg);
        }
      },
      fail: (error) => {
        console.error('wx.login调用失败:', error);
      }
    });
  },

  // 获取用户信息
  getUserInfo() {
    // 检查是否已授权
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已授权，直接获取用户信息
          wx.getUserInfo({
            success: userRes => {
              console.log('获取用户信息成功:', userRes.userInfo);
              this.saveUserInfo(userRes.userInfo);
            },
            fail: err => {
              console.error('获取用户信息失败:', err);
            }
          });
        } else {
          console.log('用户未授权，等待手动授权');
        }
      }
    });
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    // 保存到本地存储
    const userData = {
      nickName: userInfo.nickName || '微信用户',
      avatarUrl: userInfo.avatarUrl || '/images/default-avatar.png',
      gender: userInfo.gender || 0,
      country: userInfo.country || '',
      province: userInfo.province || '',
      city: userInfo.city || '',
      language: userInfo.language || 'zh_CN'
    };
    
    wx.setStorageSync('userInfo', userData);
    
    // 设置全局数据
    this.globalData.userInfo = {
      ...this.globalData.userInfo,
      ...userData
    };
    this.globalData.hasUserInfo = true;
    
    console.log('用户信息已保存:', userData);
  },

  // 手动获取用户信息（用于按钮授权）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善个人资料和浇水记录',
        success: res => {
          console.log('getUserProfile成功:', res.userInfo);
          this.saveUserInfo(res.userInfo);
          resolve(res.userInfo);
        },
        fail: err => {
          console.error('getUserProfile失败:', err);
          reject(err);
        }
      });
    });
  }
})
