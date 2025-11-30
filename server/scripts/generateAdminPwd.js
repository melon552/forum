// scripts/generateAdminPwd.js
const bcrypt = require('bcrypt');

async function generate() {
  const plainPassword = '521'; // 你要设置的明文密码
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);
  console.log('加密后的密码：', hashedPassword);
}

generate();