import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  topBar: React.ReactNode;
  bottomBar: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  leftSidebar,
  rightSidebar,
  mainContent,
  topBar,
  bottomBar,
}) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Mobile Top Bar */}
        <div className="h-16 bg-noir-dark border-b border-noir-light flex items-center justify-between px-4 sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <Sheet open={leftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="p-4">
                  {leftSidebar}
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-bold text-mafia-gold font-playfair">FIVE FAMILIES</h1>
          </div>
          
          <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <div className="p-4">
                {rightSidebar}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile Main Content */}
        <div className="flex-1 relative">
          {mainContent}
        </div>

        {/* Mobile Bottom Bar */}
        <div className="h-12 bg-noir-dark border-t border-noir-light flex items-center justify-between px-4 sticky bottom-0 z-50">
          {bottomBar}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* Left Sidebar - Desktop */}
        <motion.div
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-80 p-4 bg-gradient-to-b from-noir-dark via-background to-noir-dark border-r border-noir-light overflow-y-auto"
        >
          {leftSidebar}
        </motion.div>
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <motion.div
            initial={{ y: -64 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-16 bg-noir-dark border-b border-noir-light flex items-center justify-between px-6"
          >
            {topBar}
          </motion.div>
          
          {/* Game Board */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 p-4 bg-gradient-to-br from-background via-noir-dark/20 to-background relative"
          >
            {mainContent}
          </motion.div>
          
          {/* Bottom Status Bar */}
          <motion.div
            initial={{ y: 48 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-12 bg-noir-dark border-t border-noir-light flex items-center justify-between px-6"
          >
            {bottomBar}
          </motion.div>
        </div>
        
        {/* Right Sidebar - Desktop */}
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-80 p-4 bg-gradient-to-b from-noir-dark via-background to-noir-dark border-l border-noir-light overflow-y-auto"
        >
          {rightSidebar}
        </motion.div>
      </div>
    </div>
  );
};

// Mobile-specific components
export const MobileTabBar: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    content: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex bg-noir-dark border-t border-noir-light">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors",
            activeTab === tab.id
              ? "text-mafia-gold bg-noir-dark/50"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.icon}
          <span className="mt-1">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export const MobileFloatingActionButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}> = ({ onClick, icon, label, position = 'bottom-right' }) => {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4',
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed z-40 bg-mafia-gold hover:bg-mafia-gold/90 text-background rounded-full p-4 shadow-lg",
        positionClasses[position]
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </motion.button>
  );
};

export default ResponsiveLayout;
