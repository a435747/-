/**
 * 图片工具类
 * 统一管理对象存储图片的调用
 */

// 对象存储基础URL
const STORAGE_BASE_URL = 'https://636c-cloudbase-8geef97fbe06f6f1-1371111601.tcb.qcloud.la';

// 图片路径映射
const imagePaths = {
  // 树木图片
  tree1: '/images/1.png',
  tree2: '/images/2.png',
  tree3: '/images/3.png',
  tree4: '/images/4.png',
  tree5: '/images/5.png',
  tree6: '/images/6.png',
  tree7: '/images/7.png',
  tree8: '/images/8.png',
  tree9: '/images/9.png',
  tree10: '/images/10.png',
  
  // 动物GIF
  animal1: '/images/animal_1.gif',
  animal2: '/images/animal_2.gif',
  animal3: '/images/animal_3.gif',
  animal4: '/images/animal_4.gif',
  animal5: '/images/animal_5.gif',
  animal6: '/images/animal_6.gif',
  animal7: '/images/animal_7.gif',
  animal8: '/images/animal_8.gif',
  
  // 树木成长GIF
  growth12: '/trees-gif/tresss/1-2.gif',
  growth23: '/trees-gif/tresss/2-3.gif',
  growth34: '/trees-gif/tresss/3-4.gif',
  growth45: '/trees-gif/tresss/4-5.gif',
  growth56: '/trees-gif/tresss/5-6.gif',
  growth67: '/trees-gif/tresss/6-7.gif',
  growth78: '/trees-gif/tresss/7-8.gif',
  growth89: '/trees-gif/tresss/8-9.gif',
  growth910: '/trees-gif/tresss/9-10.gif',
  
  // 其他图片
  defaultAvatar: '/images/default-avatar.png',
  wateringGif: '/images/watering.gif',
  wateringCan: '/images/watering-can.png',
  emptyTree: '/images/empty-tree.png',
  emptyRecord: '/images/empty-record.png',
  certificateBg: '/images/certificate-bg.jpg',
  campusMap: '/images/campus-map.jpg'
};

/**
 * 获取图片完整URL
 * @param {string} pathOrKey 图片路径或图片key
 * @returns {string} 完整的图片URL
 */
function getImageUrl(pathOrKey) {
  if (!pathOrKey) {
    return STORAGE_BASE_URL + imagePaths.defaultAvatar;
  }
  
  // 如果已经是完整URL，直接返回
  if (pathOrKey.startsWith('http')) {
    return pathOrKey;
  }
  
  // 特殊处理：证书图片使用本地路径
  if (pathOrKey === 'certificateBg' || pathOrKey === '/images/certificate-bg.jpg') {
    return '/images/certificate-bg.jpg';
  }
  
  // 如果是预定义的key，使用映射路径
  if (imagePaths[pathOrKey]) {
    return STORAGE_BASE_URL + imagePaths[pathOrKey];
  }
  
  // 如果是相对路径，直接拼接
  if (pathOrKey.startsWith('/')) {
    return STORAGE_BASE_URL + pathOrKey;
  }
  
  // 其他情况，添加/images/前缀
  return STORAGE_BASE_URL + '/images/' + pathOrKey;
}

/**
 * 获取树木图片
 * @param {number|string} level 树木等级(1-10)
 * @returns {string} 树木图片URL
 */
function getTreeImage(level) {
  const treeKey = `tree${level}`;
  return imagePaths[treeKey] ? getImageUrl(treeKey) : getImageUrl('tree1');
}

/**
 * 获取动物GIF
 * @param {number|string} index 动物索引(1-8)
 * @returns {string} 动物GIF URL
 */
function getAnimalGif(index) {
  const animalKey = `animal${index}`;
  return imagePaths[animalKey] ? getImageUrl(animalKey) : getImageUrl('animal1');
}

/**
 * 获取成长动画GIF
 * @param {number} fromLevel 起始等级
 * @param {number} toLevel 目标等级
 * @returns {string} 成长动画GIF URL
 */
function getGrowthGif(fromLevel, toLevel) {
  const growthKey = `growth${fromLevel}${toLevel}`;
  return imagePaths[growthKey] ? getImageUrl(growthKey) : null;
}

module.exports = {
  getImageUrl,
  getTreeImage,
  getAnimalGif,
  getGrowthGif,
  imagePaths,
  STORAGE_BASE_URL
};
