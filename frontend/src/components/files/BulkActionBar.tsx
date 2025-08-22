/**
 * Bulk action bar for file operations
 */

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  RotateCcw, 
  FolderOpen, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { type BulkFileSelection } from '@/hooks/useBulkFileActions';

interface BulkActionBarProps {
  selection: BulkFileSelection;
  onClearSelection: () => void;
  onBulkDelete: (isHard?: boolean) => Promise<void>;
  onBulkRestore: () => Promise<void>;
  onBulkDownload: () => Promise<void>;
  onBulkMove: (category: string) => Promise<void>;
  isPerformingAction: boolean;
  showDeleted: boolean;
}

const categoryOptions = [
  { value: 'technical', label: 'Technical', icon: '⚙️' },
  { value: 'environmental', label: 'Environmental', icon: '🌱' },
  { value: 'regulatory', label: 'Regulatory', icon: '📋' },
  { value: 'other', label: 'Other', icon: '📄' },
];

export function BulkActionBar({
  selection,
  onClearSelection,
  onBulkDelete,
  onBulkRestore,
  onBulkDownload,
  onBulkMove,
  isPerformingAction,
  showDeleted,
}: BulkActionBarProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    isHard: boolean;
  }>({ open: false, isHard: false });

  const handleDeleteClick = (isHard: boolean) => {
    setDeleteDialog({ open: true, isHard });
  };

  const handleDeleteConfirm = async () => {
    await onBulkDelete(deleteDialog.isHard);
    setDeleteDialog({ open: false, isHard: false });
  };

  return (
    <>
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Selection Info */}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {selection.selectedCount} selected
                </Badge>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {selection.selectedCount === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Download */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBulkDownload}
                  disabled={isPerformingAction}
                  className="flex items-center gap-2"
                >
                  {isPerformingAction ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download
                </Button>

                {/* Move to Category */}
                {!showDeleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPerformingAction}
                        className="flex items-center gap-2"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Move to
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {categoryOptions.map((category) => (
                        <DropdownMenuItem
                          key={category.value}
                          onClick={() => onBulkMove(category.value)}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Restore (only for deleted files) */}
                {showDeleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkRestore}
                    disabled={isPerformingAction}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                  >
                    {isPerformingAction ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Restore
                  </Button>
                )}

                {/* Delete Actions */}
                {!showDeleted && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPerformingAction}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleDeleteClick(false)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Soft Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(true)}
                        className="text-red-600"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Hard Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteDialog.isHard ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Trash2 className="h-5 w-5 text-orange-500" />
              )}
              {deleteDialog.isHard ? 'Permanently Delete Files' : 'Delete Files'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.isHard ? (
                <>
                  Are you sure you want to permanently delete {selection.selectedCount} file
                  {selection.selectedCount === 1 ? '' : 's'}? This action cannot be undone and will
                  remove all file data including storage objects and thumbnails.
                </>
              ) : (
                <>
                  Are you sure you want to delete {selection.selectedCount} file
                  {selection.selectedCount === 1 ? '' : 's'}? The files will be moved to the recycle bin
                  and can be restored later.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className={deleteDialog.isHard ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
            >
              {deleteDialog.isHard ? 'Permanently Delete' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}