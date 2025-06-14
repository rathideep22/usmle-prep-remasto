import { useState, useEffect } from 'react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  subject?: string;
}

interface QuestionCardProps {
  question: Question;
  onAnswer: (questionId: string, selectedAnswer: number, isCorrect: boolean) => void;
  questionNumber: number;
  totalQuestions: number;
  isAnswered?: boolean;
  userAnswer?: number;
}

export default function QuestionCard({ 
  question, 
  onAnswer, 
  questionNumber, 
  totalQuestions,
  isAnswered = false,
  userAnswer
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    if (isAnswered && userAnswer !== undefined) {
      setSelectedAnswer(userAnswer);
      setHasAnswered(true);
      setShowExplanation(true);
    } else {
      setSelectedAnswer(null);
      setHasAnswered(false);
      setShowExplanation(false);
    }
  }, [question.id, isAnswered, userAnswer]);

  const handleOptionClick = (optionIndex: number) => {
    if (hasAnswered) return; // Prevent multiple selections
    
    setSelectedAnswer(optionIndex);
    setHasAnswered(true);
    
    const isCorrect = optionIndex === question.correct;
    onAnswer(question.id, optionIndex, isCorrect);
    
    // Show explanation after a brief delay for better UX
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!hasAnswered) {
      return "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transform hover:scale-[1.02] transition-all duration-200";
    }
    
    // After clicking, show correct answer in green
    if (optionIndex === question.correct) {
      return "border-green-500 bg-green-100 text-green-800 shadow-md";
    }
    
    // Show selected wrong answer in red
    if (optionIndex === selectedAnswer && optionIndex !== question.correct) {
      return "border-red-500 bg-red-100 text-red-800 shadow-md";
    }
    
    // Other options remain neutral
    return "border-gray-200 bg-gray-50 text-gray-600 opacity-60";
  };

  const getOptionIcon = (optionIndex: number) => {
    if (!hasAnswered) return null;
    
    if (optionIndex === question.correct) {
      return (
        <div className="flex items-center">
          <span className="text-green-600 font-bold text-xl mr-2">✓</span>
          <span className="text-green-600 text-sm font-semibold">Correct</span>
        </div>
      );
    }
    
    if (optionIndex === selectedAnswer && optionIndex !== question.correct) {
      return (
        <div className="flex items-center">
          <span className="text-red-600 font-bold text-xl mr-2">✗</span>
          <span className="text-red-600 text-sm font-semibold">Incorrect</span>
        </div>
      );
    }
    
    return null;
  };

  const isCorrectAnswer = selectedAnswer === question.correct;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Question Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </span>
          {question.subject && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
              {question.subject}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Question Text */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </h3>
        </div>

        {/* Answer Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${getOptionStyle(index)}`}
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
                  <span className="font-bold text-lg text-gray-700 mr-4 min-w-[24px]">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span className="flex-1 text-base">{option}</span>
                </div>
                {getOptionIcon(index)}
              </div>
            </div>
          ))}
        </div>

        {/* Result Summary - Shown immediately after clicking */}
        {hasAnswered && (
          <div className="mb-6 text-center">
            {isCorrectAnswer ? (
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-xl font-bold text-lg shadow-md">
                <span className="text-2xl mr-2">🎉</span>
                Excellent! You got it right!
              </div>
            ) : (
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-100 to-red-200 text-red-800 rounded-xl font-bold text-lg shadow-md">
                <span className="text-2xl mr-2">❌</span>
                Incorrect - The correct answer is {String.fromCharCode(65 + question.correct)}
              </div>
            )}
          </div>
        )}

        {/* Explanation Section - Enhanced UI */}
        {showExplanation && question.explanation && (
          <div className="mt-6 animate-fadeIn">
            <div className={`p-6 rounded-xl border-l-4 shadow-lg ${
              isCorrectAnswer 
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-500' 
                : 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-500'
            }`}>
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">💡</span>
                <h4 className={`font-bold text-lg ${
                  isCorrectAnswer ? 'text-green-900' : 'text-blue-900'
                }`}>
                  Explanation
                </h4>
              </div>
              <p className={`text-base leading-relaxed ${
                isCorrectAnswer ? 'text-green-800' : 'text-blue-800'
              }`}>
                {question.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Show placeholder if no explanation available */}
        {showExplanation && !question.explanation && (
          <div className="mt-6 animate-fadeIn">
            <div className="p-6 rounded-xl border-l-4 bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400 shadow-lg">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">⏳</span>
                <h4 className="font-bold text-lg text-gray-700">
                  Explanation
                </h4>
              </div>
              <p className="text-gray-600 text-base leading-relaxed italic">
                Explanation is being generated for this question. Please check back later for detailed insights!
              </p>
            </div>
          </div>
        )}

        {/* Instruction text - Only shown before clicking */}
        {!hasAnswered && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-base">
              💭 Select your answer to see the explanation
            </p>
          </div>
        )}
      </div>

      {/* Add custom CSS for fade-in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
} 