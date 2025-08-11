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
    const wxContext = cloud.getWXContext()
    const userId = wxContext.OPENID
    
    if (!userId) {
      return {
        code: -1,
        data: null,
        message: '未获取到用户信息'
      }
    }
    
    const { treeId, careType, expValue } = event
    
    if (!treeId || !careType) {
      return {
        code: -1,
        data: null,
        message: '参数错误：缺少必要参数'
      }
    }
    
    // 检查树木是否存在
    const treeRes = await db.collection('trees').where({
      id: treeId
    }).get()
    
    if (treeRes.data.length === 0) {
      return {
        code: -1,
        data: null,
        message: '未找到该树木'
      }
    }
    
    // 浇水时检查用户今日是否已浇水
    if (careType === '浇水') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const waterRes = await db.collection('tree_care').where({
        userId,
        treeId,
        type: '浇水',
        createdAt: _.gte(today)
      }).count()
      
      if (waterRes.total > 0) {
        return {
          code: -1,
          data: null,
          message: '今天已经给这棵树浇过水了'
        }
      }
    }
    
    // 施肥时检查用户本周是否已施肥
    if (careType === '施肥') {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const fertRes = await db.collection('tree_care').where({
        userId,
        treeId,
        type: '施肥',
        createdAt: _.gte(oneWeekAgo)
      }).count()
      
      if (fertRes.total > 0) {
        return {
          code: -1,
          data: null,
          message: '一周内已经给这棵树施过肥了'
        }
      }
    }
    
    // 添加护理记录
    const now = new Date()
    const careRecord = {
      userId,
      treeId,
      type: careType,
      exp: expValue || 0,
      createdAt: now
    }
    
    await db.collection('tree_care').add({
      data: careRecord
    })
    
    // 更新树木成长值
    if (expValue && expValue > 0) {
      await db.collection('trees').where({
        id: treeId
      }).update({
        data: {
          growthPoints: _.inc(expValue)
        }
      })
    }
    
    // 获取最新护理历史
    const history = await db.collection('tree_care').where({
      treeId
    }).orderBy('createdAt', 'desc').limit(10).get()
    
    return {
      code: 0,
      data: {
        careRecord,
        history: history.data
      },
      message: '护理成功'
    }
    
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      data: null,
      message: '更新树木护理记录失败：' + err.message
    }
  }
} 