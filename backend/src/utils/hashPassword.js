const bcrypt = require('bcryptjs');

async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plainPassword, salt);
}

module.exports = { hashPassword };
