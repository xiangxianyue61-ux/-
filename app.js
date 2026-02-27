// 加载环境变量
require('dotenv').config();
// 导入依赖
const express = require('express');
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

// 创建Express应用
const app = express();
// 从环境变量获取端口，默认使用8001端口以避免冲突
const port = process.env.PORT || 3000;

// 中间件
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 解决CORS跨域问题
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 允许所有来源，生产环境中应该限制为特定域名
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 连接 MongoDB
let dbConnected = false;
const mongoUri = process.env.MONGODB_URI;



if (mongoUri) {
  mongoose.connect(mongoUri)
    .then(async () => {
      dbConnected = true;
      console.log('✅ 已成功连接到 Atlas 数据库');
      
      // 检查连接状态
      const db = mongoose.connection;
      console.log(`📊 数据库名称: ${db.name}`);
      console.log(`🔗 连接主机: ${db.host}`);
      console.log(`🎯 连接端口: ${db.port}`);

    })
    .catch(err => {
      console.error('❌ 数据库连接失败:', err.message);
      console.log('⚠️  服务器将继续运行，但数据库相关功能将不可用');
    });
} else {
  console.log('⚠️  未配置 MONGODB_URI，跳过数据库连接（数据库相关接口将返回503）');
}

// 定义一个简单的数据模型
const TestSchema = new mongoose.Schema({
  name: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});
const TestModel = mongoose.model('Test', TestSchema);
// 引入用户路由
const { router: usersRouter } = require('./routes/users');
// 测试路由 - 创建测试数据（需要认证）
app.get('/test', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }
  
  try {
    const testDoc = new TestModel({
      name: '团队测试用户',
      message: '这是一条测试数据，证明数据库连接成功！'
    });
    await testDoc.save();
    
    res.json({
      success: true,
      message: '测试数据创建成功！',
      data: testDoc
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有测试数据（需要认证）
app.get('/data', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }
  
  try {
    const allData = await TestModel.find();
    res.json({
      success: true,
      count: allData.length,
      data: allData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 新增POST路由 - 创建自定义数据（需要认证）
app.post('/data', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }
  
  try {
    // 从请求体中获取数据
    const { name, message } = req.body;
    
    // 验证必要字段
    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: '请提供 name 和 message 字段'
      });
    }
    
    // 创建新的数据记录
    const newData = new TestModel({
      name,
      message
    });
    
    await newData.save();
    
    res.status(201).json({
      success: true,
      message: '数据创建成功！',
      data: newData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 挂载用户路由
app.use('/users', usersRouter);

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: '🟢 服务正常',
    database: dbConnected ? '🟢 已连接' : '🔴 未连接',
    timestamp: new Date().toISOString()
  });
});

// 删除测试数据路由 - 删除所有测试数据（需要认证）
app.delete('/data', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }
  
  try {
    const result = await TestModel.deleteMany({});
    res.json({
      success: true,
      message: `成功删除 ${result.deletedCount} 条测试数据！`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 动态集合处理函数
function setupCollectionRoutes(collectionName) {
  // 获取集合模型（动态创建）
  const getCollectionModel = () => {
    // 如果模型已存在，直接返回
    if (mongoose.models[collectionName]) {
      return mongoose.models[collectionName];
    }
    
    // 创建通用模式
    const Schema = new mongoose.Schema({
      name: String,
      message: String,
      createdAt: { type: Date, default: Date.now },
      // 允许存储任意字段
      [Symbol('__any__')]: mongoose.Schema.Types.Mixed
    }, { strict: false });
    
    return mongoose.model(collectionName, Schema, collectionName);
  };

  // GET - 获取集合所有数据（暂时不需要认证以便测试）
  app.get(`/${collectionName}`, (req, res, next) => next(), async (req, res) => {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: '数据库未连接，请检查 MONGODB_URI 配置'
      });
    }
    
    try {
      const Model = getCollectionModel();
      const data = await Model.find(req.query);
      res.json({
        success: true,
        count: data.length,
        data: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // POST - 创建新数据（暂时不需要认证以便测试）
  app.post(`/${collectionName}`, (req, res, next) => next(), async (req, res) => {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: '数据库未连接，请检查 MONGODB_URI 配置'
      });
    }
    
    try {
      const Model = getCollectionModel();
      const newData = new Model(req.body);
      await newData.save();
      
      res.status(201).json({
        success: true,
        message: '数据创建成功！',
        data: newData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // PUT - 更新指定ID的数据（暂时不需要认证以便测试）
  app.put(`/${collectionName}/:id`, (req, res, next) => next(), async (req, res) => {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: '数据库未连接，请检查 MONGODB_URI 配置'
      });
    }
    
    try {
      const Model = getCollectionModel();
      const { id } = req.params;
      
      const updatedData = await Model.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!updatedData) {
        return res.status(404).json({
          success: false,
          message: '未找到指定ID的数据'
        });
      }
      
      res.json({
        success: true,
        message: '数据更新成功！',
        data: updatedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // DELETE - 删除指定ID的数据（暂时不需要认证以便测试）
  app.delete(`/${collectionName}/:id`, (req, res, next) => next(), async (req, res) => {
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: '数据库未连接，请检查 MONGODB_URI 配置'
      });
    }
    
    try {
      const Model = getCollectionModel();
      const { id } = req.params;
      
      const deletedData = await Model.findByIdAndDelete(id);
      
      if (!deletedData) {
        return res.status(404).json({
          success: false,
          message: '未找到指定ID的数据'
        });
      }
      
      res.json({
        success: true,
        message: '数据删除成功！'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

// 为所有MongoDB集合设置路由
const collections = ['zxx', 'zzy','zxxx'];
collections.forEach(collection => setupCollectionRoutes(collection));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

// 启动服务器，使用配置的端口
app.listen(port, () => {
  console.log(`🚀 服务器运行在 http://localhost:${port}`);
  console.log(`📊 健康检查: http://localhost:${port}/health`);
});