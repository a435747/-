# 微信小程序云函数说明

本项目使用微信小程序云开发功能，包括云函数、云数据库和云存储。

## 云函数列表

### 1. getTreePoints

获取树木坐标点数据。

**参数：**
- region: 可选，区域名称，如果提供则只返回该区域的树木点位

**返回：**
- code: 状态码，0表示成功
- data: 树木坐标点数组
- message: 状态消息

### 2. getTreeDetail

获取树木详细信息，包括基本信息、护理记录、评论等。

**参数：**
- treeId: 必须，树木ID

**返回：**
- code: 状态码，0表示成功
- data: 
  - treeInfo: 树木基本信息
  - careHistory: 护理记录
  - comments: 评论
  - isCollected: 是否已收藏
  - canWater: 今天是否可以浇水
  - canFertilize: 本周是否可以施肥
  - watered: 今天是否已浇水
- message: 状态消息

### 3. updateTreeCare

更新树木护理记录。

**参数：**
- treeId: 必须，树木ID
- careType: 必须，护理类型（浇水/施肥/拍照记录）
- expValue: 可选，经验值
- photoUrl: 可选，照片URL（拍照记录时使用）

**返回：**
- code: 状态码，0表示成功
- data:
  - careRecord: 新增的护理记录
  - history: 最新的护理历史
- message: 状态消息

### 4. addComment

添加树木评论。

**参数：**
- treeId: 必须，树木ID
- content: 必须，评论内容

**返回：**
- code: 状态码，0表示成功
- data:
  - comment: 新增的评论
  - comments: 最新的评论列表
- message: 状态消息

## 如何使用

### 开发环境配置

1. 在微信开发者工具中，使用云开发功能
2. 在app.js中配置环境ID

### 部署云函数

1. 在微信开发者工具中，打开云开发控制台
2. 在云函数页面，上传部署每个云函数
3. 可以使用"上传并部署：所有文件"功能

### 初始化数据

1. 使用数据库导入工具，导入cloudbase目录下的初始数据
2. 确保集合权限设置正确（可在云开发控制台进行设置）

## 注意事项

1. 首次使用前需初始化云环境
2. 确保app.js中的环境ID正确
3. 图片上传时应设置合理的访问权限 