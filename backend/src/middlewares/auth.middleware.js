const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') {
        return next();
    }

    let token = req.headers.authorization;
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Validate decoded token structure
        if (!decoded || !decoded.id) {
            console.error('Invalid token structure:', decoded);
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
            console.error('Invalid ObjectId in token:', decoded.id, 'Type:', typeof decoded.id);
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        // Additional validation for string length (ObjectId should be 24 characters)
        if (typeof decoded.id !== 'string' || decoded.id.length !== 24) {
            console.error('Invalid ObjectId string length:', decoded.id.length);
            return res.status(401).json({ message: 'Token không hợp lệ' });
        }

        req.user = decoded;
        console.log('Auth middleware - req.user set:', {
            id: req.user.id,
            vaiTro: req.user.vaiTro,
            sdt: req.user.sdt
        });
        console.log('Auth middleware - token payload:', JSON.stringify(decoded, null, 2));
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};