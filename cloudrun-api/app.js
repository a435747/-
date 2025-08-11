const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 80;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'tree-care-api',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '名师林数字化小程序API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      trees: '/api/trees',
      treePoints: '/api/tree-points',
      care: '/api/care',
      comments: '/api/comments'
    }
  });
});

// 树木相关API
app.get('/api/trees', async (req, res) => {
  try {
    // 这里集成您现有的getTreePoints云函数逻辑
    res.json({
      code: 0,
      data: [
        {
          id: "1",
          name: "银杏树",
          type: "乔木",
          location: "名师林",
          x: 150,
          y: 150
        }
      ],
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木列表失败：' + error.message
    });
  }
});

// 获取树木坐标点
app.get('/api/tree-points', async (req, res) => {
  try {
    const { region } = req.query;
    
    // 这里可以集成您现有的getTreePoints云函数逻辑
    res.json({
      code: 0,
      data: [
        {
          id: "1",
          name: "银杏树",
          x: 150,
          y: 150,
          region: region || "名师林"
        }
      ],
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木坐标点失败：' + error.message
    });
  }
});

// 获取树木详情
app.get('/api/trees/:treeId', async (req, res) => {
  try {
    const { treeId } = req.params;
    
    // 这里集成您现有的getTreeDetail云函数逻辑
    res.json({
      code: 0,
      data: {
        treeInfo: {
          id: treeId,
          name: "银杏树",
          type: "乔木",
          scientificName: "Ginkgo biloba",
          description: "这是一棵银杏树"
        },
        careHistory: [],
        comments: [],
        isCollected: false,
        canWater: true,
        canFertilize: true
      },
      message: '获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '获取树木详情失败：' + error.message
    });
  }
});

// 护理记录API
app.post('/api/care', async (req, res) => {
  try {
    const { treeId, careType, expValue } = req.body;
    
    // 这里集成您现有的updateTreeCare云函数逻辑
    res.json({
      code: 0,
      data: {
        careRecord: {
          treeId,
          type: careType,
          exp: expValue || 0,
          createdAt: new Date()
        }
      },
      message: '护理成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '护理记录失败：' + error.message
    });
  }
});

// 添加评论API
app.post('/api/comments', async (req, res) => {
  try {
    const { treeId, content } = req.body;
    
    // 这里集成您现有的addComment云函数逻辑
    res.json({
      code: 0,
      data: {
        comment: {
          treeId,
          content,
          userId: 'mock-user-id',
          userName: '游客',
          createdAt: new Date()
        }
      },
      message: '评论成功'
    });
  } catch (error) {
    res.status(500).json({
      code: -1,
      message: '添加评论失败：' + error.message
    });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: -1,
    message: '服务器内部错误'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: -1,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`🌲 名师林API服务启动成功`);
  console.log(`🚀 服务运行在端口: ${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
});

module.exports = app;