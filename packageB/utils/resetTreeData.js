// 重置树木数据工具
// 用于将所有树木的成长值重置为0，并清除浇水记录

const CloudDatabase = require('./cloudDatabase.js');

async function resetAllTreesData() {
  console.log('=== 开始重置所有树木数据 ===');
  
  try {
    // 获取所有树木
    const treesResult = await CloudDatabase.getAllTrees();
    
    if (!treesResult.success) {
      console.error('获取树木数据失败:', treesResult.error);
      return;
    }
    
    const trees = treesResult.data.trees || [];
    console.log(`找到 ${trees.length} 棵树需要重置`);
    
    // 批量重置树木数据
    let successCount = 0;
    let errorCount = 0;
    
    for (const tree of trees) {
      try {
        // 重置树木数据，保持基本信息不变
        const resetResult = await CloudDatabase.createOrUpdateTree({
          treeId: tree.treeId,
          name: tree.name || '',
          species: tree.species || '银杏树',
          region: tree.region || '',
          stage: 1, // 重置为第1阶段
          points: 0, // 重置当前成长值为0
          maxPoints: 100, // 第1阶段的最大值
          totalWateringCount: 0, // 重置总浇水次数为0
          totalWateringAmount: 0, // 重置总浇水量为0
          totalGrowthValue: 0, // 重置总成长值为0
          waterLevel: 0, // 重置水分等级为0
          emoji: tree.emoji || '🌳',
          stageName: '破土萌芽', // 第1阶段名称
          guardDate: tree.guardDate || new Date().toISOString().split('T')[0],
          lastWatered: null // 清除最后浇水时间
        });
        
        if (resetResult.success) {
          successCount++;
          console.log(`重置树木 ${tree.treeId} 成功`);
        } else {
          errorCount++;
          console.error(`重置树木 ${tree.treeId} 失败:`, resetResult.error);
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
        console.error(`重置树木 ${tree.treeId} 异常:`, error);
      }
    }
    
    // 清除所有浇水记录（可选）
    console.log('=== 清除浇水记录 ===');
    try {
      const db = wx.cloud.database();
      const clearResult = await db.collection('wateringRecords').remove();
      console.log(`清除浇水记录成功，删除 ${clearResult.stats.removed} 条记录`);
    } catch (error) {
      console.warn('清除浇水记录失败（可能没有权限）:', error);
    }
    
    console.log(`=== 重置完成 ===`);
    console.log(`成功重置: ${successCount} 棵树`);
    console.log(`失败: ${errorCount} 棵`);
    console.log(`所有成长值、浇水次数、浇水量、成长值都已重置为0`);
    
    return {
      success: true,
      total: trees.length,
      successCount,
      errorCount
    };
    
  } catch (error) {
    console.error('重置树木数据失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 导出函数
module.exports = {
  resetAllTreesData
};

// 如果直接运行此脚本
if (typeof wx !== 'undefined') {
  // 在小程序环境中
  wx.resetAllTreesData = resetAllTreesData;
} else {
  // 在Node.js环境中
  console.log('重置工具已加载，可在小程序中调用 wx.resetAllTreesData()');
} 