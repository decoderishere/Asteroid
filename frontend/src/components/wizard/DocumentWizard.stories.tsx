import type { Meta, StoryObj } from '@storybook/react';
import { DocumentWizard } from './DocumentWizard';

const meta: Meta<typeof DocumentWizard> = {
  title: 'Components/Wizard/DocumentWizard',
  component: DocumentWizard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onComplete: (data) => {
      console.log('Wizard completed with data:', data);
      alert('¡Asistente completado! Ver consola para los datos.');
    },
    onCancel: () => {
      console.log('Wizard cancelled');
      alert('Asistente cancelado');
    },
  },
};

export const WithInitialData: Story = {
  args: {
    initialData: {
      projectInfo: {
        name: 'BESS Proyecto Santiago Norte',
        location: 'Santiago, Región Metropolitana',
        capacity: '50 MWh',
        developer: 'Energía Renovable Chile SpA',
        description: 'Sistema de almacenamiento de baterías para estabilización de red',
      },
      documentTypes: ['environmental_study', 'construction_permit'],
      requirements: ['grid_connection', 'environmental_assessment'],
      files: [],
      settings: {
        language: 'es',
        generatePdf: true,
        includeAppendices: true,
      },
    },
    onComplete: (data) => {
      console.log('Wizard completed with data:', data);
      alert('¡Asistente completado! Ver consola para los datos.');
    },
    onCancel: () => {
      console.log('Wizard cancelled');
      alert('Asistente cancelado');
    },
  },
};

export const ReadOnlyMode: Story = {
  args: {
    initialData: {
      projectInfo: {
        name: 'BESS Proyecto Valparaíso',
        location: 'Valparaíso, V Región',
        capacity: '100 MWh',
        developer: 'Chile Energy Storage Ltd.',
        description: 'Sistema de almacenamiento para integración de energías renovables',
      },
      documentTypes: ['environmental_study', 'construction_permit', 'operation_permit'],
      requirements: ['grid_connection', 'environmental_assessment', 'municipal_approval'],
      files: [
        {
          id: '1',
          name: 'Estudio Técnico Preliminar.pdf',
          size: 2456789,
          type: 'application/pdf',
        },
        {
          id: '2',
          name: 'Análisis Ambiental.docx',
          size: 1234567,
          type: 'application/docx',
        },
      ],
      settings: {
        language: 'es',
        generatePdf: true,
        includeAppendices: false,
      },
    },
    onComplete: (data) => {
      console.log('Wizard completed with data:', data);
      alert('¡Asistente completado! Ver consola para los datos.');
    },
    onCancel: () => {
      console.log('Wizard cancelled');
      alert('Asistente cancelado');
    },
  },
};