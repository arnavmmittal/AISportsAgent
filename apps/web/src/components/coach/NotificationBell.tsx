'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shared/ui/popover';
import { Badge } from '@/components/shared/ui/badge';
import { Card } from '@/components/shared/ui/card';

interface Notification {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  athleteId: string;
  athleteName: string;
  createdAt: string;
  read: boolean;
  actionRequired: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coach/notifications?limit=20');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/coach/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-muted-foreground/20 text-muted-foreground border-muted-foreground';
      case 'HIGH':
        return 'bg-muted/20 text-muted-foreground border-muted';
      case 'MEDIUM':
        return 'bg-muted/20 text-muted-foreground border-muted';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative" size="icon">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-background transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notification.type === 'CRISIS_ALERT' ? (
                        <div className="p-2 rounded-full bg-muted-foreground/20">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-full bg-blue-100">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-muted-foreground hover:text-muted-foreground"
                            title="Mark as read"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getSeverityColor(notification.severity)}`}
                        >
                          {notification.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {notification.actionRequired && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full text-muted-foreground border-muted-foreground hover:bg-muted-foreground/10"
                          onClick={() => {
                            window.location.href = `/coach/athletes/${notification.athleteId}`;
                          }}
                        >
                          View Athlete Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                window.location.href = '/coach/insights';
              }}
            >
              View All Alerts
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
