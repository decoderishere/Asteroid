/**
 * Document type selection step for the wizard
 */

import React from 'react';
import { FileText, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentTypeStepProps {
  selectedType: string;
  onUpdate: (documentType: string) => void;
  isValid: boolean;
}

const documentTypes = [
  {
    id: 'environmental_study',
    title: 'Environmental Impact Assessment (DIA)',
    description: 'Complete environmental study for BESS projects as required by Chilean regulations',
    sections: [
      'Executive Summary',
      'Project Description',
      'Environmental Baseline',
      'Impact Assessment',
      'Mitigation Measures',
      'Monitoring Plan'
    ],
    estimatedTime: '2-3 hours',
    complexity: 'High',
    required: true,
    icon: '🌱'
  },
  {
    id: 'technical_specs',
    title: 'Technical Specifications',
    description: 'Detailed technical documentation for BESS equipment and installation',
    sections: [
      'System Overview',
      'Battery Technology',
      'Power Conversion System',
      'Control Systems',
      'Safety Systems',
      'Performance Specifications'
    ],
    estimatedTime: '1-2 hours',
    complexity: 'Medium',
    required: true,
    icon: '⚙️'
  },
  {
    id: 'grid_connection',
    title: 'Grid Connection Study',
    description: 'Interconnection requirements and grid impact analysis',
    sections: [
      'Connection Point Analysis',
      'Grid Impact Assessment',
      'Protection Systems',
      'Power Quality Analysis',
      'Stability Studies',
      'Compliance Matrix'
    ],
    estimatedTime: '3-4 hours',
    complexity: 'High',
    required: true,
    icon: '🔌'
  },
  {
    id: 'permit_application',
    title: 'Construction Permit Application',
    description: 'Municipal permit application for BESS construction',
    sections: [
      'Project Summary',
      'Site Plans',
      'Construction Details',
      'Safety Measures',
      'Environmental Compliance',
      'Community Impact'
    ],
    estimatedTime: '1 hour',
    complexity: 'Low',
    required: false,
    icon: '🏗️'
  },
  {
    id: 'operation_manual',
    title: 'Operation & Maintenance Manual',
    description: 'Comprehensive O&M procedures and guidelines',
    sections: [
      'System Operation',
      'Maintenance Procedures',
      'Safety Protocols',
      'Troubleshooting Guide',
      'Performance Monitoring',
      'Emergency Procedures'
    ],
    estimatedTime: '2 hours',
    complexity: 'Medium',
    required: false,
    icon: '📖'
  },
  {
    id: 'compliance_report',
    title: 'Regulatory Compliance Report',
    description: 'Comprehensive compliance documentation for all applicable regulations',
    sections: [
      'Regulatory Framework',
      'Compliance Matrix',
      'Supporting Documentation',
      'Verification Methods',
      'Reporting Requirements',
      'Updates & Amendments'
    ],
    estimatedTime: '2-3 hours',
    complexity: 'High',
    required: false,
    icon: '📋'
  }
];

export function DocumentTypeStep({ selectedType, onUpdate, isValid }: DocumentTypeStepProps) {
  const selectedDoc = documentTypes.find(doc => doc.id === selectedType);

  return (
    <div className="space-y-6">
      {/* Document Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentTypes.map((docType) => {
          const isSelected = selectedType === docType.id;
          
          return (
            <Card
              key={docType.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-md',
                isSelected 
                  ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20' 
                  : 'hover:border-gray-300'
              )}
              onClick={() => onUpdate(docType.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="text-2xl">{docType.icon}</div>
                  <div className="flex flex-col gap-1">
                    {docType.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    <Badge 
                      variant={
                        docType.complexity === 'High' ? 'destructive' :
                        docType.complexity === 'Medium' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {docType.complexity}
                    </Badge>
                  </div>
                </div>
                
                <CardTitle className="text-lg leading-tight">
                  {docType.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {docType.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {docType.estimatedTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {docType.sections.length} sections
                  </div>
                </div>

                {isSelected && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                      Included Sections:
                    </p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {docType.sections.map((section, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {section}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedDoc && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100">
                  Selected: {selectedDoc.title}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Estimated generation time: {selectedDoc.estimatedTime} • {selectedDoc.sections.length} sections
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Document Selection Guide
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>
              <strong>Environmental Impact Assessment (DIA):</strong> Required for all BESS projects in Chile. 
              Essential for obtaining environmental permits.
            </p>
            <p>
              <strong>Technical Specifications:</strong> Detailed technical documentation required for 
              equipment certification and grid connection approval.
            </p>
            <p>
              <strong>Grid Connection Study:</strong> Mandatory for projects connecting to the transmission 
              or distribution grid. Required by CNE regulations.
            </p>
            <p>
              <strong>Additional Documents:</strong> Construction permits, operation manuals, and compliance 
              reports may be required depending on project scope and local regulations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isValid ? (
          <p className="text-green-600 dark:text-green-400">
            ✓ Document type selected: {selectedDoc?.title}
          </p>
        ) : (
          <p className="text-red-600 dark:text-red-400">
            ✗ Please select a document type to continue
          </p>
        )}
      </div>
    </div>
  );
}