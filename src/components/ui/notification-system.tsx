import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
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

const notificationColors = {
  success: 'bg-green-500 border-green-500 text-white',
  error: 'bg-red-500 border-red-500 text-white',
  warning: 'bg-yellow-500 border-yellow-500 text-black',
  info: 'bg-blue-500 border-blue-500 text-white',
};

const NotificationItem: React.FC<{ notification: Notification; onRemove: (id: string) => void }> = ({
  notification,
  onRemove,
}) => {
  const Icon = notificationIcons[notification.type];
  const colorClass = notificationColors[notification.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm",
        colorClass
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{notification.title}</h4>
        {notification.message && (
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
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

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
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
    <div className="fixed top-4 right-4 z-50 space-y-2">
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
      duration: 4000,
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'error',
      title,
      message,
      duration: 6000,
    });
  }, [addNotification]);

  const notifyWarning = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000,
    });
  }, [addNotification]);

  const notifyInfo = useCallback((title: string, message?: string) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
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
