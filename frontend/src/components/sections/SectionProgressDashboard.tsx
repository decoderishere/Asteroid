/**
 * Section progress dashboard with overview metrics and quick navigation
 */

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight,
  Target,
  BarChart3,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  useSectionProgress, 
  type SectionProgressData 
} from '@/hooks/useSectionProgress';
import { cn } from '@/lib/utils';

interface SectionProgressDashboardProps {
  sections: SectionProgressData[];
  onNavigateToSection?: (sectionId: string) => void;
  className?: string;
}

export function SectionProgressDashboard({
  sections,
  onNavigateToSection,
  className,
}: SectionProgressDashboardProps) {
  const progress = useSectionProgress(sections, {}, onNavigateToSection);

  const categoryColors = {
    environmental: 'bg-green-100 text-green-800 border-green-200',
    technical: 'bg-blue-100 text-blue-800 border-blue-200',
    regulatory: 'bg-purple-100 text-purple-800 border-purple-200',
    financial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const categoryIcons = {
    environmental: '🌱',
    technical: '⚙️',
    regulatory: '📋',
    financial: '💰',
    other: '📄',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Document Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span className="font-medium">{Math.round(progress.overallProgress)}%</span>
            </div>
            <Progress value={progress.overallProgress} className="h-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {progress.resolvedInputs} of {progress.totalInputs} inputs completed across {progress.totalSections} sections
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-800 dark:text-green-200">
                {progress.completedSections}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">Completed</div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-blue-800 dark:text-blue-200">
                {progress.sectionsInProgress}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Ready to Render</div>
            </div>

            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-orange-800 dark:text-orange-200">
                {progress.pendingSections}
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-300">Pending Inputs</div>
            </div>

            <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Target className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <div className="text-xl font-bold text-purple-800 dark:text-purple-200">
                {progress.missingInputs}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Missing Inputs</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Next Recommended Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.nextIncompleteSection ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{progress.nextIncompleteSection.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {progress.nextIncompleteSection.resolvedInputs} of {progress.nextIncompleteSection.requiredInputs} inputs completed
                    </p>
                  </div>
                  <Badge 
                    className={categoryColors[progress.nextIncompleteSection.category as keyof typeof categoryColors] || categoryColors.other}
                  >
                    {categoryIcons[progress.nextIncompleteSection.category as keyof typeof categoryIcons]}
                    {progress.nextIncompleteSection.category}
                  </Badge>
                </div>
                
                <Progress 
                  value={(progress.nextIncompleteSection.resolvedInputs / progress.nextIncompleteSection.requiredInputs) * 100} 
                  className="h-2"
                />
                
                <Button 
                  onClick={progress.goToNextIncompleteSection}
                  className="w-full"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Go to Section
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-medium text-green-800 dark:text-green-200">All sections complete!</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Ready to generate the final document</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sections Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Sections Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.sectionsNeedingAttention.length > 0 ? (
              <div className="space-y-3">
                {progress.getMostCriticalSections(3).map((section, index) => (
                  <div 
                    key={section.sectionId}
                    className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{section.title}</h4>
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        {section.missingInputs.length} missing input{section.missingInputs.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => progress.goToSection(section.sectionId)}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {progress.sectionsNeedingAttention.length > 3 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                    And {progress.sectionsNeedingAttention.length - 3} more sections...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-600 dark:text-green-400">No sections need immediate attention</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Progress by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progress.getSectionsByCategory()).map(([category, categorySections]) => {
              const categoryProgress = progress.getCategoryProgress(category);
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categoryIcons[category as keyof typeof categoryIcons] || '📄'}
                      </span>
                      <span className="font-medium capitalize">{category}</span>
                      <Badge 
                        variant="secondary"
                        className={categoryColors[category as keyof typeof categoryColors] || categoryColors.other}
                      >
                        {categorySections.length} section{categorySections.length === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">
                      {categoryProgress.completed}/{categoryProgress.total} complete
                    </span>
                  </div>
                  
                  <Progress value={categoryProgress.percentage} className="h-2" />
                  
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{Math.round(categoryProgress.percentage)}% complete</span>
                    <span>
                      {categorySections.filter(s => s.state === 'pending_inputs').length} pending
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}