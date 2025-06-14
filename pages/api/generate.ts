import type { NextApiRequest, NextApiResponse } from 'next';
import { generateQuestionsWithGemini } from '../../lib/gemini';
import { connectToDatabase } from '../../lib/db';

interface GenerateRequest {
  prompt: string;
  count?: number;
  difficulty?: string;
}

interface GenerateResponse {
  success: boolean;
  questions?: any[];
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { prompt, count = 5, difficulty = 'Medium' }: GenerateRequest = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Valid prompt is required'
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured. Please set GEMINI_API_KEY in environment variables.'
      });
    }

    // Generate questions using Gemini AI
    console.log(`Generating ${count} questions with prompt: "${prompt}"`);
    const generatedQuestions = await generateQuestionsWithGemini(prompt, count);

    if (!generatedQuestions || generatedQuestions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate questions. Please try again.'
      });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Save questions to database
    const savedQuestions = [];
    for (const question of generatedQuestions) {
      try {
        const questionDoc = {
          question: question.question,
          options: JSON.stringify(question.options),
          correct: question.correct,
          explanation: question.explanation || '',
          subject: question.subject || '',
          difficulty: difficulty,
          createdAt: new Date(),
          type: 'ai-generated'
        };

        const result = await db.collection('questions').insertOne(questionDoc);
        
        savedQuestions.push({
          id: result.insertedId,
          ...questionDoc
        });
      } catch (dbError) {
        console.error('Error saving question to database:', dbError);
        // Continue with other questions even if one fails
      }
    }

    console.log(`Successfully generated and saved ${savedQuestions.length} questions`);

    return res.status(200).json({
      success: true,
      questions: savedQuestions,
      message: `Successfully generated ${savedQuestions.length} questions`
    });

  } catch (error) {
    console.error('Error in generate API:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or missing Gemini API key'
        });
      }
      
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return res.status(429).json({
          success: false,
          error: 'API quota exceeded. Please try again later.'
        });
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return res.status(503).json({
          success: false,
          error: 'Network error. Please check your internet connection and try again.'
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
} 