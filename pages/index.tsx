import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';

interface StepStats {
  step1: number;
  step2: number;
  step3: number;
  aiGenerated: number;
  stepTotal: number;
  total: number;
}

interface Stats {
  questionCounts: StepStats;
  recentScores: Array<{
    score: number;
    total: number;
    percentage: number;
    createdAt: string;
  }>;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ 
    questionCounts: { step1: 0, step2: 0, step3: 0, aiGenerated: 0, stepTotal: 0, total: 0 }, 
    recentScores: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [questionsRes, scoresRes] = await Promise.all([
        fetch('/api/questions?type=stats'),
        fetch('/api/questions?type=scores&limit=5')
      ]);
      
      const questionStats = await questionsRes.json();
      const scores = await scoresRes.json();
      
      setStats({
        questionCounts: questionStats || { step1: 0, step2: 0, step3: 0, aiGenerated: 0, stepTotal: 0, total: 0 },
        recentScores: scores.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>USMLE Prep - Complete Step 1, 2 & 3 Preparation Platform</title>
        <meta name="description" content="Comprehensive USMLE exam preparation for all three steps with real exam questions, AI-generated practice, and instant feedback" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Master All <span className="text-blue-600">USMLE Steps</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Complete preparation platform for USMLE Step 1, Step 2 CK, and Step 3 with 
              real exam questions, AI-generated practice, and comprehensive performance tracking.
            </p>
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">📊 Question Bank Statistics</h3>
              
              {/* Main Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.questionCounts.step1}</div>
                  <div className="text-sm text-gray-600">Step 1</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.questionCounts.step2}</div>
                  <div className="text-sm text-gray-600">Step 2 CK</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.questionCounts.step3}</div>
                  <div className="text-sm text-gray-600">Step 3</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.questionCounts.aiGenerated}</div>
                  <div className="text-sm text-gray-600">AI Generated</div>
                </div>
                <div className="border-l-2 border-gray-200 pl-4">
                  <div className="text-2xl font-bold text-indigo-600">{stats.questionCounts.stepTotal}</div>
                  <div className="text-sm text-gray-600">Step Total</div>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3">
                  <div className="text-3xl font-bold text-indigo-700">{stats.questionCounts.total}</div>
                  <div className="text-sm text-indigo-600 font-semibold">Grand Total</div>
                </div>
              </div>

              {/* Breakdown Explanation */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-semibold text-gray-700 mb-1">📚 Official USMLE Questions</div>
                    <div>Real exam questions from official USMLE sample tests</div>
                    <div className="text-indigo-600 font-medium mt-1">
                      {stats.questionCounts.stepTotal} questions total
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="font-semibold text-gray-700 mb-1">🤖 AI-Generated Questions</div>
                    <div>Custom questions created using Gemini AI</div>
                    <div className="text-orange-600 font-medium mt-1">
                      {stats.questionCounts.aiGenerated} questions total
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* USMLE Steps Overview */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">USMLE Examination Steps</h2>
            
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-blue-600">1</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">USMLE Step 1</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    <strong>Basic Medical Sciences:</strong> Tests your understanding and ability to apply important concepts 
                    of the basic sciences to the practice of medicine. Covers anatomy, behavioral sciences, biochemistry, 
                    microbiology, pathology, pharmacology, and physiology.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <strong className="text-gray-700">Format:</strong> Computer-based test
                    </div>
                    <div>
                      <strong className="text-gray-700">Duration:</strong> 8 hours (7 blocks)
                    </div>
                    <div>
                      <strong className="text-gray-700">Questions:</strong> ~280 multiple-choice
                    </div>
                    <div>
                      <strong className="text-gray-700">Scoring:</strong> Pass/Fail (since 2022)
                    </div>
                  </div>
                </div>
                <div className="lg:w-64 flex flex-col gap-3">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.questionCounts.step1}</div>
                    <div className="text-sm text-gray-600">Practice Questions Available</div>
                  </div>
                  <Link
                    href="/quiz?step=1"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                  >
                    🎯 Practice Step 1
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 2 CK */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-green-600">2</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">USMLE Step 2 CK (Clinical Knowledge)</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    <strong>Clinical Medicine:</strong> Assesses your ability to apply medical knowledge, skills, and 
                    understanding of clinical science essential for patient care. Emphasizes health promotion, 
                    disease prevention, diagnosis, and treatment.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <strong className="text-gray-700">Format:</strong> Computer-based test
                    </div>
                    <div>
                      <strong className="text-gray-700">Duration:</strong> 9 hours (8 blocks)
                    </div>
                    <div>
                      <strong className="text-gray-700">Questions:</strong> ~318 multiple-choice
                    </div>
                    <div>
                      <strong className="text-gray-700">Scoring:</strong> 3-digit score (194-300)
                    </div>
                  </div>
                </div>
                <div className="lg:w-64 flex flex-col gap-3">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.questionCounts.step2}</div>
                    <div className="text-sm text-gray-600">Practice Questions Available</div>
                  </div>
                  <Link
                    href="/quiz?step=2"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                  >
                    🎯 Practice Step 2 CK
                  </Link>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-purple-600">3</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">USMLE Step 3</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    <strong>Clinical Practice:</strong> Assesses whether you can apply medical knowledge and understanding 
                    of biomedical and clinical science essential for unsupervised practice of medicine. Includes 
                    computer-based case simulations (CCS).
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <strong className="text-gray-700">Format:</strong> 2-day computer-based test
                    </div>
                    <div>
                      <strong className="text-gray-700">Duration:</strong> Day 1: 7 hours, Day 2: 9 hours
                    </div>
                    <div>
                      <strong className="text-gray-700">Questions:</strong> ~465 multiple-choice + CCS
                    </div>
                    <div>
                      <strong className="text-gray-700">Scoring:</strong> 3-digit score (194-300)
                    </div>
                  </div>
                </div>
                <div className="lg:w-64 flex flex-col gap-3">
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.questionCounts.step3}</div>
                    <div className="text-sm text-gray-600">Practice Questions Available</div>
                  </div>
                  <Link
                    href="/quiz?step=3"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-center transition-colors"
                  >
                    🎯 Practice Step 3
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Practice Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 mb-16 text-white">
            <h2 className="text-3xl font-bold text-center mb-8">Choose Your Practice Mode</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Link
                href="/quiz?step=1"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 text-center transition-all transform hover:scale-105"
              >
                <div className="text-3xl mb-3">🩺</div>
                <h3 className="text-xl font-bold mb-2">Step 1 Practice</h3>
                <p className="text-sm opacity-90">Basic Medical Sciences</p>
                <div className="mt-3 text-lg font-semibold">{stats.questionCounts.step1} Questions</div>
              </Link>
              
              <Link
                href="/quiz?step=2"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 text-center transition-all transform hover:scale-105"
              >
                <div className="text-3xl mb-3">🏥</div>
                <h3 className="text-xl font-bold mb-2">Step 2 CK Practice</h3>
                <p className="text-sm opacity-90">Clinical Knowledge</p>
                <div className="mt-3 text-lg font-semibold">{stats.questionCounts.step2} Questions</div>
              </Link>
              
              <Link
                href="/quiz?step=3"
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-6 text-center transition-all transform hover:scale-105"
              >
                <div className="text-3xl mb-3">👨‍⚕️</div>
                <h3 className="text-xl font-bold mb-2">Step 3 Practice</h3>
                <p className="text-sm opacity-90">Clinical Practice</p>
                <div className="mt-3 text-lg font-semibold">{stats.questionCounts.step3} Questions</div>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real USMLE Questions</h3>
              <p className="text-gray-600">
                Practice with authentic USMLE sample questions from official sources, covering all three steps comprehensively.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Generated Questions</h3>
              <p className="text-gray-600">
                Supplement your practice with high-quality AI-generated questions that match USMLE style and difficulty.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Feedback</h3>
              <p className="text-gray-600">
                Get immediate explanations for every answer, helping you understand concepts and learn from mistakes.
              </p>
            </div>
          </div>

          {/* Study Topics */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Comprehensive Topic Coverage</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                '🫀 Cardiology',
                '🧠 Neurology', 
                '💊 Pharmacology',
                '🔬 Pathology',
                '🦠 Microbiology',
                '🩺 Internal Medicine',
                '🏥 Surgery',
                '👶 Pediatrics',
                '🤰 OB/GYN',
                '🧬 Biochemistry',
                '🫁 Pulmonology',
                '🩸 Hematology',
                '🧪 Laboratory Medicine',
                '🦴 Orthopedics',
                '👁️ Ophthalmology',
                '👂 ENT'
              ].map((topic, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 text-center text-sm font-medium text-gray-700">
                  {topic}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Tools */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Additional Study Tools</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/admin"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg p-6 text-center transition-all transform hover:scale-105"
              >
                <div className="text-3xl mb-3">🤖</div>
                <h3 className="text-xl font-bold mb-2">AI Question Generator</h3>
                <p className="text-sm opacity-90">Generate custom practice questions on any medical topic</p>
              </Link>
              
              <Link
                href="/quiz"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg p-6 text-center transition-all transform hover:scale-105"
              >
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-xl font-bold mb-2">Mixed Practice</h3>
                <p className="text-sm opacity-90">Practice with questions from all steps combined</p>
              </Link>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Excel in Your USMLE Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of medical students using our comprehensive platform to master all three USMLE steps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quiz?step=1"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Start Step 1 Practice
              </Link>
              <Link
                href="/quiz?step=2"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Start Step 2 CK Practice
              </Link>
              <Link
                href="/quiz?step=3"
                className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Start Step 3 Practice
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 