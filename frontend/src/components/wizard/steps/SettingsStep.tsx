/**
 * Settings configuration step for the document wizard
 */

import React from 'react';
import { Globe, FileText, Image, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SettingsStepProps {
  settings: {
    language: 'es' | 'en';
    includeReferences: boolean;
    generateThumbnails: boolean;
  };
  onUpdate: (settings: Partial<SettingsStepProps['settings']>) => void;
  isValid: boolean;
}

export function SettingsStep({ settings, onUpdate, isValid }: SettingsStepProps) {
  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Document Language
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language-select">Primary Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value: 'es' | 'en') => onUpdate({ language: value })}
            >
              <SelectTrigger id="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">
                  🇨🇱 Español (Chilean Spanish) - Recommended
                </SelectItem>
                <SelectItem value="en">
                  🇺🇸 English (International)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Spanish is recommended for Chilean regulatory submissions. 
              All technical terms will follow Chilean standards and regulations.
            </p>
          </div>

          {/* Language Preview */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium mb-2">Language Preview:</p>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {settings.language === 'es' ? (
                <div>
                  <p><strong>Título:</strong> "Estudio de Impacto Ambiental para Sistema de Almacenamiento de Energía por Baterías"</p>
                  <p><strong>Formato:</strong> Normas chilenas CNE, formato oficial DIA</p>
                </div>
              ) : (
                <div>
                  <p><strong>Title:</strong> "Environmental Impact Assessment for Battery Energy Storage System"</p>
                  <p><strong>Format:</strong> International standards, Chilean regulatory compliance</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Document Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Include References */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="include-references" className="font-medium">
                  Include Bibliography & References
                </Label>
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically include citations, references, and bibliography sections. 
                Improves document credibility and regulatory compliance.
              </p>
              <div className="mt-2 text-xs text-green-700 dark:text-green-400">
                ✓ IEEE citation format • ✓ Chilean regulation references • ✓ Technical standards
              </div>
            </div>
            <Switch
              id="include-references"
              checked={settings.includeReferences}
              onCheckedChange={(checked) => onUpdate({ includeReferences: checked })}
            />
          </div>

          {/* Generate Thumbnails */}
          <div className="flex items-start justify-between space-x-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="generate-thumbnails" className="font-medium">
                  Generate Visual Thumbnails
                </Label>
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create thumbnail previews for diagrams, charts, and technical drawings. 
                Useful for quick document review and presentations.
              </p>
              <div className="mt-2 text-xs text-blue-700 dark:text-blue-400">
                ✓ Site plan thumbnails • ✓ System diagram previews • ✓ Chart summaries
              </div>
            </div>
            <Switch
              id="generate-thumbnails"
              checked={settings.generateThumbnails}
              onCheckedChange={(checked) => onUpdate({ generateThumbnails: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Output Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Options */}
            <div className="space-y-2">
              <Label className="font-medium">Export Formats</Label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>📄 PDF (Primary)</span>
                  <Badge variant="default" className="text-xs">Included</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>📝 Microsoft Word</span>
                  <Badge variant="secondary" className="text-xs">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>🌐 HTML</span>
                  <Badge variant="secondary" className="text-xs">Available</Badge>
                </div>
              </div>
            </div>

            {/* Quality Options */}
            <div className="space-y-2">
              <Label className="font-medium">Quality Settings</Label>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>High Resolution Images</span>
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>Professional Formatting</span>
                  <Badge variant="default" className="text-xs">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <span>Regulatory Compliance</span>
                  <Badge variant="default" className="text-xs">Verified</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Estimate */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Generation Estimate
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">2-4</div>
              <div className="text-blue-700 dark:text-blue-300">Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">25-50</div>
              <div className="text-blue-700 dark:text-blue-300">Pages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {settings.language === 'es' ? 'ES' : 'EN'}
              </div>
              <div className="text-blue-700 dark:text-blue-300">Language</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">PDF</div>
              <div className="text-blue-700 dark:text-blue-300">Primary Format</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chilean Compliance Notice */}
      <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
            🇨🇱 Chilean Regulatory Compliance
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            All generated documents will comply with Chilean regulations including CNE requirements, 
            environmental assessment standards (SEIA), and municipal permit formats. 
            Documents are formatted according to official Chilean government templates.
          </p>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isValid ? (
          <p className="text-green-600 dark:text-green-400">
            ✓ Settings configured - Ready for document generation
          </p>
        ) : (
          <p className="text-red-600 dark:text-red-400">
            ✗ Please configure all settings to continue
          </p>
        )}
      </div>
    </div>
  );
}