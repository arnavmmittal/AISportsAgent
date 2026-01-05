'use client';

import { useState } from 'react';
import { Send, Mic, AlertTriangle, Phone, Heart } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI Wellness Coach. I\'m here to provide support for your mental performance and wellbeing. What would you like to talk about today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (will be replaced with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Thank you for sharing. I\'m here to help you work through this. Can you tell me more about what\'s been on your mind?',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Wellness Coach</h1>
          <p className="mt-3 text-muted-foreground dark:text-gray-400 text-lg">Private, 24/7 mental performance support</p>
        </div>

        <div className="bg-card dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 h-[calc(100vh-16rem)] flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground dark:text-gray-100">Wellness Chat</h2>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Always here to listen</p>
                </div>
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-900 dark:text-blue-100 font-bold">Your privacy is protected</p>
                <p className="text-blue-700 dark:text-blue-300 mt-1 font-medium">
                  This conversation is private and confidential. If you're experiencing a crisis, please reach out to a mental health professional or call the crisis hotline.
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-base leading-relaxed font-medium">{message.content}</p>
                  <p
                    className={`text-xs mt-2 font-semibold ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl p-4 shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Quick Prompts</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setInput('I\'m feeling stressed about an upcoming game')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all font-bold text-sm"
              >
                Pre-game anxiety
              </button>
              <button
                onClick={() => setInput('I\'m struggling with my confidence')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all font-bold text-sm"
              >
                Confidence issues
              </button>
              <button
                onClick={() => setInput('I need help balancing academics and athletics')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all font-bold text-sm"
              >
                Balance life
              </button>
              <button
                onClick={() => setInput('Tell me about visualization techniques')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all font-bold text-sm"
              >
                Visualization
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all flex-shrink-0 shadow-md"
                title="Voice input (coming soon)"
              >
                <Mic className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-medium transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl transition-all flex-shrink-0 shadow-lg hover:shadow-xl"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Crisis Resources */}
          <div className="p-4 bg-muted-foreground/10 dark:bg-muted-foreground/20 border-t-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground dark:text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-chrome dark:text-chrome font-bold">Crisis Support Available 24/7</p>
                <p className="text-muted-foreground dark:text-chrome mt-1 font-medium">
                  National Crisis Hotline: <a href="tel:988" className="underline font-black hover:text-chrome dark:hover:text-chrome">988</a>
                  {' '} | {' '}
                  Crisis Text Line: Text "HELLO" to <a href="sms:741741" className="underline font-black hover:text-chrome dark:hover:text-chrome">741741</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
