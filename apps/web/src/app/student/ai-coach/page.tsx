'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, AlertTriangle, Phone, Heart } from 'lucide-react';
import { Card } from '@/design-system/components';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { fadeInUp, staggerContainer } from '@/design-system/motion';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      // Call MCP server for AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Pre-game anxiety', text: 'I\'m feeling stressed about an upcoming game' },
    { label: 'Confidence issues', text: 'I\'m struggling with my confidence' },
    { label: 'Balance life', text: 'I need help balancing academics and athletics' },
    { label: 'Visualization', text: 'Tell me about visualization techniques' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <Heart className="w-10 h-10 text-primary-600 dark:text-primary-500" />
                AI Wellness Coach
              </h1>
              <p className="mt-3 text-gray-600 dark:text-gray-400 text-base font-body">
                Private, 24/7 mental performance support
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeInUp}>
            <Card variant="elevated" padding="none" className="h-[calc(100vh-16rem)] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100">Wellness Chat</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-body">Always here to listen</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="p-4 bg-info-50 dark:bg-info-900/20 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-info-600 dark:text-info-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-body">
                    <p className="text-info-900 dark:text-info-100 font-semibold">Your privacy is protected</p>
                    <p className="text-info-700 dark:text-info-300 mt-1">
                      This conversation is private and confidential. If you're experiencing a crisis, please reach out to a mental health professional or call the crisis hotline.
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-primary-600 dark:bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="text-base leading-relaxed font-body">{message.content}</p>
                      <p
                        className={`text-xs mt-2 font-body ${
                          message.role === 'user' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3 font-body">Quick Prompts</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(prompt.text)}
                      className="hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      {prompt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Voice input (coming soon)"
                    className="flex-shrink-0"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-body transition-all"
                  />
                  <Button
                    variant="primary"
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Crisis Resources */}
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-danger-600 dark:text-danger-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-body">
                    <p className="text-danger-900 dark:text-danger-100 font-semibold">Crisis Support Available 24/7</p>
                    <p className="text-danger-700 dark:text-danger-300 mt-1">
                      National Crisis Hotline: <a href="tel:988" className="underline font-semibold hover:text-danger-900 dark:hover:text-danger-100">988</a>
                      {' '} | {' '}
                      Crisis Text Line: Text "HELLO" to <a href="sms:741741" className="underline font-semibold hover:text-danger-900 dark:hover:text-danger-100">741741</a>
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
