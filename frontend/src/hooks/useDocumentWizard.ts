/**
 * Hook for document wizard state management and navigation
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isOptional?: boolean;
  isCompleted: boolean;
  isValid: boolean;
  canSkip?: boolean;
}

export interface DocumentWizardData {
  projectInfo: {
    name: string;
    location: string;
    developer: string;
    description: string;
  };
  documentType: string;
  requirements: {
    environmentalStudy: boolean;
    technicalSpecs: boolean;
    regulatoryDocs: boolean;
    gridConnection: boolean;
  };
  files: File[];
  settings: {
    language: 'es' | 'en';
    includeReferences: boolean;
    generateThumbnails: boolean;
  };
}

interface UseDocumentWizardOptions {
  onComplete?: (data: DocumentWizardData) => Promise<void>;
  onStepChange?: (stepId: string, stepIndex: number) => void;
  initialData?: Partial<DocumentWizardData>;
}

interface UseDocumentWizardReturn {
  // State
  currentStepIndex: number;
  currentStep: WizardStep;
  steps: WizardStep[];
  data: DocumentWizardData;
  isCompleting: boolean;
  
  // Navigation
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  
  // Data management
  updateData: <K extends keyof DocumentWizardData>(
    section: K,
    data: Partial<DocumentWizardData[K]>
  ) => void;
  validateStep: (stepId: string) => boolean;
  completeWizard: () => Promise<void>;
  
  // Progress
  progress: number;
  completedSteps: number;
  totalSteps: number;
}

const defaultData: DocumentWizardData = {
  projectInfo: {
    name: '',
    location: '',
    developer: '',
    description: '',
  },
  documentType: '',
  requirements: {
    environmentalStudy: false,
    technicalSpecs: false,
    regulatoryDocs: false,
    gridConnection: false,
  },
  files: [],
  settings: {
    language: 'es',
    includeReferences: true,
    generateThumbnails: true,
  },
};

export function useDocumentWizard(options: UseDocumentWizardOptions = {}): UseDocumentWizardReturn {
  const { onComplete, onStepChange, initialData = {} } = options;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<DocumentWizardData>({
    ...defaultData,
    ...initialData,
  });
  const [isCompleting, setIsCompleting] = useState(false);

  // Define wizard steps
  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'project-info',
      title: 'Project Information',
      description: 'Basic details about your BESS project',
      isCompleted: false,
      isValid: false,
    },
    {
      id: 'document-type',
      title: 'Document Type',
      description: 'Select the type of document to generate',
      isCompleted: false,
      isValid: false,
    },
    {
      id: 'requirements',
      title: 'Requirements',
      description: 'Specify what sections to include',
      isCompleted: false,
      isValid: false,
    },
    {
      id: 'file-upload',
      title: 'Supporting Files',
      description: 'Upload relevant documents and files',
      isOptional: true,
      isCompleted: false,
      isValid: true, // Optional step is always valid
      canSkip: true,
    },
    {
      id: 'settings',
      title: 'Generation Settings',
      description: 'Configure output preferences',
      isCompleted: false,
      isValid: false,
    },
    {
      id: 'review',
      title: 'Review & Generate',
      description: 'Review your selections and generate the document',
      isCompleted: false,
      isValid: false,
    },
  ], []);

  // Validation functions for each step
  const validateProjectInfo = useCallback(() => {
    return !!(
      data.projectInfo.name.trim() &&
      data.projectInfo.location.trim() &&
      data.projectInfo.developer.trim()
    );
  }, [data.projectInfo]);

  const validateDocumentType = useCallback(() => {
    return !!data.documentType;
  }, [data.documentType]);

  const validateRequirements = useCallback(() => {
    return Object.values(data.requirements).some(Boolean);
  }, [data.requirements]);

  const validateFileUpload = useCallback(() => {
    // Optional step is always valid
    return true;
  }, []);

  const validateSettings = useCallback(() => {
    return !!(data.settings.language);
  }, [data.settings]);

  const validateReview = useCallback(() => {
    // All previous steps must be valid
    return (
      validateProjectInfo() &&
      validateDocumentType() &&
      validateRequirements() &&
      validateSettings()
    );
  }, [validateProjectInfo, validateDocumentType, validateRequirements, validateSettings]);

  const validators = {
    'project-info': validateProjectInfo,
    'document-type': validateDocumentType,
    'requirements': validateRequirements,
    'file-upload': validateFileUpload,
    'settings': validateSettings,
    'review': validateReview,
  };

  // Update step validation status
  const updatedSteps = useMemo(() => {
    return steps.map(step => {
      const validator = validators[step.id as keyof typeof validators];
      const isValid = validator ? validator() : false;
      const isCompleted = isValid && currentStepIndex > steps.findIndex(s => s.id === step.id);
      
      return {
        ...step,
        isValid,
        isCompleted,
      };
    });
  }, [steps, currentStepIndex, data, validators]);

  const currentStep = updatedSteps[currentStepIndex];

  // Navigation
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
      onStepChange?.(steps[stepIndex].id, stepIndex);
    }
  }, [steps, onStepChange]);

  const canGoNext = useMemo(() => {
    return currentStep.isValid || currentStep.canSkip;
  }, [currentStep]);

  const canGoPrevious = useMemo(() => {
    return currentStepIndex > 0;
  }, [currentStepIndex]);

  const nextStep = useCallback(() => {
    if (canGoNext && currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      goToStep(nextIndex);
      
      if (currentStep.isValid) {
        toast.success(`${currentStep.title} completed`);
      }
    }
  }, [canGoNext, currentStepIndex, steps.length, goToStep, currentStep]);

  const previousStep = useCallback(() => {
    if (canGoPrevious) {
      goToStep(currentStepIndex - 1);
    }
  }, [canGoPrevious, currentStepIndex, goToStep]);

  // Data management
  const updateData = useCallback(<K extends keyof DocumentWizardData>(
    section: K,
    newData: Partial<DocumentWizardData[K]>
  ) => {
    setData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...newData,
      },
    }));
  }, []);

  const validateStep = useCallback((stepId: string) => {
    const validator = validators[stepId as keyof typeof validators];
    return validator ? validator() : false;
  }, [validators]);

  const completeWizard = useCallback(async () => {
    if (!validateReview()) {
      toast.error('Please complete all required steps before generating the document');
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete?.(data);
      toast.success('Document generation started successfully!');
    } catch (error) {
      toast.error(`Failed to generate document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    } finally {
      setIsCompleting(false);
    }
  }, [validateReview, onComplete, data]);

  // Progress calculation
  const completedSteps = updatedSteps.filter(step => step.isCompleted).length;
  const totalSteps = updatedSteps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return {
    // State
    currentStepIndex,
    currentStep,
    steps: updatedSteps,
    data,
    isCompleting,
    
    // Navigation
    goToStep,
    nextStep,
    previousStep,
    canGoNext,
    canGoPrevious,
    
    // Data management
    updateData,
    validateStep,
    completeWizard,
    
    // Progress
    progress,
    completedSteps,
    totalSteps,
  };
}