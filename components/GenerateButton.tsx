import { useState } from 'react';

interface GenerateButtonProps {
  onQuestionsGenerated?: () => void;
}

export function GenerateButton({ onQuestionsGenerated }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [prompt, setPrompt] = useState({
    topic: '',
    count: 5,
    difficulty: 'Medium'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleQuickGenerate = async (topic: string, count: number = 5) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate ${count} USMLE-style multiple choice questions about ${topic}. Each question should have 4 options with one correct answer and include an explanation.`,
          count
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setSuccess(`✅ Successfully generated ${data.questions?.length || count} questions about ${topic}!`);
      onQuestionsGenerated?.();
    } catch (error) {
      console.error('Error generating questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    const customPrompt = prompt.topic || 'general USMLE topics';

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Generate ${prompt.count} ${prompt.difficulty.toLowerCase()} difficulty USMLE-style multiple choice questions about ${customPrompt}. Each question should have 4 options with one correct answer and include a detailed explanation.`,
          count: prompt.count,
          difficulty: prompt.difficulty
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      setSuccess(`✅ Successfully generated ${data.questions?.length || prompt.count} ${prompt.difficulty.toLowerCase()} questions!`);
      setShowPromptForm(false);
      setPrompt({ topic: '', count: 5, difficulty: 'Medium' });
      onQuestionsGenerated?.();
    } catch (error) {
      console.error('Error generating questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const quickTopics = [
    'Cardiology',
    'Neurology', 
    'Pharmacology',
    'Pathology',
    'Microbiology',
    'Anatomy'
  ];

  return (
    <div className="space-y-4">
      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Generate Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Quick Generate:</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {quickTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => handleQuickGenerate(topic)}
              disabled={isGenerating}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Generate Button */}
      <div className="space-y-3">
        <button
          onClick={() => setShowPromptForm(!showPromptForm)}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Questions...
            </>
          ) : (
            <>
              🎯 Custom Generate
            </>
          )}
        </button>
      </div>

      {/* Custom Prompt Form */}
      {showPromptForm && !isGenerating && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <form onSubmit={handleCustomGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic/Subject (Optional)
              </label>
              <input
                type="text"
                value={prompt.topic}
                onChange={(e) => setPrompt(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Cardiovascular system, Infectious diseases..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank for general USMLE questions
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <select
                  value={prompt.count}
                  onChange={(e) => setPrompt(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={3}>3 questions</option>
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                  <option value={20}>20 questions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={prompt.difficulty}
                  onChange={(e) => setPrompt(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Generate Questions
              </button>
              <button
                type="button"
                onClick={() => setShowPromptForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        <p><strong>💡 Tip:</strong> Questions are generated using Gemini 1.5 Flash AI. Make sure your API key is configured in the environment variables.</p>
      </div>
    </div>
  );
} 