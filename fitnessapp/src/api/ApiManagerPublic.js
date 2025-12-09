// Cấu hình API URL - Thay đổi IP này theo IP hiện tại của máy chạy backend
// Để tìm IP: chạy lệnh: ifconfig | grep "inet " | grep -v 127.0.0.1
// Hoặc trên Windows: ipconfig

// Các IP đã dùng trước đây (comment để dễ chuyển đổi):
//const API_URL = 'http://10.0.2.2:4000/api'; // Android Emulator
//const API_URL = 'http://192.168.88.89:4000/api';
//const API_URL = 'http://192.168.8.183:4000/api';
//const API_URL = 'http://192.168.110.182:4000/api';
// const API_URL = 'http://192.168.111.108:4000/api';
//const API_URL = 'http://172.23.64.104:4000/api';
//const API_URL = 'http://192.168.110.83:4000/api';

// IP hiện tại (cập nhật ngày: 2025-01-XX)
const API_URL = 'http://172.20.10.7:4000/api';

module.exports = API_URL;