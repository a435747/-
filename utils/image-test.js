/**
 * 图片路径测试工具
 * 可以在小程序开发工具的控制台中运行
 */

// 获取app实例
const app = getApp();

// 测试图片路径
function testImagePaths() {
  console.log('🔍 开始测试图片路径...');
  
  // 测试基础URL
  console.log('BASE_IMAGE_URL:', app.globalData.BASE_IMAGE_URL);
  
  // 测试静态树木图片
  const testStaticImage = app.globalData.BASE_IMAGE_URL + '/images/1.png';
  console.log('静态图片测试:', testStaticImage);
  
  // 测试动物GIF
  const testAnimalGif = app.globalData.BASE_IMAGE_URL + '/images/animal_1.gif';
  console.log('动物GIF测试:', testAnimalGif);
  
  // 测试树木生长GIF
  const testGrowthGif = app.globalData.BASE_IMAGE_URL + '/trees-gif/tresss/1-2.gif';
  console.log('生长GIF测试:', testGrowthGif);
  
  // 测试默认头像
  const testAvatar = app.getImageUrl();
  console.log('默认头像测试:', testAvatar);
  
  console.log('📝 请复制以上URL在浏览器中测试是否能正常访问');
}

// 在控制台运行：testImagePaths()
module.exports = { testImagePaths };