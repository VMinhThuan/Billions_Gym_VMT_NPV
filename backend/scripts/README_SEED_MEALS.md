# Seed Meals Data

Script này sẽ seed dữ liệu meals vào database theo format giống với mock data hiện tại.

## Cách chạy:

```bash
cd Billions_Gym_VMT_NPV/backend
node scripts/seedMeals.js
```

## Dữ liệu được seed:

- 9 món ăn mẫu với đầy đủ thông tin:
  - Featured meal: Gà Tây Nướng Với Măng Tây Hấp Và Gạo Lứt
  - Popular meals: 3 món
  - Recommended meals: 3 món
  - All meals: 2 món khác

## Các thuộc tính được seed:

- Thông tin cơ bản: name, description, image, mealType
- Mục tiêu: goals (GIAM_CAN, TANG_CO, TANG_CAN, etc.)
- Độ khó và thời gian: difficulty, cookingTimeMinutes, stepCount
- Đánh giá: rating, ratingCount
- Điểm sức khỏe: healthScore
- Dinh dưỡng: calories, carbs, protein, fat, fiber, sugar, sodium
- Tags và phân loại: tags, cuisineType, dietaryRestrictions, allergens
- Flags: isFeatured, isPopular, isRecommended, isAIRecommended
- Công thức: ingredients, instructions

## Lưu ý:

- Script sẽ KHÔNG xóa dữ liệu cũ (đã comment out)
- Nếu muốn xóa dữ liệu cũ trước khi seed, uncomment dòng `await Meal.deleteMany({});`
- Mỗi lần chạy sẽ thêm mới, không update existing meals

