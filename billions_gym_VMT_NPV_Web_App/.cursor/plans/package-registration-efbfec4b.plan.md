<!-- efbfec4b-06b0-4c95-8db9-c682b7c1c14b f78d577a-092d-42fa-9967-04e268d3188a -->
# Kế hoạch: Workflow Hoàn Tất Đăng Ký Gói Tập

## Tổng quan

Sau khi thanh toán hoặc nâng cấp gói tập thành công, hệ thống sẽ tạo thông báo yêu cầu người dùng hoàn thành các bước workflow. Cả người thanh toán và người được mời đều nhận thông báo và thực hiện workflow riêng của mình.

## Các bước thực hiện

### 1. Backend - Tạo API và Logic Workflow

#### 1.1. Cập nhật Notification Controller

File: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/backend/src/controllers/notification.controller.js`

- Tạo function `createWorkflowNotification` để tạo thông báo workflow cho cả người thanh toán và người được mời
- Thông báo sẽ có type: `WORKFLOW_PENDING` với nội dung "Vui lòng hoàn thành các bước sau để hoàn tất việc đăng ký gói tập"
- Thông báo sẽ chứa `metadata`: `{ registrationId, workflowType: 'PACKAGE_SETUP' }`

#### 1.2. Tích hợp vào Payment Callback

File: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/backend/src/controllers/payment.controller.js`

- Sau khi thanh toán thành công (trong callback MoMo/ZaloPay), gọi `createWorkflowNotification`
- Gửi thông báo cho người thanh toán (chủ gói)
- Nếu có người được mời (partnerInfo), gửi thông báo riêng cho họ

#### 1.3. Tạo API Workflow Endpoints

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/backend/src/controllers/packageSetup.controller.js`

Các endpoint cần tạo:

- `GET /api/package-setup/:registrationId/status` - Lấy trạng thái workflow hiện tại
- `PUT /api/package-setup/:registrationId/branch` - Cập nhật chi nhánh (chỉ chủ gói)
- `PUT /api/package-setup/:registrationId/complete-step` - Đánh dấu hoàn thành một bước
- `GET /api/package-setup/:registrationId/user-steps/:userId` - Lấy các bước cần làm của user cụ thể

#### 1.4. Cập nhật Model ChiTietGoiTap

File: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/backend/src/models/ChiTietGoiTap.js`

Thêm fields:

```javascript
workflowStatus: {
  ownerCompleted: { type: Boolean, default: false },
  partnerCompleted: { type: Boolean, default: false },
  ownerSteps: {
    branchSelected: { type: Boolean, default: false },
    trainerSelected: { type: Boolean, default: false },
    scheduleConfirmed: { type: Boolean, default: false }
  },
  partnerSteps: {
    trainerSelected: { type: Boolean, default: false },
    scheduleConfirmed: { type: Boolean, default: false }
  }
}
```

### 2. Frontend - Tích hợp Thông Báo Workflow

#### 2.1. Cập nhật NotificationIcon Component

File: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/components/NotificationIcon.jsx`

- Thêm logic xử lý khi click vào thông báo có type `WORKFLOW_PENDING`
- Khi click, navigate đến trang workflow: `/package-setup/:registrationId`
- Đánh dấu thông báo đã đọc nhưng không xóa cho đến khi workflow hoàn thành

#### 2.2. Tạo Package Setup Workflow Page

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/pages/PackageSetup.jsx`

**Cấu trúc trang:**

**Step 1: Xác nhận Chi Nhánh** (Chỉ hiển thị cho người thanh toán)

- Hiển thị danh sách chi nhánh từ API `/api/chinhanh`
- Cho phép chọn 1 chi nhánh
- Hiển thị thông tin: tên, địa chỉ, số điện thoại, dịch vụ
- Có thể xem trên bản đồ (nếu có tọa độ)
- Button "Xác nhận chi nhánh" để lưu và chuyển sang bước 2

**Step 2: Chọn Personal Trainer** (Cả 2 người)

- Gọi API `/api/package-workflow/:chiTietGoiTapId/trainers` để lấy danh sách PT phù hợp
- Hiển thị thông tin PT: ảnh, tên, kinh nghiệm, chuyên môn, đánh giá
- Cho phép chọn giờ tập ưu tiên và số ngày tập/tuần
- Button "Chọn PT" để lưu và chuyển sang bước 3

**Step 3: Xác Nhận Lịch Tập** (Cả 2 người)

- Gọi API `/api/package-workflow/:chiTietGoiTapId/schedule` để tạo lịch tập
- Chọn các ngày trong tuần muốn tập
- Chọn khung giờ cho mỗi ngày
- Xem preview lịch tập được tạo
- Button "Xác nhận lịch tập" để hoàn tất

**Step 4: Hoàn Thành** (Cả 2 người)

- Hiển thị thông báo hoàn thành
- Tóm tắt thông tin: chi nhánh, PT, lịch tập
- Button "Bắt đầu tập luyện" để về trang chủ

**UI/UX:**

- Sử dụng stepper component để hiển thị tiến trình
- Mỗi step có indicator (completed/current/pending)
- Disable các step chưa đến lượt
- Có thể quay lại step trước để chỉnh sửa
- Loading states cho mỗi API call
- Error handling và validation

#### 2.3. Tạo CSS cho Package Setup

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/pages/PackageSetup.css`

Styling cho:

- Stepper component
- Branch selection cards
- PT selection cards
- Schedule picker
- Completion screen

#### 2.4. Cập nhật App Router

File: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/App.jsx`

Thêm route:

```javascript
<Route path="/package-setup/:registrationId" element={<PackageSetup />} />
```

#### 2.5. Tạo Components Phụ Trợ

**BranchCard Component**

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/components/BranchCard.jsx`

- Hiển thị thông tin chi nhánh dạng card
- Có thể chọn/bỏ chọn
- Hiển thị icon dịch vụ

**TrainerCard Component**

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/components/TrainerCard.jsx`

- Hiển thị thông tin PT dạng card
- Rating stars
- Badge cho chuyên môn

**SchedulePicker Component**

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/components/SchedulePicker.jsx`

- Calendar-like interface
- Chọn ngày và giờ
- Validation số ngày tập theo gói

**WorkflowStepper Component**

File mới: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/components/WorkflowStepper.jsx`

- Hiển thị các bước workflow
- Progress indicator
- Responsive design

### 3. Tích hợp và Testing

#### 3.1. Cập nhật API Service

File: `/Users/vuthuan/billions_gym_VMT_NPV_Web_App/Billions_Gym_VMT_NPV/billions-gym/src/services/api.js`

Thêm các API calls:

- `getWorkflowStatus(registrationId)`
- `updateBranch(registrationId, branchId)`
- `getBranches()`
- `completeWorkflowStep(registrationId, stepName)`

#### 3.2. Xử lý Edge Cases

- Người dùng đóng trang giữa chừng → Lưu progress, có thể tiếp tục sau
- Người được mời chưa có tài khoản → Gửi email/SMS mời đăng ký
- Timeout session → Refresh token hoặc yêu cầu đăng nhập lại
- API errors → Hiển thị thông báo lỗi rõ ràng, cho phép retry

#### 3.3. Notification Cleanup

- Sau khi hoàn thành workflow, xóa thông báo workflow
- Tạo thông báo mới: "Bạn đã hoàn tất đăng ký gói tập! Hãy bắt đầu hành trình fitness của bạn"

## Luồng hoạt động tổng thể

1. User thanh toán gói tập thành công
2. Backend tạo thông báo workflow cho cả 2 người (nếu có partner)
3. User thấy thông báo trong NotificationIcon (icon chuông)
4. User click vào thông báo → Navigate đến `/package-setup/:registrationId`
5. **Người thanh toán:**

   - Step 1: Chọn chi nhánh cho cả 2 người
   - Step 2: Chọn PT cho mình
   - Step 3: Chọn lịch tập cho mình
   - Step 4: Hoàn thành

6. **Người được mời:**

   - Step 1: Xem chi nhánh đã được chọn (không chỉnh sửa được)
   - Step 2: Chọn PT cho mình
   - Step 3: Chọn lịch tập cho mình
   - Step 4: Hoàn thành

7. Sau khi cả 2 hoàn thành, thông báo workflow biến mất
8. Tạo thông báo hoàn thành mới

## Điểm cần lưu ý

- Chi nhánh được chọn bởi người thanh toán áp dụng cho cả 2 người
- Mỗi người tự chọn PT và lịch tập riêng của mình
- Workflow có thể tạm dừng và tiếp tục sau
- Validation đầy đủ ở cả frontend và backend
- Responsive design cho mobile
- Loading states và error handling tốt
- Accessibility (ARIA labels, keyboard navigation)

### To-dos

- [ ] Tạo function createWorkflowNotification trong notification.controller.js để gửi thông báo workflow cho người thanh toán và người được mời
- [ ] Tích hợp createWorkflowNotification vào payment callback (MoMo/ZaloPay) trong payment.controller.js
- [ ] Tạo packageSetup.controller.js với các API endpoints: get status, update branch, complete step, get user steps
- [ ] Cập nhật ChiTietGoiTap model thêm workflowStatus fields để track progress của từng người
- [ ] Tạo routes cho package setup workflow và đăng ký vào server.js
- [ ] Cập nhật NotificationIcon.jsx để xử lý click vào thông báo workflow và navigate đến trang setup
- [ ] Tạo các components: BranchCard, TrainerCard, SchedulePicker, WorkflowStepper
- [ ] Tạo PackageSetup.jsx với 4 steps: chọn chi nhánh, chọn PT, chọn lịch tập, hoàn thành
- [ ] Tạo PackageSetup.css với styling cho stepper, cards, picker và completion screen
- [ ] Thêm API calls vào api.js: getWorkflowStatus, updateBranch, getBranches, completeWorkflowStep
- [ ] Thêm route /package-setup/:registrationId vào App.jsx
- [ ] Test toàn bộ luồng: thanh toán → nhận thông báo → hoàn thành workflow cho cả người thanh toán và người được mời