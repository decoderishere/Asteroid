/**
 * Enhanced Files Page with tabs, search, bulk actions, and deleted files view
 */

import React, { useState, useMemo } from 'react';
import { Search, Download, Trash2, RotateCcw, FolderOpen, Plus, Filter } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFileSearch, type FileSearchData } from '@/hooks/useFileSearch';
import { useBulkFileActions, type BulkActionResult } from '@/hooks/useBulkFileActions';
import { FileGrid } from './FileGrid';
import { BulkActionBar } from './BulkActionBar';
import { FileFilters } from './FileFilters';
import { cn } from '@/lib/utils';

interface FilesPageProps {
  files: FileSearchData[];
  onUpload?: () => void;
  onDelete?: (fileIds: string[], isHard?: boolean) => Promise<BulkActionResult>;
  onRestore?: (fileIds: string[]) => Promise<BulkActionResult>;
  onDownload?: (fileIds: string[]) => Promise<void>;
  onMove?: (fileIds: string[], category: string) => Promise<BulkActionResult>;
  className?: string;
}

const categoryConfig = {
  technical: {
    label: 'Technical',
    description: 'Engineering specs, schematics, technical reports',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '⚙️'
  },
  environmental: {
    label: 'Environmental',
    description: 'Impact assessments, environmental studies',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '🌱'
  },
  regulatory: {
    label: 'Regulatory',
    description: 'Permits, compliance docs, legal requirements',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: '📋'
  },
  other: {
    label: 'Other',
    description: 'Miscellaneous documents and files',
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: '📄'
  }
} as const;

export function FilesPage({
  files,
  onUpload,
  onDelete,
  onRestore,
  onDownload,
  onMove,
  className
}: FilesPageProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Determine which categories are available based on file data
  const availableCategories = useMemo(() => {
    const categories = new Set(files.map(f => f.category));
    return Array.from(categories).sort();
  }, [files]);

  // Configure search options based on current tab and settings
  const searchOptions = useMemo(() => ({
    includeDeleted: showDeleted,
    categories: activeTab === 'all' ? undefined : [activeTab as FileSearchData['category']],
    sortBy: 'uploadedAt' as const,
    sortOrder: 'desc' as const,
  }), [activeTab, showDeleted]);

  const {
    searchQuery,
    setSearchQuery,
    filteredFiles,
    totalFiles,
    matchCount,
    searchStats
  } = useFileSearch(files, searchOptions);

  const bulkActions = useBulkFileActions(
    filteredFiles.map(f => f.id),
    {
      onDelete,
      onRestore,
      onDownload,
      onMove,
    }
  );

  // Count files by category (excluding deleted if not shown)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    
    files.forEach(file => {
      if (!showDeleted && file.isDeleted) return;
      
      counts.all += 1;
      counts[file.category] = (counts[file.category] || 0) + 1;
    });
    
    return counts;
  }, [files, showDeleted]);

  // Count deleted files
  const deletedCount = files.filter(f => f.isDeleted).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Files
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your project documents and files
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          {onUpload && (
            <Button onClick={onUpload} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Files
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files by name, type, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchQuery && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                {matchCount} of {totalFiles} files match "{searchQuery}"
              </span>
              
              {Object.entries(searchStats.byCategory).length > 0 && (
                <div className="flex items-center gap-2">
                  <span>by category:</span>
                  {Object.entries(searchStats.byCategory).map(([category, count]) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {categoryConfig[category as keyof typeof categoryConfig]?.label || category}: {count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters Panel */}
      {showFilters && (
        <FileFilters
          files={files}
          onFiltersChange={(filters) => {
            // Handle filter changes
            console.log('Filters changed:', filters);
          }}
        />
      )}

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-auto grid-cols-auto gap-1">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <span>All Files</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {categoryCounts.all || 0}
              </Badge>
            </TabsTrigger>
            
            {availableCategories.map(category => {
              const config = categoryConfig[category as keyof typeof categoryConfig];
              if (!config) return null;
              
              return (
                <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <span>{config.label}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {categoryCounts[category] || 0}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex items-center gap-3">
            <Button
              variant={showDeleted ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeleted(!showDeleted)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Show Deleted
              {deletedCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {deletedCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <TabsContent value="all" className="space-y-4">
          <CategoryTabContent
            category="all"
            files={filteredFiles}
            bulkActions={bulkActions}
            showDeleted={showDeleted}
          />
        </TabsContent>

        {availableCategories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <CategoryTabContent
              category={category}
              files={filteredFiles}
              bulkActions={bulkActions}
              showDeleted={showDeleted}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface CategoryTabContentProps {
  category: string;
  files: FileSearchData[];
  bulkActions: ReturnType<typeof useBulkFileActions>;
  showDeleted: boolean;
}

function CategoryTabContent({
  category,
  files,
  bulkActions,
  showDeleted
}: CategoryTabContentProps) {
  const categoryFiles = category === 'all' 
    ? files 
    : files.filter(f => f.category === category);

  if (categoryFiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {category === 'all' 
              ? 'Upload some files to get started'
              : `No ${categoryConfig[category as keyof typeof categoryConfig]?.label.toLowerCase()} files available`
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Bulk Action Bar */}
      {bulkActions.selection.selectedCount > 0 && (
        <BulkActionBar
          selection={bulkActions.selection}
          onClearSelection={bulkActions.clearSelection}
          onBulkDelete={bulkActions.bulkDelete}
          onBulkRestore={bulkActions.bulkRestore}
          onBulkDownload={bulkActions.bulkDownload}
          onBulkMove={bulkActions.bulkMove}
          isPerformingAction={bulkActions.isPerformingAction}
          showDeleted={showDeleted}
        />
      )}

      {/* File Grid */}
      <FileGrid
        files={categoryFiles}
        selection={bulkActions.selection}
        onToggleSelection={bulkActions.toggleSelection}
        onToggleAllSelection={() => bulkActions.toggleAllSelection(categoryFiles.map(f => f.id))}
        isSelected={bulkActions.isSelected}
        showDeleted={showDeleted}
      />
    </>
  );
}