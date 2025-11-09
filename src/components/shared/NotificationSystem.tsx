'use client';

import { useState, useEffect } from 'react';
import type { NotificationType } from '@/lib/types';

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  
  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { message, type, duration = 3000 } = customEvent.detail;
      const id = Date.now().toString();
      
      setNotifications(prev => [...prev, { id, message, type, duration }]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    };
    
    window.addEventListener('show-notification', handleShow);
    return () => window.removeEventListener('show-notification', handleShow);
  }, []);
  
  const typeClasses = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-600'
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notif => (
        <div
          key={notif.id}
          className={`
            ${typeClasses[notif.type]} text-white px-4 py-3 rounded-lg shadow-lg
            animate-slide-in-right max-w-sm
          `}
        >
          {notif.message}
        </div>
      ))}
    </div>
  );
}

// Helper function
export const showNotification = (message: string, type: NotificationType['type']) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('show-notification', { 
      detail: { message, type } 
    }));
  }
};
