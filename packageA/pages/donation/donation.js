Page({
  data: {
    // 表单数据
    formData: {
      donorName: '',
      phone: '',
      email: '',
      company: '',
      position: '',
      graduationYear: '',
      department: '',
      treeType: '',
      donationAmount: 0,
      message: '',
      isAnonymous: false
    },
    
    // 树种选项 - 简化为只有1500的树
    treeTypes: [
      { value: 'cedar', label: '雪松', price: 1500, description: '挺拔向上，寓意成功' }
    ],
    
    selectedTreeType: null,
    
    // 守护套餐 - 只保留1500的豪华守护
    donationPackages: [
      { id: 'deluxe', name: '豪华守护', price: 1500, duration: '永久', features: ['高档守护牌', '专属APP', '无限期养护', '年度聚会邀请', '专人服务'] }
    ],
    
    selectedPackage: null,
    
    // 支付相关
    showPaymentModal: false,
    paymentMethods: [
      { id: 'wechat', name: '微信支付', icon: '💚' },
      { id: 'alipay', name: '支付宝', icon: '💙' },
      { id: 'bank', name: '银行转账', icon: '🏦' }
    ],
    selectedPayment: null,
    
    // 表单验证
    formErrors: {},
    isSubmitting: false,
    
    // 位置信息
    selectedLocation: null,
    showLocationPicker: false,
    availableLocations: [
      { id: 'area1', name: '名师林A区', available: 8, total: 20 },
      { id: 'area2', name: '名师林B区', available: 5, total: 15 },
      { id: 'area3', name: '名师林C区', available: 12, total: 25 }
    ]
  },

  onLoad(options) {
    // 如果从其他页面传递了参数，预填表单
    if (options.treeType) {
      this.selectTreeType({ currentTarget: { dataset: { type: options.treeType } } });
    }
    if (options.package) {
      this.selectPackage({ currentTarget: { dataset: { package: options.package } } });
    }
  },

  // 输入框变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value,
      [`formErrors.${field}`]: '' // 清除错误信息
    });
  },

  // 选择树种
  selectTreeType(e) {
    const { type } = e.currentTarget.dataset;
    const selectedType = this.data.treeTypes.find(t => t.value === type);
    
    this.setData({
      selectedTreeType: selectedType,
      'formData.treeType': type
    });
    
    // 自动计算价格
    this.calculateTotal();
  },

  // 选择参与套餐
  selectPackage(e) {
    const selectedPackage = e.currentTarget.dataset.package;
    this.setData({
      'formData.package': selectedPackage,
      'formData.donationAmount': this.calculateTotalAmount(this.data.formData.treeType, selectedPackage)
    });
  },

  // 计算总价
  calculateTotal() {
    let total = 0;
    
    if (this.data.selectedTreeType) {
      total += this.data.selectedTreeType.price;
    }
    
    if (this.data.selectedPackage) {
      total += this.data.selectedPackage.price;
    }
    
    this.setData({
      'formData.donationAmount': total
    });
  },

  // 切换匿名选项
  toggleAnonymous() {
    this.setData({
      'formData.isAnonymous': !this.data.formData.isAnonymous
    });
  },

  // 选择位置
  selectLocation(e) {
    const { location } = e.currentTarget.dataset;
    const selectedLoc = this.data.availableLocations.find(l => l.id === location);
    
    this.setData({
      selectedLocation: selectedLoc,
      showLocationPicker: false
    });
  },

  // 显示位置选择器
  showLocationPicker() {
    this.setData({ showLocationPicker: true });
  },

  // 关闭位置选择器
  closeLocationPicker() {
    this.setData({ showLocationPicker: false });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;
    const errors = {};
    
    if (!formData.donorName.trim()) {
      errors.donorName = '请输入姓名';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      errors.phone = '手机号格式不正确';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = '邮箱格式不正确';
    }
    
    if (!this.data.selectedTreeType) {
      errors.treeType = '请选择树种';
    }
    
    if (!this.data.selectedPackage) {
      errors.package = '请选择守护套餐';
    }
    
    if (!this.data.selectedLocation) {
      errors.location = '请选择种植位置';
    }
    
    this.setData({ formErrors: errors });
    return Object.keys(errors).length === 0;
  },

  // 提交表单
  submitForm() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完善必填信息',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ showPaymentModal: true });
  },

  // 选择支付方式
  selectPayment(e) {
    const { method } = e.currentTarget.dataset;
    this.setData({ selectedPayment: method });
  },

  // 确认支付
  async confirmPayment() {
    if (!this.data.selectedPayment) {
      wx.showToast({
        title: '请选择支付方式',
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
        orderType: 'donation',
        amount: this.data.formData.donationAmount * 100, // 转为分
        title: '名师林树木捐赠',
        description: this.buildOrderDescription(),
        orderDetails: {
          treeType: this.data.selectedTreeType,
          package: this.data.selectedPackage,
          location: {
            region: this.data.selectedLocation?.name || '名师林',
            position: this.data.selectedLocation?.position || 'A区-001'
          },
          customization: {
            donorName: this.data.formData.donorName,
            message: this.data.formData.message,
            certificate: true
          }
        },
        contactInfo: {
          name: this.data.formData.donorName,
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
        wx.showToast({
          title: paymentResult.mockMode ? '模拟支付成功' : '支付成功',
          icon: 'success',
          duration: 2000
        });
        
        // 保存参与数据
        this.saveDonationData(paymentResult.order);
        
        // 跳转到成功页面
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/donation-success/donation-success?orderId=${paymentResult.order.orderId}&transactionId=${paymentResult.transactionId || ''}`
          });
        }, 2000);
        
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
      console.error('支付流程失败:', error);
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      
      wx.showModal({
        title: '支付失败',
        content: '支付过程中出现错误：' + (error.message || '未知错误'),
        showCancel: false
      });
    }
  },
  
  // 构建订单描述
  buildOrderDescription() {
    let description = '';
    
    if (this.data.selectedTreeType) {
      description += this.data.selectedTreeType.name;
    }
    
    if (this.data.selectedPackage) {
      description += ' + ' + this.data.selectedPackage.name;
    }
    
    return description || '名师林树木捐赠';
  },

  // 保存参与数据
  saveDonationData(order = null) {
    const donationData = {
      id: order?.orderId || Date.now().toString(),
      orderId: order?.orderId || null,
      timestamp: new Date().toISOString(),
      ...this.data.formData,
      status: order?.status || 'pending',
      paymentMethod: order ? 'wechat' : 'pending',
      paymentStatus: order?.status || 'pending',
      transactionId: order?.transactionId || null,
      paidAt: order?.paidAt || null,
      amount: order?.amount ? order.amount / 100 : this.data.formData.donationAmount,
      treeType: this.data.selectedTreeType?.name || '未选择',
      package: this.data.selectedPackage?.name || '基础套餐',
      location: this.data.selectedLocation?.name || '名师林',
      fulfillment: order?.fulfillment || {
        treeId: null,
        certificateUrl: null,
        qrCodeUrl: null,
        status: 'pending'
      }
    };
    
    // 保存到本地存储
    wx.setStorageSync('latestDonation', donationData);
    
    // 添加到参与列表
    const existingDonations = wx.getStorageSync('userDonations') || [];
    existingDonations.push(donationData);
    wx.setStorageSync('userDonations', existingDonations);
    
    console.log('参与数据已保存：', donationData);
  },

  // 关闭支付弹窗
  closePaymentModal() {
    this.setData({ showPaymentModal: false });
  },

  // 返回地图
  backToMap() {
    wx.navigateBack();
  }
}); 