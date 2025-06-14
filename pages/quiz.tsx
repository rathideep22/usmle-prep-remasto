import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar } from '../components/Navbar';
import QuestionCard from '../components/QuestionCard';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
  subject?: string;
  questionNumber?: number;
  step?: string;
}

interface Answer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
}

export default function Quiz() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showNavigation, setShowNavigation] = useState(false);
  const [instantFeedback, setInstantFeedback] = useState(true);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      const step = router.query.step as string;
      setCurrentStep(step || null);
      fetchQuestions(step);
    }
  }, [router.isReady, router.query.step]);

  // Timer effect
  useEffect(() => {
    if (questions.length > 0 && !showFinalResults) {
      const timer = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [questions.length, showFinalResults, startTime]);

  const fetchQuestions = async (step?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/questions';
      const params = new URLSearchParams();
      
      if (step) {
        params.append('step', step);
        params.append('limit', '20'); // Get more questions for step-specific practice
      } else {
        params.append('limit', '15'); // Mixed practice with fewer questions
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      if (data.length === 0) {
        const stepText = step ? `Step ${step}` : '';
        setError(`No ${stepText} questions available. ${step ? 'The database may not have questions for this step yet.' : 'Please generate some questions in the admin panel first.'}`);
        return;
      }

      // Parse options if they are stored as JSON strings
      const parsedQuestions = data.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));

      // For step-specific practice, keep original order; for mixed practice, shuffle
      const finalQuestions = step ? parsedQuestions : parsedQuestions.sort(() => 0.5 - Math.random());
      
      setQuestions(finalQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, selectedAnswer: number, isCorrect: boolean) => {
    const newAnswer: Answer = { questionId, selectedAnswer, isCorrect };
    
    // Update answers map
    setAnswers(prev => new Map(prev.set(questionId, newAnswer)));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleQuestionJump = (index: number) => {
    setCurrentIndex(index);
    setShowNavigation(false);
  };

  const handleSubmitQuiz = async () => {
    const answersArray = Array.from(answers.values());
    if (answersArray.length < questions.length) {
      const unanswered = questions.length - answersArray.length;
      if (!confirm(`You have ${unanswered} unanswered questions. Submit anyway?`)) {
        return;
      }
    }

    const endTime = Date.now();
    const score = answersArray.filter(a => a.isCorrect).length;
    const percentage = (score / questions.length) * 100;
    const duration = Math.round((endTime - startTime) / 1000);

    // Save score to database
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'score',
          score,
          total: questions.length,
          percentage,
          duration,
          step: currentStep
        })
      });
    } catch (error) {
      console.error('Error saving score:', error);
    }

    setShowFinalResults(true);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
    setShowFinalResults(false);
    setError(null);
    setTimeElapsed(0);
    fetchQuestions(currentStep || undefined);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQuestionStatus = (index: number) => {
    const question = questions[index];
    const answer = answers.get(question.id);
    
    if (answer) {
      return answer.isCorrect ? 'correct' : 'incorrect';
    }
    return index === currentIndex ? 'current' : 'unanswered';
  };

  const getCurrentQuestionAnswer = () => {
    const currentQuestion = questions[currentIndex];
    return currentQuestion ? answers.get(currentQuestion.id) : undefined;
  };

  const getProgressStats = () => {
    const answersArray = Array.from(answers.values());
    const correct = answersArray.filter(a => a.isCorrect).length;
    const total = answersArray.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    
    return { correct, total, percentage };
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case '1':
        return {
          title: 'USMLE Step 1 Practice',
          subtitle: 'Basic Medical Sciences',
          color: 'blue',
          icon: '🩺'
        };
      case '2':
        return {
          title: 'USMLE Step 2 CK Practice',
          subtitle: 'Clinical Knowledge',
          color: 'green',
          icon: '🏥'
        };
      case '3':
        return {
          title: 'USMLE Step 3 Practice',
          subtitle: 'Clinical Practice',
          color: 'purple',
          icon: '👨‍⚕️'
        };
      default:
        return {
          title: 'USMLE Mixed Practice',
          subtitle: 'All Steps Combined',
          color: 'indigo',
          icon: '🎯'
        };
    }
  };

  if (loading) {
    const stepInfo = getStepInfo();
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {stepInfo.title} questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const stepInfo = getStepInfo();
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading {stepInfo.title}</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => fetchQuestions(currentStep || undefined)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Try Again
                </button>
                <Link
                  href="/admin"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg inline-block"
                >
                  Generate Questions
                </Link>
                <Link
                  href="/"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg inline-block"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showFinalResults) {
    const answersArray = Array.from(answers.values());
    const score = answersArray.filter(a => a.isCorrect).length;
    const percentage = (score / questions.length) * 100;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const stepInfo = getStepInfo();

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">{stepInfo.icon}</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{stepInfo.title} Complete!</h1>
              <p className="text-gray-600 mb-6">{stepInfo.subtitle}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{score}/{questions.length}</div>
                  <div className="text-sm text-gray-600">Questions Correct</div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                    {percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Score</div>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatTime(duration)}
                  </div>
                  <div className="text-sm text-gray-600">Time Taken</div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {percentage >= 80 && (
                    <p className="text-green-600 font-medium">
                      Excellent work! You have a strong grasp of the {stepInfo.subtitle.toLowerCase()} material.
                    </p>
                  )}
                  {percentage >= 60 && percentage < 80 && (
                    <p className="text-yellow-600 font-medium">
                      Good job! Keep studying {stepInfo.subtitle.toLowerCase()} to improve your score.
                    </p>
                  )}
                  {percentage < 60 && (
                    <p className="text-red-600 font-medium">
                      More practice needed. Review the {stepInfo.subtitle.toLowerCase()} topics and try again.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-x-4">
                <button
                  onClick={resetQuiz}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Take Another {currentStep ? `Step ${currentStep}` : 'Mixed'} Quiz
                </button>
                <Link
                  href="/admin"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
                >
                  Generate More Questions
                </Link>
                <Link
                  href="/"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium inline-block"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const currentAnswer = getCurrentQuestionAnswer();
  const progressStats = getProgressStats();
  const stepInfo = getStepInfo();

  return (
    <>
      <Head>
        <title>{stepInfo.title} - Test Your Knowledge</title>
        <meta name="description" content={`Take ${stepInfo.title} practice quiz with real USMLE questions`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6">
          {/* Quiz Header */}
          <div className="max-w-6xl mx-auto mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{stepInfo.icon}</span>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{stepInfo.title}</h1>
                    <p className="text-sm text-gray-600 font-medium">{stepInfo.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    ⏱️ {formatTime(timeElapsed)}
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    📊 {answers.size}/{questions.length} answered
                  </div>
                  {instantFeedback && progressStats.total > 0 && (
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                      progressStats.percentage >= 80 ? 'bg-green-100 text-green-800' :
                      progressStats.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      🎯 {progressStats.correct}/{progressStats.total} correct ({progressStats.percentage.toFixed(0)}%)
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Question {currentIndex + 1} of {questions.length}
                  {currentQuestion?.questionNumber && (
                    <span className="text-gray-400 ml-2">(Original Q{currentQuestion.questionNumber})</span>
                  )}
                </span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setInstantFeedback(!instantFeedback)}
                    className={`text-xs px-2 py-1 rounded ${
                      instantFeedback 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {instantFeedback ? '✓ Instant Feedback' : 'Instant Feedback Off'}
                  </button>
                  <button
                    onClick={() => setShowNavigation(!showNavigation)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showNavigation ? 'Hide' : 'Show'} Navigation
                  </button>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-${stepInfo.color}-600 h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Navigation Panel */}
            {showNavigation && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Question Navigation</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((_, index) => {
                      const status = getQuestionStatus(index);
                      let buttonClass = "w-8 h-8 text-xs font-medium rounded transition-colors ";
                      
                      switch (status) {
                        case 'current':
                          buttonClass += `bg-${stepInfo.color}-600 text-white`;
                          break;
                        case 'correct':
                          buttonClass += "bg-green-500 text-white";
                          break;
                        case 'incorrect':
                          buttonClass += "bg-red-500 text-white";
                          break;
                        default:
                          buttonClass += "bg-gray-200 text-gray-600 hover:bg-gray-300";
                      }
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleQuestionJump(index)}
                          className={buttonClass}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-3 h-3 bg-${stepInfo.color}-600 rounded`}></div>
                      <span>Current</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Correct</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Incorrect</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-200 rounded"></div>
                      <span>Unanswered</span>
                    </div>
                  </div>

                  {/* Progress Stats */}
                  {progressStats.total > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Progress</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Answered:</span>
                          <span className="font-medium">{progressStats.total}/{questions.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correct:</span>
                          <span className="font-medium text-green-600">{progressStats.correct}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Accuracy:</span>
                          <span className={`font-medium ${getScoreColor(progressStats.percentage)}`}>
                            {progressStats.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Question Area */}
            <div className={showNavigation ? "lg:col-span-3" : "lg:col-span-4"}>
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  questionNumber={currentIndex + 1}
                  totalQuestions={questions.length}
                  isAnswered={currentAnswer !== undefined}
                  userAnswer={currentAnswer?.selectedAnswer}
                />
              )}

              {/* Navigation Controls */}
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6 border border-gray-100">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-medium rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
                  >
                    <span className="mr-2">←</span>
                    Previous
                  </button>

                  <div className="flex items-center space-x-4">
                    {/* Progress indicator */}
                    <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                      {currentIndex + 1} / {questions.length}
                    </div>
                    
                    {currentIndex === questions.length - 1 ? (
                      <button
                        onClick={handleSubmitQuiz}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        🏁 Submit Quiz
                      </button>
                    ) : (
                      <button
                        onClick={handleNext}
                        className={`flex items-center px-6 py-3 bg-gradient-to-r from-${stepInfo.color}-600 to-${stepInfo.color}-700 hover:from-${stepInfo.color}-700 hover:to-${stepInfo.color}-800 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
                      >
                        Next
                        <span className="ml-2">→</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 