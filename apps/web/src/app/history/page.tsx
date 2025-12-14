import { auth } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Calendar, ArrowRight, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default async function HistoryPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/signin?callbackUrl=/history');
  }

  if (session.user?.role !== 'ATHLETE') {
    redirect('/dashboard');
  }

  // Get athlete's chat sessions (skip DB for demo users)
  let chatSessions: any[] = [];

  if (!session.user.id.startsWith('demo-')) {
    try {
      chatSessions = await prisma.chatSession.findMany({
        where: {
          athleteId: session.user.id,
        },
        include: {
          Message: {
            orderBy: { createdAt: 'asc' },
            take: 1, // Just get first message for preview
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50, // Last 50 sessions
      });
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      chatSessions = [];
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Chat History
                </h1>
                <p className="mt-2 text-gray-600">
                  Review your past conversations with your AI sports psychology coach
                </p>
              </div>
              <Link href="/dashboard">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  ← Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Sessions</p>
                    <p className="text-3xl font-bold text-gray-900">{chatSessions.length}</p>
                  </div>
                  <MessageCircle className="size-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">This Month</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {chatSessions.filter((s) => {
                        const sessionDate = new Date(s.createdAt);
                        const now = new Date();
                        return sessionDate.getMonth() === now.getMonth() &&
                               sessionDate.getFullYear() === now.getFullYear();
                      }).length}
                    </p>
                  </div>
                  <Calendar className="size-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Messages</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {chatSessions.reduce((total, session) => {
                        return total + (session.messageCount || 0);
                      }, 0)}
                    </p>
                  </div>
                  <Search className="size-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Conversation History</CardTitle>
            </CardHeader>
            <CardContent>
              {chatSessions.length > 0 ? (
                <div className="space-y-4">
                  {chatSessions.map((session) => {
                    const firstMessage = session.messages[0];
                    const previewText = firstMessage
                      ? firstMessage.content.substring(0, 150)
                      : 'No messages';

                    return (
                      <Link
                        key={session.id}
                        href={`/chat?sessionId=${session.id}`}
                        className="block"
                      >
                        <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {session.topic || 'Untitled Session'}
                                </h3>
                                {session.sentiment && (
                                  <Badge
                                    className={
                                      session.sentiment === 'positive'
                                        ? 'bg-green-100 text-green-800'
                                        : session.sentiment === 'negative'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {session.sentiment}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {previewText}
                                {firstMessage && firstMessage.content.length > 150 && '...'}
                              </p>
                              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  {new Date(session.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="size-3" />
                                  {session.messageCount || 0} messages
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="size-5 text-gray-400 mt-1 shrink-0 ml-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="size-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No chat history yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Start your first conversation with your AI sports psychology coach
                  </p>
                  <Link href="/chat">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Start New Chat
                    </button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
