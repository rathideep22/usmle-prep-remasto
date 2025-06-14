import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../lib/db';

interface QuestionRequest {
  type?: 'question' | 'score' | 'stats';
  step?: '1' | '2' | '3';
  question?: string;
  options?: string;
  correct?: number;
  explanation?: string;
  subject?: string;
  difficulty?: string;
  score?: number;
  total?: number;
  percentage?: number;
  duration?: number;
  ids?: string[];
  limit?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { type, limit, recent, step } = req.query;
  const { db } = await connectToDatabase();

  if (type === 'stats') {
    // Get question counts for all steps and AI-generated questions
    const step1Count = await db.collection('step1').countDocuments();
    const step2Count = await db.collection('step2').countDocuments();
    const step3Count = await db.collection('step3').countDocuments();
    const aiGeneratedCount = await db.collection('questions').countDocuments();
    
    const stepTotal = step1Count + step2Count + step3Count;
    const grandTotal = stepTotal + aiGeneratedCount;

    return res.status(200).json({
      step1: step1Count,
      step2: step2Count,
      step3: step3Count,
      aiGenerated: aiGeneratedCount,
      stepTotal: stepTotal,
      total: grandTotal
    });
  }

  if (type === 'scores') {
    // Get recent scores from the scores collection
    const scores = await db.collection('scores')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 10)
      .toArray();
    
    return res.status(200).json(scores);
  }

  // Get questions from specific step or all steps
  let questions = [];
  
  if (step) {
    // Get questions from specific step collection
    const collectionName = `step${step}`;
    const stepQuestions = await db.collection(collectionName)
      .find({})
      .sort({ questionNumber: 1 })
      .limit(limit ? parseInt(limit as string) : 0)
      .toArray();
    
    // Transform MongoDB questions to match expected format
    questions = stepQuestions.map(q => ({
      id: q._id.toString(),
      question: q.questionText || '',
      options: JSON.stringify([
        q.optionA || '',
        q.optionB || '',
        q.optionC || '',
        q.optionD || '',
        q.optionE || ''
      ].filter(opt => opt.length > 0)),
      correct: q.correctAnswer || 0,
      explanation: q.explanation || '',
      subject: q.subject || `Step ${step}`,
      difficulty: q.difficulty || 'Medium',
      questionNumber: q.questionNumber,
      step: step
    }));
  } else {
    // Get questions from all steps (mixed mode)
    const collections = ['step1', 'step2', 'step3'];
    const allQuestions = [];
    
    for (const collection of collections) {
      const stepQuestions = await db.collection(collection)
        .find({})
        .sort({ questionNumber: 1 })
        .limit(limit ? Math.ceil(parseInt(limit as string) / 3) : 20)
        .toArray();
      
      const transformedQuestions = stepQuestions.map(q => ({
        id: q._id.toString(),
        question: q.questionText || '',
        options: JSON.stringify([
          q.optionA || '',
          q.optionB || '',
          q.optionC || '',
          q.optionD || '',
          q.optionE || ''
        ].filter(opt => opt.length > 0)),
        correct: q.correctAnswer || 0,
        explanation: q.explanation || '',
        subject: q.subject || `Step ${collection.slice(-1)}`,
        difficulty: q.difficulty || 'Medium',
        questionNumber: q.questionNumber,
        step: collection.slice(-1)
      }));
      
      allQuestions.push(...transformedQuestions);
    }
    
    // Shuffle questions for mixed practice
    questions = allQuestions.sort(() => Math.random() - 0.5);
    
    if (limit) {
      questions = questions.slice(0, parseInt(limit as string));
    }
  }

  return res.status(200).json(questions);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const body: QuestionRequest = req.body;
  const { db } = await connectToDatabase();

  if (body.type === 'score') {
    // Save quiz score
    if (typeof body.score !== 'number' || typeof body.total !== 'number') {
      return res.status(400).json({ error: 'Score and total are required for score submission' });
    }

    const score = await db.collection('scores').insertOne({
      score: body.score,
      total: body.total,
      percentage: body.percentage || (body.score / body.total) * 100,
      duration: body.duration,
      step: body.step || 'mixed',
      createdAt: new Date()
    });

    return res.status(201).json({ 
      id: score.insertedId,
      score: body.score,
      total: body.total,
      percentage: body.percentage || (body.score / body.total) * 100,
      duration: body.duration,
      step: body.step || 'mixed',
      createdAt: new Date()
    });
  }

  // Create AI-generated question (save to questions collection for AI questions)
  if (!body.question || !body.options || typeof body.correct !== 'number') {
    return res.status(400).json({ 
      error: 'Question, options, and correct answer index are required' 
    });
  }

  // Validate options format
  let parsedOptions;
  try {
    if (typeof body.options === 'string') {
      parsedOptions = JSON.parse(body.options);
    } else {
      parsedOptions = body.options;
    }
    
    if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
      throw new Error('Options must be an array of at least 2 items');
    }
  } catch (error) {
    return res.status(400).json({ 
      error: 'Options must be a valid JSON array of at least 2 items' 
    });
  }

  // Validate correct answer index
  if (body.correct < 0 || body.correct >= parsedOptions.length) {
    return res.status(400).json({ 
      error: `Correct answer index must be between 0 and ${parsedOptions.length - 1}` 
    });
  }

  const question = await db.collection('questions').insertOne({
    question: body.question,
    options: typeof body.options === 'string' ? body.options : JSON.stringify(body.options),
    correct: body.correct,
    explanation: body.explanation || '',
    subject: body.subject || '',
    difficulty: body.difficulty || 'Medium',
    createdAt: new Date(),
    type: 'ai-generated'
  });

  return res.status(201).json({
    id: question.insertedId,
    question: body.question,
    options: typeof body.options === 'string' ? body.options : JSON.stringify(body.options),
    correct: body.correct,
    explanation: body.explanation || '',
    subject: body.subject || '',
    difficulty: body.difficulty || 'Medium',
    createdAt: new Date(),
    type: 'ai-generated'
  });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { ids }: QuestionRequest = req.body;
  const { db } = await connectToDatabase();

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of question IDs is required' });
  }

  // Delete AI-generated questions only (not step questions)
  const { ObjectId } = require('mongodb');
  const objectIds = ids.map(id => new ObjectId(id));
  
  const deleteResult = await db.collection('questions').deleteMany({
    _id: { $in: objectIds }
  });

  return res.status(200).json({ 
    message: `Deleted ${deleteResult.deletedCount} questions`,
    count: deleteResult.deletedCount
  });
} 