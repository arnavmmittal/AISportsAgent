/**
 * AthleteGrid Component
 * Responsive grid of athlete cards
 */

import { Athlete } from '@/types/coach-portal';
import AthleteCard from './AthleteCard';
import { EmptyAthleteList } from '../ui/EmptyState';

interface AthleteGridProps {
  athletes: Athlete[];
  onAthleteClick?: (athlete: Athlete) => void;
}

export default function AthleteGrid({ athletes, onAthleteClick }: AthleteGridProps) {
  if (athletes.length === 0) {
    return <EmptyAthleteList />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {athletes.map((athlete) => (
        <AthleteCard
          key={athlete.id}
          athlete={athlete}
          onClick={onAthleteClick ? () => onAthleteClick(athlete) : undefined}
        />
      ))}
    </div>
  );
}
