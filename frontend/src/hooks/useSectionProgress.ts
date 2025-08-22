/**
 * Hook for tracking section progress and providing navigation helpers
 */

import { useMemo } from 'react';

export interface SectionProgressData {
  sectionId: string;
  title: string;
  requiredInputs: number;
  resolvedInputs: number;
  state: 'pending_inputs' | 'ready_to_render' | 'rendered';
  category: string;
  missingInputs: string[];
}

export interface SectionProgress {
  totalSections: number;
  completedSections: number;
  sectionsInProgress: number;
  pendingSections: number;
  totalInputs: number;
  resolvedInputs: number;
  missingInputs: number;
  overallProgress: number;
  sectionProgress: SectionProgressData[];
  nextIncompleteSection?: SectionProgressData;
  sectionsNeedingAttention: SectionProgressData[];
}

interface UseSectionProgressOptions {
  sortBy?: 'title' | 'progress' | 'category';
  sortOrder?: 'asc' | 'desc';
  filterBy?: 'all' | 'incomplete' | 'complete' | 'pending';
}

interface UseSectionProgressReturn extends SectionProgress {
  // Navigation helpers
  goToNextIncompleteSection: () => void;
  goToSection: (sectionId: string) => void;
  getSectionsByCategory: () => Record<string, SectionProgressData[]>;
  getMostCriticalSections: (count?: number) => SectionProgressData[];
  
  // Progress calculations
  getCategoryProgress: (category: string) => {
    completed: number;
    total: number;
    percentage: number;
  };
  getSectionProgressPercentage: (sectionId: string) => number;
}

export function useSectionProgress(
  sections: SectionProgressData[],
  options: UseSectionProgressOptions = {},
  onNavigateToSection?: (sectionId: string) => void
): UseSectionProgressReturn {
  const { sortBy = 'title', sortOrder = 'asc', filterBy = 'all' } = options;

  // Calculate overall progress metrics
  const progress = useMemo((): SectionProgress => {
    const totalSections = sections.length;
    const completedSections = sections.filter(s => s.state === 'rendered').length;
    const sectionsInProgress = sections.filter(s => s.state === 'ready_to_render').length;
    const pendingSections = sections.filter(s => s.state === 'pending_inputs').length;
    
    const totalInputs = sections.reduce((sum, s) => sum + s.requiredInputs, 0);
    const resolvedInputs = sections.reduce((sum, s) => sum + s.resolvedInputs, 0);
    const missingInputs = totalInputs - resolvedInputs;
    
    const overallProgress = totalInputs > 0 ? (resolvedInputs / totalInputs) * 100 : 0;
    
    // Find next incomplete section
    const nextIncompleteSection = sections
      .filter(s => s.state !== 'rendered')
      .sort((a, b) => {
        // Prioritize sections with some progress
        const aProgress = a.resolvedInputs / a.requiredInputs;
        const bProgress = b.resolvedInputs / b.requiredInputs;
        return bProgress - aProgress;
      })[0];

    // Sections needing immediate attention (have some inputs but not complete)
    const sectionsNeedingAttention = sections
      .filter(s => s.resolvedInputs > 0 && s.resolvedInputs < s.requiredInputs)
      .sort((a, b) => {
        const aProgress = a.resolvedInputs / a.requiredInputs;
        const bProgress = b.resolvedInputs / b.requiredInputs;
        return bProgress - aProgress; // Sort by highest progress first
      });

    // Sort and filter sections
    let filteredSections = [...sections];
    
    switch (filterBy) {
      case 'complete':
        filteredSections = sections.filter(s => s.state === 'rendered');
        break;
      case 'incomplete':
        filteredSections = sections.filter(s => s.state !== 'rendered');
        break;
      case 'pending':
        filteredSections = sections.filter(s => s.state === 'pending_inputs');
        break;
    }

    filteredSections.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'progress':
          aValue = a.resolvedInputs / (a.requiredInputs || 1);
          bValue = b.resolvedInputs / (b.requiredInputs || 1);
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'title':
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      totalSections,
      completedSections,
      sectionsInProgress,
      pendingSections,
      totalInputs,
      resolvedInputs,
      missingInputs,
      overallProgress,
      sectionProgress: filteredSections,
      nextIncompleteSection,
      sectionsNeedingAttention,
    };
  }, [sections, sortBy, sortOrder, filterBy]);

  // Navigation helpers
  const goToNextIncompleteSection = () => {
    if (progress.nextIncompleteSection && onNavigateToSection) {
      onNavigateToSection(progress.nextIncompleteSection.sectionId);
    }
  };

  const goToSection = (sectionId: string) => {
    if (onNavigateToSection) {
      onNavigateToSection(sectionId);
    }
  };

  // Group sections by category
  const getSectionsByCategory = () => {
    return sections.reduce((groups, section) => {
      const category = section.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(section);
      return groups;
    }, {} as Record<string, SectionProgressData[]>);
  };

  // Get most critical sections (lowest progress but with some work done)
  const getMostCriticalSections = (count = 3) => {
    return progress.sectionsNeedingAttention.slice(0, count);
  };

  // Calculate progress for a specific category
  const getCategoryProgress = (category: string) => {
    const categorySections = sections.filter(s => s.category === category);
    const completed = categorySections.filter(s => s.state === 'rendered').length;
    const total = categorySections.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return { completed, total, percentage };
  };

  // Get progress percentage for a specific section
  const getSectionProgressPercentage = (sectionId: string) => {
    const section = sections.find(s => s.sectionId === sectionId);
    if (!section || section.requiredInputs === 0) return 0;
    return (section.resolvedInputs / section.requiredInputs) * 100;
  };

  return {
    ...progress,
    goToNextIncompleteSection,
    goToSection,
    getSectionsByCategory,
    getMostCriticalSections,
    getCategoryProgress,
    getSectionProgressPercentage,
  };
}