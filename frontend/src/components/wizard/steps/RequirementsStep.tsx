/**
 * Requirements selection step for the document wizard
 */

import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RequirementsStepProps {
  requirements: {
    environmentalStudy: boolean;
    technicalSpecs: boolean;
    regulatoryDocs: boolean;
    gridConnection: boolean;
  };
  onUpdate: (requirements: Partial<RequirementsStepProps['requirements']>) => void;
  isValid: boolean;
}

const requirementOptions = [
  {
    id: 'environmentalStudy',
    title: 'Environmental Study Components',
    description: 'Include detailed environmental impact assessment sections',
    sections: [
      'Environmental baseline assessment',
      'Impact identification and evaluation',
      'Mitigation and compensation measures',
      'Environmental monitoring plan',
      'Stakeholder consultation record',
      'Cumulative impact analysis'
    ],
    importance: 'high',
    estimatedPages: 25,
    icon: '🌱'
  },
  {
    id: 'technicalSpecs',
    title: 'Technical Specifications',
    description: 'Comprehensive technical documentation and specifications',
    sections: [
      'Battery system specifications',
      'Power conversion system details',
      'Control and monitoring systems',
      'Safety and protection systems',
      'Performance characteristics',
      'Testing and commissioning procedures'
    ],
    importance: 'high',
    estimatedPages: 20,
    icon: '⚙️'
  },
  {
    id: 'regulatoryDocs',
    title: 'Regulatory Documentation',
    description: 'Compliance documentation for Chilean regulations',
    sections: [
      'CNE compliance matrix',
      'Electrical safety standards',
      'Municipal permit requirements',
      'Fire safety documentation',
      'Seismic design considerations',
      'Waste management plan'
    ],
    importance: 'medium',
    estimatedPages: 15,
    icon: '📋'
  },
  {
    id: 'gridConnection',
    title: 'Grid Connection Requirements',
    description: 'Grid interconnection and power system studies',
    sections: [
      'Connection point specifications',
      'Power quality analysis',
      'Grid stability studies',
      'Protection coordination',
      'Communication requirements',
      'Metering and billing setup'
    ],
    importance: 'high',
    estimatedPages: 18,
    icon: '🔌'
  }
];

export function RequirementsStep({ requirements, onUpdate, isValid }: RequirementsStepProps) {
  const handleToggle = (requirementId: keyof typeof requirements) => {
    onUpdate({
      [requirementId]: !requirements[requirementId]
    });
  };

  const selectedCount = Object.values(requirements).filter(Boolean).length;
  const totalEstimatedPages = requirementOptions
    .filter(option => requirements[option.id as keyof typeof requirements])
    .reduce((sum, option) => sum + option.estimatedPages, 0);

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      {selectedCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            You have selected {selectedCount} requirement{selectedCount === 1 ? '' : 's'}. 
            Estimated document length: {totalEstimatedPages} pages.
          </AlertDescription>
        </Alert>
      )}

      {/* Requirements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requirementOptions.map((option) => {
          const isSelected = requirements[option.id as keyof typeof requirements];
          const importanceColor = option.importance === 'high' ? 'destructive' : 'secondary';
          
          return (
            <Card
              key={option.id}
              className={`transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-950/20' 
                  : 'hover:border-gray-300'
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(option.id as keyof typeof requirements)}
                      className="mt-1"
                    />
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">{option.icon}</span>
                        {option.title}
                      </CardTitle>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Badge variant={importanceColor} className="text-xs">
                      {option.importance === 'high' ? 'High Priority' : 'Standard'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      ~{option.estimatedPages} pages
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {option.description}
                </p>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Included sections:</p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {option.sections.map((section, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Recommendations
          </h3>
          <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <p>
              <strong>For Environmental Permits:</strong> Environmental Study Components are typically required 
              for all BESS projects in Chile exceeding 3MW capacity.
            </p>
            <p>
              <strong>For Grid Connection:</strong> Technical Specifications and Grid Connection Requirements 
              are mandatory for interconnection approval.
            </p>
            <p>
              <strong>For Construction Permits:</strong> Regulatory Documentation helps ensure compliance 
              with local building codes and safety standards.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Selection Buttons */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Quick Selection:</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onUpdate({
                environmentalStudy: true,
                technicalSpecs: true,
                regulatoryDocs: true,
                gridConnection: true,
              })}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              Select All (Complete Package)
            </button>
            
            <button
              onClick={() => onUpdate({
                environmentalStudy: true,
                technicalSpecs: true,
                regulatoryDocs: false,
                gridConnection: true,
              })}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              Essential Requirements Only
            </button>
            
            <button
              onClick={() => onUpdate({
                environmentalStudy: false,
                technicalSpecs: false,
                regulatoryDocs: false,
                gridConnection: false,
              })}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isValid ? (
          <p className="text-green-600 dark:text-green-400">
            ✓ {selectedCount} requirement{selectedCount === 1 ? '' : 's'} selected 
            ({totalEstimatedPages} estimated pages)
          </p>
        ) : (
          <p className="text-red-600 dark:text-red-400">
            ✗ Please select at least one requirement to continue
          </p>
        )}
      </div>
    </div>
  );
}