/**
 * File grid component with selection and interactive file cards
 */

import React from 'react';
import { 
  FileText, 
  Image, 
  Archive, 
  Download, 
  Trash2, 
  RotateCcw, 
  Eye,
  MoreHorizontal,
  Calendar,
  User,
  HardDrive
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { type FileSearchData } from '@/hooks/useFileSearch';
import { type BulkFileSelection } from '@/hooks/useBulkFileActions';
import { cn } from '@/lib/utils';

interface FileGridProps {
  files: FileSearchData[];
  selection: BulkFileSelection;
  onToggleSelection: (fileId: string) => void;
  onToggleAllSelection: () => void;
  isSelected: (fileId: string) => boolean;
  showDeleted: boolean;
  onPreview?: (file: FileSearchData) => void;
  onDownload?: (file: FileSearchData) => void;
  onDelete?: (file: FileSearchData, isHard?: boolean) => void;
  onRestore?: (file: FileSearchData) => void;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="h-5 w-5 text-red-500" />,
  'application/msword': <FileText className="h-5 w-5 text-blue-500" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileText className="h-5 w-5 text-blue-500" />,
  'text/plain': <FileText className="h-5 w-5 text-gray-500" />,
  'message/rfc822': <FileText className="h-5 w-5 text-orange-500" />,
  'image/png': <Image className="h-5 w-5 text-green-500" />,
  'image/jpeg': <Image className="h-5 w-5 text-green-500" />,
  'application/zip': <Archive className="h-5 w-5 text-purple-500" />,
  'application/acad': <FileText className="h-5 w-5 text-cyan-500" />,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function FileGrid({
  files,
  selection,
  onToggleSelection,
  onToggleAllSelection,
  isSelected,
  showDeleted,
  onPreview,
  onDownload,
  onDelete,
  onRestore,
}: FileGridProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No files to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <div className="flex items-center gap-3 py-2 px-1">
        <Checkbox
          checked={selection.isAllSelected}
          ref={(el) => {
            if (el) {
              el.indeterminate = selection.isPartiallySelected && !selection.isAllSelected;
            }
          }}
          onCheckedChange={onToggleAllSelection}
        />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {selection.selectedCount > 0 
            ? `${selection.selectedCount} of ${files.length} files selected`
            : `Select all ${files.length} files`
          }
        </span>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            isSelected={isSelected(file.id)}
            onToggleSelection={() => onToggleSelection(file.id)}
            showDeleted={showDeleted}
            onPreview={onPreview}
            onDownload={onDownload}
            onDelete={onDelete}
            onRestore={onRestore}
          />
        ))}
      </div>
    </div>
  );
}

interface FileCardProps {
  file: FileSearchData;
  isSelected: boolean;
  onToggleSelection: () => void;
  showDeleted: boolean;
  onPreview?: (file: FileSearchData) => void;
  onDownload?: (file: FileSearchData) => void;
  onDelete?: (file: FileSearchData, isHard?: boolean) => void;
  onRestore?: (file: FileSearchData) => void;
}

function FileCard({
  file,
  isSelected,
  onToggleSelection,
  showDeleted,
  onPreview,
  onDownload,
  onDelete,
  onRestore,
}: FileCardProps) {
  const fileIcon = fileTypeIcons[file.type] || <FileText className="h-5 w-5 text-gray-500" />;
  
  const categoryColors = {
    technical: 'bg-blue-50 text-blue-700 border-blue-200',
    environmental: 'bg-green-50 text-green-700 border-green-200',
    regulatory: 'bg-purple-50 text-purple-700 border-purple-200',
    other: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <Card className={cn(
      'relative group hover:shadow-md transition-all duration-200',
      isSelected && 'ring-2 ring-blue-500',
      file.isDeleted && 'opacity-60'
    )}>
      <CardContent className="p-4">
        {/* Selection Checkbox */}
        <div className="absolute top-3 left-3 z-10">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="bg-white dark:bg-gray-800 shadow-sm"
          />
        </div>

        {/* File Actions Menu */}
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem onClick={() => onPreview(file)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
              )}
              
              {onDownload && !file.isDeleted && (
                <DropdownMenuItem onClick={() => onDownload(file)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
              )}
              
              {file.isDeleted && onRestore ? (
                <DropdownMenuItem onClick={() => onRestore(file)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              ) : (
                onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(file, false)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(file, true)}
                      className="text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hard Delete
                    </DropdownMenuItem>
                  </>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File Icon and Name */}
        <div className="mt-6 mb-3">
          <div className="flex items-center gap-3 mb-2">
            {fileIcon}
            <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1">
              {file.name}
            </h3>
          </div>
          
          {/* Category Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              'text-xs',
              categoryColors[file.category] || categoryColors.other
            )}
          >
            {file.category}
          </Badge>
        </div>

        {/* File Metadata */}
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(file.size)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>
              {file.isDeleted ? 'Deleted' : 'Uploaded'} {formatDate(
                file.isDeleted ? file.deletedAt! : file.uploadedAt
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-3 w-3" />
            <span className="truncate">
              {file.isDeleted ? file.deletedBy : file.uploadedBy}
            </span>
          </div>
        </div>

        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {file.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {file.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{file.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Deleted State Indicator */}
        {file.isDeleted && (
          <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <Trash2 className="h-3 w-3" />
              <span className="text-xs font-medium">Deleted File</span>
            </div>
            {file.deletedAt && (
              <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                Deleted on {formatDate(file.deletedAt)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}