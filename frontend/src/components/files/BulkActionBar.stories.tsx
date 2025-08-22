import type { Meta, StoryObj } from '@storybook/react';
import { BulkActionBar } from './BulkActionBar';

const meta: Meta<typeof BulkActionBar> = {
  title: 'Components/Files/BulkActionBar',
  component: BulkActionBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleFile: Story = {
  args: {
    selectedCount: 1,
    totalCount: 10,
    onSelectAll: () => console.log('Select all'),
    onClearSelection: () => console.log('Clear selection'),
    onBulkDelete: () => console.log('Bulk delete'),
    onBulkRestore: () => console.log('Bulk restore'),
    onBulkDownload: () => console.log('Bulk download'),
    onBulkMove: (category) => console.log('Bulk move to:', category),
    showDeleted: false,
  },
};

export const MultipleFiles: Story = {
  args: {
    selectedCount: 5,
    totalCount: 20,
    onSelectAll: () => console.log('Select all'),
    onClearSelection: () => console.log('Clear selection'),
    onBulkDelete: () => console.log('Bulk delete'),
    onBulkRestore: () => console.log('Bulk restore'),
    onBulkDownload: () => console.log('Bulk download'),
    onBulkMove: (category) => console.log('Bulk move to:', category),
    showDeleted: false,
  },
};

export const AllSelected: Story = {
  args: {
    selectedCount: 15,
    totalCount: 15,
    onSelectAll: () => console.log('Select all'),
    onClearSelection: () => console.log('Clear selection'),
    onBulkDelete: () => console.log('Bulk delete'),
    onBulkRestore: () => console.log('Bulk restore'),
    onBulkDownload: () => console.log('Bulk download'),
    onBulkMove: (category) => console.log('Bulk move to:', category),
    showDeleted: false,
  },
};

export const DeletedFilesMode: Story = {
  args: {
    selectedCount: 3,
    totalCount: 8,
    onSelectAll: () => console.log('Select all'),
    onClearSelection: () => console.log('Clear selection'),
    onBulkDelete: () => console.log('Bulk delete (permanent)'),
    onBulkRestore: () => console.log('Bulk restore'),
    onBulkDownload: () => console.log('Bulk download'),
    onBulkMove: (category) => console.log('Bulk move to:', category),
    showDeleted: true,
  },
};

export const Loading: Story = {
  args: {
    selectedCount: 2,
    totalCount: 10,
    onSelectAll: () => console.log('Select all'),
    onClearSelection: () => console.log('Clear selection'),
    onBulkDelete: () => console.log('Bulk delete'),
    onBulkRestore: () => console.log('Bulk restore'),
    onBulkDownload: () => console.log('Bulk download'),
    onBulkMove: (category) => console.log('Bulk move to:', category),
    showDeleted: false,
    isLoading: true,
  },
};