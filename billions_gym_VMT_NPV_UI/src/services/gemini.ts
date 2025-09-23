import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. AI features will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface AIWorkoutSuggestion {
  workoutName: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    restTime: string;
    description: string;
  }>;
  duration: string;
  difficulty: 'DE' | 'TRUNG_BINH' | 'KHO';
  targetMuscles: string[];
  notes: string;
}

export interface AINutritionSuggestion {
  mealType: string;
  foods: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalCalories: number;
  notes: string;
}

export class GeminiAIService {
  private model = genAI?.getGenerativeModel({ model: 'gemini-pro' });

  async generateWorkoutPlan(memberData: {
    age?: number;
    gender?: string;
    fitnessLevel?: string;
    goals?: string;
    healthConditions?: string;
    availableTime?: number;
  }): Promise<AIWorkoutSuggestion> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please check your API key.');
    }

    const prompt = `
Tạo một kế hoạch tập luyện cá nhân hóa cho hội viên phòng gym với thông tin sau:
- Tuổi: ${memberData.age || 'Không xác định'}
- Giới tính: ${memberData.gender || 'Không xác định'}
- Trình độ: ${memberData.fitnessLevel || 'Người mới bắt đầu'}
- Mục tiêu: ${memberData.goals || 'Tăng cường sức khỏe tổng quát'}
- Tình trạng sức khỏe: ${memberData.healthConditions || 'Bình thường'}
- Thời gian có thể tập: ${memberData.availableTime || 60} phút

Hãy trả về một kế hoạch tập luyện chi tiết bao gồm:
1. Tên bài tập
2. Các bài tập cụ thể với số set, số lần lặp, thời gian nghỉ
3. Thời gian tổng
4. Độ khó (DE/TRUNG_BINH/KHO)
5. Nhóm cơ target
6. Ghi chú quan trọng

Trả về dưới dạng JSON với format:
{
  "workoutName": "string",
  "exercises": [
    {
      "name": "string",
      "sets": number,
      "reps": "string",
      "restTime": "string", 
      "description": "string"
    }
  ],
  "duration": "string",
  "difficulty": "DE|TRUNG_BINH|KHO",
  "targetMuscles": ["string"],
  "notes": "string"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format from AI');
    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw error;
    }
  }

  async generateNutritionPlan(memberData: {
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
    activityLevel?: string;
    goals?: string;
    dietaryRestrictions?: string;
  }): Promise<AINutritionSuggestion> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please check your API key.');
    }

    const prompt = `
Tạo một kế hoạch dinh dưỡng cá nhân hóa cho hội viên phòng gym với thông tin sau:
- Tuổi: ${memberData.age || 'Không xác định'}
- Giới tính: ${memberData.gender || 'Không xác định'}
- Cân nặng: ${memberData.weight || 'Không xác định'} kg
- Chiều cao: ${memberData.height || 'Không xác định'} cm
- Mức độ hoạt động: ${memberData.activityLevel || 'Trung bình'}
- Mục tiêu: ${memberData.goals || 'Duy trì sức khỏe'}
- Hạn chế ăn uống: ${memberData.dietaryRestrictions || 'Không có'}

Hãy tạo một bữa ăn chi tiết bao gồm:
1. Loại bữa ăn (sáng/trưa/tối/phụ)
2. Danh sách thực phẩm với khối lượng và dinh dưỡng
3. Tổng calories
4. Ghi chú quan trọng

Trả về dưới dạng JSON với format:
{
  "mealType": "string",
  "foods": [
    {
      "name": "string",
      "quantity": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "totalCalories": number,
  "notes": "string"
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format from AI');
    } catch (error) {
      console.error('Error generating nutrition plan:', error);
      throw error;
    }
  }

  async generateHealthAnalysis(memberData: {
    bmi?: number;
    heartRate?: number;
    age?: number;
    gender?: string;
    activityLevel?: string;
  }): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI not initialized. Please check your API key.');
    }

    const prompt = `
Phân tích tình trạng sức khỏe của hội viên phòng gym với các chỉ số sau:
- BMI: ${memberData.bmi || 'Không xác định'}
- Nhịp tim: ${memberData.heartRate || 'Không xác định'} bpm
- Tuổi: ${memberData.age || 'Không xác định'}
- Giới tính: ${memberData.gender || 'Không xác định'}
- Mức độ hoạt động: ${memberData.activityLevel || 'Không xác định'}

Hãy đưa ra:
1. Đánh giá tổng quan về tình trạng sức khỏe
2. Các khuyến nghị cải thiện
3. Lưu ý quan trọng về sức khỏe
4. Gợi ý về chế độ tập luyện phù hợp

Trả lời bằng tiếng Việt, ngắn gọn và dễ hiểu.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating health analysis:', error);
      throw error;
    }
  }
}

export const geminiAI = new GeminiAIService();
