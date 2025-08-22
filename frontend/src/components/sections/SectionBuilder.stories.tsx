import type { Meta, StoryObj } from '@storybook/react';
import { SectionBuilder } from './SectionBuilder';
import type { SectionProgressData } from '../../hooks/useSectionProgress';

const meta: Meta<typeof SectionBuilder> = {
  title: 'Components/Sections/SectionBuilder',
  component: SectionBuilder,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSections: SectionProgressData[] = [
  {
    id: 'executive-summary',
    title: 'Resumen Ejecutivo',
    description: 'Síntesis general del proyecto y sus características principales',
    category: 'overview',
    priority: 'high',
    requiredInputs: [
      {
        id: 'project-overview',
        label: 'Descripción general del proyecto',
        type: 'textarea',
        required: true,
        isResolved: true,
        value: 'Sistema BESS de 50 MWh para estabilización de red eléctrica',
      },
      {
        id: 'project-objectives',
        label: 'Objetivos del proyecto',
        type: 'textarea',
        required: true,
        isResolved: true,
        value: 'Mejorar la estabilidad de la red y integrar energías renovables',
      },
      {
        id: 'investment-amount',
        label: 'Monto de inversión (USD)',
        type: 'number',
        required: true,
        isResolved: false,
      },
    ],
    estimatedTime: 30,
    dependencies: [],
  },
  {
    id: 'technical-description',
    title: 'Descripción Técnica',
    description: 'Especificaciones técnicas detalladas del sistema BESS',
    category: 'technical',
    priority: 'high',
    requiredInputs: [
      {
        id: 'battery-technology',
        label: 'Tecnología de baterías',
        type: 'select',
        required: true,
        isResolved: true,
        value: 'lithium-ion',
        options: [
          { value: 'lithium-ion', label: 'Litio-Ion' },
          { value: 'sodium-ion', label: 'Sodio-Ion' },
          { value: 'flow-battery', label: 'Batería de Flujo' },
        ],
      },
      {
        id: 'storage-capacity',
        label: 'Capacidad de almacenamiento (MWh)',
        type: 'number',
        required: true,
        isResolved: true,
        value: '50',
      },
      {
        id: 'power-rating',
        label: 'Potencia nominal (MW)',
        type: 'number',
        required: true,
        isResolved: false,
      },
      {
        id: 'technical-specs',
        label: 'Especificaciones técnicas adicionales',
        type: 'file',
        required: true,
        isResolved: false,
      },
    ],
    estimatedTime: 60,
    dependencies: ['executive-summary'],
  },
  {
    id: 'environmental-impact',
    title: 'Impacto Ambiental',
    description: 'Evaluación de impactos ambientales y medidas de mitigación',
    category: 'environmental',
    priority: 'high',
    requiredInputs: [
      {
        id: 'site-location',
        label: 'Ubicación del sitio',
        type: 'text',
        required: true,
        isResolved: true,
        value: 'Santiago, Región Metropolitana',
      },
      {
        id: 'environmental-baseline',
        label: 'Línea base ambiental',
        type: 'file',
        required: true,
        isResolved: false,
      },
      {
        id: 'impact-assessment',
        label: 'Evaluación de impactos',
        type: 'textarea',
        required: true,
        isResolved: false,
      },
      {
        id: 'mitigation-measures',
        label: 'Medidas de mitigación',
        type: 'textarea',
        required: true,
        isResolved: false,
      },
    ],
    estimatedTime: 120,
    dependencies: ['technical-description'],
  },
  {
    id: 'regulatory-compliance',
    title: 'Cumplimiento Regulatorio',
    description: 'Análisis de normativas aplicables y requisitos de cumplimiento',
    category: 'legal',
    priority: 'medium',
    requiredInputs: [
      {
        id: 'applicable-regulations',
        label: 'Normativas aplicables',
        type: 'checklist',
        required: true,
        isResolved: true,
        value: ['ley-20920', 'ds-1338'],
        options: [
          { value: 'ley-20920', label: 'Ley 20.920 (Gestión de Residuos)' },
          { value: 'ds-1338', label: 'DS 1338 (Reglamento SEIA)' },
          { value: 'nch-elec', label: 'NCh Elec (Normas Eléctricas)' },
        ],
      },
      {
        id: 'compliance-matrix',
        label: 'Matriz de cumplimiento',
        type: 'file',
        required: true,
        isResolved: false,
      },
    ],
    estimatedTime: 90,
    dependencies: ['environmental-impact'],
  },
  {
    id: 'financial-analysis',
    title: 'Análisis Financiero',
    description: 'Evaluación económica y financiera del proyecto',
    category: 'financial',
    priority: 'low',
    requiredInputs: [
      {
        id: 'capex',
        label: 'Inversión inicial (CAPEX)',
        type: 'number',
        required: true,
        isResolved: false,
      },
      {
        id: 'opex',
        label: 'Costos operacionales (OPEX)',
        type: 'number',
        required: true,
        isResolved: false,
      },
      {
        id: 'revenue-projections',
        label: 'Proyecciones de ingresos',
        type: 'file',
        required: false,
        isResolved: false,
      },
    ],
    estimatedTime: 45,
    dependencies: ['technical-description'],
  },
];

export const Default: Story = {
  args: {
    sections: mockSections,
    onSectionUpdate: (sectionId, inputId, value) => {
      console.log('Section update:', { sectionId, inputId, value });
    },
    onNavigateToInput: (sectionId, inputId) => {
      console.log('Navigate to input:', { sectionId, inputId });
    },
    onRenderSection: (sectionId) => {
      console.log('Render section:', sectionId);
      return Promise.resolve('Contenido renderizado para la sección: ' + sectionId);
    },
  },
};

export const HighProgress: Story = {
  args: {
    sections: mockSections.map((section, index) => ({
      ...section,
      requiredInputs: section.requiredInputs.map((input, inputIndex) => ({
        ...input,
        isResolved: index < 3 || (index === 3 && inputIndex === 0),
        value: index < 3 || (index === 3 && inputIndex === 0) 
          ? input.value || 'Valor completado' 
          : undefined,
      })),
    })),
    onSectionUpdate: (sectionId, inputId, value) => {
      console.log('Section update:', { sectionId, inputId, value });
    },
    onNavigateToInput: (sectionId, inputId) => {
      console.log('Navigate to input:', { sectionId, inputId });
    },
    onRenderSection: (sectionId) => {
      console.log('Render section:', sectionId);
      return Promise.resolve('Contenido renderizado para la sección: ' + sectionId);
    },
  },
};

export const EmptyState: Story = {
  args: {
    sections: [],
    onSectionUpdate: (sectionId, inputId, value) => {
      console.log('Section update:', { sectionId, inputId, value });
    },
    onNavigateToInput: (sectionId, inputId) => {
      console.log('Navigate to input:', { sectionId, inputId });
    },
    onRenderSection: (sectionId) => {
      console.log('Render section:', sectionId);
      return Promise.resolve('Sin contenido disponible');
    },
  },
};