import type { Meta, StoryObj } from '@storybook/react';
import { SectionProgressDashboard } from './SectionProgressDashboard';

const meta: Meta<typeof SectionProgressDashboard> = {
  title: 'Components/Sections/SectionProgressDashboard',
  component: SectionProgressDashboard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LowProgress: Story = {
  args: {
    resolvedCount: 3,
    totalCount: 18,
    onShowMissingInputs: () => console.log('Show missing inputs'),
  },
};

export const MediumProgress: Story = {
  args: {
    resolvedCount: 12,
    totalCount: 18,
    onShowMissingInputs: () => console.log('Show missing inputs'),
  },
};

export const HighProgress: Story = {
  args: {
    resolvedCount: 16,
    totalCount: 18,
    onShowMissingInputs: () => console.log('Show missing inputs'),
  },
};

export const Complete: Story = {
  args: {
    resolvedCount: 18,
    totalCount: 18,
    onShowMissingInputs: () => console.log('Show missing inputs'),
  },
};

export const Empty: Story = {
  args: {
    resolvedCount: 0,
    totalCount: 0,
    onShowMissingInputs: () => console.log('Show missing inputs'),
  },
};