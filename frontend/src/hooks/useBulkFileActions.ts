/**
 * Hook for bulk file operations
 * Handles selection, batch actions, and state management
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

export interface BulkFileSelection {
  selectedIds: Set<string>;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  selectedCount: number;
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: Array<{ fileId: string; error: string }>;
}

interface UseBulkFileActionsOptions {
  onDelete?: (fileIds: string[], isHard?: boolean) => Promise<BulkActionResult>;
  onRestore?: (fileIds: string[]) => Promise<BulkActionResult>;
  onDownload?: (fileIds: string[]) => Promise<void>;
  onMove?: (fileIds: string[], category: string) => Promise<BulkActionResult>;
}

interface UseBulkFileActionsReturn {
  selection: BulkFileSelection;
  toggleSelection: (fileId: string) => void;
  toggleAllSelection: (fileIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (fileId: string) => boolean;
  
  // Bulk actions
  bulkDelete: (isHard?: boolean) => Promise<void>;
  bulkRestore: () => Promise<void>;
  bulkDownload: () => Promise<void>;
  bulkMove: (category: string) => Promise<void>;
  
  // Action states
  isPerformingAction: boolean;
}

export function useBulkFileActions(
  totalFileIds: string[],
  options: UseBulkFileActionsOptions = {}
): UseBulkFileActionsReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const selection = useMemo((): BulkFileSelection => {
    const selectedCount = selectedIds.size;
    const totalCount = totalFileIds.length;
    
    return {
      selectedIds,
      isAllSelected: selectedCount > 0 && selectedCount === totalCount,
      isPartiallySelected: selectedCount > 0 && selectedCount < totalCount,
      selectedCount,
    };
  }, [selectedIds, totalFileIds.length]);

  const toggleSelection = useCallback((fileId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const toggleAllSelection = useCallback((fileIds: string[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      const allSelected = fileIds.every(id => newSet.has(id));
      
      if (allSelected) {
        // Deselect all
        fileIds.forEach(id => newSet.delete(id));
      } else {
        // Select all
        fileIds.forEach(id => newSet.add(id));
      }
      
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((fileId: string) => {
    return selectedIds.has(fileId);
  }, [selectedIds]);

  const performBulkAction = useCallback(async (
    action: string,
    actionFn: () => Promise<BulkActionResult | void>
  ) => {
    if (selectedIds.size === 0) {
      toast.error('No files selected');
      return;
    }

    setIsPerformingAction(true);
    try {
      const result = await actionFn();
      
      if (result && 'success' in result) {
        const { success, failed, errors } = result;
        
        if (success > 0) {
          toast.success(`${action}: ${success} file${success === 1 ? '' : 's'} processed successfully`);
        }
        
        if (failed > 0) {
          toast.error(`${action}: ${failed} file${failed === 1 ? '' : 's'} failed`);
          errors.forEach(({ error }) => {
            console.error(`Bulk ${action.toLowerCase()} error:`, error);
          });
        }
      } else {
        toast.success(`${action} completed successfully`);
      }
      
      clearSelection();
    } catch (error) {
      toast.error(`${action} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`Bulk ${action.toLowerCase()} error:`, error);
    } finally {
      setIsPerformingAction(false);
    }
  }, [selectedIds.size, clearSelection]);

  const bulkDelete = useCallback(async (isHard = false) => {
    if (!options.onDelete) {
      toast.error('Delete action not available');
      return;
    }

    const action = isHard ? 'Hard Delete' : 'Delete';
    await performBulkAction(action, () => 
      options.onDelete!(Array.from(selectedIds), isHard)
    );
  }, [selectedIds, options.onDelete, performBulkAction]);

  const bulkRestore = useCallback(async () => {
    if (!options.onRestore) {
      toast.error('Restore action not available');
      return;
    }

    await performBulkAction('Restore', () => 
      options.onRestore!(Array.from(selectedIds))
    );
  }, [selectedIds, options.onRestore, performBulkAction]);

  const bulkDownload = useCallback(async () => {
    if (!options.onDownload) {
      toast.error('Download action not available');
      return;
    }

    await performBulkAction('Download', () => 
      options.onDownload!(Array.from(selectedIds))
    );
  }, [selectedIds, options.onDownload, performBulkAction]);

  const bulkMove = useCallback(async (category: string) => {
    if (!options.onMove) {
      toast.error('Move action not available');
      return;
    }

    await performBulkAction('Move', () => 
      options.onMove!(Array.from(selectedIds), category)
    );
  }, [selectedIds, options.onMove, performBulkAction]);

  return {
    selection,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    isSelected,
    bulkDelete,
    bulkRestore,
    bulkDownload,
    bulkMove,
    isPerformingAction,
  };
}