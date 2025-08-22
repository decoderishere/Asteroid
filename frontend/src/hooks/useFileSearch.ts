/**
 * Hook for file search functionality
 * Searches across file metadata including name, type, content, and tags
 */

import { useMemo, useState } from 'react';

export interface FileSearchData {
  id: string;
  name: string;
  type: string;
  category: 'technical' | 'environmental' | 'regulatory' | 'other';
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  tags: string[];
  content?: string; // Extracted text content for search
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

interface UseFileSearchOptions {
  includeDeleted?: boolean;
  categories?: FileSearchData['category'][];
  sortBy?: 'name' | 'uploadedAt' | 'size' | 'type';
  sortOrder?: 'asc' | 'desc';
}

interface UseFileSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredFiles: FileSearchData[];
  totalFiles: number;
  matchCount: number;
  searchStats: {
    byCategory: Record<string, number>;
    byType: Record<string, number>;
  };
}

export function useFileSearch(
  files: FileSearchData[],
  options: UseFileSearchOptions = {}
): UseFileSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    includeDeleted = false,
    categories,
    sortBy = 'uploadedAt',
    sortOrder = 'desc'
  } = options;

  const filteredFiles = useMemo(() => {
    let result = files;

    // Filter by deletion status
    if (!includeDeleted) {
      result = result.filter(file => !file.isDeleted);
    }

    // Filter by categories
    if (categories && categories.length > 0) {
      result = result.filter(file => categories.includes(file.category));
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(file => {
        // Search in file name
        if (file.name.toLowerCase().includes(query)) return true;
        
        // Search in file type
        if (file.type.toLowerCase().includes(query)) return true;
        
        // Search in category
        if (file.category.toLowerCase().includes(query)) return true;
        
        // Search in tags
        if (file.tags.some(tag => tag.toLowerCase().includes(query))) return true;
        
        // Search in uploader name
        if (file.uploadedBy.toLowerCase().includes(query)) return true;
        
        // Search in extracted content (if available)
        if (file.content && file.content.toLowerCase().includes(query)) return true;
        
        // Search in deletion info (if deleted)
        if (file.isDeleted && file.deletedBy?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    // Sort results
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'uploadedAt':
        default:
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, searchQuery, includeDeleted, categories, sortBy, sortOrder]);

  const searchStats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byType: Record<string, number> = {};

    filteredFiles.forEach(file => {
      byCategory[file.category] = (byCategory[file.category] || 0) + 1;
      byType[file.type] = (byType[file.type] || 0) + 1;
    });

    return { byCategory, byType };
  }, [filteredFiles]);

  return {
    searchQuery,
    setSearchQuery,
    filteredFiles,
    totalFiles: files.length,
    matchCount: filteredFiles.length,
    searchStats,
  };
}