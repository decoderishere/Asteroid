/**
 * Enhanced section builder with progress dashboard and navigation
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  List, 
  Filter, 
  SortAsc, 
  SortDesc,
  Search,
  Plus,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionProgressDashboard } from './SectionProgressDashboard';
import { EnhancedSectionCard } from './EnhancedSectionCard';
import { useSectionProgress, type SectionProgressData } from '@/hooks/useSectionProgress';
import { cn } from '@/lib/utils';

interface SectionBuilderProps {
  sections: SectionProgressData[];
  onSectionUpdate: (sectionId: string) => void;
  onNavigateToInput?: (inputId: string) => void;
  onRenderSection?: (sectionId: string) => Promise<void>;
  onPreviewSection?: (sectionId: string) => void;
  onCreateSection?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function SectionBuilder({
  sections,
  onSectionUpdate,
  onNavigateToInput,
  onRenderSection,
  onPreviewSection,
  onCreateSection,
  onRefresh,
  className,
}: SectionBuilderProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'progress' | 'category'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterBy, setFilterBy] = useState<'all' | 'incomplete' | 'complete' | 'pending'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter sections by search query and category
  const filteredSections = useMemo(() => {
    let filtered = sections;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(section =>
        section.title.toLowerCase().includes(query) ||
        section.category.toLowerCase().includes(query) ||
        section.missingInputs.some(input => input.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(section => section.category === selectedCategory);
    }

    return filtered;
  }, [sections, searchQuery, selectedCategory]);

  const progress = useSectionProgress(
    filteredSections,
    { sortBy, sortOrder, filterBy },
    (sectionId) => {
      // Auto-scroll to section when navigating
      const element = document.getElementById(`section-${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  );

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = Array.from(new Set(sections.map(s => s.category))).sort();
    return cats;
  }, [sections]);

  const handleSectionRender = async (sectionId: string) => {
    if (onRenderSection) {
      await onRenderSection(sectionId);
      onSectionUpdate(sectionId);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Sections
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Build and manage your document sections
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
          
          {onCreateSection && (
            <Button onClick={onCreateSection}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-auto grid-cols-2 gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Progress Dashboard
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Section List
            <Badge variant="secondary" className="ml-1">
              {sections.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <SectionProgressDashboard
            sections={sections}
            onNavigateToSection={(sectionId) => {
              setActiveTab('sections');
              const element = document.getElementById(`section-${sectionId}`);
              if (element) {
                setTimeout(() => {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
              }
            }}
          />
        </TabsContent>

        {/* Sections List Tab */}
        <TabsContent value="sections" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search sections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        <span className="capitalize">{category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filterBy} onValueChange={setFilterBy as any}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="complete">Completed</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="pending">Pending Inputs</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy as any}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Sort by Title</SelectItem>
                      <SelectItem value="progress">Sort by Progress</SelectItem>
                      <SelectItem value="category">Sort by Category</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Filter Summary */}
              {(searchQuery || selectedCategory !== 'all' || filterBy !== 'all') && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Filter className="h-4 w-4" />
                  <span>
                    Showing {progress.sectionProgress.length} of {sections.length} sections
                  </span>
                  
                  {searchQuery && (
                    <Badge variant="outline">Search: "{searchQuery}"</Badge>
                  )}
                  
                  {selectedCategory !== 'all' && (
                    <Badge variant="outline">Category: {selectedCategory}</Badge>
                  )}
                  
                  {filterBy !== 'all' && (
                    <Badge variant="outline">Status: {filterBy}</Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setFilterBy('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Cards */}
          {progress.sectionProgress.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No sections found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery || selectedCategory !== 'all' || filterBy !== 'all'
                    ? 'Try adjusting your filters to see more sections.'
                    : 'Create your first section to get started.'}
                </p>
                {onCreateSection && (
                  <Button onClick={onCreateSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Section
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {progress.sectionProgress.map((section, index) => (
                <div key={section.sectionId} id={`section-${section.sectionId}`}>
                  <EnhancedSectionCard
                    sectionData={section}
                    index={index}
                    onUpdate={() => onSectionUpdate(section.sectionId)}
                    onNavigateToInput={onNavigateToInput}
                    onRender={() => handleSectionRender(section.sectionId)}
                    onPreview={() => onPreviewSection?.(section.sectionId)}
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}