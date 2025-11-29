'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function ChatPage() {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)]">
        <ChatInterface />
      </div>
    </DashboardLayout>
  );
}
