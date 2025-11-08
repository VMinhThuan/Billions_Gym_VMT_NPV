// Helper function to calculate cosine similarity between two face encodings
export const calculateCosineSimilarity = (encoding1, encoding2) => {
    if (!encoding1 || !encoding2 || encoding1.length !== encoding2.length) {
        return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < encoding1.length; i++) {
        dotProduct += encoding1[i] * encoding2[i];
        norm1 += encoding1[i] * encoding1[i];
        norm2 += encoding2[i] * encoding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
};

// Validate that multiple encodings belong to the same person
export const validateEncodingsSimilarity = (encodings, threshold = 0.65) => {
    if (!encodings || encodings.length < 2) {
        return {
            isValid: false,
            similarities: [],
            minSimilarity: 0,
            message: 'Cần ít nhất 2 encodings để so sánh'
        };
    }

    // Validate each encoding
    for (let i = 0; i < encodings.length; i++) {
        if (!Array.isArray(encodings[i]) || encodings[i].length !== 128) {
            return {
                isValid: false,
                similarities: [],
                minSimilarity: 0,
                message: `Encoding ${i + 1} không hợp lệ`
            };
        }
    }

    // Calculate similarities between all pairs
    const similarities = [];
    let minSimilarity = 1;

    for (let i = 0; i < encodings.length; i++) {
        for (let j = i + 1; j < encodings.length; j++) {
            const similarity = calculateCosineSimilarity(encodings[i], encodings[j]);
            similarities.push({
                pair: `${i + 1}-${j + 1}`,
                similarity
            });
            if (similarity < minSimilarity) {
                minSimilarity = similarity;
            }
        }
    }

    // Check if all similarities meet the threshold
    const isValid = similarities.every(s => s.similarity >= threshold);

    return {
        isValid,
        similarities: similarities.map(s => s.similarity),
        minSimilarity,
        message: isValid
            ? `${encodings.length} lần quét khớp với nhau`
            : `${encodings.length} lần quét không khớp. Độ tương đồng tối thiểu: ${minSimilarity.toFixed(3)} (yêu cầu: ${threshold})`
    };
};

// Compare current encoding with stored encodings (for enrollment step-by-step validation)
export const compareWithStoredEncodings = (currentEncoding, storedEncodings, threshold = 0.65) => {
    if (!storedEncodings || storedEncodings.length === 0) {
        return {
            isValid: true, // First encoding, always valid
            similarity: 1,
            message: 'Lần quét đầu tiên'
        };
    }

    // Compare with all stored encodings
    const similarities = storedEncodings.map(stored =>
        calculateCosineSimilarity(currentEncoding, stored)
    );

    const minSimilarity = Math.min(...similarities);
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    const isValid = minSimilarity >= threshold;

    return {
        isValid,
        similarity: minSimilarity,
        avgSimilarity,
        similarities,
        message: isValid
            ? `Khuôn mặt khớp với các lần quét trước (độ tương đồng: ${minSimilarity.toFixed(3)})`
            : `Khuôn mặt không khớp với các lần quét trước (độ tương đồng: ${minSimilarity.toFixed(3)})`
    };
};

