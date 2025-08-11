/**
 * 生产环境配置更新示例
 * 
 * 当您获得API网关地址后，请按以下步骤更新：
 */

// 步骤1：将API网关地址替换到api-config.js文件第17行
const EXAMPLE_API_GATEWAY_URL = 'https://service-xxxxx-xxxxxxxx.gz.apigw.tencentcs.com';

// 步骤2：更新配置文件
/*
修改 workspace/config/api-config.js 第17行：
从：API_BASE_URL: 'https://service-xxxxx-xxxxxxxx.gz.apigw.tencentcs.com'
改为：API_BASE_URL: 'https://service-您的真实API网关地址.gz.apigw.tencentcs.com'
*/

// 步骤3：切换到生产环境
/*
修改 workspace/config/api-config.js 第24行：
从：const CURRENT_ENV = 'testing';
改为：const CURRENT_ENV = 'production';
*/

// 步骤4：确认配置
console.log('生产环境配置示例：');
console.log('API_BASE_URL:', EXAMPLE_API_GATEWAY_URL);
console.log('SHOW_REQUEST_LOG:', false);
console.log('ENV_NAME:', 'production');