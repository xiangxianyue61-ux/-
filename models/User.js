const mongoose = require('mongoose');

// 用户表（users）模型定义
// 字段：头像、账号、密码、真实姓名、联系方式、身份证号、联系地址、所属部门、所属岗位、所属角色
const UserSchema = new mongoose.Schema({
  avatar: { type: String, default: '' }, // 头像 URL
  username: { type: String, required: true, unique: true, trim: true }, // 账号
  password: { type: String, required: true }, // 密码（示例项目未加密，生产请务必加密）
  realName: { type: String, default: '' }, // 真实姓名
  contact: { type: String, default: '' }, // 联系方式（手机号 / 邮箱等）
  idNumber: { type: String, default: '' }, // 身份证号
  address: { type: String, default: '' }, // 联系地址
  department: { type: String, default: '' }, // 所属部门
  position: { type: String, default: '' }, // 所属岗位
  // 所属角色，关联角色表（roles）
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
}, {
  timestamps: true // 自动维护 createdAt / updatedAt
});

module.exports = mongoose.model('User', UserSchema, 'users');

