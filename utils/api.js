/**
 * API请求工具类 - 替换云函数调用
 */

// 引入配置文件
const config = require('../config/api-config.js');
const API_BASE_URL = config.API_BASE_URL;

// 封装HTTP请求
const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '处理中...'
    });
    
    const requestConfig = {
      url: `${API_BASE_URL}${url}`,
      method,
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log(`请求 ${method} ${url} 成功:`, res);
        
        // 处理API返回的数据
        if (res.statusCode === 200 && res.data) {
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else {
            // 显示错误提示
            const errorMsg = res.data.message || '操作失败';
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            });
            reject(new Error(errorMsg));
          }
        } else {
          wx.showToast({
            title: '请求失败',
            icon: 'none'
          });
          reject(new Error('请求失败'));
        }
      },
      fail: err => {
        console.error(`请求 ${method} ${url} 失败:`, err);
        
        wx.showToast({
          title: '网络连接失败',
          icon: 'none'
        });
        
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    };
    
    // GET请求将参数拼接到URL，POST请求放在body中
    if (method === 'GET' && Object.keys(data).length > 0) {
      const params = Object.keys(data).map(key => 
        `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
      ).join('&');
      requestConfig.url += `?${params}`;
    } else if (method === 'POST') {
      requestConfig.data = data;
    }
    
    wx.request(requestConfig);
  });
};

// API方法封装
const api = {
  // 获取树木详情（替换 getTreeDetail 云函数）
  getTreeDetail(treeId) {
    return request(`/api/trees/${treeId}`, 'GET');
  },
  
  // 获取树木坐标点（替换 getTreePoints 云函数）
  getTreePoints(region = '') {
    const params = region ? { region } : {};
    return request('/api/tree-points', 'GET', params);
  },
  
  // 更新树木护理记录（替换 updateTreeCare 云函数）
  updateTreeCare(treeId, careType, expValue = 10) {
    return request('/api/care', 'POST', {
      treeId,
      careType,
      expValue
    });
  },
  
  // 添加评论（替换 addComment 云函数）
  addComment(treeId, content) {
    return request('/api/comments', 'POST', {
      treeId,
      content
    });
  },
  
  // 获取评论列表
  getComments(treeId) {
    return request(`/api/comments/${treeId}`, 'GET');
  },
  
  // 获取树木列表
  getTrees() {
    return request('/api/trees', 'GET');
  }
};

module.exports = {
  api,
  request
};