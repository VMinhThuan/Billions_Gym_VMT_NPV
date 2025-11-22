# Nutrition API Debug Guide

## Lỗi ERR_CONNECTION_REFUSED

Lỗi này xảy ra khi frontend không thể kết nối đến backend server.

### Các bước kiểm tra:

1. **Kiểm tra Backend Server có đang chạy không:**
   ```bash
   cd Billions_Gym_VMT_NPV/backend
   npm start
   # hoặc
   node server.js
   ```
   
   Bạn sẽ thấy log: `Server is running on port 4000`

2. **Kiểm tra Port:**
   - Backend mặc định chạy ở port 4000
   - Kiểm tra file `.env` có `PORT=4000` không
   - Nếu port khác, cập nhật `VITE_API_URL` trong frontend

3. **Kiểm tra CORS:**
   - Backend đã được cấu hình để cho phép:
     - `http://localhost:3000`
     - `http://localhost:5173` (Vite default)
     - `http://localhost:5174`
     - Các origin trong `.env` (FRONTEND_URL, FRONTEND_URL_CLIENT)

4. **Test API endpoint:**
   ```bash
   # Test health check (không cần auth)
   curl http://localhost:4000/health
   
   # Test nutrition endpoint (cần auth token)
   curl -X POST http://localhost:4000/api/nutrition/plan \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "goal": "Giảm cân",
       "calories": 1800,
       "period": "daily",
       "preferences": ""
     }'
   ```

5. **Kiểm tra Authentication:**
   - Đảm bảo bạn đã đăng nhập và có token trong localStorage
   - Token phải được gửi trong header: `Authorization: Bearer <token>`

6. **Kiểm tra Network:**
   - Mở DevTools > Network tab
   - Xem request có được gửi đi không
   - Xem response status code là gì

### Common Issues:

1. **Backend chưa start:**
   - Solution: Chạy `npm start` trong thư mục backend

2. **Port conflict:**
   - Solution: Đổi port trong `.env` hoặc kill process đang dùng port 4000

3. **CORS error:**
   - Solution: Đã được fix trong server.js, restart backend

4. **Authentication error:**
   - Solution: Đăng nhập lại để lấy token mới

### Logs để debug:

Backend sẽ log:
- `Server is running on port 4000`
- `Đã kết nối MongoDB thành công`
- Request logs khi có API call

Frontend sẽ log:
- `Generating plan with: {...}` khi bắt đầu
- `Plan generation result: {...}` khi có response
- Error details trong console

