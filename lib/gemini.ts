interface QuestionData {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  subject?: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function generateQuestionsWithGemini(
  prompt: string, 
  count: number = 5
): Promise<QuestionData[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  // Enhanced USMLE-specific prompt
  const systemPrompt = `You are a USMLE question writer with extensive medical knowledge. Generate exactly ${count} high-quality, USMLE Step 1, 2, or 3 style multiple choice questions based on: "${prompt}"

CRITICAL REQUIREMENTS:
1. Write questions that test clinical reasoning, differential diagnosis, and medical decision-making
2. Use realistic patient scenarios with proper medical terminology
3. Include relevant clinical findings, lab values, imaging results when appropriate
4. Each question should have exactly 4 plausible answer choices
5. Make distractors medically reasonable but clearly incorrect
6. Focus on high-yield USMLE topics and commonly tested concepts
7. Use proper medical formatting (vital signs, lab values, etc.)

QUESTION STRUCTURE:
- Start with patient demographics (age, sex) when relevant
- Present chief complaint and history
- Include physical exam findings
- Add relevant diagnostic tests/results
- Ask for most likely diagnosis, next best step, or treatment

DIFFICULTY LEVELS:
- Step 1: Basic science concepts, anatomy, physiology, pathology
- Step 2: Clinical scenarios, diagnosis, treatment, management
- Step 3: Patient management, emergency medicine, outpatient care

Format your response as a valid JSON array with this exact structure:
[
  {
    "question": "Clinical scenario with patient presentation...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Detailed medical explanation with reasoning",
    "subject": "Medical specialty (e.g., Cardiology, Infectious Disease, Surgery)"
  }
]

IMPORTANT: 
- The "correct" field should be the index (0-3) of the correct answer
- Do NOT indicate which option is correct in the question text
- Make all options appear equally plausible
- Ensure medical accuracy and current guidelines
- Generate exactly ${count} questions
- Use proper JSON formatting

EXAMPLE TOPICS TO INCLUDE:
- Cardiology: MI, heart failure, arrhythmias, valvular disease
- Infectious Disease: Pneumonia, UTI, sepsis, meningitis
- Endocrine: Diabetes, thyroid disorders, adrenal disease
- Gastroenterology: IBD, liver disease, GI bleeding
- Neurology: Stroke, seizures, headache, movement disorders
- Surgery: Acute abdomen, trauma, postoperative complications
- Psychiatry: Depression, anxiety, psychosis, substance abuse
- Pediatrics: Development, vaccines, common childhood diseases
- OB/GYN: Pregnancy complications, contraception, gynecologic disorders`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: systemPrompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ]
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid Gemini API key');
      } else if (response.status === 429) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('Gemini API service unavailable. Please try again later.');
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Raw Gemini response:', generatedText);

    // Parse the JSON response
    let questions: QuestionData[];
    try {
      // Clean the response text - remove any markdown formatting or extra text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : generatedText;
      
      questions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Failed to parse questions from Gemini response. The AI response was not in the expected format.');
    }

    // Validate the parsed questions
    if (!Array.isArray(questions)) {
      throw new Error('Generated response is not an array of questions');
    }

    const validatedQuestions: QuestionData[] = [];
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Validate question structure
      if (!q.question || typeof q.question !== 'string') {
        console.warn(`Question ${i} missing or invalid question text`);
        continue;
      }
      
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        console.warn(`Question ${i} missing or invalid options array`);
        continue;
      }
      
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= 4) {
        console.warn(`Question ${i} missing or invalid correct answer index`);
        continue;
      }

      // Ensure all options are strings
      const validOptions = q.options.map(opt => 
        typeof opt === 'string' ? opt : String(opt)
      );

      validatedQuestions.push({
        question: q.question.trim(),
        options: validOptions,
        correct: q.correct,
        explanation: q.explanation || '',
        subject: q.subject || ''
      });
    }

    if (validatedQuestions.length === 0) {
      throw new Error('No valid questions could be generated from the AI response');
    }

    console.log(`Successfully generated ${validatedQuestions.length} valid USMLE questions`);
    return validatedQuestions;

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error generating questions with Gemini:', error.message);
      throw error;
    } else {
      console.error('Unknown error generating questions:', error);
      throw new Error('Unknown error occurred while generating questions');
    }
  }
} 