import type { Meta, StoryObj } from '@storybook/react';
import { ProjectInfoStep } from './ProjectInfoStep';

const meta: Meta<typeof ProjectInfoStep> = {
  title: 'Components/Wizard/Steps/ProjectInfoStep',
  component: ProjectInfoStep,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    data: {},
    onUpdate: (data) => console.log('Updated:', data),
    errors: {},
  },
};

export const WithData: Story = {
  args: {
    data: {
      name: 'BESS Proyecto Santiago Norte',
      location: 'Santiago, Región Metropolitana',
      capacity: '50 MWh',
      developer: 'Energía Renovable Chile SpA',
      description: 'Sistema de almacenamiento de baterías para estabilización de red eléctrica y integración de energías renovables en la zona norte de Santiago.',
    },
    onUpdate: (data) => console.log('Updated:', data),
    errors: {},
  },
};

export const WithErrors: Story = {
  args: {
    data: {
      name: '',
      location: 'Santiago',
      capacity: '',
      developer: '',
      description: '',
    },
    onUpdate: (data) => console.log('Updated:', data),
    errors: {
      name: 'El nombre del proyecto es obligatorio',
      capacity: 'La capacidad debe ser un número válido',
      developer: 'El desarrollador es obligatorio',
    },
  },
};

export const PartiallyFilled: Story = {
  args: {
    data: {
      name: 'BESS Valparaíso',
      location: 'Valparaíso, V Región',
      capacity: '',
      developer: '',
      description: 'Proyecto de almacenamiento para el puerto...',
    },
    onUpdate: (data) => console.log('Updated:', data),
    errors: {
      capacity: 'La capacidad es obligatoria',
    },
  },
};