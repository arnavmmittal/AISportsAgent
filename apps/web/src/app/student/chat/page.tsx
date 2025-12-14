'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Lightbulb,
  Heart,
  Trophy,
  BookOpen,
  Clock,
} from 'lucide-react';

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

const QUICK_TOPICS = [
  { icon: Heart, label: 'Pre-Game Anxiety', color: 'text-pink-600 bg-pink-50' },
  { icon: Trophy, label: 'Building Confidence', color: 'text-yellow-600 bg-yellow-50' },
  { icon: Lightbulb, label: 'Mental Toughness', color: 'text-purple-600 bg-purple-50' },
  { icon: BookOpen, label: 'Visualization', color: 'text-blue-600 bg-blue-50' },
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            AI Mental Performance Coach
          </h1>
          <p className="text-gray-600 mt-1">Evidence-based sports psychology guidance, 24/7</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Online
        </Badge>
      </div>

      {/* Quick Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Topics</CardTitle>
          <CardDescription>Common mental performance areas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.label}
                  onClick={() => handlePromptClick(`Help me with ${topic.label.toLowerCase()}`)}
                  className={`p-3 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all ${topic.color}`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium text-center">{topic.label}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chat Container */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Mental Performance Coach</CardTitle>
              <CardDescription className="text-xs">Powered by sports psychology research</CardDescription>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div className={`flex-1 max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          {/* Suggested Prompts */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500 w-full">Suggested:</span>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your message... (Press Enter to send)"
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            For crisis support, contact your coach or call the National Suicide Prevention Lifeline: 988
          </p>
        </div>
      </Card>
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
