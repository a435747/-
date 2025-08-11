// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { treeId } = event
    
    if (!treeId) {
      return {
        code: -1,
        data: null,
        message: '参数错误：缺少树木ID'
      }
    }
    
    // 获取树木基本信息
    const treeDetail = await db.collection('trees').where({
      id: treeId
    }).get()
    
    if (treeDetail.data.length === 0) {
      return {
        code: -1,
        data: null,
        message: '未找到该树木'
      }
    }
    
    // 获取树木护理记录
    const careHistory = await db.collection('tree_care').where({
      treeId: treeId
    }).orderBy('createdAt', 'desc').limit(10).get()
    
    // 获取树木评论
    const comments = await db.collection('tree_comments').where({
      treeId: treeId
    }).orderBy('createdAt', 'desc').limit(10).get()
    
    // 查询用户是否收藏了该树木
    const wxContext = cloud.getWXContext()
    const userId = wxContext.OPENID
    
    let isCollected = false
    if (userId) {
      const collectResult = await db.collection('user_collections').where({
        userId: userId,
        treeId: treeId
      }).count()
      
      isCollected = collectResult.total > 0
    }
    
    // 查询用户今日是否已浇水
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let canWater = true
    if (userId) {
      const waterResult = await db.collection('tree_care').where({
        userId: userId,
        treeId: treeId,
        type: '浇水',
        createdAt: _.gte(today)
      }).count()
      
      canWater = waterResult.total === 0
    }
    
    // 查询用户本周是否已施肥
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    let canFertilize = true
    if (userId) {
      const fertilizeResult = await db.collection('tree_care').where({
        userId: userId,
        treeId: treeId,
        type: '施肥',
        createdAt: _.gte(oneWeekAgo)
      }).count()
      
      canFertilize = fertilizeResult.total === 0
    }
    
    return {
      code: 0,
      data: {
        treeInfo: treeDetail.data[0],
        careHistory: careHistory.data,
        comments: comments.data,
        isCollected,
        canWater,
        canFertilize,
        watered: !canWater
      },
      message: '获取成功'
    }
    
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      data: null,
      message: '获取树木详情失败：' + err.message
    }
  }
} 