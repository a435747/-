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
    const { region } = event
    
    // 如果指定了区域，只返回该区域的树木点位
    let query = {}
    if (region) {
      query.region = region
    }
    
    // 从数据库获取树木坐标点
    const result = await db.collection('tree_points').where(query).get()
    
    return {
      code: 0,
      data: result.data,
      message: '获取成功'
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      data: null,
      message: '获取树木坐标点失败：' + err.message
    }
  }
} 