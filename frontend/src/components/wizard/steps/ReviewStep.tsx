/**
 * Review and generation step for the document wizard
 */

import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Globe, 
  Settings, 
  Upload,
  AlertTriangle,
  Download,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type DocumentWizardData } from '@/hooks/useDocumentWizard';

interface ReviewStepProps {
  data: DocumentWizardData;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  isValid: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getEstimatedPages(requirements: DocumentWizardData['requirements']): number {
  let pages = 5; // Base pages
  
  if (requirements.environmentalStudy) pages += 25;
  if (requirements.technicalSpecs) pages += 20;
  if (requirements.regulatoryDocs) pages += 15;
  if (requirements.gridConnection) pages += 18;
  
  return pages;
}

function getEstimatedTime(requirements: DocumentWizardData['requirements']): string {
  const selectedCount = Object.values(requirements).filter(Boolean).length;
  
  if (selectedCount >= 3) return '3-5 minutes';
  if (selectedCount >= 2) return '2-3 minutes';
  return '1-2 minutes';
}

export function ReviewStep({ data, onGenerate, isGenerating, isValid }: ReviewStepProps) {
  const estimatedPages = getEstimatedPages(data.requirements);
  const estimatedTime = getEstimatedTime(data.requirements);
  const totalFileSize = data.files.reduce((sum, file) => sum + file.size, 0);
  const selectedRequirements = Object.entries(data.requirements)
    .filter(([_, selected]) => selected)
    .map(([key, _]) => key);

  const documentTypeLabels: Record<string, string> = {
    environmental_study: 'Environmental Impact Assessment (DIA)',
    technical_specs: 'Technical Specifications',
    grid_connection: 'Grid Connection Study',
    permit_application: 'Construction Permit Application',
    operation_manual: 'Operation & Maintenance Manual',
    compliance_report: 'Regulatory Compliance Report',
  };

  const requirementLabels: Record<string, string> = {
    environmentalStudy: 'Environmental Study Components',
    technicalSpecs: 'Technical Specifications',
    regulatoryDocs: 'Regulatory Documentation',
    gridConnection: 'Grid Connection Requirements',
  };

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      {isGenerating && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Generating your document... This may take {estimatedTime}. Please do not close this window.
          </AlertDescription>
        </Alert>
      )}

      {!isValid && !isGenerating && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please complete all required steps before generating the document.
          </AlertDescription>
        </Alert>
      )}

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</p>
              <p className="text-lg font-semibold">{data.projectInfo.name || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location</p>
              <p className="text-lg font-semibold">{data.projectInfo.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Developer</p>
              <p className="text-lg font-semibold">{data.projectInfo.developer || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</p>
              <p className="text-lg font-semibold">
                {documentTypeLabels[data.documentType] || 'Not selected'}
              </p>
            </div>
          </div>
          
          {data.projectInfo.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {data.projectInfo.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Selected Requirements
            <Badge variant="secondary" className="ml-auto">
              {selectedRequirements.length} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedRequirements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedRequirements.map((req) => (
                <div
                  key={req}
                  className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    {requirementLabels[req] || req}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No requirements selected</p>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-purple-500" />
            Supporting Files
            <Badge variant="secondary" className="ml-auto">
              {data.files.length} file{data.files.length === 1 ? '' : 's'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.files.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total size: {formatFileSize(totalFileSize)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {data.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                  >
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No files uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-500" />
            Generation Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.settings.language === 'es' ? 'Español (Chile)' : 'English'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">References</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.settings.includeReferences ? 'Included' : 'Not included'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Thumbnails</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.settings.generateThumbnails ? 'Generate' : 'Skip'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Estimate */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 text-center">
            Document Generation Estimate
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                {estimatedTime}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Generation Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                ~{estimatedPages}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Estimated Pages</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                {selectedRequirements.length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Requirements</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                {data.files.length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Support Files</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Button */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Ready to Generate Document</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your document will be generated using the latest Chilean regulatory standards 
              and professional formatting. All information will be compiled into a comprehensive report.
            </p>
            
            <Button
              size="lg"
              onClick={onGenerate}
              disabled={!isValid || isGenerating}
              className="px-8 py-3 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
            
            {isGenerating && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Estimated completion: {estimatedTime}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ Important Notice
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Generated documents are for initial review and guidance purposes. 
            All documents should be reviewed by qualified professionals before submission 
            to regulatory authorities. This tool assists in document preparation but does not 
            replace professional engineering or legal consultation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}