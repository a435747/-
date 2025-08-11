// 创建全局加载遮罩
const showLoadingSplash = function() {
  wx.showLoading({
    title: '加载中...',
    mask: true
  });
};

const hideLoadingSplash = function() {
  wx.hideLoading();
};

// 通过云托管API获取图片（已部署成功）
const BASE_IMAGE_URL = 'https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/images';

const app = getApp();
const DataSync = require('../../utils/dataSync');
const CloudDatabase = require('../../../utils/cloudDatabase');

// 树木成长阶段定义
const TREE_GROWTH_STAGES = [
  { stage: 1, name: '破土萌芽', emoji: '🌱', threshold: 100, waterAmount: 1, growthValue: 70 },
  { stage: 2, name: '稚嫩幼苗', emoji: '🌿', threshold: 400, waterAmount: 1, growthValue: 70 },
  { stage: 3, name: '抽枝展叶', emoji: '🌳', threshold: 800, waterAmount: 1, growthValue: 70 },
  { stage: 4, name: '茁壮成长', emoji: '🍃', threshold: 1400, waterAmount: 1, growthValue: 70 },
  { stage: 5, name: '绿意盎然', emoji: '🌸', threshold: 2000, waterAmount: 1, growthValue: 70 },
  { stage: 6, name: '华盖初成', emoji: '💮', threshold: 2700, waterAmount: 1, growthValue: 70 },
  { stage: 7, name: '枝干擎天', emoji: '🍒', threshold: 3500, waterAmount: 1, growthValue: 70 },
  { stage: 8, name: '冠盖如云', emoji: '🍎', threshold: 4500, waterAmount: 1, growthValue: 70 },
  { stage: 9, name: '根深叶茂', emoji: '🌲', threshold: 5700, waterAmount: 1, growthValue: 70 },
  { stage: 10, name: '擎天巨木', emoji: '✨', threshold: 7000, waterAmount: 1, growthValue: 70 }
];

Page({
  data: {
    // 树木数据
    tree: null,
    currentImageSrc: '',
    treeImageLoaded: false,
    
    // 浇水表单
    showWateringForm: false,
    formData: {
      name: '',
      message: '',
      isAnonymous: false
    },
    
    // 浇水结果
    showResult: false,
    waterResult: null,
    
    // 证书相关
    showCertificate: false,
    currentCertificate: null,
    
    // 浇水动画
    isWatering: false,
    wateringAnimationActive: false,
    
    // 静态图片 - 直接使用对象存储URL
    treeStaticImages: {
      1: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/1.png',
      2: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/2.png',
      3: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/3.png',
      4: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/4.png',
      5: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/5.png',
      6: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/6.png',
      7: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/7.png',
      8: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/8.png',
      9: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/9.png',
      10: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/10.png'
    },
    
    // 升级GIF - 更新为正确的文件名
    treeUpgradeGifs: {
      1: BASE_IMAGE_URL + '/trees-gif/tresss/1-2.gif',
      2: BASE_IMAGE_URL + '/trees-gif/tresss/2-3.gif',
      3: BASE_IMAGE_URL + '/trees-gif/tresss/3-4.gif',
      4: BASE_IMAGE_URL + '/trees-gif/tresss/4-5.gif',
      5: BASE_IMAGE_URL + '/trees-gif/tresss/5-6.gif',
      6: BASE_IMAGE_URL + '/trees-gif/tresss/6-7.gif',
      7: BASE_IMAGE_URL + '/trees-gif/tresss/7-8.gif',
      8: BASE_IMAGE_URL + '/trees-gif/tresss/8-9.gif',
      9: BASE_IMAGE_URL + '/trees-gif/tresss/9-10.gif'
    },
    
    // 小动物举牌子gif - 直接使用对象存储URL
    animalGifs: [
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_1.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_2.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_3.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_4.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_5.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_6.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_7.gif',
      'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/animal_8.gif'
    ],
    
    // 新增浇水GIF - 直接使用对象存储URL
    wateringGif: 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la/images/images/watering.gif',
    
    stageNames: {
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
    },
    
    stageEmojis: {
      1: '🌱',
      2: '🌿',
      3: '🌳',
      4: '🍃',
      5: '🌸',
      6: '💮',
      7: '🍒',
      8: '🍎',
      9: '🌲',
      10: '✨'
    },
    
    // 每个阶段的背景色
    stageColors: {
      1: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
      2: 'linear-gradient(135deg, #d4f5d4 0%, #e8f5e8 100%)',
      3: 'linear-gradient(135deg, #b8e6b8 0%, #d4f5d4 100%)',
      4: 'linear-gradient(135deg, #9dd89d 0%, #b8e6b8 100%)',
      5: 'linear-gradient(135deg, #81c784 0%, #9dd89d 100%)',
      6: 'linear-gradient(135deg, #66bb6a 0%, #81c784 100%)',
      7: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
      8: 'linear-gradient(135deg, #3f9d3f 0%, #66bb6a 100%)',
      9: 'linear-gradient(135deg, #2e8b2e 0%, #4caf50 100%)',
      10: 'linear-gradient(135deg, #ffd700 0%, #fffbe6 100%)'
    },
    
    waterOptions: [
      {
        id: 'basic',
        name: '普通浇水',
        icon: '💧',
        points: 30,
        price: 0,
        description: '普通清水，适合日常浇灌'
      }
    ],
    
    selectedOption: 'basic',
    isIdle: true,
    isUpgrading: false,
    showUpgradeGif: false,
    
    // 动画控制变量
    wateringKey: Date.now(),
    
    // 用户信息
    userAvatar: '',
    
    activityList: [], // 动态加载真实浇水记录
    
    // 添加升级GIF相关属性
    upgradeGifSrc: '',       // 当前加载的升级GIF地址
    isUpgradeReady: false,   // 升级GIF是否准备完毕
    
    // 小动物动画相关属性
    showAnimalGif: false,    // 是否显示小动物动画
    animalGifSrc: '',        // 小动物动画源
    animalGifKey: Date.now() // 强制重建小动物动画元素的key
  },

  onLoad(options) {
    console.log('页面加载, 参数:', options);
    
    // 生成并保存用户ID，如果不存在
    if (!wx.getStorageSync('userId')) {
      const userId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      wx.setStorageSync('userId', userId);
      console.log('生成并保存用户ID:', userId);
    }
    
    // 获取用户信息
    this.loadUserInfo();
    
    // 显示加载遮罩
    showLoadingSplash();
    
    console.log('=== 浇水页面加载 ===');
    
    // 优先设置背景色
    wx.setBackgroundColor({
      backgroundColor: '#ffffff'
    });
    
    // 同时设置页面背景样式
    wx.setBackgroundTextStyle({
      textStyle: 'light'
    });
    
    // 显示加载中以阻止页面闪烁
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    let loadingClosed = false;
    
    // 确保总是关闭loading，防止页面卡死
    const safeHideLoading = () => {
      if (!loadingClosed) {
        loadingClosed = true;
        wx.hideLoading();
      }
    };
    
    // 设置安全关闭计时器，确保最终会关闭loading
    setTimeout(safeHideLoading, 5000);
    
    // 关键：通过延迟处理阻止页面闪烁
    setTimeout(() => {
      try {
        // 初始化树木数据
        this.initializeTreeData();
        
        // 确保树木数据已正确加载
        if (!this.data.tree) {
          console.error('树木数据加载失败');
          wx.showToast({
            title: '树木数据加载失败，请重试',
            icon: 'none'
          });
        }
        
        // 更新当前显示的图片
        this.updateCurrentImage();
        
        // 启动待机动画
        this.startIdleAnimation();
        
        console.log('页面加载完成，当前树木数据:', this.data.tree);
      } catch (error) {
        console.error('页面加载出错:', error);
        wx.showToast({
          title: '加载出错，请重试',
          icon: 'none'
        });
      } finally {
        // 确保在所有操作完成后再关闭加载提示
        setTimeout(() => {
          safeHideLoading();
        }, 500);
      }
    }, 200); // 稍微延迟处理，确保页面上下文已完全准备好
  },
  
  onReady() {
    console.log('=== 浇水页面准备完成 ===');
    
    // 强制将页面置于最顶层
    wx.setTabBarStyle({
      backgroundColor: '#ffffff'
    });
  },
  
  onShow() {
    console.log('=== 浇水页面显示 ===');
    
    // 确保页面显示时重置所有动画状态，但保留弹窗状态
    this.setData({
      isWatering: false,
      wateringAnimationActive: false,
      showSplash: false,
      showSplash2: false,
      showSplash3: false,
      wateringKey: Date.now() // 重新生成key
      // 不重置 showResult，保留弹窗状态
    });
    
    // 更新当前树木图片
    this.updateCurrentImage();
    
    // 显示加载中以阻止页面闪烁
    let loadingShown = false;
    
    // 安全显示加载
    const safeShowLoading = () => {
      if (!loadingShown) {
        loadingShown = true;
        wx.showLoading({
          title: '加载中...',
          mask: true
        });
      }
    };
    
    // 安全隐藏加载
    const safeHideLoading = () => {
      if (loadingShown) {
        loadingShown = false;
        wx.hideLoading();
      }
    };
    
    // 短暂显示加载
    safeShowLoading();
    
    // 设置安全关闭计时器，确保最终会关闭loading
    setTimeout(safeHideLoading, 5000);
    
    // 关键：强制重置页面，确保不会闪烁
    setTimeout(() => {
      // 确保页面完全显示前禁用任何动画
      this.stopIdleAnimation();
      
      // 重新加载图片
      if (this.data.currentImageSrc) {
        // 重新触发图片加载流程
        this.updateCurrentImage();
      }
      
      // 延迟启动待机动画
      setTimeout(() => {
        this.startIdleAnimation();
        // 关闭加载遮罩
        safeHideLoading();
      }, 300);
    }, 100);
  },
  
  onHide() {
    console.log('=== 浇水页面隐藏 ===');
    this.pageShowing = false;
    
    // 停止所有可能的动画和计时器
    this.stopIdleAnimation();
    
    // 清除所有可能的计时器
    if (this.wateringTimer) clearTimeout(this.wateringTimer);
    if (this.splashTimer) clearTimeout(this.splashTimer);
  },

  onUnload() {
    console.log('=== 浇水页面卸载 ===');
    
    // 确保关闭加载遮罩
    try {
      wx.hideLoading();
    } catch (e) {
      console.error('关闭加载遮罩出错:', e);
    }
    
    // 停止所有动画
    this.stopIdleAnimation();
    
    // 清除所有计时器
    if (this.wateringTimer) clearTimeout(this.wateringTimer);
    if (this.splashTimer) clearTimeout(this.splashTimer);
    
    // 重置页面状态
    this.pageShowing = false;
  },

  initializeTreeData() {
    // 优先从路由参数获取 treeId
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const options = currentPage.options || {};
    let treeId = options.treeId || wx.getStorageSync('currentTreeId');

    // 若没有 treeId，提示用户去地图选择，不再设置任何默认值
    if (!treeId) {
      wx.showToast({ title: '请先在地图选择一棵树', icon: 'none' });
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/map/map' });
      }, 500);
      return;
    }

    // 保存当前树ID
    wx.setStorageSync('currentTreeId', treeId);

    // 尝试从本地存储获取树木数据
    const treeDataKey = `tree_data_${treeId}`;
    let treeData = wx.getStorageSync(treeDataKey);

    // 如果本地没有数据，尝试从 allTrees 中查找
    if (!treeData) {
      const allTrees = wx.getStorageSync('allTrees') || [];
      treeData = allTrees.find(tree =>
        (tree.treeId === treeId) || (tree._id === treeId) || (tree._id === `tree-${treeId}`)
      );

      if (treeData) {
        // 将找到的数据保存到本地存储
        wx.setStorageSync(treeDataKey, treeData);
        console.log('从 allTrees 找到树木数据:', treeData);
      } else {
        // 未找到任何数据，引导用户去地图选择
        wx.showToast({ title: '未找到该树，请在地图选择', icon: 'none' });
        setTimeout(() => {
          wx.navigateTo({ url: '/pages/map/map' });
        }, 500);
        return;
      }
    }

    // 根据树阶段设置最大成长值并初始化
    const stage = treeData.stage || 1;
    const stageInfo = TREE_GROWTH_STAGES[stage - 1] || TREE_GROWTH_STAGES[0];
    const maxPoints = stageInfo.threshold;

    this.setData({
      tree: {
        ...this.data.tree,
        ...treeData,
        maxPoints: maxPoints
      },
      currentTreeId: treeId
    });

    console.log('树木数据初始化成功:', this.data.tree);

    // 加载真实的浇水记录
    this.loadWateringRecords();
  },

  // 加载真实的浇水记录
  async loadWateringRecords() {
    try {
      if (!this.data.tree || !this.data.tree.treeId) {
        console.log('树木ID不存在，跳过加载浇水记录');
        return;
      }

      const treeId = this.data.tree.treeId;
      const db = wx.cloud.database();
      
      // 获取该树的最近浇水记录
      const result = await db.collection('wateringRecords')
        .where({ treeId })
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      if (result && result.data) {
        const records = result.data.map(record => ({
          id: record._id || Date.now() + Math.random(),
          avatar: record.userAvatar || '',
          nickname: record.userName || '微信用户',
          action: `给TA浇水${record.waterAmount || 1}桶`,
          time: this.formatTime(record.timestamp || record.createdAt)
        }));

        this.setData({ activityList: records });
        console.log('加载真实浇水记录:', records.length);
      }
    } catch (error) {
      console.error('加载浇水记录失败:', error);
      // 保持空列表，不显示错误
    }
  },

  // 格式化时间显示
  formatTime(timestamp) {
    if (!timestamp) return '刚刚';
    
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 86400000)}天前`;
    
    return new Date(timestamp).toLocaleDateString('zh-CN');
  },

  // 更新当前显示的图片
  updateCurrentImage() {
    const { tree, showUpgradeGif } = this.data;
    let imageSrc = '';
    
    // 确保tree对象存在
    if (!tree) {
      console.error('树木数据不存在');
      this.setData({
        currentImageSrc: this.data.treeStaticImages[1] || BASE_IMAGE_URL + '/images/1.png',
        treeImageLoaded: false,
        treeImageError: false
      });
      return;
    }
    
    // 先设置加载状态，但保持旧图片可见，避免闪烁
    this.setData({
      isTransitioning: true
    });
    
    // 确定要加载的图片
    if (showUpgradeGif) {
      imageSrc = this.data.treeUpgradeGifs[tree.stage] || this.data.treeUpgradeGifs[1];
      console.log('加载升级GIF:', imageSrc);
    } else {
      imageSrc = this.data.treeStaticImages[tree.stage] || this.data.treeStaticImages[1];
      console.log('加载静态图片:', imageSrc);
    }
    
    // 使用正确的微信API预加载图片，增加超时和重试
    const loadImageWithRetry = (src, retryCount = 0) => {
      console.log(`尝试加载图片 (第${retryCount + 1}次):`, src);
      
      wx.getImageInfo({
        src: src,
        timeout: 10000, // 10秒超时
        success: (res) => {
          console.log('图片预加载成功:', src);
          
          // 短暂延迟再显示新图片，确保页面渲染平滑
          setTimeout(() => {
            this.setData({
              currentImageSrc: src,
              treeImageLoaded: true,
              treeImageError: false,
              isTransitioning: false
            });
          }, 50);
        },
        fail: (err) => {
          console.error(`图片加载失败 (第${retryCount + 1}次):`, src, err);
          
          // 最多重试2次
          if (retryCount < 2) {
            console.log(`准备重试第${retryCount + 2}次...`);
            setTimeout(() => {
              loadImageWithRetry(src, retryCount + 1);
            }, 1000 * (retryCount + 1)); // 递增延迟：1秒，2秒
          } else {
            console.error('图片加载重试失败，使用默认图片');
            // 重试失败后直接使用1.png
            this.setData({
              currentImageSrc: this.data.treeStaticImages[1],
              treeImageLoaded: true,
              treeImageError: true,
              isTransitioning: false
            });
          }
        }
      });
    };
    
    // 开始加载图片
    loadImageWithRetry(imageSrc);
  },
  
  // 预加载图片 - 保留这个函数但更新实现
  preloadImage(src, callback) {
    // 使用微信的图片预加载API
    wx.getImageInfo({
      src: src,
      success: (res) => {
        console.log('图片预加载成功:', src);
        if (callback) callback();
      },
      fail: (err) => {
        console.error('图片预加载失败:', src, err);
        // 失败时也调用回调，确保UI不会卡住
        if (callback) callback();
      }
    });
  },
  
  // 处理预加载图片加载完成
  onNextImageLoad() {
    console.log('预加载图片加载完成:', this.data.nextImageSrc);
    this.setData({
      nextImageLoaded: true
    });
  },

  // 简化的待机动画
  startIdleAnimation() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
    }
    
    this.idleTimer = setInterval(() => {
      if (!this.data.isWatering && !this.data.isUpgrading) {
        this.setData({
          showIdleEffects: true
        });
        
        // 2秒后隐藏效果
        setTimeout(() => {
          this.setData({
            showIdleEffects: false
          });
        }, 2000);
      }
    }, 3000); // 每8秒触发一次待机效果
  },

  stopIdleAnimation() {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }
  },

  // 添加showWateringForm方法，显示浇水表单
  showWateringForm() {
    console.log('显示浇水表单');
    
    // 智能检查用户信息：如果本地有缓存且用户已经设置过，直接显示表单
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const hasUserInfo = userInfo.avatarUrl && userInfo.nickName && userInfo.nickName !== '微信用户';
      
      if (hasUserInfo) {
        console.log('用户信息已完善，直接显示表单');
        // 确保清除可能的计时器
        if (this.idleTimer) {
          clearInterval(this.idleTimer);
        }
        
        this.setData({
          showWateringForm: true
        });
        
        // 添加额外的日志用于调试
        setTimeout(() => {
          console.log('表单状态:', this.data.showWateringForm);
        }, 100);
        return;
      }
    } catch (e) {
      console.log('读取用户信息失败:', e);
    }
    
    // 如果用户信息不完善，显示引导提示
    wx.showModal({
      title: '完善个人信息',
      content: '为了更好的体验，请先完善您的头像和昵称',
      confirmText: '去完善',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/packageB/pages/my-trees/my-trees' });
        } else {
          // 用户选择稍后再说，仍然显示表单（但会提示信息不完整）
          console.log('用户选择稍后再说，显示表单但提示信息不完整');
          if (this.idleTimer) {
            clearInterval(this.idleTimer);
          }
          
          this.setData({
            showWateringForm: true
          });
          
          // 显示提示
          setTimeout(() => {
            wx.showToast({
              title: '建议完善个人信息以获得更好体验',
              icon: 'none',
              duration: 2000
            });
          }, 500);
        }
      }
    });
  },
  
  // 隐藏浇水表单
  hideWateringForm() {
    console.log('隐藏浇水表单');
    this.setData({
      showWateringForm: false
    });
    
    // 重新启动待机动画
    this.startIdleAnimation();
  },
  
  // 取消浇水
  cancelWatering() {
    this.setData({
      showWateringForm: false,
      formData: {
        name: '',
        message: '',
        isAnonymous: false
      }
    });
  },
  
  // 处理姓名输入
  inputName(e) {
    this.setData({
      'formData.name': e.detail.value
    });
  },
  
  // 处理留言输入
  inputMessage(e) {
    this.setData({
      'formData.message': e.detail.value
    });
  },
  
  // 新增：处理匿名/实名选择切换
  onDisplayTypeChange(e) {
    const value = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
    const isAnonymous = value === 'anonymous';
    this.setData({
      'formData.isAnonymous': isAnonymous,
      // 如果选择匿名，清空姓名
      'formData.name': isAnonymous ? '' : this.data.formData.name
    });
  },
  
  // 开始支付
  async startPayment() {
    const { name, isAnonymous } = this.data.formData;
    
    // 智能检查用户信息：如果选择实名但信息不完整，给出友好提示
    if (!isAnonymous) {
      try {
        const userInfo = wx.getStorageSync('userInfo') || {};
        const hasUserInfo = userInfo.avatarUrl && userInfo.nickName && userInfo.nickName !== '微信用户';
        
        if (!hasUserInfo) {
          wx.showModal({
            title: '完善个人信息',
            content: '实名浇水需要完善头像和昵称，是否现在去完善？',
            confirmText: '去完善',
            cancelText: '改为匿名',
            success: (res) => {
              if (res.confirm) {
                wx.navigateTo({ url: '/packageB/pages/my-trees/my-trees' });
              } else {
                // 用户选择改为匿名
                this.setData({
                  'formData.isAnonymous': true,
                  'formData.name': ''
                });
                wx.showToast({
                  title: '已切换为匿名模式',
                  icon: 'success'
                });
                // 重新调用支付
                setTimeout(() => {
                  this.startPayment();
                }, 500);
              }
            }
          });
          return;
        }
      } catch (e) {
        console.log('读取用户信息失败:', e);
      }
    }
    
    // 实名状态下才验证姓名
    if (!isAnonymous && !name) {
      wx.showToast({
        title: '请输入您的姓名',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ isSubmitting: true });
    
    try {
      wx.showLoading({ title: '正在创建订单...' });
      
      // 引入支付服务
              const paymentService = require('../../utils/payment');
      
      // 构造订单数据
      const orderData = {
        orderType: 'watering',
        amount: 1, // 70元转为分
        title: '名师林树木浇水服务',
        description: `为${this.data.tree?.name || '树木'}提供浇水服务`,
        orderDetails: {
          treeId: this.data.tree?.id,
          treeName: this.data.tree?.name,
          serviceType: 'watering',
          location: this.data.tree?.location || '名师林'
        },
        contactInfo: {
          name: isAnonymous ? '匿名用户' : name,
          isAnonymous: isAnonymous,
          phone: this.data.formData.phone || '',
          email: this.data.formData.email || ''
        }
      };
      
      wx.hideLoading();
      wx.showLoading({ title: '正在支付...' });
      
      // 执行支付流程
      const paymentResult = await paymentService.processPayment(orderData);
      
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      
      if (paymentResult.success) {
        // 支付成功
        this.handlePaymentSuccess(paymentResult);
        
      } else if (paymentResult.cancelled) {
        // 用户取消支付
        wx.showToast({
          title: '支付已取消',
          icon: 'none'
        });
      } else {
        // 支付失败
        wx.showModal({
          title: '支付失败',
          content: paymentResult.message || '支付过程中出现错误，请重试',
          showCancel: false
        });
      }
      
    } catch (error) {
      console.error('浇水支付失败:', error);
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      
      wx.showModal({
        title: '支付失败',
        content: '支付过程中出现错误：' + (error.message || '未知错误'),
        showCancel: false
      });
    }
  },
  
  // 处理支付成功
  handlePaymentSuccess(paymentResult = null) {
    wx.showToast({
      title: paymentResult?.mockMode ? '模拟支付成功' : '支付成功',
      icon: 'success',
      duration: 2000
    });
    
    // 保存浇水记录
    this.saveWateringRecord(paymentResult?.order);
    
    // 关闭表单
    this.setData({
      showWateringForm: false
    });
    
    // 更新浇水状态（函数已移除，这里改为直接处理）
    console.log('浇水成功，准备显示效果');
    
    // 延迟显示浇水效果
    setTimeout(() => {
      console.log('浇水效果显示');
      // 执行浇水操作
      this.performWatering();
    }, 500);
  },
  
  // 保存浇水记录
  saveWateringRecord(order = null) {
    const { name, isAnonymous } = this.data.formData;
    const displayName = isAnonymous ? '匿名用户' : (name || '微信用户');
    
    const wateringRecord = {
      id: order?.orderId || Date.now().toString(),
      orderId: order?.orderId || null,
      treeId: this.data.tree?.id || 'unknown',
      treeName: this.data.tree?.name || '未知树木',
      userName: displayName,
      isAnonymous: isAnonymous || false, // 确保默认为false
      message: this.data.formData.message || '',
      amount: order?.amount ? order.amount / 100 : 70,
      timestamp: new Date().toISOString(),
      paymentMethod: order ? 'wechat' : 'pending',
      paymentStatus: order?.status || 'pending',
      transactionId: order?.transactionId || null,
      paidAt: order?.paidAt || null,
      location: this.data.tree?.location || '名师林',
      serviceType: 'watering',
      fulfillment: order?.fulfillment || {
        status: 'pending',
        serviceTime: null
      }
    };
    
    // 保存到本地存储
    try {
      const existingRecords = wx.getStorageSync('wateringHistory') || [];
      existingRecords.unshift(wateringRecord);
      wx.setStorageSync('wateringHistory', existingRecords);
      
      console.log('浇水记录保存成功:', wateringRecord);
    } catch (error) {
      console.error('保存浇水记录失败:', error);
    }
    const newActivity = {
      id: Date.now(),
      avatar: this.data.userAvatar || '',
      nickname: displayName,
      action: `给TA浇水${wateringRecord.amount || 1}桶`,
      time: '刚刚'
    };
    
    // 更新活动列表，将新记录添加到顶部（避免重复）
    const currentActivityList = this.data.activityList || [];
    const filteredList = currentActivityList.filter(item => item.id !== newActivity.id);
    
    this.setData({
      activityList: [newActivity, ...filteredList].slice(0, 10) // 只保留最新的10条记录
    });
    
    // 重新加载真实的浇水记录（确保数据一致性）
    setTimeout(() => {
      this.loadWateringRecords();
    }, 1000);
  },

  selectWaterOption(e) {
    const option = e.currentTarget.dataset.option;
    this.setData({
      selectedOption: option
    });
  },

  // 执行浇水操作
  async performWatering() {
    console.log('执行浇水操作');
    // 智能检查用户信息：如果选择实名但信息不完整，给出友好提示
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const hasUserInfo = userInfo.avatarUrl && userInfo.nickName && userInfo.nickName !== '微信用户';
      const { isAnonymous } = this.data.formData;
      if (!isAnonymous && !hasUserInfo) {
        wx.showModal({
          title: '完善个人信息',
          content: '实名浇水需要完善头像和昵称，是否现在去完善？',
          confirmText: '去完善',
          cancelText: '改为匿名',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/packageB/pages/my-trees/my-trees' });
            } else {
              // 用户选择改为匿名
              this.setData({
                'formData.isAnonymous': true,
                'formData.name': ''
              });
              wx.showToast({
                title: '已切换为匿名模式',
                icon: 'success'
              });
              // 重新调用浇水
              setTimeout(() => {
                this.performWatering();
              }, 500);
            }
          }
        });
        return;
      }
    } catch (e) {
      // 读取异常也进行引导
      wx.navigateTo({ url: '/packageB/pages/my-trees/my-trees' });
      return;
    }
    try {
      // 重置表单并隐藏
      this.setData({
        showWateringForm: false
      });
      
      // 显示浇水GIF动画
      this.setData({
        isWatering: true,
        wateringAnimationActive: true
      });
      
      // 播放浇水动画3秒钟
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 确保在关闭浇水动画前预加载静态图片
      const currentStage = this.data.tree.stage;
      const staticImageSrc = this.data.treeStaticImages[currentStage] || this.data.treeStaticImages[1];
      
      try {
        // 预加载静态图片
        await new Promise((resolve, reject) => {
          wx.getImageInfo({
            src: staticImageSrc,
            success: resolve,
            fail: reject
          });
        });
        console.log('静态图片预加载成功:', staticImageSrc);
      } catch (err) {
        console.warn('图片预加载失败，继续执行:', err);
      }
      
      // 关闭浇水动画前先增加一个短暂的淡出效果
      this.setData({
        wateringAnimationActive: false
      });
      
      // 等待淡出动画完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 结束浇水动画
      this.setData({
        isWatering: false
      });
      
      // 处理浇水结果，但不显示弹窗
      // 在processWateringResult中会根据情况显示小动物动画或升级动画
      const result = await this.processWateringResult();
      
      // 浇水完成后立即保存数据并同步
      await this.saveTreeData();
      
      // 根据结果判断是否需要等待动画完成
      if (result.hasAnimation) {
        console.log('等待动画完成后显示结果弹窗');
        // 如果有动画，等待动画完成后再显示结果弹窗
        setTimeout(() => {
          this.showResultPopup();
        }, result.waitTime);
      } else {
        // 如果没有动画，直接显示结果弹窗
        console.log('没有动画，直接显示结果弹窗');
        this.showResultPopup();
      }
    } catch (error) {
      console.error('浇水过程发生错误:', error);
      // 出错时也重置状态
      this.setData({
        isWatering: false,
        wateringAnimationActive: false
      });
    }
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

  // 显示结果弹窗的函数
  showResultPopup() {
    console.log('显示浇水结果弹窗');
    
    // 强制显示结果弹窗
    this.setData({
      showResult: true
    });
    
    // 打印当前状态，帮助调试
    console.log('当前showResult状态:', this.data.showResult);
    console.log('当前waterResult数据:', this.data.waterResult);
    
    // 确保弹窗显示在最前面
    wx.nextTick(() => {
      // 使用选择器获取弹窗元素
      const query = wx.createSelectorQuery();
      query.select('.watering-result-modal').boundingClientRect();
      query.exec((res) => {
        console.log('弹窗元素:', res);
        if (res && res[0]) {
          console.log('弹窗已找到，尺寸:', res[0].width, res[0].height);
        } else {
          console.error('弹窗元素未找到!');
          // 再次尝试显示弹窗
          this.setData({
            showResult: true
          });
        }
      });
    });
  },
  
  // 修改处理浇水结果的函数，确保动画状态重置
  processWateringResult() {
    console.log('处理浇水结果，当前阶段:', this.data.tree.stage);
    
    // 返回Promise以便等待处理完成
    return new Promise((resolve) => {
    // 延迟一小段时间，确保动画完全停止
    setTimeout(async () => {
      const currentStage = this.data.tree.stage;
        
        // 获取当前阶段信息
        const stageInfo = TREE_GROWTH_STAGES[currentStage - 1] || TREE_GROWTH_STAGES[0];
        const pointsGained = stageInfo.growthValue; // 根据当前阶段获取成长值
        const wateringAmount = stageInfo.waterAmount; // 本次浇水桶数
        
        // 更新树木数据
        const newPoints = this.data.tree.points + pointsGained;
        const newTotalGrowthValue = (this.data.tree.totalGrowthValue || 0) + pointsGained;
        const newTotalWateringCount = (this.data.tree.totalWateringCount || 0) + 1;
        const newTotalWateringAmount = (this.data.tree.totalWateringAmount || 0) + wateringAmount;
        
        const maxPoints = stageInfo.threshold;
      
      let upgraded = false;
      let newStage = currentStage;
        let nextStageRemaining = 0;
        let showAnimalGif = false;
        let animalGifSrc = '';
      
      // 检查是否升级
        if (newPoints >= maxPoints && currentStage < 10) {
        upgraded = true;
        newStage = currentStage + 1;
        } else {
          // 如果没有升级，计算距离下一阶段还需成长值
          nextStageRemaining = maxPoints - newPoints;
          
          // 显示小动物动画
          showAnimalGif = true;
          
          // 所有小动物索引
          const allAnimals = [0, 1, 2, 3, 4, 5, 6, 7]; // 对应animal_1到animal_8
          // 特殊小动物（需要放大显示的）
          const specialAnimals = [0, 1, 4, 6]; // 对应animal_1, animal_2, animal_5, animal_7
          
          // 决定是否显示特殊小动物
          const showSpecialAnimal = Math.random() > 0.3; // 70%概率显示特殊小动物
          
          let animalIndex;
          if (showSpecialAnimal) {
            // 从特殊小动物中随机选择
            const specialIndex = Math.floor(Math.random() * specialAnimals.length);
            animalIndex = specialAnimals[specialIndex];
          } else {
            // 随机选择任意小动物
            animalIndex = Math.floor(Math.random() * allAnimals.length);
          }
          
          animalGifSrc = this.data.animalGifs[animalIndex];
          
          console.log('选择的小动物索引:', animalIndex);
          console.log('小动物动画路径:', animalGifSrc);
          console.log('对应的CSS类:', 
            animalGifSrc.includes('animal_1.gif') ? 'animal-1' : 
            animalGifSrc.includes('animal_2.gif') ? 'animal-2' : 
            animalGifSrc.includes('animal_5.gif') ? 'animal-5' : 
            animalGifSrc.includes('animal_7.gif') ? 'animal-7' : '无');
      }
      
      // 设置结果数据
      const waterResult = {
        success: true,
        pointsGained: pointsGained,
        newStage: newStage,
        upgraded: upgraded,
        stageName: this.data.stageNames[newStage],
        nextStageRemaining: nextStageRemaining,
        showAnimalGif: showAnimalGif,
        animalGifSrc: animalGifSrc,
        wateringCount: 1,
        wateringAmount: wateringAmount,
        totalWateringCount: newTotalWateringCount,
        totalWateringAmount: newTotalWateringAmount,
        totalGrowthValue: newTotalGrowthValue,
        // 添加云数据库需要的字段
        newPoints: newPoints,
        maxPoints: maxPoints,
        newWaterLevel: Math.min(100, (this.data.tree.waterLevel || 0) + 30)
      };
      
      console.log('浇水结果:', waterResult);
      
      // 更新所有状态
      this.setData({
        waterResult: waterResult,
          currentPoints: this.data.currentPoints + pointsGained,
          showAnimalGif: showAnimalGif && !upgraded, // 只有在不升级时才显示小动物动画
          animalGifSrc: animalGifSrc,
          animalGifKey: Date.now() // 更新key强制重建动画元素
        });
        
        // 如果显示小动物动画，5秒后自动隐藏
        if (showAnimalGif && !upgraded) {
          setTimeout(() => {
            this.setData({
              showAnimalGif: false
            });
          }, 5000);
        }
        
        // 创建动画信息对象
        let animationInfo = {
          hasAnimation: false,
          waitTime: 0
        };
      
      if (upgraded) {
        console.log(`树木升级: ${currentStage} -> ${newStage}`);
        // 播放升级动画
        this.playUpgradeAnimation(currentStage, newStage);
          // 升级动画需要等待更长时间
          animationInfo.hasAnimation = true;
          animationInfo.waitTime = 5500; // 5秒动画 + 0.5秒缓冲
        } else if (showAnimalGif) {
          console.log(`显示小动物动画`);
          // 小动物动画
          animationInfo.hasAnimation = true;
          animationInfo.waitTime = 5000; // 5秒动画
      } else {
        console.log(`树木未升级，当前阶段: ${currentStage}, 成长值: ${newPoints}/${maxPoints}`);
        }
        
        if (!upgraded) {
        // 在关闭浇水动画之前先预加载静态图片
        const staticImageSrc = this.data.treeStaticImages[currentStage] || this.data.treeStaticImages[1];
        
        // 先设置过渡状态但不改变任何可见元素
        this.setData({
          isTransitioning: true
        });
        
        // 确保背景稳定
        wx.setBackgroundColor({
          backgroundColor: '#ffffff'
        });
        
        try {
          // 使用Promise包装图片加载
          await new Promise((resolve) => {
            wx.getImageInfo({
              src: staticImageSrc,
              success: (res) => {
                console.log('静态图片预加载成功:', staticImageSrc);
                resolve(res);
              },
              fail: (err) => {
                console.error('静态图片预加载失败:', err);
                resolve(null); // 即使失败也继续
              }
            });
          });
          
          // 更短的延迟，避免长时间等待
          await new Promise(resolve => setTimeout(resolve, 100));
            
            // 获取下一阶段的阈值
            const nextStageInfo = TREE_GROWTH_STAGES[currentStage] || TREE_GROWTH_STAGES[currentStage - 1];
            const nextStageThreshold = nextStageInfo ? nextStageInfo.threshold : maxPoints;
          
          // 更新树木数据同时更新图片
          const updatedTree = {
            ...this.data.tree,
            points: newPoints,
              maxPoints: maxPoints,
              waterLevel: Math.min(100, this.data.tree.waterLevel + 30),
              totalWateringCount: newTotalWateringCount,
              totalWateringAmount: newTotalWateringAmount,
              totalGrowthValue: newTotalGrowthValue
          };
          
          this.setData({
            tree: updatedTree,
            currentImageSrc: staticImageSrc,
            treeImageLoaded: true
          });
          
          // 数据保存将在 performWatering 中统一处理
          
          // 快速完成过渡
          setTimeout(() => {
            this.setData({
              isTransitioning: false
            });
          }, 150);  // 从500ms减少到150ms
          
        } catch (error) {
          console.error('图片加载过程中出错:', error);
          
          // 出错时的备用方案
          const updatedTree = {
            ...this.data.tree,
            points: newPoints,
              maxPoints: maxPoints,
              waterLevel: Math.min(100, this.data.tree.waterLevel + 30),
              totalWateringCount: newTotalWateringCount,
              totalWateringAmount: newTotalWateringAmount,
              totalGrowthValue: newTotalGrowthValue
          };
          
          this.setData({
            tree: updatedTree,
            isTransitioning: false
          });
          
          // 数据保存将在 performWatering 中统一处理
        }
      }
      
      // 重新开始待机动画
      setTimeout(() => {
        this.startIdleAnimation();
      }, 500);  // 从1000ms减少到500ms
        
        // 返回动画信息
        resolve(animationInfo);
    }, 100);  // 从200ms减少到100ms
    });
  },

  // 修改关闭结果的方法，确保完全重置状态
  closeResult() {
    this.setData({
      showResult: false,
      isWatering: false,
      wateringAnimationActive: false,
      showSplash: false,
      showSplash2: false,
      showSplash3: false
    });
  },

  // 继续浇水
  continueWatering() {
    console.log('继续浇水');
    
    // 关闭结果弹窗
    this.setData({
      showResult: false
    });
    
    // 延迟一下再显示浇水表单
    setTimeout(() => {
      // 重置所有动画状态
      this.setData({
        isWatering: false,
        wateringAnimationActive: false,
        showSplash: false,
        showSplash2: false,
        showSplash3: false,
        wateringKey: Date.now() // 重新生成key
      });
      
      // 显示浇水表单
      this.showWateringForm();
    }, 300);
  },

  goBack() {
    wx.navigateBack();
  },

  goToAdopt() {
    wx.navigateTo({
      url: '/packageB/pages/my-trees/my-trees'
    });
  },

  // 图片加载相关
  onTreeImageLoad() {
    const loadTime = Date.now() - (this.gifLoadStartTime || 0);
    console.log(`树木图片加载成功, 耗时: ${loadTime}ms`);
    
    if (this.data.showUpgradeGif) {
      // 如果是升级GIF加载完成，记录时间点
      this.gifLoadedTime = Date.now();
      console.log(`升级GIF加载完成时间: ${this.gifLoadedTime}`);
    }
    
    this.setData({ treeImageLoaded: true, treeImageError: false });
  },

  onTreeImageError() {
    console.log('树木图片加载失败');
    this.setData({ treeImageLoaded: false, treeImageError: true });
  },
  
  // 新增：升级GIF加载完成处理
  onUpgradeGifLoaded() {
    console.log('升级GIF加载完成');
    
    // 确保延迟一点点再显示，让过渡更平滑
    setTimeout(() => {
      this.setData({ isUpgradeReady: true });
    }, 50);
  },

  // 辅助方法
  getProgressPercent() {
    // 确保tree对象存在
    if (!this.data.tree) {
      return 0;
    }
    
    const { points, maxPoints } = this.data.tree;
    return Math.min(100, Math.round((points / (maxPoints || 150)) * 100));
  },

  getStageColor() {
    // 确保tree对象存在
    if (!this.data.tree) {
      return this.data.stageColors[1];
    }
    
    return this.data.stageColors[this.data.tree.stage] || this.data.stageColors[1];
  },

  getCurrentImageSrc() {
    return this.data.currentImageSrc;
  },

  toggleInfoCard() {
    this.setData({ showInfoCard: !this.data.showInfoCard });
  },
  
  // 加载用户信息
  loadUserInfo() {
    console.log('=== 加载用户信息 ===');
    
    // 从本地存储获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.nickName) {
      console.log('从本地存储获取用户信息:', userInfo);
      this.setData({
        'formData.name': userInfo.nickName,
        userAvatar: userInfo.avatarUrl
      });
    } else {
      // 尝试从全局获取
      const app = getApp();
      if (app.globalData.userInfo && app.globalData.userInfo.nickName) {
        console.log('从全局数据获取用户信息:', app.globalData.userInfo);
        this.setData({
          'formData.name': app.globalData.userInfo.nickName,
          userAvatar: app.globalData.userInfo.avatarUrl
        });
      } else {
        console.log('未找到用户信息，使用默认值');
        this.setData({
          'formData.name': '微信用户',
          userAvatar: ''
        });
      }
    }
  },

  // 手动获取用户信息（授权按钮）
  async getUserProfile() {
    try {
      const app = getApp();
      const userInfo = await app.getUserProfile();
      
      // 更新页面数据
      this.setData({
        'formData.name': userInfo.nickName,
        userAvatar: userInfo.avatarUrl
      });
      
      wx.showToast({
        title: '授权成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('获取用户信息失败:', error);
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      });
    }
  },

  // 保存树木数据（云数据库集成）
  async saveTreeData() {
    console.log('=== 保存树木数据（云数据库集成） ===');
    
    // 获取当前树木ID
    const treeId = this.data.currentTreeId || DataSync.getCurrentTreeId();
    
    if (this.data.waterResult) {
      // 1. 本地同步（保持原有逻辑）
      DataSync.syncWateringAction(treeId, this.data.waterResult, this.data.formData);
      console.log('本地数据同步完成');
      
      // 2. 强制启用云数据库同步（确保数据写入云端）
      const cloudSyncEnabled = true; // 强制启用云同步
      if (cloudSyncEnabled) {
        console.log('云数据库已启用，开始云同步...');
        
        try {
          // 获取用户信息
          const userInfo = wx.getStorageSync('userInfo') || {};
          
          // 确保用户信息正确获取
          const realUserName = userInfo.nickName || this.data.formData?.name || '微信用户';
          const realUserAvatar = userInfo.avatarUrl || this.data.userAvatar || '';
          
          // 检查头像是否为临时路径，如果是则保存为永久路径
          let finalUserAvatar = realUserAvatar;
          if (realUserAvatar && (realUserAvatar.startsWith('wx://') || realUserAvatar.startsWith('http://tmp/'))) {
            try {
              const saveResult = await new Promise((resolve, reject) => {
                wx.saveFile({
                  tempFilePath: realUserAvatar,
                  success: resolve,
                  fail: reject
                });
              });
              finalUserAvatar = saveResult.savedFilePath;
              console.log('头像已保存为永久路径:', finalUserAvatar);
            } catch (error) {
              console.error('保存头像失败:', error);
              // 如果保存失败，尝试使用网络头像
              finalUserAvatar = '';
            }
          }
          
          const cloudSyncData = {
            treeId: treeId,
            treeName: this.data.tree?.name || '',
            userName: realUserName,
            userAvatar: finalUserAvatar,
            message: this.data.formData?.message || '',
            waterAmount: this.data.waterResult.wateringAmount || 1,
            growthValue: this.data.waterResult.pointsGained || 70,
            region: this.data.tree?.region || (String(treeId).indexOf('alumni-') === 0 ? '校友林' : '名师林'),
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0].slice(0, 5),
            newStage: this.data.waterResult.newStage,
            newPoints: this.data.waterResult.newPoints,
            maxPoints: this.data.waterResult.maxPoints,
            totalWateringCount: this.data.waterResult.totalWateringCount,
            totalWateringAmount: this.data.waterResult.totalWateringAmount,
            totalGrowthValue: this.data.waterResult.totalGrowthValue,
            newWaterLevel: this.data.waterResult.newWaterLevel,
            userTotalWateringCount: this.data.waterResult.totalWateringCount,
            userTotalGrowthValue: this.data.waterResult.totalGrowthValue,
            userTotalWaterAmount: this.data.waterResult.totalWateringAmount,
            isAnonymous: this.data.formData?.isAnonymous || false, // 添加匿名状态
            userId: await CloudDatabase.getOpenId() // 添加用户ID
          };
          
          console.log('准备同步到云数据库的数据:', cloudSyncData);
          
          const cloudResult = await CloudDatabase.syncWateringAction(cloudSyncData);
          
          if (cloudResult.success) {
            console.log('云数据库同步成功:', cloudResult);
            
            // 设置数据更新标记
            wx.setStorageSync('dataUpdateFlag', Date.now());
            
            // 同步成功后，自动刷新"我的树木"页面的数据
            this.refreshMyTreesPage();
            
            // 同时保存本地浇水记录
            this.saveWateringRecord();
            
            // 调试：立即检查云数据库中的数据
            setTimeout(async () => {
              try {
                const db = wx.cloud.database();
                const checkResult = await db.collection('wateringRecords')
                  .where({ treeId: treeId })
                  .orderBy('timestamp', 'desc')
                  .limit(1)
                  .get();
                
                console.log('浇水后立即检查云数据库记录:', checkResult.data);
              } catch (error) {
                console.error('检查云数据库记录失败:', error);
              }
            }, 1000);
          } else {
            console.warn('云数据库同步失败:', cloudResult.error);
          }
        } catch (error) {
          console.error('云同步过程中出错:', error);
        }
      } else {
        console.log('云数据库未启用，仅本地同步');
      }
    } else {
      console.warn('waterResult 数据不存在，无法同步');
    }
  },

  // 自动刷新"我的树木"页面数据
  refreshMyTreesPage() {
    console.log('=== 自动刷新我的树木页面数据 ===');
    
    try {
      // 获取"我的树木"页面实例
      const pages = getCurrentPages();
      const myTreesPage = pages.find(page => page.route === 'packageB/pages/my-trees/my-trees');
      
      if (myTreesPage) {
        console.log('找到我的树木页面，触发数据刷新');
        
        // 强制刷新所有数据
        if (myTreesPage.loadAllWateringRecords) {
          myTreesPage.loadAllWateringRecords();
        }
        if (myTreesPage.loadMyTrees) {
          myTreesPage.loadMyTrees();
        }
        if (myTreesPage.calculateStatistics) {
          myTreesPage.calculateStatistics();
        }
        if (myTreesPage.updateDisplayData) {
          myTreesPage.updateDisplayData();
        }
        
        // 强制更新页面显示
        myTreesPage.setData({
          refreshKey: Date.now() // 添加一个刷新键，强制页面重新渲染
        });
        
        console.log('我的树木页面数据刷新完成');
      } else {
        console.log('我的树木页面未找到，数据将在下次进入时自动同步');
      }
    } catch (error) {
      console.error('刷新我的树木页面失败:', error);
    }
  },

  // 重写升级动画 - 使用无缝过渡层
  playUpgradeAnimation(fromStage, toStage) {
    console.log(`播放升级gif动画: ${fromStage} -> ${toStage}`);
    
    // 记录GIF开始播放的时间
    this.gifStartTime = Date.now();
    
    // 设置升级GIF路径和下一阶段静态图片
    const upgradeSrc = this.data.treeUpgradeGifs[fromStage] || this.data.treeUpgradeGifs[1];
    const nextStageSrc = this.data.treeStaticImages[toStage] || this.data.treeStaticImages[1];
    
    // 确保稳定的背景色
    wx.setBackgroundColor({
      backgroundColor: '#ffffff'
    });
    
    // 先预加载下一阶段的静态图片，确保在GIF结束后可以立即显示
    wx.getImageInfo({
      src: nextStageSrc,
      success: () => {
        console.log('下一阶段静态图片预加载成功:', nextStageSrc);
        
        // 预加载成功后，再加载并显示升级GIF
    wx.getImageInfo({
      src: upgradeSrc,
      success: () => {
        console.log('升级GIF预加载成功:', upgradeSrc);
        
            // 设置GIF源并显示
        this.setData({
          upgradeGifSrc: upgradeSrc,
          showUpgradeGif: true,
              isUpgradeReady: false,  // 初始为false，在onUpgradeGifLoaded中设为true
              nextImageSrc: nextStageSrc // 保存下一阶段图片路径
        });
        
            // GIF播放5秒后切换回静态图片
        setTimeout(() => {
          // 计算GIF已播放的时间
          const playedTime = Date.now() - this.gifStartTime;
          console.log(`GIF已播放时间: ${playedTime}ms`);
          
              // 获取新阶段的信息
              const newStageInfo = TREE_GROWTH_STAGES[toStage - 1] || TREE_GROWTH_STAGES[0];
              const newMaxPoints = newStageInfo.threshold;
              
              // 先设置下一阶段的静态图片为当前图片
              this.setData({
                currentImageSrc: nextStageSrc,
                treeImageLoaded: true
              });
              
              // 短暂延迟后再更新树木数据和关闭GIF层
              setTimeout(() => {
                // 更新树木数据
          const updatedTree = {
            ...this.data.tree,
            points: 0,  // 升级后重置积分
            stage: toStage,
                  maxPoints: newMaxPoints, // 使用新阶段的阈值
                  waterLevel: Math.min(100, this.data.tree.waterLevel + 15),
                  totalWateringCount: this.data.waterResult.totalWateringCount,
                  totalWateringAmount: this.data.waterResult.totalWateringAmount,
                  totalGrowthValue: this.data.waterResult.totalGrowthValue
          };
          
                // 设置树木数据并开始淡出GIF
          this.setData({
            tree: updatedTree,
                  isUpgradeReady: false, // 开始淡出GIF
                  showUpgradeGif: false, // 隐藏GIF层
              isUpgrading: false
            });
            
                // 保存树木数据并显示结果
            this.saveTreeData();
                // 短暂延迟后再显示结果弹窗，确保GIF完全隐藏后再显示
                setTimeout(() => {
            this.showWateringResult();
          }, 300);
              }, 100);
        }, 5000);
      },
      fail: (err) => {
        // 失败处理逻辑
        console.error('升级GIF预加载失败:', err);
            
            // 获取新阶段的信息
            const newStageInfo = TREE_GROWTH_STAGES[toStage - 1] || TREE_GROWTH_STAGES[0];
            const newMaxPoints = newStageInfo.threshold;
        
        // 即使GIF加载失败也要继续流程
        this.setData({
              currentImageSrc: nextStageSrc, // 直接设置为下一阶段图片
              treeImageLoaded: true,
          tree: {
            ...this.data.tree,
            points: 0,
            stage: toStage,
                maxPoints: newMaxPoints,
                waterLevel: Math.min(100, this.data.tree.waterLevel + 15),
                totalWateringCount: this.data.waterResult.totalWateringCount,
                totalWateringAmount: this.data.waterResult.totalWateringAmount,
                totalGrowthValue: this.data.waterResult.totalGrowthValue
          },
              isUpgrading: false
        });
        
        this.saveTreeData();
            // 延迟显示结果弹窗，确保树木图片完全更新后再显示
            setTimeout(() => {
        this.showWateringResult();
            }, 300);
          }
        });
      },
      fail: (err) => {
        console.error('下一阶段静态图片预加载失败:', err);
        // 即使静态图片加载失败，也尝试显示GIF
        this.playUpgradeAnimationFallback(fromStage, toStage);
      }
    });
  },
  
  // 备用方法，当静态图片加载失败时使用
  playUpgradeAnimationFallback(fromStage, toStage) {
    const upgradeSrc = this.data.treeUpgradeGifs[fromStage] || this.data.treeUpgradeGifs[1];
    const nextStageSrc = this.data.treeStaticImages[toStage] || this.data.treeStaticImages[1];
    
    // 直接显示GIF
    this.setData({
      upgradeGifSrc: upgradeSrc,
      showUpgradeGif: true,
      isUpgradeReady: true
    });
    
    // 5秒后切换到下一阶段
    setTimeout(() => {
      const newStageInfo = TREE_GROWTH_STAGES[toStage - 1] || TREE_GROWTH_STAGES[0];
      const newMaxPoints = newStageInfo.threshold;
      
      this.setData({
        currentImageSrc: nextStageSrc,
        treeImageLoaded: true,
        showUpgradeGif: false,
        tree: {
          ...this.data.tree,
          points: 0,
          stage: toStage,
          maxPoints: newMaxPoints,
          waterLevel: Math.min(100, this.data.tree.waterLevel + 15),
          totalWateringCount: this.data.waterResult.totalWateringCount,
          totalWateringAmount: this.data.waterResult.totalWateringAmount,
          totalGrowthValue: this.data.waterResult.totalGrowthValue
        },
        isUpgrading: false
      });
      
      this.saveTreeData();
      // 延迟显示结果弹窗，确保树木图片完全更新后再显示
      setTimeout(() => {
        this.showWateringResult();
      }, 300);
    }, 5000);
  },

  showWateringResult() {
    this.setData({
      showResult: true
    });
    
    // 自动关闭结果弹窗
    setTimeout(() => {
      this.closeResult();
    }, 5000);  // 5秒后自动关闭
  },

  // 下载浇水证书
  downloadCertificate() {
    console.log('开始生成浇水证书');
    
    wx.showLoading({
      title: '正在生成证书',
      mask: true
    });
    
    // 格式化日期时间
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // 生成证书编号
    const certNumber = `XA${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {};
    
    // 创建证书数据
    const certificateData = {
      timestamp: now.getTime(),
      certNumber: certNumber,
      certDate: dateStr,
      certTime: timeStr,
      name: userInfo.nickName || '匿名用户',
      message: this.data.waterResult?.message || '',
      waterAmount: this.data.waterResult?.wateringAmount || 1,
      growthValue: this.data.waterResult?.pointsGained || 140,
      treeName: this.data.tree.name || '未命名树木',
      treeRegion: this.data.tree.region || '校友林',
      year: year,
      month: month,
      day: day
    };
    
    console.log('证书数据:', certificateData);
    
    // 显示证书弹窗
    this.setData({
      showCertificate: true,
      currentCertificate: certificateData
    }, () => {
      // 在setData的回调中确保弹窗已显示
      console.log('证书弹窗已显示');
      wx.hideLoading();
      
      // 2秒后自动保存证书
      setTimeout(() => {
        console.log('准备自动保存证书');
        this.saveCertificate();
      }, 1000);
    });
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
        const dateBottom = height * 0.81;
        const dateWidth = width * 0.25;
        const dateRight = width * 0.85;
        const dateLeft = dateRight - dateWidth;
        
        // 年月日位置
        const yearX = dateLeft + dateWidth * 0.19;
        const monthX = dateLeft + dateWidth * 0.60;
        const dayX = dateLeft + dateWidth * 0.77;
        
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
        // 兜底：尝试下载后使用临时文件绘制
        wx.downloadFile({
          url: '/images/certificate-bg.jpg',
          success: (res) => {
            if (res.statusCode === 200) {
              wx.getImageInfo({
                src: res.tempFilePath,
                success: (imgInfo) => {
                  const width = imgInfo.width;
                  const height = imgInfo.height;
                  ctx.drawImage(imgInfo.path, 0, 0, width, height);
                  // 后续绘制逻辑与成功分支一致
                  ctx.setFillStyle('#333333');
                  ctx.setFontSize(25);
                  ctx.setTextAlign('right');
                  ctx.fillText('NO.' + this.data.currentCertificate.certNumber, width * 0.85, height * 0.25);
                  ctx.setFillStyle('#333333');
                  ctx.setFontSize(30);
                  ctx.setTextAlign('left');
                  ctx.fillText(this.data.currentCertificate.name, width * 0.18, height * 0.45);
                  const year = this.data.currentCertificate.year;
                  const month = this.data.currentCertificate.month;
                  const day = this.data.currentCertificate.day;
                  ctx.setTextAlign('center');
                  const dateBottom = height * 0.81;
                  const dateWidth = width * 0.25;
                  const yCenter = dateBottom + 15;
                  ctx.setFontSize(26);
                  ctx.fillText(String(year), width * 0.56, yCenter);
                  ctx.fillText(String(month).padStart(2, '0'), width * 0.64, yCenter);
                  ctx.fillText(String(day).padStart(2, '0'), width * 0.72, yCenter);
                  ctx.draw(false, () => {
                    wx.canvasToTempFilePath({
                      canvasId: 'tempCanvas',
                      success: (res2) => {
                        wx.saveImageToPhotosAlbum({
                          filePath: res2.tempFilePath,
                          success: () => {
                            wx.hideLoading();
                            wx.showToast({ title: '证书已保存到相册', icon: 'success' });
                            setTimeout(() => { this.closeCertificate(); }, 3000);
                          },
                          fail: (err2) => {
                            console.error('保存证书失败:', err2);
                            wx.hideLoading();
                            wx.showToast({ title: '保存失败，请重试', icon: 'none' });
                          }
                        });
                      },
                      fail: (err3) => {
                        console.error('生成临时文件失败:', err3);
                        wx.hideLoading();
                        wx.showToast({ title: '证书生成失败', icon: 'none' });
                      }
                    });
                  });
                },
                fail: (e2) => {
                  console.error('downloadFile后 getImageInfo 仍失败:', e2);
                  wx.hideLoading();
                  wx.showToast({ title: '证书背景加载失败', icon: 'none' });
                }
              });
            } else {
              wx.hideLoading();
              wx.showToast({ title: '证书背景加载失败', icon: 'none' });
            }
          },
          fail: (e) => {
            console.error('下载证书背景失败:', e);
            wx.hideLoading();
            wx.showToast({ title: '证书背景加载失败', icon: 'none' });
          }
        });
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
  },
}); 