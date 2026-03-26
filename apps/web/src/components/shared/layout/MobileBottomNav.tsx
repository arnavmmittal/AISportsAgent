'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/navigation';

interface MobileBottomNavProps {
  items: NavItem[];
  /** Maximum items to show (default 5 for usability) */
  maxItems?: number;
}

export function MobileBottomNav({ items, maxItems = 5 }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = items.slice(0, maxItems);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-[4.5rem] bg-card/95 backdrop-blur-sm border-t border-border z-40 safe-area-bottom"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch justify-around h-full px-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <button
              key={item.href}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 min-h-[48px] py-2 px-1',
                'transition-all duration-200 select-none active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1 transition-transform duration-200',
                isActive && 'scale-110'
              )} />
              <span className={cn(
                'text-[10px] leading-tight',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
