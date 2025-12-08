# Hướng Dẫn Sử Dụng Sơ Đồ Mermaid

## Tổng Quan

Thư mục này chứa các sơ đồ kiến trúc hệ thống được viết bằng Mermaid, có thể sử dụng cho:
- Tài liệu kỹ thuật
- Bản trình bày (PowerPoint, Google Slides)
- Tài liệu dự án
- Wiki nội bộ

## Các File Sơ Đồ

### 1. `use-case-diagram.mmd`
**Mô tả:** Sơ đồ use case tổng quát của hệ thống
**Nội dung:**
- Các actors: Hội Viên, PT, Chủ Phòng Gym, Hệ Thống
- Các use case chính cho từng actor
- Mối quan hệ giữa actors và use cases

**Cách sử dụng:**
- Copy nội dung vào [Mermaid Live Editor](https://mermaid.live/)
- Hoặc sử dụng extension Mermaid trong VS Code
- Export sang PNG/SVG để chèn vào PPT

### 2. `class-diagram.mmd`
**Mô tả:** Sơ đồ class diagram của hệ thống
**Nội dung:**
- Các class chính: NguoiDung, HoiVien, PT, OngChu
- Các class quản lý: GoiTap, ChiTietGoiTap, Session, BuoiTap
- Các class hỗ trợ: ThanhToan, NutritionPlan, ChatRoom
- Mối quan hệ kế thừa, association, aggregation

**Cách sử dụng:**
- Hiển thị cấu trúc OOP của hệ thống
- Dùng để giải thích kiến trúc cho developers
- Có thể tách thành nhiều diagram nhỏ hơn nếu cần

### 3. `erd-diagram.mmd`
**Mô tả:** Entity Relationship Diagram (ERD) của database
**Nội dung:**
- Tất cả các entities trong MongoDB
- Primary keys (PK) và Foreign keys (FK)
- Mối quan hệ 1-1, 1-nhiều, nhiều-nhiều
- Các trường dữ liệu quan trọng

**Cách sử dụng:**
- Hiển thị cấu trúc database
- Dùng để thiết kế database schema
- Hữu ích cho database administrators

### 4. `system-architecture.mmd`
**Mô tả:** Sơ đồ kiến trúc hệ thống tổng quan
**Nội dung:**
- Client Layer (Web App, Mobile App, Admin Panel)
- API Gateway Layer (Express.js Server)
- Business Logic Layer (Controllers, Services)
- Data Layer (MongoDB)
- External Services (Payment, AI, SMS, File Storage)

**Cách sử dụng:**
- Tổng quan kiến trúc cho stakeholders
- Giải thích luồng dữ liệu
- Planning và architecture review

### 5. `sequence-diagrams.mmd`
**Mô tả:** Các sequence diagram cho các luồng xử lý chính
**Nội dung:**
- Luồng đăng ký gói tập và thanh toán
- Luồng tạo và tham gia buổi tập
- Luồng chat real-time
- Luồng tạo kế hoạch dinh dưỡng AI

**Cách sử dụng:**
- Hiểu rõ luồng xử lý của từng chức năng
- Debug và troubleshooting
- Onboarding cho developers mới

## Cách Sử Dụng Trong PowerPoint

### Phương Pháp 1: Sử dụng Mermaid Live Editor
1. Mở [Mermaid Live Editor](https://mermaid.live/)
2. Copy nội dung từ file `.mmd`
3. Paste vào editor
4. Click "Actions" → "Download PNG" hoặc "Download SVG"
5. Chèn vào PowerPoint

### Phương Pháp 2: Sử dụng VS Code Extension
1. Cài đặt extension "Markdown Preview Mermaid Support"
2. Mở file `.mmd` trong VS Code
3. Preview diagram
4. Export sang image

### Phương Pháp 3: Sử dụng Mermaid CLI
```bash
# Cài đặt Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Convert sang PNG
mmdc -i use-case-diagram.mmd -o use-case-diagram.png

# Convert sang SVG
mmdc -i use-case-diagram.mmd -o use-case-diagram.svg
```

### Phương Pháp 4: Sử dụng Online Tools
- [Mermaid Live Editor](https://mermaid.live/)
- [Draw.io](https://app.diagrams.net/) (có hỗ trợ import Mermaid)
- [Excalidraw](https://excalidraw.com/)

## Tips cho PPT

1. **Chia nhỏ diagram:** Nếu diagram quá lớn, chia thành nhiều slide
2. **Sử dụng animation:** Hiển thị từng phần của diagram
3. **Thêm notes:** Giải thích từng phần trong speaker notes
4. **Consistent styling:** Sử dụng cùng màu sắc và font chữ
5. **Export chất lượng cao:** Sử dụng SVG hoặc PNG 300 DPI

## Cập Nhật Sơ Đồ

Khi cập nhật code, nhớ cập nhật các sơ đồ tương ứng:
- Thêm model mới → Cập nhật ERD và Class Diagram
- Thêm API mới → Cập nhật Use Case Diagram
- Thay đổi kiến trúc → Cập nhật System Architecture Diagram
- Thay đổi luồng xử lý → Cập nhật Sequence Diagrams

## Tài Liệu Tham Khảo

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Syntax Guide](https://mermaid.js.org/intro/syntax-reference.html)
- [Mermaid Live Editor](https://mermaid.live/)

