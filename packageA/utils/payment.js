/**
 * 微信支付服务
 * 封装小程序端的支付相关功能
 */

const config = require('../config/api-config');

/**
 * 创建订单
 * @param {Object} orderData 订单数据
 * @returns {Promise<Object>} 订单信息
 */
async function createOrder(orderData) {
  try {
    console.log('使用云托管callContainer创建订单');
    console.log('请求数据:', orderData);
    
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/orders',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: {
          userId: getCurrentUserId(),
          ...orderData
        },
        success: (res) => {
          console.log('请求成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(new Error('网络请求失败: ' + (err.errMsg || '未知错误')));
        }
      });
    });
    
    console.log('云托管响应:', response);
    console.log('响应数据:', response.data);
    
    if (!response.data) {
      throw new Error('云托管响应数据为空');
    }
    
    if (response.data.code === 0) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '创建订单失败');
    }
  } catch (error) {
    console.error('创建订单失败:', error);
    throw error;
  }
}

/**
 * 发起支付
 * @param {string} orderId 订单ID
 * @returns {Promise<Object>} 支付结果
 */
async function requestPayment(orderId) {
  try {
    console.log('开始发起支付:', orderId);
    
    // 1. 调用统一下单接口
    const unifiedOrderResponse = await new Promise((resolve, reject) => {
      wx.request({
        url: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/payment/unifiedorder',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        data: { orderId },
        success: resolve,
        fail: reject
      });
    });
    
    if (unifiedOrderResponse.data.code !== 0) {
      throw new Error(unifiedOrderResponse.data.message || '创建支付失败');
    }
    
    const paymentParams = unifiedOrderResponse.data.data;
    console.log('统一下单成功:', paymentParams);
    
    // 2. 如果是测试模式，显示模拟支付选项
    if (paymentParams.mockMode) {
      return await showMockPaymentDialog(orderId);
    }
    
    // 3. 调用微信支付API
    try {
      await wx.requestPayment({
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType,
        paySign: paymentParams.paySign
      });
      
      // 支付成功，查询订单状态确认
      const orderStatus = await queryPaymentStatus(orderId);
      return {
        success: true,
        orderId,
        transactionId: orderStatus.transactionId,
        message: '支付成功'
      };
      
    } catch (paymentError) {
      console.error('微信支付失败:', paymentError);
      
      if (paymentError.errMsg && paymentError.errMsg.includes('cancel')) {
        // 用户取消支付
        return {
          success: false,
          cancelled: true,
          message: '支付已取消'
        };
      } else {
        // 支付失败
        throw new Error('支付失败: ' + (paymentError.errMsg || '未知错误'));
      }
    }
    
  } catch (error) {
    console.error('发起支付失败:', error);
    throw error;
  }
}

/**
 * 显示模拟支付对话框
 * @param {string} orderId 订单ID
 * @returns {Promise<Object>} 支付结果
 */
function showMockPaymentDialog(orderId) {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title: '测试支付',
      content: '当前为测试环境，是否模拟支付成功？',
      confirmText: '支付成功',
      cancelText: '支付失败',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用模拟支付成功接口
            const mockResponse = await new Promise((resolve, reject) => {
              wx.request({
                url: `https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/payment/mock-success/${orderId}`,
                method: 'POST',
                success: resolve,
                fail: reject
              });
            });
            
            if (mockResponse.data.code === 0) {
              resolve({
                success: true,
                orderId,
                transactionId: mockResponse.data.data.transactionId,
                message: '模拟支付成功',
                mockMode: true
              });
            } else {
              reject(new Error(mockResponse.data.message || '模拟支付失败'));
            }
          } catch (error) {
            reject(error);
          }
        } else {
          resolve({
            success: false,
            cancelled: true,
            message: '用户取消支付'
          });
        }
      },
      fail: (error) => {
        reject(new Error('显示支付对话框失败'));
      }
    });
  });
}

/**
 * 查询支付状态
 * @param {string} orderId 订单ID
 * @returns {Promise<Object>} 支付状态
 */
async function queryPaymentStatus(orderId) {
  try {
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: `https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/payment/query/${orderId}`,
        method: 'GET',
        success: resolve,
        fail: reject
      });
    });
    
    if (response.data.code === 0) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '查询支付状态失败');
    }
  } catch (error) {
    console.error('查询支付状态失败:', error);
    throw error;
  }
}

/**
 * 查询订单详情
 * @param {string} orderId 订单ID
 * @returns {Promise<Object>} 订单详情
 */
async function queryOrder(orderId) {
  try {
    const response = await new Promise((resolve, reject) => {
      wx.request({
        url: `https://test-175573-5-1371111601.sh.run.tcloudbase.com/api/orders/${orderId}`,
        method: 'GET',
        success: resolve,
        fail: reject
      });
    });
    
    if (response.data.code === 0) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || '查询订单失败');
    }
  } catch (error) {
    console.error('查询订单失败:', error);
    throw error;
  }
}

/**
 * 获取当前用户ID
 * @returns {string} 用户ID
 */
function getCurrentUserId() {
  // 这里应该返回用户的OpenID
  // 在实际应用中，需要通过微信登录获取
  const app = getApp();
  return app.globalData.userInfo?.openId || 'test_user_' + Date.now();
}

/**
 * 轮询查询订单状态（用于支付完成后确认）
 * @param {string} orderId 订单ID
 * @param {number} maxAttempts 最大尝试次数
 * @param {number} interval 查询间隔（毫秒）
 * @returns {Promise<Object>} 最终订单状态
 */
async function pollOrderStatus(orderId, maxAttempts = 10, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await queryPaymentStatus(orderId);
      
      if (status.orderStatus === 'paid') {
        return {
          success: true,
          orderStatus: status.orderStatus,
          transactionId: status.transactionId,
          paidAt: status.paidAt
        };
      }
      
      if (status.orderStatus === 'cancelled' || status.paymentStatus === 'failed') {
        return {
          success: false,
          orderStatus: status.orderStatus,
          message: '支付失败或订单已取消'
        };
      }
      
      // 等待下次查询
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
    } catch (error) {
      console.warn(`第${i+1}次查询订单状态失败:`, error);
      if (i === maxAttempts - 1) {
        throw error;
      }
    }
  }
  
  return {
    success: false,
    message: '支付状态确认超时，请稍后查询订单'
  };
}

/**
 * 完整的支付流程
 * @param {Object} orderData 订单数据
 * @returns {Promise<Object>} 支付结果
 */
async function processPayment(orderData) {
  try {
    // 1. 创建订单
    console.log('创建订单...', orderData);
    const order = await createOrder(orderData);
    
    // 2. 发起支付
    console.log('发起支付...', order.orderId);
    const paymentResult = await requestPayment(order.orderId);
    
    if (!paymentResult.success) {
      return paymentResult;
    }
    
    // 3. 确认支付状态（轮询查询）
    console.log('确认支付状态...');
    const confirmResult = await pollOrderStatus(order.orderId);
    
    if (confirmResult.success) {
      // 4. 查询最终订单详情
      const finalOrder = await queryOrder(order.orderId);
      
      return {
        success: true,
        order: finalOrder,
        transactionId: confirmResult.transactionId,
        message: '支付成功',
        mockMode: paymentResult.mockMode
      };
    } else {
      return confirmResult;
    }
    
  } catch (error) {
    console.error('支付流程失败:', error);
    return {
      success: false,
      message: error.message || '支付失败'
    };
  }
}

module.exports = {
  createOrder,
  requestPayment,
  queryPaymentStatus,
  queryOrder,
  pollOrderStatus,
  processPayment
};