-- 订单管理数据库结构设计


-- 1. 订单主表 (orders)
-- 存储订单基本信息
{
  "_id": "auto_generated",
  "orderId": "ORDER_20241201_123456789",     -- 订单编号（唯一）
  "userId": "user_openid",                   -- 用户OpenID
  "orderType": "donation",                   -- 订单类型：donation(捐赠), watering(浇水), package(套餐)
  "status": "pending",                       -- 订单状态：pending(待支付), paid(已支付), cancelled(已取消), refunded(已退款)
  "amount": 7000,                           -- 订单金额（分）
  "currency": "CNY",                        -- 货币类型
  "title": "名师林树木捐赠",                  -- 订单标题
  "description": "梧桐树认养 + 基础守护套餐",   -- 订单描述
  
  -- 订单详情
  "orderDetails": {
    "treeType": {
      "id": "tree_type_1",
      "name": "梧桐树",
      "price": 5000,                        -- 价格（分）
      "quantity": 1
    },
    "package": {
      "id": "package_basic",
      "name": "基础守护套餐", 
      "price": 2000,
      "quantity": 1,
      "duration": "1年"
    },
    "location": {
      "region": "名师林",
      "position": "A区-001"
    },
    "customization": {
      "donorName": "张同学",                  -- 捐赠者姓名
      "message": "希望这棵树茁壮成长",          -- 寄语
      "certificate": true                    -- 是否需要证书
    }
  },
  
  -- 联系信息
  "contactInfo": {
    "name": "张同学",
    "phone": "138****8888",
    "email": "zhang@example.com"
  },
  
  -- 时间信息
  "createdAt": "2024-12-01T10:30:00.000Z",  -- 创建时间
  "updatedAt": "2024-12-01T10:35:00.000Z",  -- 更新时间
  "expiredAt": "2024-12-01T12:30:00.000Z",  -- 过期时间（30分钟后）
  "paidAt": null,                            -- 支付时间
  
  -- 支付相关
  "paymentMethod": "wechat",                 -- 支付方式
  "paymentId": null,                         -- 支付流水号
  "transactionId": null,                     -- 微信交易号
  
  -- 配送/履约信息
  "fulfillment": {
    "treeId": null,                          -- 分配的树木ID
    "certificateUrl": null,                  -- 证书下载链接
    "qrCodeUrl": null,                       -- 树木二维码链接
    "status": "pending"                      -- 履约状态：pending(待履约), fulfilled(已履约)
  }
}

-- 2. 支付记录表 (payments)
-- 存储支付流水信息
{
  "_id": "auto_generated",
  "paymentId": "PAY_20241201_123456789",     -- 支付流水号
  "orderId": "ORDER_20241201_123456789",     -- 关联订单号
  "userId": "user_openid",                   -- 用户OpenID
  "paymentMethod": "wechat",                 -- 支付方式：wechat, alipay
  "amount": 7000,                           -- 支付金额（分）
  "currency": "CNY",                        -- 货币类型
  "status": "pending",                      -- 支付状态：pending(处理中), success(成功), failed(失败), cancelled(取消)
  
  -- 微信支付相关
  "wechatPayment": {
    "appId": "wxe48f433772f6ca68",
    "mchId": "1234567890",                   -- 商户号
    "nonceStr": "random_string",             -- 随机字符串
    "prepayId": "wx123456789",               -- 预支付ID
    "transactionId": null,                   -- 微信交易号（支付成功后填入）
    "tradeType": "JSAPI",                    -- 交易类型
    "signType": "MD5",                       -- 签名类型
    "paySign": "generated_sign"              -- 支付签名
  },
  
  -- 时间信息
  "createdAt": "2024-12-01T10:30:00.000Z",  -- 创建时间
  "paidAt": null,                            -- 支付完成时间
  "notifiedAt": null,                        -- 回调通知时间
  
  -- 回调信息
  "notifyData": null,                        -- 微信回调原始数据
  "verifyStatus": null                       -- 签名验证状态
}

-- 3. 订单状态变更记录表 (order_logs)
-- 记录订单状态变更历史
{
  "_id": "auto_generated",
  "orderId": "ORDER_20241201_123456789",     -- 订单号
  "fromStatus": "pending",                   -- 变更前状态
  "toStatus": "paid",                        -- 变更后状态
  "action": "payment_success",               -- 触发动作
  "operator": "system",                      -- 操作者：system(系统), admin(管理员), user(用户)
  "reason": "微信支付成功",                   -- 变更原因
  "metadata": {                              -- 附加数据
    "transactionId": "wx123456789",
    "paymentTime": "2024-12-01T10:35:00.000Z"
  },
  "createdAt": "2024-12-01T10:35:00.000Z"
}

-- 4. 退款记录表 (refunds)
-- 存储退款信息
{
  "_id": "auto_generated",
  "refundId": "REFUND_20241201_123456789",   -- 退款单号
  "orderId": "ORDER_20241201_123456789",     -- 原订单号
  "paymentId": "PAY_20241201_123456789",     -- 原支付流水
  "userId": "user_openid",                   -- 用户OpenID
  "refundAmount": 7000,                     -- 退款金额（分）
  "refundReason": "用户主动申请",             -- 退款原因
  "status": "pending",                      -- 退款状态：pending(处理中), success(成功), failed(失败)
  
  -- 微信退款相关
  "wechatRefund": {
    "refundId": "wx_refund_123456",          -- 微信退款单号
    "refundAccount": "REFUND_SOURCE_RECHARGE_FUNDS"
  },
  
  "createdAt": "2024-12-01T11:00:00.000Z",
  "processedAt": null                        -- 处理完成时间
}

-- 5. 商品/套餐配置表 (products)
-- 存储可购买的商品信息
{
  "_id": "auto_generated",
  "productId": "tree_type_1",                -- 商品ID
  "type": "tree",                           -- 商品类型：tree(树木), package(套餐), service(服务)
  "name": "梧桐树",                          -- 商品名称
  "description": "法桐，生长快速，绿荫浓密",    -- 商品描述
  "price": 5000,                           -- 价格（分）
  "originalPrice": 6000,                   -- 原价（分）
  "currency": "CNY",
  "status": "active",                      -- 状态：active(上架), inactive(下架)
  "stock": 100,                           -- 库存数量
  "attributes": {                          -- 商品属性
    "species": "法桐",
    "expectedHeight": "15-20米",
    "growthCycle": "10年",
    "maintenance": "每周浇水1次"
  },
  "images": [                             -- 商品图片
    "/images/tree_platanus.jpg"
  ],
  "createdAt": "2024-12-01T00:00:00.000Z",
  "updatedAt": "2024-12-01T00:00:00.000Z"
}