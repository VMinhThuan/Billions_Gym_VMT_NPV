const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exercise = require('../src/models/Exercise');
const TemplateBuoiTap = require('../src/models/TemplateBuoiTap');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        seedExercises();
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Hàm tạo ratings ngẫu nhiên
function generateRandomRatings() {
    const numRatings = Math.floor(Math.random() * 15) + 5; // 5-20 ratings
    const ratings = [];
    let totalRating = 0;

    for (let i = 0; i < numRatings; i++) {
        const rating = Math.floor(Math.random() * 2) + 3; // 3-5 stars
        totalRating += rating;
        ratings.push({
            rating: rating,
            comment: rating >= 4 ? 'Bài tập rất hữu ích!' : 'Bài tập tốt',
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        });
    }

    const averageRating = totalRating / numRatings;

    return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings: numRatings,
        ratings: ratings
    };
}

// Định nghĩa 20 bài tập cho mỗi template type với YouTube links thật
const exercisesByTemplateType = {
    'Pull': [
        { title: 'Deadlift Tutorial - Form và Kỹ thuật', youtubeId: 'op9kVnSso6Q', difficulty: 'intermediate', duration: 600 },
        { title: 'Barbell Row - Hướng dẫn chi tiết', youtubeId: 'k8Lys7pvEPs', difficulty: 'intermediate', duration: 480 },
        { title: 'Pull-ups cho người mới bắt đầu', youtubeId: 'CAwf7n6Luuc', difficulty: 'beginner', duration: 420 },
        { title: 'Lat Pulldown - Kỹ thuật đúng', youtubeId: 'CAwf7n6Luuc', difficulty: 'beginner', duration: 380 },
        { title: 'Cable Row Variations - Nhiều biến thể', youtubeId: 'k8Lys7pvEPs', difficulty: 'intermediate', duration: 540 },
        { title: 'T-Bar Row - Bài tập kéo hiệu quả', youtubeId: 'wAqY8VQqrYs', difficulty: 'intermediate', duration: 450 },
        { title: 'Face Pull - Phát triển vai sau', youtubeId: 'rep-qVOkqgk', difficulty: 'beginner', duration: 360 },
        { title: 'Shrugs với tạ đòn', youtubeId: 'vM4jaxAL4X8', difficulty: 'beginner', duration: 300 },
        { title: 'Chest Supported Row', youtubeId: 'aKovE_L4m0s', difficulty: 'beginner', duration: 400 },
        { title: 'One-Arm Dumbbell Row', youtubeId: 'roCP6wCXPqo', difficulty: 'intermediate', duration: 480 },
        { title: 'Inverted Row - Bodyweight', youtubeId: '8NgqZjA4AoA', difficulty: 'beginner', duration: 360 },
        { title: 'Wide Grip Pull-ups', youtubeId: 'CAwf7n6Luuc', difficulty: 'advanced', duration: 420 },
        { title: 'Chin-ups vs Pull-ups', youtubeId: 'CAwf7n6Luuc', difficulty: 'intermediate', duration: 400 },
        { title: 'Rack Pulls - Deadlift Variation', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 540 },
        { title: 'Snatch Grip Deadlift', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 600 },
        { title: 'Rope Pull-downs', youtubeId: 'rep-qVOkqgk', difficulty: 'intermediate', duration: 380 },
        { title: 'Straight Arm Pulldown', youtubeId: 'CAwf7n6Luuc', difficulty: 'intermediate', duration: 400 },
        { title: 'Hammer Strength Row', youtubeId: 'k8Lys7pvEPs', difficulty: 'beginner', duration: 420 },
        { title: 'Landmine Row', youtubeId: 'wAqY8VQqrYs', difficulty: 'intermediate', duration: 450 },
        { title: 'Pull Day Complete Workout', youtubeId: 'CAwf7n6Luuc', difficulty: 'intermediate', duration: 1800 }
    ],
    'Push': [
        { title: 'Bench Press - Kỹ thuật cơ bản', youtubeId: 'rT7DgCr-3pg', difficulty: 'beginner', duration: 600 },
        { title: 'Incline Bench Press', youtubeId: '8iP4vqZNebc', difficulty: 'intermediate', duration: 540 },
        { title: 'Push-ups cho người mới', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 480 },
        { title: 'Dumbbell Flyes', youtubeId: 'eozdVDA78K0', difficulty: 'beginner', duration: 420 },
        { title: 'Overhead Press - Shoulder', youtubeId: 'qEwKCR5JCog', difficulty: 'intermediate', duration: 480 },
        { title: 'Lateral Raises', youtubeId: '3VcKaXpzqRo', difficulty: 'beginner', duration: 300 },
        { title: 'Tricep Dips', youtubeId: '6kALZikXxLc', difficulty: 'beginner', duration: 360 },
        { title: 'Close Grip Bench Press', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 450 },
        { title: 'Push-ups Variations', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 540 },
        { title: 'Cable Crossover', youtubeId: 'eozdVDA78K0', difficulty: 'intermediate', duration: 400 },
        { title: 'Diamond Push-ups', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 360 },
        { title: 'Pike Push-ups', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 420 },
        { title: 'Tricep Extension', youtubeId: '6kALZikXxLc', difficulty: 'beginner', duration: 380 },
        { title: 'Cable Flyes', youtubeId: 'eozdVDA78K0', difficulty: 'intermediate', duration: 400 },
        { title: 'Front Raises', youtubeId: '3VcKaXpzqRo', difficulty: 'beginner', duration: 320 },
        { title: 'Arnold Press', youtubeId: 'qEwKCR5JCog', difficulty: 'intermediate', duration: 450 },
        { title: 'Weighted Push-ups', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 480 },
        { title: 'Decline Bench Press', youtubeId: '8iP4vqZNebc', difficulty: 'intermediate', duration: 500 },
        { title: 'Pec Deck Machine', youtubeId: 'eozdVDA78K0', difficulty: 'beginner', duration: 380 },
        { title: 'Push Day Complete Workout', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 1800 }
    ],
    'Legs': [
        { title: 'Squat - Hướng dẫn cơ bản', youtubeId: 'Dy28eq2PjcM', difficulty: 'beginner', duration: 600 },
        { title: 'Leg Press Machine', youtubeId: 'IZxyjW8PL9g', difficulty: 'beginner', duration: 480 },
        { title: 'Lunges - Cơ bản', youtubeId: 'QOVaHwm-Q6U', difficulty: 'beginner', duration: 420 },
        { title: 'Romanian Deadlift', youtubeId: 'op9kVnSso6Q', difficulty: 'intermediate', duration: 540 },
        { title: 'Leg Curls - Hamstring', youtubeId: 'iz3zHXeZgZI', difficulty: 'beginner', duration: 380 },
        { title: 'Leg Extensions - Quadriceps', youtubeId: 'IZxyjW8PL9g', difficulty: 'beginner', duration: 360 },
        { title: 'Bulgarian Split Squat', youtubeId: 'QOVaHwm-Q6U', difficulty: 'intermediate', duration: 480 },
        { title: 'Calf Raises', youtubeId: 'r4MzxtBKyNE', difficulty: 'beginner', duration: 300 },
        { title: 'Goblet Squat', youtubeId: 'Dy28eq2PjcM', difficulty: 'beginner', duration: 400 },
        { title: 'Walking Lunges', youtubeId: 'QOVaHwm-Q6U', difficulty: 'intermediate', duration: 450 },
        { title: 'Hip Thrusts', youtubeId: 'BEMRFH0W0Ak', difficulty: 'intermediate', duration: 420 },
        { title: 'Step-ups', youtubeId: 'QOVaHwm-Q6U', difficulty: 'beginner', duration: 380 },
        { title: 'Box Squats', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 500 },
        { title: 'Front Squat', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 540 },
        { title: 'Sumo Deadlift', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 560 },
        { title: 'Stiff Leg Deadlift', youtubeId: 'op9kVnSso6Q', difficulty: 'intermediate', duration: 480 },
        { title: 'Single Leg RDL', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 420 },
        { title: 'Wall Sits', youtubeId: 'Dy28eq2PjcM', difficulty: 'beginner', duration: 300 },
        { title: 'Leg Day Complete Workout', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2000 },
        { title: 'Lower Body Mobility', youtubeId: 'QOVaHwm-Q6U', difficulty: 'beginner', duration: 600 }
    ],
    'Cardio': [
        { title: 'HIIT Cardio 20 phút', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'Running for Beginners', youtubeId: '5kMQXUiJVuc', difficulty: 'beginner', duration: 900 },
        { title: 'Rowing Machine Basics', youtubeId: 'Wj3OECWkefs', difficulty: 'beginner', duration: 600 },
        { title: 'Cycling Interval Training', youtubeId: 'K0Q-2KMrCEg', difficulty: 'intermediate', duration: 1800 },
        { title: 'Jump Rope Workout', youtubeId: 'uaH9qL-O8yA', difficulty: 'beginner', duration: 900 },
        { title: 'Elliptical Training', youtubeId: 'BHY0FxzoKZE', difficulty: 'beginner', duration: 1200 },
        { title: 'StairMaster Workout', youtubeId: 'b7CzPaJWqIM', difficulty: 'intermediate', duration: 1500 },
        { title: 'Treadmill Interval', youtubeId: '5kMQXUiJVuc', difficulty: 'intermediate', duration: 1800 },
        { title: 'Steady State Cardio', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 2400 },
        { title: 'Tabata Cardio', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 480 },
        { title: 'Burpees Challenge', youtubeId: 'auBLP_X8BSg', difficulty: 'advanced', duration: 600 },
        { title: 'Mountain Climbers', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 540 },
        { title: 'Jumping Jacks', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 300 },
        { title: 'High Knees', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 360 },
        { title: 'Box Jumps', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 420 },
        { title: 'Battle Ropes', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 600 },
        { title: 'Swimming Strokes', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 900 },
        { title: 'Indoor Cycling Class', youtubeId: 'K0Q-2KMrCEg', difficulty: 'intermediate', duration: 2700 },
        { title: 'Cardio Endurance Build', youtubeId: '5kMQXUiJVuc', difficulty: 'advanced', duration: 2400 },
        { title: 'Full Cardio Session', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2100 }
    ],
    'Boxing': [
        { title: 'Boxing Basics - Jab Cross Hook', youtubeId: '5kDvjUBl2ow', difficulty: 'beginner', duration: 720 },
        { title: 'Heavy Bag Training', youtubeId: 'mWJsXrBMnLg', difficulty: 'intermediate', duration: 900 },
        { title: 'Footwork & Movement', youtubeId: 'mWJsXrBMnLg', difficulty: 'intermediate', duration: 600 },
        { title: 'Shadow Boxing Routine', youtubeId: '5kDvjUBl2ow', difficulty: 'beginner', duration: 900 },
        { title: 'Speed Bag Training', youtubeId: 'mWJsXrBMnLg', difficulty: 'intermediate', duration: 540 },
        { title: 'Double End Bag', youtubeId: 'mWJsXrBMnLg', difficulty: 'advanced', duration: 600 },
        { title: 'Punching Combinations', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 720 },
        { title: 'Defense Techniques', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 660 },
        { title: 'Boxing Conditioning', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 1200 },
        { title: 'Upper Cut Technique', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 480 },
        { title: 'Hook Variations', youtubeId: '5kDvjUBl2ow', difficulty: 'advanced', duration: 540 },
        { title: 'Boxing Cardio Workout', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 1500 },
        { title: 'Pad Work Basics', youtubeId: '5kDvjUBl2ow', difficulty: 'beginner', duration: 600 },
        { title: 'Sparring Drills', youtubeId: '5kDvjUBl2ow', difficulty: 'advanced', duration: 1800 },
        { title: 'Boxing Warm-up', youtubeId: '5kDvjUBl2ow', difficulty: 'beginner', duration: 480 },
        { title: 'Boxing Cool-down', youtubeId: '5kDvjUBl2ow', difficulty: 'beginner', duration: 420 },
        { title: 'Advanced Combinations', youtubeId: '5kDvjUBl2ow', difficulty: 'advanced', duration: 780 },
        { title: 'Boxing for Fitness', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 1200 },
        { title: 'Boxing Footwork Drills', youtubeId: 'mWJsXrBMnLg', difficulty: 'intermediate', duration: 720 },
        { title: 'Complete Boxing Session', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 2400 }
    ],
    'ShoulderAbs': [
        { title: 'Shoulder Press Tutorial', youtubeId: 'qEwKCR5JCog', difficulty: 'beginner', duration: 360 },
        { title: 'Lateral Raises', youtubeId: '3VcKaXpzqRo', difficulty: 'beginner', duration: 300 },
        { title: 'Ab Workout Beginners', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 480 },
        { title: 'Plank Variations', youtubeId: 'pSHjTRCQxIw', difficulty: 'intermediate', duration: 420 },
        { title: 'Front Raises', youtubeId: '3VcKaXpzqRo', difficulty: 'beginner', duration: 320 },
        { title: 'Crunches Tutorial', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 300 },
        { title: 'Reverse Flyes', youtubeId: 'rep-qVOkqgk', difficulty: 'beginner', duration: 380 },
        { title: 'Russian Twists', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 400 },
        { title: 'Arnold Press', youtubeId: 'qEwKCR5JCog', difficulty: 'intermediate', duration: 450 },
        { title: 'Leg Raises', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 360 },
        { title: 'Cable Lateral Raises', youtubeId: '3VcKaXpzqRo', difficulty: 'intermediate', duration: 420 },
        { title: 'Mountain Climbers', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 480 },
        { title: 'Upright Row', youtubeId: '3VcKaXpzqRo', difficulty: 'intermediate', duration: 400 },
        { title: 'Bicycle Crunches', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 360 },
        { title: 'Shoulder Shrugs', youtubeId: 'vM4jaxAL4X8', difficulty: 'beginner', duration: 300 },
        { title: 'Hanging Leg Raises', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 420 },
        { title: 'Pike Push-ups', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 480 },
        { title: 'Side Plank', youtubeId: 'pSHjTRCQxIw', difficulty: 'intermediate', duration: 360 },
        { title: 'Complete Shoulder & Abs', youtubeId: 'qEwKCR5JCog', difficulty: 'intermediate', duration: 1800 },
        { title: 'Core Stability Training', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 1200 }
    ],
    'BB': [
        { title: 'Barbell Squat Advanced', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 840 },
        { title: 'Barbell Bench Press', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 720 },
        { title: 'Barbell Deadlift', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 900 },
        { title: 'Barbell Overhead Press', youtubeId: 'GJFjYyA40ss', difficulty: 'intermediate', duration: 600 },
        { title: 'Barbell Row', youtubeId: 'k8Lys7pvEPs', difficulty: 'intermediate', duration: 540 },
        { title: 'Front Squat Tutorial', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 720 },
        { title: 'Barbell Curls', youtubeId: 'IaZd5H3H9Os', difficulty: 'beginner', duration: 420 },
        { title: 'Barbell Shrugs', youtubeId: 'vM4jaxAL4X8', difficulty: 'beginner', duration: 360 },
        { title: 'Close Grip Bench Press', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 480 },
        { title: 'Barbell Good Mornings', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 540 },
        { title: 'Barbell Hip Thrusts', youtubeId: 'BEMRFH0W0Ak', difficulty: 'intermediate', duration: 480 },
        { title: 'Barbell Lunges', youtubeId: 'QOVaHwm-Q6U', difficulty: 'intermediate', duration: 500 },
        { title: 'Zercher Squat', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 600 },
        { title: 'Barbell Rack Pulls', youtubeId: 'op9kVnSso6Q', difficulty: 'advanced', duration: 540 },
        { title: 'Barbell Calf Raises', youtubeId: 'r4MzxtBKyNE', difficulty: 'beginner', duration: 360 },
        { title: 'Reverse Barbell Curls', youtubeId: 'IaZd5H3H9Os', difficulty: 'intermediate', duration: 400 },
        { title: 'Landmine Press', youtubeId: 'wAqY8VQqrYs', difficulty: 'intermediate', duration: 450 },
        { title: 'Barbell Romanian Deadlift', youtubeId: 'op9kVnSso6Q', difficulty: 'intermediate', duration: 560 },
        { title: 'Powerlifting Techniques', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 1200 },
        { title: 'Complete Barbell Workout', youtubeId: 'rT7DgCr-3pg', difficulty: 'advanced', duration: 2400 }
    ],
    'FullBody': [
        { title: 'Full Body Beginner', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1800 },
        { title: 'Full Body Intermediate', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2100 },
        { title: 'Full Body Advanced', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 2400 },
        { title: 'Circuit Training', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2000 },
        { title: 'Bodyweight Full Body', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 1500 },
        { title: 'Dumbbell Full Body', youtubeId: 'eozdVDA78K0', difficulty: 'intermediate', duration: 1800 },
        { title: 'HIIT Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1200 },
        { title: 'Full Body Strength', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2100 },
        { title: 'Functional Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1800 },
        { title: 'Full Body Cardio', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2000 },
        { title: 'Kettlebell Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1500 },
        { title: 'Resistance Band Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1200 },
        { title: 'Full Body Stretch', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 900 },
        { title: '30 Min Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1800 },
        { title: 'Full Body Burn', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1500 },
        { title: 'Full Body Toning', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2000 },
        { title: 'Full Body Power', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 1800 },
        { title: 'Full Body Mobility', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1200 },
        { title: 'Full Body Endurance', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 2400 },
        { title: 'Complete Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2100 }
    ],
    'Core': [
        { title: 'Core Workout Beginner', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 600 },
        { title: 'Plank Challenge', youtubeId: 'pSHjTRCQxIw', difficulty: 'intermediate', duration: 900 },
        { title: 'Abs 10 Minutes', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 600 },
        { title: 'Advanced Core', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 1200 },
        { title: 'Russian Twists', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 400 },
        { title: 'Leg Raises', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 360 },
        { title: 'Bicycle Crunches', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 360 },
        { title: 'Dead Bug Exercise', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 420 },
        { title: 'Bird Dog', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 380 },
        { title: 'Side Plank', youtubeId: 'pSHjTRCQxIw', difficulty: 'intermediate', duration: 360 },
        { title: 'Hanging Leg Raises', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 420 },
        { title: 'Ab Wheel Rollout', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 480 },
        { title: 'Cable Crunches', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 400 },
        { title: 'Flutter Kicks', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 300 },
        { title: 'V-Ups', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 380 },
        { title: 'Toe Touches', youtubeId: '1fbU_MkV7NE', difficulty: 'beginner', duration: 320 },
        { title: 'Mountain Climbers', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 480 },
        { title: 'Pallof Press', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 420 },
        { title: 'Complete Core Session', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 1500 },
        { title: 'Core Stability', youtubeId: '1fbU_MkV7NE', difficulty: 'advanced', duration: 1200 }
    ],
    'Yoga': [
        { title: 'Yoga for Beginners', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Sun Salutation', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Yoga Flow', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 2100 },
        { title: 'Power Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 2400 },
        { title: 'Yin Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 2700 },
        { title: 'Yoga Stretching', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1500 },
        { title: 'Vinyasa Flow', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 2400 },
        { title: 'Hatha Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 2100 },
        { title: 'Ashtanga Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 2700 },
        { title: 'Morning Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Evening Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1500 },
        { title: 'Yoga for Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 1800 },
        { title: 'Yoga Poses Basics', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 900 },
        { title: 'Hot Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 3600 },
        { title: 'Yoga Meditation', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Yoga Balance', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 1200 },
        { title: 'Restorative Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 2400 },
        { title: 'Yoga Core', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 1500 },
        { title: 'Advanced Yoga', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 2700 },
        { title: 'Complete Yoga Session', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 2400 }
    ],
    'HIIT': [
        { title: 'HIIT Beginner', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1200 },
        { title: 'HIIT Intermediate', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1500 },
        { title: 'HIIT Advanced', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1800 },
        { title: '20 Min HIIT', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: '30 Min HIIT', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1800 },
        { title: 'Tabata HIIT', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 480 },
        { title: 'HIIT Cardio', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'HIIT Strength', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1500 },
        { title: 'HIIT Full Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1500 },
        { title: 'HIIT Lower Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'HIIT Upper Body', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'HIIT Core', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 900 },
        { title: 'HIIT No Equipment', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 1200 },
        { title: 'HIIT Boxing', youtubeId: '5kDvjUBl2ow', difficulty: 'intermediate', duration: 1500 },
        { title: 'HIIT Burpees', youtubeId: 'auBLP_X8BSg', difficulty: 'advanced', duration: 600 },
        { title: 'HIIT Kettlebell', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1500 },
        { title: 'HIIT Cycling', youtubeId: 'K0Q-2KMrCEg', difficulty: 'intermediate', duration: 1800 },
        { title: 'HIIT Running', youtubeId: '5kMQXUiJVuc', difficulty: 'advanced', duration: 1200 },
        { title: 'HIIT Abs', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 900 },
        { title: 'Complete HIIT Workout', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1800 }
    ],
    'Strength': [
        { title: 'Strength Training Basics', youtubeId: 'Dy28eq2PjcM', difficulty: 'beginner', duration: 1800 },
        { title: 'Upper Body Strength', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 2100 },
        { title: 'Lower Body Strength', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2400 },
        { title: 'Full Body Strength', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2700 },
        { title: 'Progressive Overload', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 1200 },
        { title: '5x5 Strength Program', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2400 },
        { title: 'Compound Movements', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2100 },
        { title: 'Strength Hypertrophy', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2700 },
        { title: 'Max Strength Training', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2400 },
        { title: 'Functional Strength', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2100 },
        { title: 'Dumbbell Strength', youtubeId: 'eozdVDA78K0', difficulty: 'intermediate', duration: 1800 },
        { title: 'Bodyweight Strength', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 1500 },
        { title: 'Kettlebell Strength', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 2100 },
        { title: 'Resistance Band Strength', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1200 },
        { title: 'Strength Periodization', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 1800 },
        { title: 'Core Strength', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 1500 },
        { title: 'Push Strength', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 2100 },
        { title: 'Pull Strength', youtubeId: 'CAwf7n6Luuc', difficulty: 'intermediate', duration: 2100 },
        { title: 'Leg Strength', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2400 },
        { title: 'Complete Strength Program', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2700 }
    ],
    'Endurance': [
        { title: 'Endurance Training Basics', youtubeId: '5kMQXUiJVuc', difficulty: 'beginner', duration: 1800 },
        { title: 'Running Endurance', youtubeId: '5kMQXUiJVuc', difficulty: 'intermediate', duration: 2400 },
        { title: 'Cycling Endurance', youtubeId: 'K0Q-2KMrCEg', difficulty: 'intermediate', duration: 2700 },
        { title: 'Swimming Endurance', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2100 },
        { title: 'Cardio Endurance Build', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 2400 },
        { title: 'Muscular Endurance', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2100 },
        { title: 'Endurance Circuit', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2000 },
        { title: 'Long Distance Training', youtubeId: '5kMQXUiJVuc', difficulty: 'advanced', duration: 3600 },
        { title: 'Interval Endurance', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1800 },
        { title: 'Endurance Recovery', youtubeId: '5kMQXUiJVuc', difficulty: 'beginner', duration: 1200 },
        { title: 'Endurance Nutrition', youtubeId: '5kMQXUiJVuc', difficulty: 'beginner', duration: 900 },
        { title: 'Endurance Breathing', youtubeId: '5kMQXUiJVuc', difficulty: 'beginner', duration: 600 },
        { title: 'Marathon Training', youtubeId: '5kMQXUiJVuc', difficulty: 'advanced', duration: 3600 },
        { title: 'Triathlon Endurance', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 4200 },
        { title: 'Endurance Pacing', youtubeId: '5kMQXUiJVuc', difficulty: 'intermediate', duration: 1200 },
        { title: 'Endurance Mental', youtubeId: '5kMQXUiJVuc', difficulty: 'intermediate', duration: 900 },
        { title: 'Endurance Core', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 1500 },
        { title: 'Endurance Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Endurance Program', youtubeId: '5kMQXUiJVuc', difficulty: 'advanced', duration: 3000 },
        { title: 'Complete Endurance', youtubeId: '5kMQXUiJVuc', difficulty: 'intermediate', duration: 2400 }
    ],
    'Flexibility': [
        { title: 'Stretching Basics', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Full Body Stretch', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Hip Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 900 },
        { title: 'Shoulder Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Hamstring Stretch', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 480 },
        { title: 'Back Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 720 },
        { title: 'Dynamic Stretching', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 900 },
        { title: 'Static Stretching', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'PNF Stretching', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 1500 },
        { title: 'Morning Stretch', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Evening Stretch', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 900 },
        { title: 'Pre-Workout Stretch', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 480 },
        { title: 'Post-Workout Stretch', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Split Training', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 1800 },
        { title: 'Flexibility Program', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 2100 },
        { title: 'Mobility Work', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 1500 },
        { title: 'Yoga Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 2400 },
        { title: 'Advanced Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'advanced', duration: 1800 },
        { title: 'Flexibility Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Complete Flexibility', youtubeId: 'v7AYKMP6rOE', difficulty: 'intermediate', duration: 1800 }
    ],
    'CrossFit': [
        { title: 'CrossFit Basics', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1800 },
        { title: 'CrossFit WOD', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2400 },
        { title: 'CrossFit Advanced', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 2700 },
        { title: 'AMRAP Workout', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'EMOM CrossFit', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1800 },
        { title: 'CrossFit Conditioning', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2400 },
        { title: 'CrossFit Strength', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2700 },
        { title: 'CrossFit Gymnastics', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 2100 },
        { title: 'CrossFit Olympic Lifts', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2400 },
        { title: 'CrossFit Endurance', youtubeId: '5kMQXUiJVuc', difficulty: 'intermediate', duration: 3000 },
        { title: 'CrossFit Skills', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1500 },
        { title: 'CrossFit Mobility', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'CrossFit Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 900 },
        { title: 'CrossFit Nutrition', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 600 },
        { title: 'CrossFit Programming', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1800 },
        { title: 'CrossFit Competition', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 3600 },
        { title: 'CrossFit Scaling', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1200 },
        { title: 'CrossFit Rx', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 2400 },
        { title: 'CrossFit Community', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 600 },
        { title: 'Complete CrossFit', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2700 }
    ],
    'Calisthenics': [
        { title: 'Calisthenics Basics', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 1500 },
        { title: 'Bodyweight Training', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 1800 },
        { title: 'Push-up Progressions', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 1200 },
        { title: 'Pull-up Progressions', youtubeId: 'CAwf7n6Luuc', difficulty: 'intermediate', duration: 1200 },
        { title: 'Handstand Tutorial', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 1800 },
        { title: 'Muscle-up Training', youtubeId: 'CAwf7n6Luuc', difficulty: 'advanced', duration: 2100 },
        { title: 'Human Flag', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 1500 },
        { title: 'Front Lever', youtubeId: 'CAwf7n6Luuc', difficulty: 'advanced', duration: 1800 },
        { title: 'Back Lever', youtubeId: 'CAwf7n6Luuc', difficulty: 'advanced', duration: 1800 },
        { title: 'Planche Training', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 2400 },
        { title: 'L-Sit Progression', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 1200 },
        { title: 'Dips Progressions', youtubeId: '6kALZikXxLc', difficulty: 'intermediate', duration: 900 },
        { title: 'Pike Push-up', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 600 },
        { title: 'Archer Push-up', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 720 },
        { title: 'One Arm Push-up', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 900 },
        { title: 'Weighted Calisthenics', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 1500 },
        { title: 'Calisthenics Flow', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 1800 },
        { title: 'Street Workout', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 2100 },
        { title: 'Calisthenics Skills', youtubeId: 'IODxDxX7oi4', difficulty: 'advanced', duration: 2400 },
        { title: 'Complete Calisthenics', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 1800 }
    ],
    'Bodybuilding': [
        { title: 'Bodybuilding Basics', youtubeId: 'Dy28eq2PjcM', difficulty: 'beginner', duration: 2100 },
        { title: 'Hypertrophy Training', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2700 },
        { title: 'Chest Specialization', youtubeId: 'rT7DgCr-3pg', difficulty: 'intermediate', duration: 2400 },
        { title: 'Back Specialization', youtubeId: 'CAwf7n6Luuc', difficulty: 'intermediate', duration: 2400 },
        { title: 'Legs Specialization', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2700 },
        { title: 'Arms Specialization', youtubeId: 'IaZd5H3H9Os', difficulty: 'intermediate', duration: 2100 },
        { title: 'Shoulders Specialization', youtubeId: 'qEwKCR5JCog', difficulty: 'intermediate', duration: 2100 },
        { title: 'PPL Split', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2700 },
        { title: 'Bro Split', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2400 },
        { title: 'Upper Lower Split', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2700 },
        { title: 'Volume Training', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 3000 },
        { title: 'Intensity Techniques', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2100 },
        { title: 'Bodybuilding Nutrition', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 1800 },
        { title: 'Posing Practice', youtubeId: 'Dy28eq2PjcM', difficulty: 'beginner', duration: 1200 },
        { title: 'Cutting Phase', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2700 },
        { title: 'Bulking Phase', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 3000 },
        { title: 'Contest Prep', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 3600 },
        { title: 'Off Season Training', youtubeId: 'Dy28eq2PjcM', difficulty: 'intermediate', duration: 2700 },
        { title: 'Bodybuilding Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Complete Bodybuilding', youtubeId: 'Dy28eq2PjcM', difficulty: 'advanced', duration: 2700 }
    ],
    'Functional': [
        { title: 'Functional Training Basics', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1500 },
        { title: 'Movement Patterns', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1800 },
        { title: 'Kettlebell Swings', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 900 },
        { title: 'Turkish Get-ups', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1200 },
        { title: 'Farmer Walks', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 600 },
        { title: 'Sled Pushes', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 900 },
        { title: 'Battle Ropes', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'Sandbag Training', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1500 },
        { title: 'TRX Training', youtubeId: 'IODxDxX7oi4', difficulty: 'beginner', duration: 1800 },
        { title: 'Suspension Training', youtubeId: 'IODxDxX7oi4', difficulty: 'intermediate', duration: 1500 },
        { title: 'Functional Core', youtubeId: '1fbU_MkV7NE', difficulty: 'intermediate', duration: 1200 },
        { title: 'Agility Training', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1200 },
        { title: 'Balance Training', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 900 },
        { title: 'Coordination Drills', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 1000 },
        { title: 'Reactive Training', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1200 },
        { title: 'Sport Specific', youtubeId: 'ml6cT4AZdqI', difficulty: 'advanced', duration: 1800 },
        { title: 'Everyday Movements', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1500 },
        { title: 'Injury Prevention', youtubeId: 'ml6cT4AZdqI', difficulty: 'beginner', duration: 1200 },
        { title: 'Functional Mobility', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1500 },
        { title: 'Complete Functional', youtubeId: 'ml6cT4AZdqI', difficulty: 'intermediate', duration: 2100 }
    ],
    'Recovery': [
        { title: 'Recovery Basics', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Active Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Stretching Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1500 },
        { title: 'Foam Rolling', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 900 },
        { title: 'Mobility Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Yoga Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Meditation Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Sleep Optimization', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Recovery Nutrition', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 900 },
        { title: 'Rest Day Activities', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Injury Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1500 },
        { title: 'Muscle Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1200 },
        { title: 'Cold Therapy', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 480 },
        { title: 'Heat Therapy', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Massage Techniques', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 },
        { title: 'Recovery Breathing', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Recovery Hydration', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 300 },
        { title: 'Recovery Supplements', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 600 },
        { title: 'Full Recovery Day', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 2400 },
        { title: 'Complete Recovery', youtubeId: 'v7AYKMP6rOE', difficulty: 'beginner', duration: 1800 }
    ]
};

async function seedExercises() {
    try {
        console.log('🌱 Starting to seed Exercise data...\n');

        // Lấy tất cả template từ database
        const templates = await TemplateBuoiTap.find();
        console.log(`📋 Found ${templates.length} templates in database\n`);

        // Tập hợp tất cả các loại template
        const templateTypes = new Set();
        templates.forEach(template => {
            if (template.loai) {
                templateTypes.add(template.loai);
            }
        });

        // Nếu không có template trong DB, sử dụng tất cả các loại đã định nghĩa
        if (templateTypes.size === 0) {
            console.log('⚠️  No templates found in DB. Using all defined template types...\n');
            Object.keys(exercisesByTemplateType).forEach(type => templateTypes.add(type));
        }

        console.log(`🎯 Creating exercises for ${templateTypes.size} template types\n`);
        console.log(`📝 Template types: ${Array.from(templateTypes).join(', ')}\n`);

        const allExercises = [];
        const exercisesByType = {};

        // Tạo bài tập cho từng loại template
        for (const type of templateTypes) {
            const exercises = exercisesByTemplateType[type] || [];

            if (exercises.length === 0) {
                console.log(`⚠️  No exercises defined for type: ${type}`);
                continue;
            }

            console.log(`📝 Creating ${exercises.length} exercises for type: ${type}`);

            for (const exerciseData of exercises) {
                const exercise = new Exercise({
                    title: exerciseData.title,
                    type: 'external_link',
                    source_url: `https://www.youtube.com/watch?v=${exerciseData.youtubeId}`,
                    description: exerciseData.title + ' - Video hướng dẫn chi tiết',
                    duration_sec: exerciseData.duration,
                    difficulty: exerciseData.difficulty,
                    status: 'active',
                    metadata: { youtubeId: exerciseData.youtubeId },
                    ratings: generateRandomRatings()
                });
                allExercises.push(exercise);
            }

            exercisesByType[type] = exercises.length;
        }

        // Lưu tất cả exercises
        if (allExercises.length > 0) {
            const savedExercises = await Exercise.insertMany(allExercises, { ordered: false });
            console.log(`\n✅ Successfully created ${savedExercises.length} Exercise records\n`);

            // Thống kê
            console.log('📊 Statistics by Template Type:');
            Object.entries(exercisesByType).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} exercises`);
            });

            // Thống kê theo difficulty
            const statsByDifficulty = {
                beginner: 0,
                intermediate: 0,
                advanced: 0
            };
            savedExercises.forEach(ex => {
                if (statsByDifficulty[ex.difficulty] !== undefined) {
                    statsByDifficulty[ex.difficulty]++;
                }
            });

            console.log('\n📊 Statistics by Difficulty:');
            Object.entries(statsByDifficulty).forEach(([difficulty, count]) => {
                console.log(`   ${difficulty}: ${count} exercises`);
            });

            // Thống kê ratings
            const avgRatings = savedExercises.map(ex => ex.ratings?.averageRating || 0);
            const totalRatings = avgRatings.reduce((sum, rating) => sum + rating, 0);
            const overallAvgRating = totalRatings / avgRatings.length;

            console.log('\n⭐ Ratings Statistics:');
            console.log(`   Overall Average Rating: ${overallAvgRating.toFixed(2)}/5`);
            console.log(`   Total Exercises with Ratings: ${savedExercises.filter(ex => ex.ratings?.totalRatings > 0).length}`);

            console.log('\n🎉 Exercise seeding completed successfully!');
            console.log(`\n📦 Total: ${savedExercises.length} exercises created`);
            console.log(`📺 All exercises use real YouTube links`);
            console.log('\n💡 Tip: You can now assign these exercises to session playlists using the playlist API');
        } else {
            console.log('⚠️  No exercises were created. Please check your template types.');
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding Exercises:', error);
        if (error.writeErrors) {
            console.error('Write errors:', error.writeErrors);
        }
        process.exit(1);
    }
}
