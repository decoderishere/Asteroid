/**
 * Project information step for the document wizard
 */

import React from 'react';
import { Building, MapPin, User, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

interface ProjectInfoStepProps {
  data: {
    name: string;
    location: string;
    developer: string;
    description: string;
  };
  onUpdate: (data: Partial<ProjectInfoStepProps['data']>) => void;
  isValid: boolean;
}

export function ProjectInfoStep({ data, onUpdate, isValid }: ProjectInfoStepProps) {
  const handleInputChange = (field: keyof typeof data, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <Card className={`transition-colors ${!data.name.trim() ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'}`}>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="project-name" className="flex items-center gap-2 text-sm font-medium">
              <Building className="h-4 w-4" />
              Project Name *
            </Label>
            <Input
              id="project-name"
              placeholder="e.g., Antofagasta BESS Project"
              value={data.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              The official name of your BESS project
            </p>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className={`transition-colors ${!data.location.trim() ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'}`}>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="project-location" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="project-location"
              placeholder="e.g., Antofagasta, Chile"
              value={data.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              City and region where the project will be located
            </p>
          </CardContent>
        </Card>

        {/* Developer */}
        <Card className={`transition-colors ${!data.developer.trim() ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'}`}>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="project-developer" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Developer/Company *
            </Label>
            <Input
              id="project-developer"
              placeholder="e.g., Energy Solutions Chile S.A."
              value={data.developer}
              onChange={(e) => handleInputChange('developer', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Name of the company or organization developing the project
            </p>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="project-description" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              Project Description
            </Label>
            <Textarea
              id="project-description"
              placeholder="Brief description of the BESS project, including capacity, purpose, and key features..."
              value={data.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full min-h-[100px]"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Optional description to provide context for document generation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Fill Suggestions */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Quick Fill Examples
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Project Names:</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 mt-1">
                <li>• Antofagasta BESS 100MW</li>
                <li>• Valparaíso Energy Storage</li>
                <li>• Santiago Grid Support BESS</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Locations:</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 mt-1">
                <li>• Antofagasta, Región de Antofagasta</li>
                <li>• Valparaíso, Región de Valparaíso</li>
                <li>• Santiago, Región Metropolitana</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Developers:</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 mt-1">
                <li>• Enel Green Power Chile</li>
                <li>• AES Gener S.A.</li>
                <li>• Colbún S.A.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <p>
          <span className="font-medium">Required fields:</span> Project Name, Location, Developer
        </p>
        {isValid ? (
          <p className="text-green-600 dark:text-green-400 mt-1">
            ✓ All required information provided
          </p>
        ) : (
          <p className="text-red-600 dark:text-red-400 mt-1">
            ✗ Please complete all required fields to continue
          </p>
        )}
      </div>
    </div>
  );
}