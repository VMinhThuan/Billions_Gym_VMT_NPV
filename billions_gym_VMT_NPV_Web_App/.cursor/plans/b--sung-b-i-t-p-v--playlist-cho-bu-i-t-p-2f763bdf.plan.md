<!-- 2f763bdf-3d10-425d-a4ac-8992df876525 23912054-b4a7-409c-bd9e-c0c6f4aff5c0 -->
# Thiết kế Bubble Chat AI với Gemini Integration

## Mục tiêu

Tạo hệ thống AI chat bubble xuất hiện trên mọi trang, giúp hội viên tra cứu mọi thông tin từ database thông qua Gemini AI, với quyền truy cập an toàn và gợi ý điều hướng.

## Kiến trúc

### Backend Components

- **AI Service**: Service tích hợp Gemini API với prompt engineering
- **AI Controller**: Xử lý requests và trả về responses với actions
- **AI Routes**: `/api/ai/chat`, `/api/ai/search`, `/api/ai/query`, `/api/ai/action/:name`
- **Query Builder**: Chuyển đổi natural language thành database queries an toàn

### Frontend Components

- **BubbleChat Component**: Component bubble chat với UI/UX hiện đại, LÚC NÀO MỞ ĐOẠN CHAT CŨNG PHẢI Ở TRONG MÀN HÌNH CHỨ KHÔNG OUT RA NGOÀI CẦM BUBBLE chat quăng qua lại nhẹ nhàng
- **BubbleChat CSS**: Styling với dark/light theme support, draggable
- **Main Integration**: Tích hợp vào main.tsx để hiển thị toàn cục
- **API Client**: Service gọi các AI endpoints

## Implementation Details

### Backend Files

- `backend/src/services/ai.service.js` - Gemini integration + query processing
- `backend/src/controllers/ai.controller.js` - Request handling + context injection
- `backend/src/routes/ai.route.js` - API endpoints
- `backend/server.js` - Đăng ký route `/api/ai`

### Frontend Files

- `billions_gym_VMT_NPV_UI/src/components/BubbleChat.tsx` - Main chat component
- `billions_gym_VMT_NPV_UI/src/components/BubbleChat.css` - Styling
- `billions_gym_VMT_NPV_UI/src/services/ai.ts` - API client
- `billions_gym_VMT_NPV_UI/src/main.tsx` - Global integration

### Key Features

- **Gemini Integration**: Sử dụng API key từ backend (không expose)
- **Context Aware**: Tự động inject user_id, roles, branch_id vào mọi request
- **Smart Querying**: Chuyển đổi câu hỏi tự nhiên thành database queries
- **Actions Support**: Response có thể chứa actions (links, buttons) để điều hướng
- **Markdown Rendering**: Hiển thị markdown với formatting
- **Quick Chips**: Gợi ý nhanh "Gói của tôi", "Lịch hôm nay", etc.
- **Draggable**: Bubble có thể kéo thả
- **Theme Support**: Dark/light mode theo theme của app
- **Keyboard Shortcut**: Ctrl+/ để mở/đóng (desktop)

## Security

- API key Gemini chỉ ở backend (env variable)
- Mọi request đều có auth middleware
- Quyền truy cập được kiểm tra dựa trên roles
- Không trả về dữ liệu nhạy cảm (thẻ, mật khẩu, token)

## Data Sources

Tích hợp với các models/services hiện có:

- GoiTap (gói tập)
- LichTap (lịch tập)
- BuoiTap (buổi tập)
- ChiTietGoiTap (đăng ký gói)
- ChiSoCoThe (chỉ số cơ thể)
- LichSuTap (lịch sử tập)
- ThanhToan (thanh toán)
- NguoiDung/HoiVien (user profile)

### To-dos

- [ ] Tạo model Exercise với các trường: title, type (enum), file_url, source_url, duration_sec, description, metadata, status
- [ ] Tạo model SessionPlaylistItem với session_id, exercise_id, position, is_preview và các unique constraints
- [ ] Tạo exercise.service.js với các hàm CRUD và checkExerciseInUse
- [ ] Tạo sessionPlaylist.service.js với addExerciseToSession, removeExerciseFromSession, reorderPlaylist, getSessionPlaylist
- [ ] Tạo exercise.controller.js xử lý HTTP requests cho Exercise CRUD
- [ ] Tạo sessionPlaylist.controller.js xử lý HTTP requests cho Playlist operations
- [ ] Tạo exercise.route.js và mount vào server.js tại /api/exercises
- [ ] Tạo sessionPlaylist.route.js và mount vào server.js tại /api/sessions/:sessionId/playlist