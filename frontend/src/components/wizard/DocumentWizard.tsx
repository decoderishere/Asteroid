/**
 * Enhanced document wizard with stepper, validation, and toast notifications
 */

import React from 'react';
import { ArrowLeft, ArrowRight, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentWizard, type DocumentWizardData } from '@/hooks/useDocumentWizard';
import { WizardStepper } from './WizardStepper';
import { ProjectInfoStep } from './steps/ProjectInfoStep';
import { DocumentTypeStep } from './steps/DocumentTypeStep';
import { RequirementsStep } from './steps/RequirementsStep';
import { FileUploadStep } from './steps/FileUploadStep';
import { SettingsStep } from './steps/SettingsStep';
import { ReviewStep } from './steps/ReviewStep';
import { cn } from '@/lib/utils';

interface DocumentWizardProps {
  onComplete?: (data: DocumentWizardData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<DocumentWizardData>;
  className?: string;
}

export function DocumentWizard({
  onComplete,
  onCancel,
  initialData,
  className,
}: DocumentWizardProps) {
  const wizard = useDocumentWizard({
    onComplete,
    initialData,
    onStepChange: (stepId, stepIndex) => {
      console.log(`Navigated to step: ${stepId} (${stepIndex})`);
    },
  });

  const renderStepContent = () => {
    switch (wizard.currentStep.id) {
      case 'project-info':
        return (
          <ProjectInfoStep
            data={wizard.data.projectInfo}
            onUpdate={(data) => wizard.updateData('projectInfo', data)}
            isValid={wizard.currentStep.isValid}
          />
        );
      
      case 'document-type':
        return (
          <DocumentTypeStep
            selectedType={wizard.data.documentType}
            onUpdate={(documentType) => wizard.updateData('documentType', documentType)}
            isValid={wizard.currentStep.isValid}
          />
        );
      
      case 'requirements':
        return (
          <RequirementsStep
            requirements={wizard.data.requirements}
            onUpdate={(requirements) => wizard.updateData('requirements', requirements)}
            isValid={wizard.currentStep.isValid}
          />
        );
      
      case 'file-upload':
        return (
          <FileUploadStep
            files={wizard.data.files}
            onUpdate={(files) => wizard.updateData('files', files)}
            isOptional={wizard.currentStep.isOptional}
          />
        );
      
      case 'settings':
        return (
          <SettingsStep
            settings={wizard.data.settings}
            onUpdate={(settings) => wizard.updateData('settings', settings)}
            isValid={wizard.currentStep.isValid}
          />
        );
      
      case 'review':
        return (
          <ReviewStep
            data={wizard.data}
            onGenerate={wizard.completeWizard}
            isGenerating={wizard.isCompleting}
            isValid={wizard.currentStep.isValid}
          />
        );
      
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className={cn('max-w-6xl mx-auto space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Document Generation Wizard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Generate professional BESS permitting documents for Chile
        </p>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="p-6">
          <WizardStepper
            steps={wizard.steps}
            currentStepIndex={wizard.currentStepIndex}
            onStepClick={wizard.goToStep}
            progress={wizard.progress}
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-500" />
                {wizard.currentStep.title}
                {wizard.currentStep.isOptional && (
                  <Badge variant="secondary">Optional</Badge>
                )}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400">
                {wizard.currentStep.description}
              </p>
            </div>
            
            <Badge
              variant={wizard.currentStep.isValid ? "default" : "destructive"}
              className="ml-4"
            >
              {wizard.currentStep.isValid
                ? wizard.currentStep.isOptional
                  ? 'Complete'
                  : 'Valid'
                : wizard.currentStep.isOptional
                ? 'Skippable'
                : 'Incomplete'
              }
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step validation warning */}
          {!wizard.currentStep.isValid && !wizard.currentStep.isOptional && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete all required fields to continue to the next step.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Step Content */}
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Cancel Button */}
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              
              {/* Step Info */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Step {wizard.currentStepIndex + 1} of {wizard.totalSteps}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Previous Button */}
              <Button
                variant="outline"
                onClick={wizard.previousStep}
                disabled={!wizard.canGoPrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              {/* Next/Complete Button */}
              {wizard.currentStepIndex === wizard.totalSteps - 1 ? (
                <Button
                  onClick={wizard.completeWizard}
                  disabled={!wizard.currentStep.isValid || wizard.isCompleting}
                  className="flex items-center gap-2"
                >
                  {wizard.isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {wizard.isCompleting ? 'Generating...' : 'Generate Document'}
                </Button>
              ) : (
                <Button
                  onClick={wizard.nextStep}
                  disabled={!wizard.canGoNext}
                  className="flex items-center gap-2"
                >
                  {wizard.currentStep.canSkip && !wizard.currentStep.isValid ? 'Skip' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {wizard.completedSteps} of {wizard.totalSteps} steps completed
              </span>
              <span>
                {Math.round(wizard.progress)}% complete
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}