"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Calendar, 
  FileText, 
  Hash, 
  Download,
  Share2,
  Copy,
  RefreshCw,
  History,
  Eye,
  FileJson,
  ExternalLink,
  Loader2,
  FileCode
} from 'lucide-react'
import { toast } from 'sonner'
import { usePdfGeneration, sampleEnvironmentalStudyData } from '@/hooks/usePdfGeneration'

// Mock data types as specified
interface Section {
  id: string
  title: string
  content: string
  wordCount: number
}

interface DocRun {
  id: string
  title: string
  projectName: string
  generatedDate: string
  sections: Section[]
  status: 'completed' | 'processing' | 'failed'
  markdown: string
  html: string
  metadata: {
    documentType: string
    region: string
    compliance: string[]
    quality: number
  }
}

// Mock data
const mockDocRun: DocRun = {
  id: "run_abc123",
  title: "BESS Investment-Grade Feasibility Study",
  projectName: "Coquimbo Solar + Storage Phase I",
  generatedDate: "2024-01-15T14:30:00Z",
  status: "completed",
  sections: [
    { id: "exec", title: "Executive Summary", content: "Executive summary content...", wordCount: 450 },
    { id: "tech", title: "Technical Analysis", content: "Technical analysis content...", wordCount: 1200 },
    { id: "fin", title: "Financial Projections", content: "Financial projections content...", wordCount: 800 },
    { id: "risk", title: "Risk Assessment", content: "Risk assessment content...", wordCount: 600 }
  ],
  markdown: "# BESS Investment-Grade Feasibility Study\n\n## Executive Summary\n\nThis document presents a comprehensive analysis...",
  html: "<h1>BESS Investment-Grade Feasibility Study</h1><h2>Executive Summary</h2><p>This document presents a comprehensive analysis...</p>",
  metadata: {
    documentType: "Investment-Grade Feasibility Study",
    region: "Coquimbo, Chile",
    compliance: ["CNE Supreme Decree No. 70", "SEIA Environmental Assessment"],
    quality: 94
  }
}

interface AIDocumentOutputProps {
  docRun?: DocRun
  onDownload?: (format: 'pdf' | 'docx' | 'html' | 'markdown') => void
  onGenerateNew?: () => void
  onCopy?: (content: string, type: string) => void
  onOpenRuns?: () => void
}

export default function AIDocumentOutput({ 
  docRun = mockDocRun,
  onDownload = () => {},
  onGenerateNew = () => {},
  onCopy = () => {},
  onOpenRuns = () => {}
}: AIDocumentOutputProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'json'>('preview')
  const { generateEnvironmentalStudyPDF, generateFromHTML, isGenerating, progress } = usePdfGeneration()

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success(`${type} copied to clipboard`)
      onCopy(content, type)
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }

  const handlePdfDownload = async () => {
    try {
      if (docRun.metadata.documentType === "Investment-Grade Feasibility Study") {
        // Use sample environmental study data for demo
        await generateEnvironmentalStudyPDF(sampleEnvironmentalStudyData)
      } else {
        // Generate PDF from current HTML content
        await generateFromHTML(
          docRun.html,
          `${docRun.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        )
      }
      onDownload('pdf')
    } catch (error) {
      console.error('PDF download failed:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Document Generation Complete
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your AI-generated document is ready for review and download
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[calc(100vh-200px)]">
          
          {/* Left Metadata Rail - 320px equivalent */}
          <div className="lg:col-span-3">
            <Card className="sticky top-8">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Title</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {docRun.title}
                  </p>
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Project</span>
                  </div>
                  <p className="text-sm text-foreground">{docRun.projectName}</p>
                </div>

                {/* Generated Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Generated</span>
                  </div>
                  <p className="text-sm text-foreground">{formatDate(docRun.generatedDate)}</p>
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Type</span>
                  </div>
                  <p className="text-sm text-foreground">{docRun.metadata.documentType}</p>
                </div>

                {/* Quality Score */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getQualityColor(docRun.metadata.quality)}`}>
                      {docRun.metadata.quality}%
                    </span>
                    <Badge variant="outline" className="text-xs">
                      AI Assessed
                    </Badge>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Sections</span>
                  <div className="space-y-2">
                    {docRun.sections.map((section) => (
                      <div key={section.id} className="flex justify-between items-center text-xs">
                        <span className="text-foreground truncate">{section.title}</span>
                        <span className="text-muted-foreground ml-2">{section.wordCount}w</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Compliance</span>
                  <div className="flex flex-wrap gap-1">
                    {docRun.metadata.compliance.map((item) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Run ID */}
                <div className="pt-4 border-t space-y-2">
                  <span className="text-xs text-muted-foreground">Run ID</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded block">
                    {docRun.id}
                  </code>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Center Content Area with Tabs */}
          <div className="lg:col-span-6">
            <Card className="h-full">
              <CardHeader className="pb-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="markdown" className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Markdown
                    </TabsTrigger>
                    <TabsTrigger value="json" className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              
              <CardContent className="flex-1 p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  
                  {/* Preview Tab */}
                  <TabsContent value="preview" className="m-0 h-full">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Document Preview</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy(docRun.html, 'HTML')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy HTML
                        </Button>
                      </div>
                      
                      {/* A4-like document preview */}
                      <div className="bg-white dark:bg-gray-900 border border-border shadow-sm rounded-lg overflow-hidden">
                        <div 
                          className="prose prose-sm max-w-none p-8 min-h-[800px] dark:prose-invert"
                          style={{ 
                            fontFamily: '"Times New Roman", serif',
                            lineHeight: '1.6',
                            fontSize: '14px'
                          }}
                          dangerouslySetInnerHTML={{ __html: docRun.html }}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Markdown Tab */}
                  <TabsContent value="markdown" className="m-0 h-full">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Markdown Source</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy(docRun.markdown, 'Markdown')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Markdown
                        </Button>
                      </div>
                      
                      <div className="bg-muted rounded-lg border border-border overflow-hidden">
                        <pre className="p-4 text-sm overflow-auto max-h-[800px] text-foreground">
                          <code>{docRun.markdown}</code>
                        </pre>
                      </div>
                    </div>
                  </TabsContent>

                  {/* JSON Tab */}
                  <TabsContent value="json" className="m-0 h-full">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Raw Data</h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopy(JSON.stringify(docRun, null, 2), 'JSON')}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy JSON
                        </Button>
                      </div>
                      
                      <div className="bg-muted rounded-lg border border-border overflow-hidden">
                        <pre className="p-4 text-sm overflow-auto max-h-[800px] text-foreground">
                          <code>{JSON.stringify(docRun, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  </TabsContent>

                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Action Rail - 280px equivalent */}
          <div className="lg:col-span-3">
            <div className="sticky top-8 space-y-6">
              
              {/* Download Actions */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Download</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={handlePdfDownload}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-xs text-muted-foreground text-center">
                        {progress}% completado
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => onDownload('docx')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download DOCX
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDownload('html')}
                    >
                      HTML
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDownload('markdown')}
                    >
                      Markdown
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Share & History */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Share & History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/documents/${docRun.id}`
                      handleCopy(shareUrl, 'Share link')
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onOpenRuns}
                  >
                    <History className="h-4 w-4 mr-2" />
                    View All Runs
                  </Button>
                </CardContent>
              </Card>

              {/* Generation Actions */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Generate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={onGenerateNew}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New Version
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => window.open('/documents/new', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Start New Document
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}