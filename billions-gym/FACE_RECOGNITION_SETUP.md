# Face Recognition Setup Guide

## Models Setup

Face-api.js requires model files to be served from the public directory. You need to download the following models and place them in the `public/models` directory:

1. **tiny_face_detector_model-weights_manifest.json** and **tiny_face_detector_model-shard1**
2. **face_landmark_68_model-weights_manifest.json** and **face_landmark_68_model-shard1**
3. **face_recognition_model-weights_manifest.json** and **face_recognition_model-shard1**

### Download Models

You can download these models from:
- https://github.com/justadudewhohacks/face-api.js-models

Or use the following commands:

```bash
cd billions-gym/public
mkdir -p models
cd models

# Download tiny face detector model
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/tiny_face_detector_model-shard1

# Download face landmark model
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_landmark_68_model-shard1

# Download face recognition model
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_recognition_model-weights_manifest.json
curl -O https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master/face_recognition_model-shard1
```

### Directory Structure

After downloading, your `public/models` directory should look like:

```
public/
  models/
    tiny_face_detector_model-weights_manifest.json
    tiny_face_detector_model-shard1
    face_landmark_68_model-weights_manifest.json
    face_landmark_68_model-shard1
    face_recognition_model-weights_manifest.json
    face_recognition_model-shard1
```

## Features

1. **Face Enrollment**: Members can enroll their face by scanning 3 times
2. **Check-in**: Members can check-in to workout sessions using facial recognition
3. **Check-out**: Members can check-out from workout sessions using facial recognition
4. **History**: View check-in/check-out history

## Usage

1. Navigate to the "Check-in/Check-out" page from the sidebar
2. If you haven't enrolled your face, you'll be prompted to do so (3 scans required)
3. Select a workout session from today's list
4. Position yourself in front of the camera
5. Click "Check-in" or "Check-out" when your face is detected

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: May require HTTPS for camera access
- Mobile browsers: Supported, but performance may vary

## Security Notes

- Face encodings are stored securely on the server
- Face matching uses cosine similarity with a threshold of 0.6
- Camera access requires user permission
- All API calls require authentication

