import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Navbar } from '../components/Navbar';
import { GenerateButton } from '../components/GenerateButton';

interface Question {
  id: string;
  question: string;
  options: string;
  correct: number;
  explanation?: string;
  subject?: string;
  difficulty: string;
  createdAt: string;
}

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
}

function QuestionDisplay({ question, questionNumber }: QuestionDisplayProps) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  let options: string[] = [];
  try {
    options = JSON.parse(question.options);
  } catch (error) {
    console.error('Error parsing options:', error);
    options = ['Error loading options'];
  }

  const handleOptionClick = (optionIndex: number) => {
    if (showAnswer) return; // Prevent multiple selections
    
    setSelectedAnswer(optionIndex);
    setShowAnswer(true);
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!showAnswer) {
      return "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
    }
    
    // After clicking, show correct answer in green
    if (optionIndex === question.correct) {
      return "border-green-500 bg-green-100 text-green-800";
    }
    
    // Show selected wrong answer in red
    if (optionIndex === selectedAnswer && optionIndex !== question.correct) {
      return "border-red-500 bg-red-100 text-red-800";
    }
    
    // Other options remain neutral
    return "border-gray-200 bg-gray-50 text-gray-600";
  };

  const getOptionIcon = (optionIndex: number) => {
    if (!showAnswer) return null;
    
    if (optionIndex === question.correct) {
      return (
        <span className="text-green-600 font-bold ml-2">
          ✓
        </span>
      );
    }
    
    if (optionIndex === selectedAnswer && optionIndex !== question.correct) {
      return (
        <span className="text-red-600 font-bold ml-2">
          ✗
        </span>
      );
    }
    
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Question Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-500">
            Question {questionNumber}
          </span>
          {question.subject && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {question.subject}
            </span>
          )}
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
            {question.difficulty}
          </span>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">
          {question.question}
        </h3>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-6">
        {options.map((option, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${getOptionStyle(index)}`}
            onClick={() => handleOptionClick(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOptionClick(index);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1">
                <span className="font-medium text-gray-700 mr-3">
                  {String.fromCharCode(65 + index)}.
                </span>
                <span className="flex-1">{option}</span>
              </div>
              {getOptionIcon(index)}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation - Only shown after clicking */}
      {showAnswer && question.explanation && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <h4 className="font-semibold text-blue-900 mb-2">
            📚 Explanation:
          </h4>
          <p className="text-blue-800 leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {/* Result Summary - Only shown after clicking */}
      {showAnswer && (
        <div className="mt-4 text-center">
          {selectedAnswer === question.correct ? (
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              🎉 Correct Answer!
            </div>
          ) : (
            <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full font-semibold">
              ❌ Incorrect - Correct answer is {String.fromCharCode(65 + question.correct)}
            </div>
          )}
        </div>
      )}

      {/* Instruction text - Only shown before clicking */}
      {!showAnswer && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Click on your answer choice to see the result
          </p>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleQuestionsGenerated = async () => {
    // Fetch only the most recently generated questions
    try {
      const response = await fetch('/api/questions?limit=10&recent=true');
      const data = await response.json();
      
      if (response.ok) {
        setGeneratedQuestions(data);
      } else {
        console.error('Error fetching questions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const clearQuestions = () => {
    setGeneratedQuestions([]);
  };

  return (
    <>
      <Head>
        <title>Generate Questions and Practice - USMLE Prep</title>
        <meta name="description" content="Generate AI-powered USMLE questions and practice instantly" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Generate Questions and Practice
              </h1>
              <p className="text-lg text-gray-600">
                Generate AI-powered USMLE questions and practice them instantly
              </p>
            </div>

            {/* Generate Questions Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  🤖 Generate New Questions
                </h2>
                <p className="text-gray-600">
                  Create personalized USMLE practice questions using AI
                </p>
              </div>
              <GenerateButton onQuestionsGenerated={handleQuestionsGenerated} />
            </div>

            {/* Practice Questions Section */}
            {generatedQuestions.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    📚 Practice Questions ({generatedQuestions.length})
                  </h2>
                  <button
                    onClick={clearQuestions}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    Clear Questions
                  </button>
                </div>

                <div className="space-y-6">
                  {generatedQuestions.map((question, index) => (
                    <QuestionDisplay
                      key={question.id}
                      question={question}
                      questionNumber={index + 1}
                    />
                  ))}
                </div>

                {/* Practice Summary */}
                <div className="mt-8 p-6 bg-blue-50 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Ready for a Full Quiz?
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Take a timed quiz with questions from your question bank
                  </p>
                  <a
                    href="/quiz"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    🎯 Take Full Quiz
                  </a>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-6xl mb-6">🎓</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Ready to Start Practicing?
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Generate your first set of USMLE questions above and start practicing immediately. 
                  Each question comes with detailed explanations to help you learn.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl mb-2">🤖</div>
                    <h4 className="font-semibold text-blue-900">AI-Generated</h4>
                    <p className="text-sm text-blue-700">High-quality questions created by AI</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl mb-2">📚</div>
                    <h4 className="font-semibold text-green-900">Instant Feedback</h4>
                    <p className="text-sm text-green-700">Immediate explanations for learning</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl mb-2">🎯</div>
                    <h4 className="font-semibold text-purple-900">Exam-Style</h4>
                    <p className="text-sm text-purple-700">Realistic USMLE format</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 