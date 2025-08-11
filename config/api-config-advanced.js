/**
 * 高级API配置 - 支持多种访问地址
 */

const config = {
  // 公网地址（小程序使用）
  EXTERNAL_API_URL: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com',
  
  // 内网地址（云函数使用）
  INTERNAL_API_URL: 'http://tvhccwug.test.giufayis.jxgairht.com',
  
  // 根据运行环境自动选择
  getApiUrl() {
    // 判断是否在云函数环境中
    if (typeof wx === 'undefined' || wx.env && wx.env.isCloudFunction) {
      // 云函数环境，使用内网地址
      return this.INTERNAL_API_URL;
    } else {
      // 小程序环境，使用公网地址
      return this.EXTERNAL_API_URL;
    }
  },
  
  // 强制使用公网地址（小程序专用）
  getExternalUrl() {
    return this.EXTERNAL_API_URL;
  },
  
  // 强制使用内网地址（云函数专用）
  getInternalUrl() {
    return this.INTERNAL_API_URL;
  }
};

module.exports = config;