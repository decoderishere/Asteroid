/**
 * Enhanced section card with progress tracking and quick navigation
 */

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Play,
  Eye,
  RefreshCw,
  ArrowRight,
  Target,
  MapPin,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EnhancedSectionCardProps {
  sectionData: {
    sectionId: string;
    title: string;
    description: string;
    category: string;
    state: 'pending_inputs' | 'ready_to_render' | 'rendered';
    requiredInputs: number;
    resolvedInputs: number;
    missingInputs: string[];
    dependencies?: string[];
    createdAt: string;
    renderedAt?: string;
  };
  index: number;
  onUpdate: () => void;
  onNavigateToInput?: (inputId: string) => void;
  onRender?: () => Promise<void>;
  onPreview?: () => void;
}

export function EnhancedSectionCard({
  sectionData,
  index,
  onUpdate,
  onNavigateToInput,
  onRender,
  onPreview,
}: EnhancedSectionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [rendering, setRendering] = useState(false);

  const {
    sectionId,
    title,
    description,
    category,
    state,
    requiredInputs,
    resolvedInputs,
    missingInputs,
    dependencies,
    createdAt,
    renderedAt,
  } = sectionData;

  const progressPercentage = requiredInputs > 0 ? (resolvedInputs / requiredInputs) * 100 : 0;
  const isCompleted = state === 'rendered';
  const canRender = state === 'ready_to_render' || state === 'rendered';

  const getStateInfo = () => {
    switch (state) {
      case 'rendered':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>,
          color: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
          textColor: 'text-green-800 dark:text-green-200'
        };
      case 'ready_to_render':
        return {
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          badge: <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ready to Render</Badge>,
          color: 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20',
          textColor: 'text-blue-800 dark:text-blue-200'
        };
      case 'pending_inputs':
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
          badge: <Badge variant="outline" className="border-orange-200 text-orange-800">Pending Inputs</Badge>,
          color: 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20',
          textColor: 'text-orange-800 dark:text-orange-200'
        };
    }
  };

  const stateInfo = getStateInfo();

  const categoryConfig = {
    environmental: { icon: '🌱', color: 'bg-green-100 text-green-800 border-green-200' },
    technical: { icon: '⚙️', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    regulatory: { icon: '📋', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    financial: { icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    other: { icon: '📄', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  };

  const categoryInfo = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.other;

  const handleRender = async () => {
    if (!canRender || !onRender) return;

    setRendering(true);
    try {
      await onRender();
      toast.success(isCompleted ? 'Section re-rendered successfully' : 'Section rendered successfully');
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to render section');
    } finally {
      setRendering(false);
    }
  };

  const handleMissingInputClick = (inputId: string) => {
    if (onNavigateToInput) {
      onNavigateToInput(inputId);
    } else {
      toast.info(`Please complete the "${inputId}" input to continue`);
    }
  };

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', stateInfo.color)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Section Number */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-muted text-sm font-medium flex-shrink-0 mt-1">
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Section Header */}
              <div className="flex items-center gap-2 mb-2">
                {stateInfo.icon}
                <CardTitle className="text-lg truncate">{title}</CardTitle>
                {stateInfo.badge}
              </div>
              
              {/* Category and Description */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className={cn('text-xs', categoryInfo.color)}>
                  <span className="mr-1">{categoryInfo.icon}</span>
                  {category}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{description}</p>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={stateInfo.textColor}>
                    Progress: {resolvedInputs}/{requiredInputs} inputs
                  </span>
                  <span className={cn('font-medium', stateInfo.textColor)}>
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCompleted && onPreview && (
              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            
            {canRender && (
              <Button
                onClick={handleRender}
                disabled={rendering}
                size="sm"
                variant={isCompleted ? "outline" : "default"}
              >
                {rendering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {isCompleted ? 'Re-render' : 'Render'}
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Missing Inputs Alert */}
          {missingInputs.length > 0 && (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Missing inputs to complete this section:</p>
                  <div className="flex flex-wrap gap-2">
                    {missingInputs.map((inputId, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleMissingInputClick(inputId)}
                        className="h-7 px-2 text-xs hover:bg-orange-50 border-orange-200"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {inputId.replace(/_/g, ' ')}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Section Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Category:</span>
              <div className="flex items-center gap-1 mt-1">
                <span>{categoryInfo.icon}</span>
                <span className="capitalize">{category}</span>
              </div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status:</span>
              <p className="mt-1 capitalize">{state.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Completion:</span>
              <p className="mt-1 font-medium">{Math.round(progressPercentage)}%</p>
            </div>
          </div>

          {/* Dependencies */}
          {dependencies && dependencies.length > 0 && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Dependencies:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {dependencies.map((dep, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {dep.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {missingInputs.length > 0 && (
            <div className="pt-3 border-t">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Quick Actions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (missingInputs.length > 0) {
                      handleMissingInputClick(missingInputs[0]);
                    }
                  }}
                  className="justify-start"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to first missing input
                </Button>
                
                {missingInputs.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpanded(true)}
                    className="justify-start"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    View all {missingInputs.length} missing inputs
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>
              <p>{new Date(createdAt).toLocaleDateString()}</p>
            </div>
            {renderedAt && (
              <div>
                <span className="font-medium">Last Rendered:</span>
                <p>{new Date(renderedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}