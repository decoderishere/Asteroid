/**
 * Advanced file filtering component
 */

import React, { useState, useMemo } from 'react';
import { Calendar, User, Tag, FileType, HardDrive, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { type FileSearchData } from '@/hooks/useFileSearch';

interface FileFiltersProps {
  files: FileSearchData[];
  onFiltersChange: (filters: FileFilterConfig) => void;
  className?: string;
}

export interface FileFilterConfig {
  fileTypes: string[];
  categories: string[];
  uploadedBy: string[];
  tags: string[];
  sizeRange: {
    min?: number;
    max?: number;
  };
  dateRange: {
    from?: string;
    to?: string;
  };
}

export function FileFilters({ files, onFiltersChange, className }: FileFiltersProps) {
  const [filters, setFilters] = useState<FileFilterConfig>({
    fileTypes: [],
    categories: [],
    uploadedBy: [],
    tags: [],
    sizeRange: {},
    dateRange: {},
  });

  // Extract unique values from files for filter options
  const filterOptions = useMemo(() => {
    const fileTypes = new Set<string>();
    const categories = new Set<string>();
    const uploaders = new Set<string>();
    const tags = new Set<string>();
    
    files.forEach(file => {
      fileTypes.add(file.type);
      categories.add(file.category);
      uploaders.add(file.uploadedBy);
      file.tags.forEach(tag => tags.add(tag));
    });

    return {
      fileTypes: Array.from(fileTypes).sort(),
      categories: Array.from(categories).sort(),
      uploaders: Array.from(uploaders).sort(),
      tags: Array.from(tags).sort(),
    };
  }, [files]);

  const updateFilters = (newFilters: Partial<FileFilterConfig>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const emptyFilters: FileFilterConfig = {
      fileTypes: [],
      categories: [],
      uploadedBy: [],
      tags: [],
      sizeRange: {},
      dateRange: {},
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.fileTypes.length > 0 ||
      filters.categories.length > 0 ||
      filters.uploadedBy.length > 0 ||
      filters.tags.length > 0 ||
      filters.sizeRange.min !== undefined ||
      filters.sizeRange.max !== undefined ||
      filters.dateRange.from !== undefined ||
      filters.dateRange.to !== undefined
    );
  }, [filters]);

  const handleCheckboxChange = (
    filterType: keyof Pick<FileFilterConfig, 'fileTypes' | 'categories' | 'uploadedBy' | 'tags'>,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[filterType];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter(v => v !== value);
    
    updateFilters({ [filterType]: newValues });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Advanced Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* File Types */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileType className="h-4 w-4" />
              File Types
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filterOptions.fileTypes.map(type => {
                const count = files.filter(f => f.type === type).length;
                const displayName = type.split('/').pop() || type;
                
                return (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.fileTypes.includes(type)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('fileTypes', type, !!checked)
                      }
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="capitalize">{displayName}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Categories
            </Label>
            <div className="space-y-2">
              {filterOptions.categories.map(category => {
                const count = files.filter(f => f.category === category).length;
                
                return (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('categories', category, !!checked)
                      }
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="capitalize">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {count}
                      </Badge>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uploaded By */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Uploaded By
            </Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {filterOptions.uploaders.map(uploader => {
                const count = files.filter(f => f.uploadedBy === uploader).length;
                
                return (
                  <div key={uploader} className="flex items-center space-x-2">
                    <Checkbox
                      id={`uploader-${uploader}`}
                      checked={filters.uploadedBy.includes(uploader)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('uploadedBy', uploader, !!checked)
                      }
                    />
                    <label
                      htmlFor={`uploader-${uploader}`}
                      className="text-sm flex-1 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{uploader}</span>
                      <Badge variant="secondary" className="text-xs ml-2">
                        {count}
                      </Badge>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Size Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <HardDrive className="h-4 w-4" />
            File Size Range
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="size-min" className="text-xs text-gray-600">
                Min Size (MB)
              </Label>
              <Input
                id="size-min"
                type="number"
                placeholder="0"
                value={filters.sizeRange.min || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined;
                  updateFilters({ sizeRange: { ...filters.sizeRange, min: value } });
                }}
              />
            </div>
            <div>
              <Label htmlFor="size-max" className="text-xs text-gray-600">
                Max Size (MB)
              </Label>
              <Input
                id="size-max"
                type="number"
                placeholder="100"
                value={filters.sizeRange.max ? filters.sizeRange.max / (1024 * 1024) : ''}
                onChange={(e) => {
                  const value = e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined;
                  updateFilters({ sizeRange: { ...filters.sizeRange, max: value } });
                }}
              />
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            Upload Date Range
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="date-from" className="text-xs text-gray-600">
                From
              </Label>
              <Input
                id="date-from"
                type="date"
                value={filters.dateRange.from || ''}
                onChange={(e) =>
                  updateFilters({ dateRange: { ...filters.dateRange, from: e.target.value } })
                }
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="text-xs text-gray-600">
                To
              </Label>
              <Input
                id="date-to"
                type="date"
                value={filters.dateRange.to || ''}
                onChange={(e) =>
                  updateFilters({ dateRange: { ...filters.dateRange, to: e.target.value } })
                }
              />
            </div>
          </div>
        </div>

        {/* Tags */}
        {filterOptions.tags.length > 0 && (
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.tags.map(tag => {
                const count = files.filter(f => f.tags.includes(tag)).length;
                const isSelected = filters.tags.includes(tag);
                
                return (
                  <Button
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCheckboxChange('tags', tag, !isSelected)}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    {tag}
                    <Badge 
                      variant={isSelected ? "secondary" : "outline"} 
                      className="ml-2 text-xs"
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.fileTypes.map(type => (
                <Badge key={`type-${type}`} variant="secondary" className="text-xs">
                  Type: {type.split('/').pop()}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => handleCheckboxChange('fileTypes', type, false)}
                  />
                </Badge>
              ))}
              {filters.categories.map(category => (
                <Badge key={`cat-${category}`} variant="secondary" className="text-xs">
                  Category: {category}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => handleCheckboxChange('categories', category, false)}
                  />
                </Badge>
              ))}
              {filters.uploadedBy.map(uploader => (
                <Badge key={`up-${uploader}`} variant="secondary" className="text-xs">
                  By: {uploader}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => handleCheckboxChange('uploadedBy', uploader, false)}
                  />
                </Badge>
              ))}
              {filters.tags.map(tag => (
                <Badge key={`tag-${tag}`} variant="secondary" className="text-xs">
                  Tag: {tag}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => handleCheckboxChange('tags', tag, false)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}