const mongoose = require('mongoose');

// 角色表（roles）模型定义
// 示例字段：角色名称、角色编码、备注描述
const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true }, // 角色名称，如“管理员”
  code: { type: String, required: true, unique: true, trim: true }, // 角色编码，如“ADMIN”
  description: { type: String, default: '' } // 角色说明
}, {
  timestamps: true // 自动维护 createdAt / updatedAt
});

const Role = mongoose.model('Role', RoleSchema, 'roles');

module.exports = Role;

