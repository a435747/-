/**
 * API配置文件
 * 请在这里配置您的云托管服务地址
 */

// 环境配置
const environments = {
  // 测试环境
  testing: {
    API_BASE_URL: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com',
    SHOW_REQUEST_LOG: true,
    ENV_NAME: 'testing'
  },
  
  // 生产环境（云托管）
  production: {
    API_BASE_URL: 'https://test-175573-5-1371111601.sh.run.tcloudbase.com',
    SHOW_REQUEST_LOG: false,
    ENV_NAME: 'production'
  }
};

// 当前环境（上线时改为 'production'）
const CURRENT_ENV = 'production';

const config = {
  // 当前环境配置
  ...environments[CURRENT_ENV],
  
  // 通用配置
  REQUEST_TIMEOUT: 10000,
  DEFAULT_ERROR_MESSAGE: '网络连接失败，请稍后再试',
  
  // 切换到生产环境的方法
  switchToProduction() {
    return { ...this, ...environments.production };
  },
  
  // 切换到测试环境的方法  
  switchToTesting() {
    return { ...this, ...environments.testing };
  }
};

module.exports = config;