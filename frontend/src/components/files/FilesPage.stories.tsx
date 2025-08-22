import type { Meta, StoryObj } from '@storybook/react';
import { FilesPage } from './FilesPage';
import type { FileSearchData } from '../../hooks/useFileSearch';

const meta: Meta<typeof FilesPage> = {
  title: 'Components/Files/FilesPage',
  component: FilesPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockFiles: FileSearchData[] = [
  {
    id: '1',
    name: 'Estudio Impacto Ambiental - BESS Santiago.pdf',
    size: 2456789,
    type: 'application/pdf',
    category: 'environmental',
    uploadedAt: new Date('2024-01-15'),
    tags: ['ambiental', 'santiago', 'bess'],
    metadata: {
      author: 'Consultora Ambiental Ltda.',
      pageCount: 127,
      language: 'es',
    },
    content: 'Contenido del documento ambiental...',
    isDeleted: false,
  },
  {
    id: '2',
    name: 'Planos Técnicos Sistema BESS.dwg',
    size: 5234567,
    type: 'application/dwg',
    category: 'technical',
    uploadedAt: new Date('2024-01-20'),
    tags: ['planos', 'técnico', 'autocad'],
    metadata: {
      version: '2024',
      layers: 15,
    },
    content: 'Planos técnicos del sistema...',
    isDeleted: false,
  },
  {
    id: '3',
    name: 'Permiso Municipal Construcción.pdf',
    size: 1234567,
    type: 'application/pdf',
    category: 'legal',
    uploadedAt: new Date('2024-01-10'),
    tags: ['permiso', 'municipal', 'construcción'],
    metadata: {
      issuer: 'Municipalidad de Santiago',
      validUntil: '2024-12-31',
    },
    content: 'Permiso municipal para construcción...',
    isDeleted: false,
  },
  {
    id: '4',
    name: 'Análisis Financiero Proyecto.xlsx',
    size: 987654,
    type: 'application/xlsx',
    category: 'financial',
    uploadedAt: new Date('2024-01-25'),
    tags: ['financiero', 'análisis', 'excel'],
    metadata: {
      sheets: 8,
      formulas: 245,
    },
    content: 'Análisis financiero del proyecto...',
    isDeleted: false,
  },
  {
    id: '5',
    name: 'Documento Borrador.docx',
    size: 234567,
    type: 'application/docx',
    category: 'other',
    uploadedAt: new Date('2024-01-05'),
    tags: ['borrador', 'temporal'],
    metadata: {
      wordCount: 1250,
    },
    content: 'Documento borrador temporal...',
    isDeleted: true,
  },
];

export const Default: Story = {
  args: {
    files: mockFiles,
    onUpload: (files) => console.log('Upload:', files),
    onDelete: (ids) => console.log('Delete:', ids),
    onRestore: (ids) => console.log('Restore:', ids),
    onDownload: (ids) => console.log('Download:', ids),
    onMove: (ids, category) => console.log('Move:', ids, 'to', category),
  },
};

export const EmptyState: Story = {
  args: {
    files: [],
    onUpload: (files) => console.log('Upload:', files),
    onDelete: (ids) => console.log('Delete:', ids),
    onRestore: (ids) => console.log('Restore:', ids),
    onDownload: (ids) => console.log('Download:', ids),
    onMove: (ids, category) => console.log('Move:', ids, 'to', category),
  },
};

export const WithDeletedFiles: Story = {
  args: {
    files: [
      ...mockFiles,
      {
        id: '6',
        name: 'Documento Eliminado 1.pdf',
        size: 1000000,
        type: 'application/pdf',
        category: 'legal',
        uploadedAt: new Date('2024-01-01'),
        tags: ['eliminado'],
        metadata: {},
        content: 'Contenido eliminado...',
        isDeleted: true,
      },
      {
        id: '7',
        name: 'Documento Eliminado 2.docx',
        size: 500000,
        type: 'application/docx',
        category: 'other',
        uploadedAt: new Date('2024-01-02'),
        tags: ['eliminado'],
        metadata: {},
        content: 'Otro contenido eliminado...',
        isDeleted: true,
      },
    ],
    onUpload: (files) => console.log('Upload:', files),
    onDelete: (ids) => console.log('Delete:', ids),
    onRestore: (ids) => console.log('Restore:', ids),
    onDownload: (ids) => console.log('Download:', ids),
    onMove: (ids, category) => console.log('Move:', ids, 'to', category),
  },
};