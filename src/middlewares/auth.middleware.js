const jwt = require('jsonwebtoken');
module.exports = function (req, res, next) {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};