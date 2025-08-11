/**
 * 云开发工具类
 */

// 封装云函数调用
const callFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '处理中...'
    });
    
    wx.cloud.callFunction({
      name,
      data,
      success: res => {
        console.log(`调用云函数 ${name} 成功:`, res);
        
        // 标准返回格式处理
        if (res.result && res.result.code === 0) {
          resolve(res.result.data);
        } else {
          // 显示错误提示
          const errorMsg = (res.result && res.result.message) || '操作失败';
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          });
          reject(new Error(errorMsg));
        }
      },
      fail: err => {
        console.error(`调用云函数 ${name} 失败:`, err);
        
        // 显示错误提示
        wx.showToast({
          title: '操作失败，请稍后再试',
          icon: 'none'
        });
        
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  });
};

// 上传文件到云存储
const uploadFile = (cloudPath, filePath) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '上传中...'
    });
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        console.log('上传成功:', res);
        resolve(res.fileID);
      },
      fail: err => {
        console.error('上传失败:', err);
        
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        });
        
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  });
};

// 从云存储下载文件
const downloadFile = (fileID) => {
  return new Promise((resolve, reject) => {
    wx.showLoading({
      title: '下载中...'
    });
    
    wx.cloud.downloadFile({
      fileID,
      success: res => {
        console.log('下载成功:', res);
        resolve(res.tempFilePath);
      },
      fail: err => {
        console.error('下载失败:', err);
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  });
};

// 获取临时文件URL
const getTempFileURL = (fileList) => {
  return new Promise((resolve, reject) => {
    if (!fileList || fileList.length === 0) {
      resolve([]);
      return;
    }
    
    wx.cloud.getTempFileURL({
      fileList: Array.isArray(fileList) ? fileList : [fileList],
      success: res => {
        console.log('获取临时文件URL成功:', res);
        resolve(res.fileList);
      },
      fail: err => {
        console.error('获取临时文件URL失败:', err);
        reject(err);
      }
    });
  });
};

// 删除云存储文件
const deleteFile = (fileList) => {
  return new Promise((resolve, reject) => {
    if (!fileList || fileList.length === 0) {
      resolve({ fileList: [] });
      return;
    }
    
    wx.cloud.deleteFile({
      fileList: Array.isArray(fileList) ? fileList : [fileList],
      success: res => {
        console.log('删除文件成功:', res);
        resolve(res);
      },
      fail: err => {
        console.error('删除文件失败:', err);
        reject(err);
      }
    });
  });
};

module.exports = {
  callFunction,
  uploadFile,
  downloadFile,
  getTempFileURL,
  deleteFile
}; 