'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { Input } from '@/design-system/components/Input';
import { fadeInUp, staggerContainer } from '@/design-system/motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "I'm feeling anxious about tomorrow's game",
  "How do I improve my pre-game routine?",
  "I made a mistake and can't stop thinking about it",
  "Tips for staying focused during competition",
];

export default function StudentChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI mental performance coach. I'm here to help you with pre-game anxiety, building confidence, staying focused, and developing mental toughness. What's on your mind today?",
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
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Bar - Fixed at top */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-display font-semibold text-gray-900 dark:text-gray-100">
                  Mental Performance Coach
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 font-body">
                  Evidence-based sports psychology, 24/7
                </p>
              </div>
            </div>
            <Badge variant="success" dot>
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Chat Area - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {/* AI Avatar - Left side */}
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    'max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3',
                    'font-body text-sm lg:text-base leading-relaxed',
                    message.role === 'user'
                      ? 'bg-primary-600 dark:bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock
                      className={cn(
                        'w-3 h-3',
                        message.role === 'user'
                          ? 'text-primary-100'
                          : 'text-gray-400 dark:text-gray-500'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs',
                        message.role === 'user'
                          ? 'text-primary-100'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>

                {/* User Avatar - Right side */}
                {message.role === 'user' && (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar - Fixed at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-4 space-y-3">
          {/* Suggested Prompts - Only show initially */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2"
            >
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-full uppercase tracking-wider">
                Quick prompts
              </span>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className={cn(
                    'text-xs lg:text-sm px-3 py-1.5 lg:py-2 rounded-full font-body',
                    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                    'hover:bg-primary-50 dark:hover:bg-primary-900/20',
                    'hover:text-primary-700 dark:hover:text-primary-300',
                    'hover:border-primary-300 dark:hover:border-primary-700',
                    'border border-gray-200 dark:border-gray-700',
                    'transition-all duration-fast active:scale-95'
                  )}
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}

          {/* Input Field */}
          <div className="flex gap-2 lg:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className={cn(
                'flex-1 px-4 py-3 lg:py-3.5 rounded-xl font-body text-sm lg:text-base',
                'bg-gray-50 dark:bg-gray-800',
                'border border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all duration-fast'
              )}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              variant="primary"
              size="icon"
              className="h-12 w-12 lg:h-14 lg:w-14 flex-shrink-0"
            >
              <Send className="w-5 h-5 lg:w-5 lg:h-5" />
            </Button>
          </div>

          {/* Crisis Support Notice */}
          <div className="flex items-start gap-2 px-2">
            <AlertTriangle className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 dark:text-gray-400 font-body">
              Crisis support:{' '}
              <a
                href="tel:988"
                className="text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 font-semibold underline"
              >
                988
              </a>
              {' '} | {' '}
              Text "HELLO" to{' '}
              <a
                href="sms:741741"
                className="text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300 font-semibold underline"
              >
                741741
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock response generator (replace with actual AI API)
function generateMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('nervous')) {
    return "Pre-game anxiety is completely normal and actually shows you care about your performance. Let's work on some strategies:\n\n1. **Breathing Exercise**: Try box breathing - inhale for 4 counts, hold for 4, exhale for 4, hold for 4. This activates your parasympathetic nervous system.\n\n2. **Reframe**: Instead of 'I'm nervous,' try 'I'm excited and ready.' Research shows this cognitive reframe improves performance.\n\n3. **Routine**: Create a consistent pre-game routine. Familiarity reduces uncertainty and anxiety.\n\nWhich of these would you like to explore further?";
  }

  if (lowerMessage.includes('confidence') || lowerMessage.includes('believe')) {
    return "Building confidence is a skill you can develop. Here's what works:\n\n1. **Success Log**: Write down 3 things you did well after each practice/game. Your brain remembers what you focus on.\n\n2. **Process Goals**: Instead of 'win the game,' focus on controllables like 'execute my pre-shot routine.'\n\n3. **Positive Self-Talk**: Replace 'Don't mess up' with 'I've trained for this.'\n\nConfidence comes from preparation meeting opportunity. What area of your game would you like to build confidence in?";
  }

  if (lowerMessage.includes('mistake') || lowerMessage.includes('error')) {
    return "Athletes who ruminate on mistakes actually perform worse. Let's break this pattern:\n\n1. **The 10-Second Rule**: Give yourself 10 seconds to feel frustrated, then move on. Champions have short memories for errors.\n\n2. **Learning Question**: Ask yourself 'What can I learn from this?' This shifts from emotion to growth.\n\n3. **Physical Reset**: Use a physical gesture (adjust your socks, tap your chest) to signal 'that point is over.'\n\nRemember: Michael Jordan missed over 9,000 shots. Mistakes are data, not definitions. What specifically are you struggling to let go of?";
  }

  if (lowerMessage.includes('focus') || lowerMessage.includes('concentrate') || lowerMessage.includes('distracted')) {
    return "Staying focused under pressure is one of the most trainable mental skills:\n\n1. **Attention Cues**: Choose one thing to focus on (e.g., 'follow the ball,' 'feel my feet'). Return to this when distracted.\n\n2. **Present Moment**: Past and future don't exist in competition. If you notice yourself there, say 'be here now' internally.\n\n3. **Pre-Performance Routine**: Triggers automatic focus. Same routine = same focus state.\n\nWhere does your mind typically wander during competition?";
  }

  return "I'm here to help with your mental performance. Whether it's pre-game anxiety, building confidence, handling pressure, or developing mental toughness, we can work on specific strategies tailored to your sport.\n\nWhat specific situation or feeling would you like help with?";
}
