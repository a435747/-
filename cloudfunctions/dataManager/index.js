// 云函数入口文件 - 数据管理
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { action, data } = event
  
  console.log('数据管理云函数调用:', action, data)
  
  try {
    switch (action) {
      case 'syncWateringAction':
        return await syncWateringAction(data, wxContext.OPENID)
      case 'getUserStatistics':
        return await getUserStatistics(wxContext.OPENID)
      case 'getRecentRecords':
        return await getRecentRecords(data.limit || 50)
      case 'initSampleData':
        return await initSampleData(wxContext.OPENID)
      case 'batchUpdateTrees':
        return await batchUpdateTrees(data.trees)
      case 'bulkUpsertTrees':
        return await bulkUpsertTrees(data.trees)
      case 'getAllTrees':
        return await getAllTrees()
      default:
        throw new Error(`未知操作: ${action}`)
    }
  } catch (error) {
    console.error('数据管理操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 获取所有树木数据（服务端分页聚合）
async function getAllTrees() {
  try {
    const collection = db.collection('trees')
    const countRes = await collection.count()
    const total = countRes.total || 0
    
    if (total === 0) {
      return { success: true, data: { trees: [], total: 0 } }
    }
    
    // 服务端分页，每批100条
    const batchSize = 100
    const batches = Math.ceil(total / batchSize)
    const allTrees = []
    
    for (let i = 0; i < batches; i++) {
      const res = await collection.skip(i * batchSize).limit(batchSize).get()
      if (res && Array.isArray(res.data)) {
        allTrees.push(...res.data)
      }
    }
    
    return {
      success: true,
      data: {
        trees: allTrees,
        total: allTrees.length
      }
    }
  } catch (error) {
    console.error('获取所有树木失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 同步浇水操作
async function syncWateringAction(actionData, openid) {
  const session = await db.startTransaction()
  
  try {
    // 1. 创建浇水记录
    const recordDoc = {
      _openid: openid,
      userId: openid,
      treeId: actionData.treeId,
      treeName: actionData.treeName || '智慧之树',
      userName: actionData.userName || '微信用户',
      userAvatar: actionData.userAvatar || '',
      message: actionData.message || '',
      waterAmount: actionData.waterAmount || 1,
      growthValue: actionData.growthValue || 70,
      region: actionData.region || '',
      timestamp: actionData.timestamp || Date.now(),
      date: actionData.date || new Date().toISOString().split('T')[0],
      time: actionData.time || new Date().toTimeString().split(' ')[0].slice(0, 5),
      createdAt: new Date()
    }
    
    const recordResult = await session.collection('wateringRecords').add({
      data: recordDoc
    })
    
    // 2. 更新树木状态
    const treeUpdate = {
      stage: actionData.newStage,
      points: actionData.newPoints,
      maxPoints: actionData.maxPoints,
      totalWateringCount: _.inc(1),
      totalWateringAmount: _.inc(actionData.waterAmount || 1),
      totalGrowthValue: _.inc(actionData.growthValue || 70),
      waterLevel: actionData.newWaterLevel,
      lastWatered: new Date().toISOString(),
      updatedAt: new Date()
    }
    
    await session.collection('trees').doc(actionData.treeId).update({
      data: treeUpdate
    })
    
    // 3. 更新用户统计
    const userUpdate = {
      nickName: actionData.userName || '微信用户',
      avatarUrl: actionData.userAvatar || '',
      totalWateringCount: _.inc(1),
      totalGrowthValue: _.inc(actionData.growthValue || 70),
      totalWaterAmount: _.inc(actionData.waterAmount || 1),
      lastActiveTime: new Date(),
      updatedAt: new Date()
    }
    
    await session.collection('users').doc(openid).update({
      data: userUpdate
    })
    
    await session.commit()
    
    console.log('浇水操作同步成功')
    return {
      success: true,
      data: {
        recordId: recordResult._id,
        message: '浇水操作同步成功'
      }
    }
  } catch (error) {
    await session.rollback()
    console.error('浇水操作同步失败:', error)
    throw error
  }
}

// 获取用户统计
async function getUserStatistics(openid) {
  try {
    // 获取用户信息
    const userResult = await db.collection('users').doc(openid).get()
    
    // 获取用户浇水记录
    const recordsResult = await db.collection('wateringRecords')
      .where({ _openid: openid })
      .count()
    
    // 获取用户参与的树木数量
    const treesResult = await db.collection('wateringRecords')
      .where({ _openid: openid })
      .field({ treeId: true })
      .get()
    
    const uniqueTrees = [...new Set(treesResult.data.map(r => r.treeId))]
    
    const user = userResult.data || {}
    
    return {
      success: true,
      data: {
        totalWateringCount: user.totalWateringCount || recordsResult.total,
        totalWaterAmount: user.totalWaterAmount || 0,
        totalGrowthValue: user.totalGrowthValue || 0,
        treesWatered: uniqueTrees.length,
        joinDate: user.joinDate,
        lastActiveTime: user.lastActiveTime,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl
      }
    }
  } catch (error) {
    console.error('获取用户统计失败:', error)
    throw error
  }
}

// 获取最近记录
async function getRecentRecords(limit) {
  try {
    const result = await db.collection('wateringRecords')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
    
    return {
      success: true,
      data: { records: result.data }
    }
  } catch (error) {
    console.error('获取最近记录失败:', error)
    throw error
  }
}

// 初始化示例数据
async function initSampleData(openid) {
  try {
    console.log('开始初始化示例数据...')
    
    // 1. 初始化树木数据 - 基于名师林真实数据
    const exampleTrees = [
      // 代表性的雪松
      {
        treeId: 'cedar-south-001',
        name: '挺拔雪松1号',
        species: '雪松',
        region: '名师林-南大门广场区域',
        stage: 5,
        points: 750,
        maxPoints: 1000,
        totalWateringCount: 15,
        totalWateringAmount: 15,
        totalGrowthValue: 1050,
        waterLevel: 85,
        emoji: '🌲',
        stageName: '茁壮成长',
        guardDate: '2024-01-01',
        description: '挺拔雪松，彰显学府庄重气象',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 代表性的银杏
      {
        treeId: 'ginkgo-court-001',
        name: '优雅银杏1号',
        species: '银杏',
        region: '名师林-图文信息中心内庭院',
        stage: 4,
        points: 420,
        maxPoints: 600,
        totalWateringCount: 12,
        totalWateringAmount: 12,
        totalGrowthValue: 840,
        waterLevel: 70,
        emoji: '🌳',
        stageName: '枝繁叶茂',
        guardDate: '2024-01-15',
        description: '优雅银杏树，寓意杏坛芬芳，金秋硕果',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // 代表性的油松
      {
        treeId: 'pine-south-001',
        name: '常青油松1号',
        species: '油松',
        region: '名师林-图文信息中心南侧',
        stage: 6,
        points: 800,
        maxPoints: 800,
        totalWateringCount: 20,
        totalWateringAmount: 20,
        totalGrowthValue: 1400,
        waterLevel: 90,
        emoji: '🌲',
        stageName: '参天大树',
        guardDate: '2024-02-01',
        description: '常青油松，象征师道长存，基业长青',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // 批量插入树木（如果不存在）
    for (const tree of exampleTrees) {
      try {
        await db.collection('trees').doc(tree.treeId).set({
          data: tree
        })
      } catch (error) {
        // 如果树木已存在，更新数据
        await db.collection('trees').doc(tree.treeId).update({
          data: { ...tree, updatedAt: new Date() }
        })
      }
    }
    
    // 2. 初始化浇水记录
    const now = new Date()
    const exampleRecords = [
      {
        _openid: openid,
        userId: openid,
        treeId: 'tree-001',
        treeName: '智慧银杏',
        userName: '微信用户',
        userAvatar: '',
        message: '希望这棵树茁壮成长！',
        waterAmount: 1,
        growthValue: 70,
    region: '',
        timestamp: Date.now() - 1800000,
        date: now.toISOString().split('T')[0],
        time: '15:30',
        createdAt: new Date()
      },
      {
        _openid: openid,
        userId: openid,
        treeId: 'tree-002',
        treeName: '希望樱花',
        userName: '微信用户',
        userAvatar: '',
        message: '为美好的明天浇水！',
        waterAmount: 1,
        growthValue: 70,
        region: '名师林',
        timestamp: Date.now() - 3600000,
        date: now.toISOString().split('T')[0],
        time: '14:30',
        createdAt: new Date()
      }
    ]
    
    // 批量插入浇水记录
    for (const record of exampleRecords) {
      await db.collection('wateringRecords').add({
        data: record
      })
    }
    
    console.log('示例数据初始化完成')
    return {
      success: true,
      message: '示例数据初始化完成',
      data: {
        treesCount: exampleTrees.length,
        recordsCount: exampleRecords.length
      }
    }
  } catch (error) {
    console.error('初始化示例数据失败:', error)
    throw error
  }
}

// 批量更新树木
async function batchUpdateTrees(trees) {
  try {
    const results = []
    
    for (const tree of trees) {
      const result = await db.collection('trees').doc(tree.treeId).update({
        data: {
          ...tree,
          updatedAt: new Date()
        }
      })
      results.push(result)
    }
    
    return {
      success: true,
      data: { updatedCount: results.length }
    }
  } catch (error) {
    console.error('批量更新树木失败:', error)
    throw error
  }
}

// 批量写入/更新树木（根据 treeId 进行 upsert）
async function bulkUpsertTrees(trees) {
  try {
    if (!Array.isArray(trees)) {
      throw new Error('参数错误：trees 必须是数组')
    }

    const normalize = (raw) => {
      const treeId = String(raw.treeId || raw.id)
      if (!treeId) return null
      const _id = `tree-${treeId}`
      const now = new Date()
      
      // 统一字段类型和默认值
      return {
        _id,
        data: {
          treeId,
          name: raw.name || `树木 ${treeId}`,
          region: raw.region || (raw.areaId === 'famous-teacher-forest' ? '名师林' : '校友林'),
          areaId: raw.areaId || (raw.region === '名师林' ? 'famous-teacher-forest' : 'alumni-forest'),
          originalX: Number(raw.originalX ?? raw.x ?? raw.mapX) || 0,
          originalY: Number(raw.originalY ?? raw.y ?? raw.mapY) || 0,
          emoji: raw.emoji || '🌳',
          species: raw.species || '银杏',
          stage: Number(raw.stage) || 1,
          points: Number(raw.points) || 0,
          maxPoints: Number(raw.maxPoints) || 7000,
          totalWateringCount: Number(raw.totalWateringCount) || 0,
          totalWateringAmount: Number(raw.totalWateringAmount) || 0,
          totalGrowthValue: Number(raw.totalGrowthValue) || 0,
          waterLevel: Number(raw.waterLevel) || 0,
          lastWatered: raw.lastWatered ? new Date(raw.lastWatered) : null,
          createdAt: raw.createdAt ? new Date(raw.createdAt) : now,
          updatedAt: now
        }
      }
    }

    const items = trees.map(normalize).filter(Boolean)
    const results = []

    // 并发限制（20）
    const concurrency = 20
    for (let i = 0; i < items.length; i += concurrency) {
      const slice = items.slice(i, i + concurrency)
      const ops = slice.map(({ _id, data }) => (async () => {
        try {
          await db.collection('trees').doc(_id).set({ data })
          return { id: data.treeId, op: 'create' }
        } catch (e) {
          await db.collection('trees').doc(_id).update({ data })
          return { id: data.treeId, op: 'update' }
        }
      })())
      const batchRes = await Promise.all(ops)
      results.push(...batchRes)
    }

    return { success: true, data: { count: results.length, results } }
  } catch (error) {
    console.error('bulkUpsertTrees 失败:', error)
    return { success: false, error: error.message }
  }
}