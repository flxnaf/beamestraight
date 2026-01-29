import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI with backend API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Configure this based on your deployment
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for image data
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Beame Backend API is running' });
});

// Generate straightened teeth image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { imageData, modelName } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Remove data URL prefix if present
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const prompt = `MANDATORY TEETH STRAIGHTENING - EXTREME TRANSFORMATION REQUIRED:

You MUST create a DRAMATIC, HIGHLY EXAGGERATED transformation showing PERFECTLY STRAIGHT, IDEALLY ALIGNED teeth.

CRITICAL REQUIREMENTS:
1. Make ALL teeth PERFECTLY STRAIGHT - eliminate ANY rotation, tilt, or angle
2. Create a FLAWLESS, UNIFORM arch - like a professional Hollywood smile
3. EXAGGERATE the straightness - make it look almost TOO perfect
4. Align all teeth in a PERFECTLY SMOOTH, EVEN curve
5. Remove ALL gaps, crowding, and overlaps completely
6. Make front teeth perfectly centered and symmetrically aligned
7. Ensure teeth appear bright, white, and professionally aligned
8. The result should look like the BEST POSSIBLE outcome from orthodontic treatment

TRANSFORMATION INTENSITY: MAXIMUM
- Don't be subtle - make the change OBVIOUS and DRAMATIC
- If you're unsure, make teeth STRAIGHTER
- The "after" should look like a textbook perfect smile
- Think: celebrity smile, orthodontist's portfolio, ideal dental arch

Keep the natural photo realistic but make the teeth alignment DRAMATICALLY improved and noticeably straighter than the original.`;

    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-2.0-flash-exp' });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    // Look for inline image data in the response
    for (const part of parts) {
      if (part.inlineData) {
        // Return the image data URL directly
        const imageDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return res.json({ 
          success: true, 
          imageDataUrl,
          model: modelName || 'gemini-2.0-flash-exp'
        });
      }
    }

    // If no image data found, return error
    res.status(500).json({ 
      success: false,
      error: 'No image data returned from AI model' 
    });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image', 
      message: error.message 
    });
  }
});

// Classify dental case severity
app.post('/api/classify', async (req, res) => {
  try {
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured on server' });
    }

    // Remove data URL prefix if present
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const prompt = `You are a world-class orthodontist reviewing a patient's photo for clear aligners. 
Your goal is to be realistic and appropriately cautious. DO NOT UNDER-DIAGNOSE.

Most people taking this test have some degree of alignment issues that would benefit from treatment.

CLASSIFICATION RULES (FOLLOW STRICTLY):

1. **MILD** (ONLY for truly excellent teeth - ~10% of cases):
   - Teeth are almost perfectly straight with only the tiniest cosmetic imperfections.
   - Maybe ONE tooth with very minor rotation or spacing.
   - If someone would say "your teeth are already great", it IS MILD.
   - This category is for people who don't really NEED treatment but want perfection.

2. **MODERATE** (DEFAULT - Choose this for ~65% of cases):
   - Visible crowding, spacing, or rotation affecting multiple teeth.
   - Teeth that are noticeably misaligned but not extreme.
   - The typical person seeking aligners falls into this category.
   - If there's ANY noticeable crowding or gaps, choose MODERATE.
   - Overall arch shape is recognizable.

3. **COMPLEX** (Choose for ~23% of cases):
   - Severe overlap where teeth are significantly behind one another.
   - Major gaps or severe crowding.
   - Obvious, significant misalignment requiring extensive movement.
   - Bite issues that are clearly visible.
   - Multiple teeth severely out of position.

4. **URGENT** (RARE - Only ~2% of cases):
   - Extreme cases that may require surgical intervention.
   - Missing teeth or severe damage.
   - Jaw alignment issues visible in the photo.
   - Cases where clear aligners alone might not be sufficient.

IMPORTANT: If in doubt between two categories, choose the MORE SEVERE one.

Respond with ONLY ONE WORD: MILD, MODERATE, COMPLEX, or URGENT.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text().trim().toUpperCase();
    
    // Validate response
    const validCategories = ['MILD', 'MODERATE', 'COMPLEX', 'URGENT'];
    const classification = validCategories.includes(text) ? text : 'MODERATE';

    res.json({ 
      success: true, 
      classification
    });

  } catch (error) {
    console.error('Error classifying case:', error);
    res.status(500).json({ 
      error: 'Failed to classify case', 
      message: error.message,
      fallback: 'MODERATE' // Provide fallback for client
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Beame Backend API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 API Key configured: ${process.env.GEMINI_API_KEY ? '✓ Yes' : '✗ No'}`);
});
