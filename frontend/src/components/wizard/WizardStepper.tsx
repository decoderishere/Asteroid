/**
 * Wizard stepper component with progress indication and step navigation
 */

import React from 'react';
import { Check, Circle, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { type WizardStep } from '@/hooks/useDocumentWizard';

interface WizardStepperProps {
  steps: WizardStep[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  progress: number;
  className?: string;
}

export function WizardStepper({
  steps,
  currentStepIndex,
  onStepClick,
  progress,
  className,
}: WizardStepperProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Progress</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Desktop Stepper - Horizontal */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepItem
                step={step}
                index={index}
                isActive={index === currentStepIndex}
                isPast={index < currentStepIndex}
                isFuture={index > currentStepIndex}
                onClick={() => onStepClick?.(index)}
                orientation="horizontal"
              />
              
              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-0.5 transition-colors duration-300',
                      index < currentStepIndex
                        ? 'bg-green-500'
                        : index === currentStepIndex
                        ? 'bg-blue-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile Stepper - Vertical */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <StepItem
              step={step}
              index={index}
              isActive={index === currentStepIndex}
              isPast={index < currentStepIndex}
              isFuture={index > currentStepIndex}
              onClick={() => onStepClick?.(index)}
              orientation="vertical"
            />
            
            {/* Vertical Connector */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-6 bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface StepItemProps {
  step: WizardStep;
  index: number;
  isActive: boolean;
  isPast: boolean;
  isFuture: boolean;
  onClick?: () => void;
  orientation: 'horizontal' | 'vertical';
}

function StepItem({
  step,
  index,
  isActive,
  isPast,
  isFuture,
  onClick,
  orientation,
}: StepItemProps) {
  const isClickable = onClick && (isPast || isActive);

  const stepIcon = () => {
    if (isPast && step.isCompleted) {
      return <Check className="h-5 w-5 text-white" />;
    }
    
    if (isActive) {
      if (!step.isValid && !step.isOptional) {
        return <AlertCircle className="h-5 w-5 text-white" />;
      }
      return <Circle className="h-5 w-5 text-white fill-current" />;
    }
    
    return <span className="text-sm font-medium text-gray-500">{index + 1}</span>;
  };

  const stepStatus = () => {
    if (isPast && step.isCompleted) return 'completed';
    if (isActive && step.isValid) return 'active-valid';
    if (isActive && !step.isValid && !step.isOptional) return 'active-invalid';
    if (isActive) return 'active';
    return 'future';
  };

  const statusColors = {
    completed: 'bg-green-500 border-green-500',
    'active-valid': 'bg-blue-500 border-blue-500',
    'active-invalid': 'bg-red-500 border-red-500',
    active: 'bg-blue-500 border-blue-500',
    future: 'bg-gray-200 border-gray-200 dark:bg-gray-700 dark:border-gray-700',
  };

  const textColors = {
    completed: 'text-green-700 dark:text-green-400',
    'active-valid': 'text-blue-700 dark:text-blue-400',
    'active-invalid': 'text-red-700 dark:text-red-400',
    active: 'text-blue-700 dark:text-blue-400',
    future: 'text-gray-500 dark:text-gray-400',
  };

  const status = stepStatus();

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        orientation === 'horizontal' ? 'flex-col text-center max-w-48' : 'flex-row',
        isClickable && 'cursor-pointer group'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Step Circle */}
      <div
        className={cn(
          'relative flex items-center justify-center w-12 h-12 border-2 rounded-full transition-all duration-200',
          statusColors[status],
          isClickable && 'group-hover:scale-105'
        )}
      >
        {stepIcon()}
        
        {/* Optional indicator */}
        {step.isOptional && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
          >
            ?
          </Badge>
        )}
      </div>

      {/* Step Content */}
      <div className={cn(
        'flex-1',
        orientation === 'horizontal' ? 'space-y-1' : 'space-y-0'
      )}>
        <h3
          className={cn(
            'font-medium transition-colors duration-200',
            textColors[status],
            isClickable && 'group-hover:text-gray-900 dark:group-hover:text-white'
          )}
        >
          {step.title}
          {step.isOptional && (
            <span className="text-gray-400 text-sm ml-1">(optional)</span>
          )}
        </h3>
        
        {orientation === 'vertical' && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {step.description}
          </p>
        )}
      </div>

      {/* Navigation Arrow (mobile only) */}
      {orientation === 'vertical' && isActive && (
        <ChevronRight className="h-5 w-5 text-blue-500" />
      )}
    </div>
  );
}