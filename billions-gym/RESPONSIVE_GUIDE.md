# 📱 Responsive Design Guide

## 🎯 Tổng quan
Web đã được tối ưu hóa responsive để hiển thị hoàn hảo trên mọi thiết bị từ mobile đến desktop.

## 📐 Breakpoints
- **Mobile**: < 480px
- **Tablet**: 480px - 768px  
- **Desktop**: 768px - 1024px
- **Large Desktop**: 1024px - 1280px
- **Extra Large**: > 1280px

## 🛠️ Các Class Responsive Có Sẵn

### Container
```css
.responsive-container     /* Container với max-width và padding responsive */
```

### Grid System
```css
.responsive-grid         /* Grid layout responsive */
.responsive-card-grid    /* Grid cho cards */
```

### Typography
```css
.responsive-title        /* Tiêu đề responsive */
.responsive-subtitle     /* Phụ đề responsive */
.responsive-body         /* Nội dung responsive */
```

### Components
```css
.responsive-button       /* Button responsive */
.responsive-form         /* Form responsive */
.responsive-card         /* Card responsive */
.responsive-image        /* Hình ảnh responsive */
```

### Utilities
```css
.hide-mobile            /* Ẩn trên mobile */
.show-mobile            /* Hiện trên mobile */
.touch-target           /* Touch-friendly (min 44px) */
```

## 📱 Mobile-First Approach

### Layout
- **Mobile**: Single column layout
- **Tablet**: 2 columns layout  
- **Desktop**: 2-3 columns layout

### Typography
- **Mobile**: Smaller font sizes
- **Tablet**: Medium font sizes
- **Desktop**: Larger font sizes

### Spacing
- **Mobile**: Compact padding/margins
- **Tablet**: Medium spacing
- **Desktop**: Generous spacing

## 🎨 Form Responsive

### Input Fields
```css
.responsive-form-input {
    width: 100%;
    padding: 12px 16px;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
}
```

### Button
```css
.responsive-button {
    padding: 12px 24px;
    font-size: 1rem;
    min-height: 44px;
    min-width: 44px;
}
```

## 🖼️ Image Responsive

```css
.responsive-image {
    width: 100%;
    height: auto;
    max-width: 100%;
    object-fit: cover;
    border-radius: 8px;
}
```

## 📊 Table Responsive

```css
.responsive-table {
    width: 100%;
    border-collapse: collapse;
    overflow-x: auto;
}
```

## 🌙 Dark Mode Support

```css
@media (prefers-color-scheme: dark) {
    /* Dark mode styles */
}
```

## ♿ Accessibility

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    /* Disable animations */
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
    /* High contrast styles */
}
```

## 🎯 Best Practices

### 1. Mobile-First
- Luôn bắt đầu với mobile design
- Sử dụng `min-width` media queries
- Progressive enhancement

### 2. Touch-Friendly
- Minimum touch target: 44px x 44px
- Adequate spacing between interactive elements
- Large enough text for readability

### 3. Performance
- Optimize images for different screen sizes
- Use appropriate image formats (WebP, AVIF)
- Lazy loading for images below the fold

### 4. Content Priority
- Most important content first
- Hide secondary content on mobile
- Use progressive disclosure

## 🔧 Customization

### Custom Breakpoints
```css
@media (min-width: 600px) {
    /* Custom tablet breakpoint */
}

@media (min-width: 900px) {
    /* Custom desktop breakpoint */
}
```

### Custom Responsive Classes
```css
.my-responsive-class {
    /* Mobile styles */
}

@media (min-width: 768px) {
    .my-responsive-class {
        /* Desktop styles */
    }
}
```

## 📱 Testing

### Browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes

### Real Devices
- iPhone (375px, 414px)
- iPad (768px, 1024px)
- Android phones (360px, 411px)
- Desktop (1920px, 1440px)

## 🚀 Performance Tips

1. **Use CSS Grid and Flexbox** for layouts
2. **Optimize images** for different screen densities
3. **Minimize CSS** with efficient selectors
4. **Use transform** instead of changing layout properties
5. **Implement lazy loading** for images and content

## 🎨 Design System

### Colors
- Primary: #e74c3c (Red)
- Secondary: #3498db (Blue)
- Background: #000000 (Black)
- Text: #ffffff (White)

### Typography
- Font Family: Inter, Roboto, system-ui
- Font Weights: 400, 500, 600, 700, 900
- Line Heights: 1.2, 1.3, 1.4, 1.6

### Spacing
- Mobile: 1rem, 1.5rem, 2rem
- Desktop: 2rem, 3rem, 4rem, 5rem, 6rem

## 📞 Support

Nếu có vấn đề với responsive design, hãy kiểm tra:
1. Viewport meta tag
2. CSS media queries
3. Image optimization
4. Touch targets size
5. Content hierarchy

---

**Happy Coding! 🎉**
