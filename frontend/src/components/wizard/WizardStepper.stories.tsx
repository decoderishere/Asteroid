import type { Meta, StoryObj } from '@storybook/react';
import { WizardStepper } from './WizardStepper';

const meta: Meta<typeof WizardStepper> = {
  title: 'Components/Wizard/WizardStepper',
  component: WizardStepper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const steps = [
  {
    id: 'project-info',
    title: 'Información del Proyecto',
    description: 'Datos básicos del proyecto BESS',
  },
  {
    id: 'document-types',
    title: 'Tipos de Documento',
    description: 'Selecciona los documentos a generar',
  },
  {
    id: 'requirements',
    title: 'Requisitos',
    description: 'Define requisitos específicos',
  },
  {
    id: 'files',
    title: 'Archivos',
    description: 'Sube archivos de soporte',
  },
  {
    id: 'settings',
    title: 'Configuración',
    description: 'Configuración de generación',
  },
  {
    id: 'review',
    title: 'Revisión',
    description: 'Revisa y confirma la información',
  },
];

export const FirstStep: Story = {
  args: {
    steps,
    currentStep: 0,
    completedSteps: [],
    onStepClick: (stepIndex) => console.log('Clicked step:', stepIndex),
  },
};

export const MiddleStep: Story = {
  args: {
    steps,
    currentStep: 2,
    completedSteps: [0, 1],
    onStepClick: (stepIndex) => console.log('Clicked step:', stepIndex),
  },
};

export const LastStep: Story = {
  args: {
    steps,
    currentStep: 5,
    completedSteps: [0, 1, 2, 3, 4],
    onStepClick: (stepIndex) => console.log('Clicked step:', stepIndex),
  },
};

export const AllCompleted: Story = {
  args: {
    steps,
    currentStep: 5,
    completedSteps: [0, 1, 2, 3, 4, 5],
    onStepClick: (stepIndex) => console.log('Clicked step:', stepIndex),
  },
};

export const NonInteractive: Story = {
  args: {
    steps,
    currentStep: 2,
    completedSteps: [0, 1],
    // No onStepClick prop makes it non-interactive
  },
};