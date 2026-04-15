'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PreGameRoster } from '@/components/coach/game-day/PreGameRoster';
import { format, addDays } from 'date-fns';

function GameDayContent() {
  const searchParams = useSearchParams();
  const gameDate = searchParams.get('date') || format(addDays(new Date(), 2), 'yyyy-MM-dd');
  const gameName = searchParams.get('name') || undefined;
  const opponent = searchParams.get('opponent') || undefined;

  return (
    <PreGameRoster
      sport="all"
      schoolId="default"
      gameDate={gameDate}
      gameName={gameName}
      opponent={opponent}
    />
  );
}

export default function GameDayPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GameDayContent />
    </Suspense>
  );
}
