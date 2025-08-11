// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  console.log('用户登录，获取openid:', wxContext.OPENID)
  
  try {
    // 查询或创建用户记录
    const userCollection = db.collection('users')
    const openid = wxContext.OPENID
    
    // 检查用户是否已存在
    const existingUser = await userCollection.doc(openid).get()
    
    if (existingUser.data) {
      // 更新最后活跃时间
      await userCollection.doc(openid).update({
        data: {
          lastActiveTime: new Date(),
          updatedAt: new Date()
        }
      })
      
      console.log('用户已存在，更新活跃时间')
    } else {
      // 创建新用户
      await userCollection.doc(openid).set({
        data: {
          // 移除 _openid 字段，云开发会自动分配
          userId: openid, // 使用 userId 字段
          nickName: '微信用户',
          avatarUrl: '/images/default-avatar.png',
          totalWateringCount: 0,
          totalGrowthValue: 0,
          totalWaterAmount: 0,
          joinDate: new Date().toISOString().split('T')[0],
          lastActiveTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      console.log('新用户创建成功')
    }
    
    return {
      success: true,
      openid: openid,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
      envVersion: wxContext.ENV_VERSION,
      message: '登录成功'
    }
  } catch (error) {
    console.error('登录处理失败:', error)
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID,
      message: '登录失败'
    }
  }
}
