'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Brain, LogOut, Sparkles, MessageSquare } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/config/navigation';

interface AppSidebarProps {
  navItems: NavItem[];
  portalLabel: string;
  onSignOut: () => void;
  /** Show "Talk to AI Coach" quick action in footer (student portal) */
  aiCoachHref?: string;
}

export function AppSidebar({ navItems, portalLabel, onSignOut, aiCoachHref }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="overflow-hidden group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap">
              Flow Sports Coach
            </h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{portalLabel}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + '/') ||
                  (item.href.endsWith('/dashboard') && pathname === item.href.replace('/dashboard', ''));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => router.push(item.href)}
                      className={
                        !isActive && item.highlight
                          ? 'text-accent hover:bg-accent/10 hover:text-accent'
                          : undefined
                      }
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {item.badge && !isActive && (
                      <SidebarMenuBadge className="bg-accent/20 text-accent">
                        <Sparkles className="w-3 h-3 mr-0.5" />
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {aiCoachHref && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Talk to AI Coach"
                onClick={() => router.push(aiCoachHref)}
                className="text-primary bg-primary/5 hover:bg-primary/10"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Talk to AI Coach</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={onSignOut}>
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
