import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '../public/models');
// Models are in the main face-api.js repository in the /weights directory
// Repository: https://github.com/justadudewhohacks/face-api.js
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Models to download - SSD MobileNetV1 + Face Landmark 68 + Face Recognition
const models = [
    // SSD MobileNet V1 (for better accuracy)
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    // Face Landmark 68 points
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    // Face Recognition
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

// Create models directory if it doesn't exist
if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true });
    console.log('Created models directory:', MODELS_DIR);
}

// Download function
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('Downloaded:', path.basename(filepath));
                    resolve();
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
                file.close();
                fs.unlinkSync(filepath);
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            reject(err);
        });
    });
}

// Download all models
async function downloadAllModels() {
    console.log('Starting download of face-api.js models...');
    console.log('Models directory:', MODELS_DIR);

    for (const model of models) {
        const url = `${BASE_URL}/${model}`;
        const filepath = path.join(MODELS_DIR, model);

        try {
            await downloadFile(url, filepath);
        } catch (error) {
            console.error(`Error downloading ${model}:`, error.message);
        }
    }

    console.log('\nAll models downloaded successfully!');
    console.log('Models are now available at:', MODELS_DIR);
}

downloadAllModels().catch(console.error);

