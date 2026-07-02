import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  /** Internal: group key (type + title). When set, grouping logic merges incoming
   *  toasts with the same key fired within GROUP_WINDOW_MS into a single collapsed toast. */
  groupKey?: string;
  /** Internal: child notifications when this toast is a collapsed group. */
  items?: Array<{ title: string; message?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/* Telegram styling: ink color + stamp word per severity (paper base comes
   from the .telegram class). */
const notificationInks = {
  success: { icon: 'text-[hsl(150,50%,24%)]', stamp: 'RECEIVED' },
  error: { icon: 'text-[hsl(8,49%,42%)]', stamp: 'URGENT' },
  warning: { icon: 'text-[hsl(38,60%,30%)]', stamp: 'NOTICE' },
  info: { icon: 'text-[hsl(223,45%,34%)]', stamp: 'MEMO' },
};

const GROUP_WINDOW_MS = 800;
const MAX_VISIBLE_ITEMS = 5;

const NotificationItem: React.FC<{ notification: Notification; onRemove: (id: string) => void }> = ({
  notification,
  onRemove,
}) => {
  const Icon = notificationIcons[notification.type];
  const ink = notificationInks[notification.type];
  const [expanded, setExpanded] = useState(false);
  const items = notification.items || [];
  const isGroup = items.length > 1;
  const visible = expanded ? items : items.slice(0, MAX_VISIBLE_ITEMS);
  const hidden = items.length - visible.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16, y: 4 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 16, y: 4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="telegram relative flex items-start gap-3 p-3 shadow-lg w-full pointer-events-auto"
    >
      <Icon className={cn('h-5 w-5 mt-4 flex-shrink-0', ink.icon)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[8px] tracking-[0.25em] uppercase opacity-60 border-b border-current/20 pb-0.5 mb-1">
          <span>City Wire Service</span>
          <span className={cn('font-bold', ink.icon)}>{ink.stamp}</span>
        </div>
        <h4 className="font-semibold text-sm flex items-center gap-1.5">
          {isGroup ? `${items.length}× ${notification.title}` : notification.title}
          {isGroup && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="ml-auto p-0.5 hover:bg-black/10 rounded"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </h4>
        {!isGroup && notification.message && (
          <p className="text-xs opacity-90 mt-1">{notification.message}</p>
        )}
        {isGroup && (
          <ul className="mt-1 space-y-0.5 text-xs opacity-90">
            {visible.map((it, i) => (
              <li key={i} className="truncate">• {it.message || it.title}</li>
            ))}
            {!expanded && hidden > 0 && (
              <li className="italic opacity-75">+{hidden} more…</li>
            )}
          </ul>
        )}
        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-sm underline hover:no-underline"
          >
            {notification.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Tracks recent toasts by group key for the merging window.
  const groupRegistryRef = useRef<Map<string, { id: string; lastAt: number }>>(new Map());

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const groupKey = `${notification.type}::${notification.title}`;
    const now = Date.now();
    const existing = groupRegistryRef.current.get(groupKey);

    if (existing && now - existing.lastAt < GROUP_WINDOW_MS) {
      // Merge into existing group toast.
      setNotifications(prev => prev.map(n => {
        if (n.id !== existing.id) return n;
        const items = n.items || [{ title: n.title, message: n.message }];
        return {
          ...n,
          items: [...items, { title: notification.title, message: notification.message }],
        };
      }));
      groupRegistryRef.current.set(groupKey, { id: existing.id, lastAt: now });
      return;
    }

    const newNotification: Notification = { ...notification, id, groupKey };
    setNotifications(prev => [...prev, newNotification]);
    groupRegistryRef.current.set(groupKey, { id, lastAt: now });

    const duration = notification.duration || 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const reg = groupRegistryRef.current.get(groupKey);
      if (reg && reg.id === id) groupRegistryRef.current.delete(groupKey);
    }, duration);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    groupRegistryRef.current.clear();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
};

const NotificationContainer: React.FC<{
  notifications: Notification[];
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-2 pointer-events-none w-[320px] max-w-[90vw]"
      style={{
        top: 'calc(var(--top-bar-height, 1rem) + 0.75rem)',
        right: 'calc(var(--right-sidebar-width, 0px) + 0.5rem)',
      }}
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Mafia-themed notification helpers
export const useMafiaNotifications = () => {
  const { addNotification } = useNotifications();

  const notifySuccess = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration: 6000,
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 10000,
    });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000,
    });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 5000,
    });
  }, [addNotification]);

  // Mafia-specific notifications
  const notifyTerritoryCaptured = useCallback((district: string) => {
    notifySuccess(
      "Territory Secured",
      `${district} is now under your control. The family's influence grows stronger.`
    );
  }, [notifySuccess]);

  const notifyBusinessAcquired = useCallback((businessType: string, income: number) => {
    notifySuccess(
      "Business Acquired",
      `New ${businessType} operation generating $${income.toLocaleString()} per turn.`
    );
  }, [notifySuccess]);

  const notifySoldierLost = useCallback((count: number) => {
    notifyError(
      "Soldiers Lost",
      `${count} loyal soldiers have fallen. The family mourns their sacrifice.`
    );
  }, [notifyError]);

  const notifyPoliceRaid = useCallback((district: string) => {
    notifyWarning(
      "Police Raid",
      `The feds are raiding ${district}. Heat levels are rising.`
    );
  }, [notifyWarning]);

  const notifyReputationChange = useCallback((change: number, type: 'respect' | 'fear') => {
    const isPositive = change > 0;
    const typeText = type === 'respect' ? 'Respect' : 'Fear';
    const message = isPositive 
      ? `Your ${typeText} has increased by ${change} points.`
      : `Your ${typeText} has decreased by ${Math.abs(change)} points.`;
    
    addNotification({
      type: isPositive ? 'success' : 'warning',
      title: `${typeText} ${isPositive ? 'Gained' : 'Lost'}`,
      message,
      duration: 4000,
    });
  }, [addNotification]);

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyTerritoryCaptured,
    notifyBusinessAcquired,
    notifySoldierLost,
    notifyPoliceRaid,
    notifyReputationChange,
  };
};
