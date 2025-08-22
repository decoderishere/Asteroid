"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Settings, 
  Info,
  Lightbulb,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import SectionList from '@/components/sections/SectionList'
import { getOrderedSections } from '@/lib/sectionTemplates'

export default function SectionBuilderDemoPage() {
  const [activeTab, setActiveTab] = useState<'demo' | 'overview' | 'templates'>('overview')
  const [selectedDocumentId] = useState('demo-doc-001') // Mock document ID
  
  const templates = getOrderedSections()
  const categoryColors = {
    general: 'bg-blue-100 text-blue-800',
    technical: 'bg-green-100 text-green-800',
    environmental: 'bg-emerald-100 text-emerald-800',
    financial: 'bg-yellow-100 text-yellow-800',
    regulatory: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Interactive Section Builder
        </h1>
        <p className="text-muted-foreground">
          Build comprehensive BESS feasibility studies section by section with guided inputs and smart validation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Live Demo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  How Section Builder Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Template-Driven Sections</h4>
                      <p className="text-sm text-muted-foreground">
                        Each section is configured via JSON templates with defined required inputs, validation rules, and dependencies.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">State Machine Logic</h4>
                      <p className="text-sm text-muted-foreground">
                        Sections transition through states: pending_inputs → ready_to_render → rendered based on input completion.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Smart Input Validation</h4>
                      <p className="text-sm text-muted-foreground">
                        Real-time validation ensures data quality with type checking, length limits, and file format requirements.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Dynamic Rendering</h4>
                      <p className="text-sm text-muted-foreground">
                        Once inputs are complete, sections render into professional Markdown/HTML with project-specific content.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">File attachment with category filtering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Multi-type inputs (text, number, date, boolean, file)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Section dependencies and ordering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Real-time progress tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Live preview of rendered sections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Professional document formatting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Export to Markdown/HTML/PDF</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium mb-2">1. Create Sections</h3>
                  <p className="text-sm text-muted-foreground">
                    Click "Create All Sections" to generate the complete document structure
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Settings className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium mb-2">2. Fill Inputs</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete required inputs for each section with text, numbers, or file attachments
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg border border-border">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium mb-2">3. Render & Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate professional sections and export the complete document
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                <Button onClick={() => setActiveTab('demo')}>
                  Try Live Demo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Section Templates Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                {templates.length} pre-configured section templates for comprehensive BESS feasibility studies
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template, index) => (
                  <Card key={template.key} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                              {index + 1}
                            </span>
                            <h3 className="font-medium">{template.title}</h3>
                            <Badge 
                              className={`text-xs ${categoryColors[template.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}
                            >
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-muted-foreground">Required Inputs:</span>
                          <p>{template.requiredInputs.length}</p>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">Input Types:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[...new Set(template.requiredInputs.map(input => input.type))].map(type => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {template.dependencies && template.dependencies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <span className="text-sm font-medium text-muted-foreground">Dependencies:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.dependencies.map(dep => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {dep.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <details className="mt-3">
                        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                          View Required Inputs ({template.requiredInputs.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {template.requiredInputs.map(input => (
                            <div key={input.key} className="p-2 bg-muted/50 rounded text-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {input.type}
                                </Badge>
                                <span className="font-medium">{input.label}</span>
                                {input.validation?.required !== false && (
                                  <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              {input.description && (
                                <p className="text-muted-foreground text-xs">{input.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Section Builder Demo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Interactive demonstration using mock document ID: <code className="bg-muted px-1 rounded">{selectedDocumentId}</code>
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <SectionList 
                  documentId={selectedDocumentId}
                  onSectionUpdate={(sections) => {
                    console.log('Sections updated:', sections.length)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}