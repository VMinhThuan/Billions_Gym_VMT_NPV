const os = require('os');

function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const nets = interfaces[name] || [];
        for (const net of nets) {
            const isV4 = net.family === 'IPv4' || net.family === 4;
            if (isV4 && !net.internal) {
                return net.address;
            }
        }
    }
    // Fallback nếu không tìm thấy địa chỉ IP LAN
    return '127.0.0.1';
}

module.exports = getLocalIPAddress;


