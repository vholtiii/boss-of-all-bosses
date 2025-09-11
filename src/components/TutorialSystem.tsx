import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Target, 
  DollarSign, 
  Users, 
  Shield,
  Brain,
  Zap,
  CheckCircle
} from 'lucide-react';
import { useSoundSystem } from '@/hooks/useSoundSystem';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
}

interface TutorialSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TutorialSystem: React.FC<TutorialSystemProps> = ({ 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { playSound } = useSoundSystem();

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Ultimate Five Families',
      description: 'Learn the basics of running a mafia empire',
      icon: <BookOpen className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You are the head of the {<span className="font-semibold text-mafia-gold">GAMBINO FAMILY</span>}, 
            one of the five powerful mafia families in New York City.
          </p>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Your Goal:</h4>
            <p className="text-sm">
              Dominate the underworld by controlling 80% of all territory. 
              Manage resources, build businesses, and outmaneuver rival families.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'resources',
      title: 'Managing Resources',
      description: 'Understanding your family\'s assets',
      icon: <DollarSign className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded">
              <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="font-semibold">Money</p>
              <p className="text-xs text-muted-foreground">Your financial resources</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Users className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p className="font-semibold">Soldiers</p>
              <p className="text-xs text-muted-foreground">Your fighting force</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Shield className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold">Respect</p>
              <p className="text-xs text-muted-foreground">Your reputation</p>
            </div>
            <div className="text-center p-3 border rounded">
              <Brain className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="font-semibold">Research</p>
              <p className="text-xs text-muted-foreground">Technology points</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep an eye on these resources - they determine your family's power and influence.
          </p>
        </div>
      ),
    },
    {
      id: 'combat',
      title: 'Combat System',
      description: 'How to expand your territory',
      icon: <Target className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded">
              <Target className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-semibold">Attack Territory</p>
                <p className="text-xs text-muted-foreground">Launch attacks on rival families</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-semibold">Train Soldiers</p>
                <p className="text-xs text-muted-foreground">Improve your fighting force</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">Upgrade Equipment</p>
                <p className="text-xs text-muted-foreground">Better weapons and armor</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Combat actions cost money and soldiers. Higher risk means higher rewards!
          </p>
        </div>
      ),
    },
    {
      id: 'economy',
      title: 'Economic Management',
      description: 'Building your financial empire',
      icon: <DollarSign className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 border rounded">
              <h4 className="font-semibold mb-2">Investment Opportunities</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Stock Market</span>
                  <Badge variant="default" className="text-xs">Low Risk</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Real Estate</span>
                  <Badge variant="secondary" className="text-xs">Medium Risk</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cryptocurrency</span>
                  <Badge variant="destructive" className="text-xs">High Risk</Badge>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Invest wisely to grow your wealth. Higher risk investments offer better returns.
          </p>
        </div>
      ),
    },
    {
      id: 'technology',
      title: 'Research & Development',
      description: 'Advancing your family\'s capabilities',
      icon: <Zap className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 border rounded">
              <h4 className="font-semibold mb-2">Available Technologies</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Wiretapping</span>
                  <span className="text-xs text-muted-foreground">$15,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Armored Vehicles</span>
                  <span className="text-xs text-muted-foreground">$25,000</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Research new technologies to gain advantages over your rivals. 
            Each technology provides unique benefits.
          </p>
        </div>
      ),
    },
    {
      id: 'victory',
      title: 'Victory Conditions',
      description: 'How to win the game',
      icon: <CheckCircle className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              🏆 Ultimate Victory
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Control 80% of all territory to become the Ultimate Boss of All Bosses!
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Key Strategies:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Balance aggressive expansion with resource management</li>
              <li>• Invest in technology to gain advantages</li>
              <li>• Manage your reputation and police heat</li>
              <li>• Adapt to changing market conditions</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
      playSound('click');
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      playSound('click');
    }
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    playSound('success');
    onComplete();
  };

  const handleSkip = () => {
    playSound('click');
    onClose();
  };

  const progress = ((currentStep + 1) / tutorialSteps.length) * 100;
  const currentStepData = tutorialSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStepData.icon}
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {currentStepData.description}
              </p>
              {currentStepData.content}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
              >
                <X className="h-4 w-4 mr-1" />
                Skip Tutorial
              </Button>
            </div>

            <div className="flex gap-2">
              {currentStepData.action && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={currentStepData.action.onClick}
                >
                  {currentStepData.action.text}
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TutorialSystem;
