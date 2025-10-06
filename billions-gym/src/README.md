# Cấu trúc thư mục dự án React Vite + Tailwind CSS

## Tổng quan
Dự án được tổ chức theo cấu trúc thư mục chuẩn cho ứng dụng React hiện đại với Vite và Tailwind CSS.

## Cấu trúc thư mục

```
src/
├── components/           # Các component tái sử dụng
│   ├── ui/              # UI components cơ bản
│   │   ├── Button.jsx   # Component button
│   │   ├── Input.jsx    # Component input
│   │   └── Card.jsx     # Component card
│   ├── layout/          # Layout components
│   │   ├── Header.jsx   # Header component
│   │   ├── Footer.jsx   # Footer component
│   │   └── Layout.jsx   # Main layout wrapper
│   └── forms/           # Form components
│       └── LoginForm.jsx # Login form component
├── pages/               # Các trang của ứng dụng
│   └── Home.jsx         # Trang chủ
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.js # Hook quản lý localStorage
│   └── useApi.js        # Hook gọi API
├── utils/               # Các hàm tiện ích
│   ├── formatDate.js    # Hàm format ngày tháng
│   └── validation.js    # Hàm validation
├── services/            # API services
│   └── api.js           # API service chính
├── contexts/            # React Context
│   └── AuthContext.jsx  # Context quản lý authentication
├── types/               # TypeScript types (nếu sử dụng TS)
│   └── index.js         # Định nghĩa các types
├── constants/           # Các hằng số
│   ├── api.js           # API constants
│   └── theme.js         # Theme constants
├── assets/              # Tài nguyên tĩnh
│   ├── images/          # Hình ảnh
│   ├── icons/           # Icon files
│   └── fonts/           # Font files
├── styles/               # CSS files
│   └── globals.css     # Global styles
├── App.jsx             # Component chính
├── main.jsx            # Entry point
└── index.css           # Tailwind CSS imports
```

## Mô tả chi tiết

### 📁 components/
Chứa tất cả các React components được tái sử dụng:

- **ui/**: Các component UI cơ bản như Button, Input, Card
- **layout/**: Các component layout như Header, Footer, Layout
- **forms/**: Các component form như LoginForm, RegisterForm

### 📁 pages/
Chứa các trang chính của ứng dụng:
- Mỗi file đại diện cho một trang/route
- Sử dụng Layout component để bao bọc

### 📁 hooks/
Chứa các custom React hooks:
- **useLocalStorage**: Quản lý localStorage
- **useApi**: Hook gọi API với loading và error states

### 📁 utils/
Chứa các hàm tiện ích:
- **formatDate**: Format ngày tháng
- **validation**: Các hàm validation form

### 📁 services/
Chứa các service gọi API:
- **api.js**: Service chính để gọi API với authentication

### 📁 contexts/
Chứa React Context để quản lý state toàn cục:
- **AuthContext**: Quản lý authentication state

### 📁 types/
Chứa các định nghĩa types (nếu sử dụng TypeScript):
- Định nghĩa các constants và enums

### 📁 constants/
Chứa các hằng số của ứng dụng:
- **api.js**: API endpoints, error messages
- **theme.js**: Theme colors, typography, spacing

### 📁 assets/
Chứa tài nguyên tĩnh:
- **images/**: Hình ảnh
- **icons/**: Icon files
- **fonts/**: Font files

### 📁 styles/
Chứa các file CSS:
- **globals.css**: Global styles và CSS variables

## Quy tắc đặt tên

### Files và Folders
- Sử dụng PascalCase cho components: `Button.jsx`, `LoginForm.jsx`
- Sử dụng camelCase cho utilities: `formatDate.js`, `validation.js`
- Sử dụng kebab-case cho assets: `user-avatar.png`

### Components
- Tên component phải bắt đầu bằng chữ hoa
- Sử dụng functional components với hooks
- Export default cho component chính

### Hooks
- Tên hook bắt đầu bằng "use": `useLocalStorage`, `useApi`
- Trả về object hoặc array với các giá trị cần thiết

## Best Practices

### 1. Component Structure
```jsx
import React from 'react';

const ComponentName = ({ prop1, prop2, ...props }) => {
  // Component logic here
  
  return (
    <div className="component-class">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### 2. Custom Hooks
```jsx
import { useState, useEffect } from 'react';

const useCustomHook = (initialValue) => {
  const [value, setValue] = useState(initialValue);
  
  // Hook logic here
  
  return [value, setValue];
};

export default useCustomHook;
```

### 3. API Service
```jsx
class ApiService {
  async get(endpoint) {
    // API call logic
  }
  
  async post(endpoint, data) {
    // API call logic
  }
}

export default new ApiService();
```

### 4. Context Usage
```jsx
import { createContext, useContext } from 'react';

const ContextName = createContext();

export const useContextName = () => {
  const context = useContext(ContextName);
  if (!context) {
    throw new Error('useContextName must be used within Provider');
  }
  return context;
};
```

## Cài đặt và sử dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy development server
```bash
npm run dev
```

### 3. Build production
```bash
npm run build
```

## Lưu ý

- Luôn sử dụng Tailwind CSS classes cho styling
- Sử dụng CSS variables trong globals.css cho theme
- Tách logic phức tạp ra custom hooks
- Sử dụng Context cho state toàn cục
- Validate input với utility functions
- Sử dụng TypeScript nếu cần type safety
