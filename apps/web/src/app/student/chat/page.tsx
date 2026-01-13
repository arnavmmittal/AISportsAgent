'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/shared/ui/button';
import {
  MessageSquare,
  Bot,
  User,
  Clock,
  ChevronRight,
  Sparkles,
  Calendar,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Student Chat History Page - Updated with Design System v2.0
 *
 * Features:
 * - List of past chat sessions
 * - Quick access to AI coach
 * - Session summaries and timestamps
 */

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date;
  messageCount: number;
}

export default function StudentChatHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      setIsLoading(true);
      const profileResponse = await fetch('/api/athlete/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success || !profileData.data?.userId) {
        setSessions([]);
        setIsLoading(false);
        return;
      }

      const userId = profileData.data.userId;
      const response = await fetch(`/api/chat/sessions?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const transformedSessions: ChatSession[] = data.data.map((session: any) => ({
            id: session.id,
            title: session.title || 'Chat Session',
            lastMessage: session.lastMessage || 'No messages yet',
            createdAt: new Date(session.createdAt),
            messageCount: session.messageCount || 0,
          }));
          setSessions(transformedSessions);
        }
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading conversations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary" />
            Chat History
          </h1>
          <p className="text-muted-foreground mt-1">
            Review your past conversations with AI Coach
          </p>
        </header>

        {/* Quick Action - New Chat */}
        <button
          onClick={() => router.push('/student/ai-coach')}
          className="w-full card-interactive p-4 flex items-center gap-4 animate-slide-up"
        >
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-foreground">Start New Conversation</div>
            <p className="text-sm text-muted-foreground">Talk to your AI mental performance coach</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Search */}
        {sessions.length > 0 && (
          <div className="relative animate-slide-up">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            />
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="card-elevated p-8 text-center animate-slide-up">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a conversation with your AI coach to see your history here
            </p>
            <Button onClick={() => router.push('/student/ai-coach')}>
              <Bot className="w-4 h-4 mr-2" />
              Talk to AI Coach
            </Button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="card-elevated p-8 text-center animate-slide-up">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">No matches found</h3>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => router.push(`/student/ai-coach?sessionId=${session.id}`)}
                className="w-full card-interactive p-4 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate">{session.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{session.lastMessage}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Tips Section */}
        <section className="p-4 rounded-lg bg-info/5 border border-info/10 animate-slide-up">
          <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-info" />
            Get the Most from AI Coach
          </h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Be specific about what's on your mind</li>
            <li>• Share how you're feeling before games or practices</li>
            <li>• Ask for specific techniques (visualization, breathing, etc.)</li>
            <li>• Return to past conversations to track your progress</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
