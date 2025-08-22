import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-64">
      <Select {...args}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una opción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Opción 1</SelectItem>
          <SelectItem value="option2">Opción 2</SelectItem>
          <SelectItem value="option3">Opción 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithValue: Story = {
  render: () => (
    <div className="w-64">
      <Select value="option2">
        <SelectTrigger>
          <SelectValue placeholder="Selecciona una opción" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Opción 1</SelectItem>
          <SelectItem value="option2">Opción 2</SelectItem>
          <SelectItem value="option3">Opción 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const DocumentTypes: Story = {
  render: () => (
    <div className="w-80">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tipo de documento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dia">Declaración de Impacto Ambiental</SelectItem>
          <SelectItem value="eia">Estudio de Impacto Ambiental</SelectItem>
          <SelectItem value="permiso-construccion">Permiso de Construcción</SelectItem>
          <SelectItem value="permiso-operacion">Permiso de Operación</SelectItem>
          <SelectItem value="interconexion">Solicitud de Interconexión</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};