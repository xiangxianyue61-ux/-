const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 所有用户路由依赖的数据库连接状态由 app.js 注入
let isDbConnected = false;

function setDbConnected(getStateFn) {
  isDbConnected = getStateFn ? getStateFn() : false;
}

// 创建用户
router.post('/', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }

  try {
    const {
      avatar,
      username,
      password,
      realName,
      contact,
      idNumber,
      address,
      department,
      position,
      role
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '账号(username) 和 密码(password) 为必填项'
      });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: '账号已存在'
      });
    }

    const user = new User({
      avatar,
      username,
      password,
      realName,
      contact,
      idNumber,
      address,
      department,
      position,
      role
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '用户创建失败',
      error: error.message
    });
  }
});

// 用户登录（根据账号、密码和部门）
router.post('/login', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请稍后再试'
    });
  }

  try {
    const { username, password, department } = req.body;

    if (!username || !password || !department) {
      return res.status(400).json({
        success: false,
        message: '请填写账号、密码和部门'
      });
    }

    const user = await User.findOne({ username, password, department });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '账号、密码或部门不正确'
      });
    }

    res.json({
      success: true,
      message: '登录成功',
      data: {
        id: user._id,
        avatar: user.avatar,
        username: user.username,
        realName: user.realName,
        contact: user.contact,
        idNumber: user.idNumber,
        address: user.address,
        department: user.department,
        position: user.position,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取用户列表
router.get('/', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }

  try {
    const users = await User.find();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 获取单个用户详情
router.get('/:id', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }

  try {
    const updateData = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户更新成功',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '用户更新失败',
      error: error.message
    });
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: '数据库未连接，请检查 MONGODB_URI 配置'
    });
  }

  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '用户删除失败',
      error: error.message
    });
  }
});

module.exports = {
  router,
  setDbConnected
};

