"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  Download, 
  Copy, 
  Eye, 
  Code2,
  RefreshCw
} from 'lucide-react'
import { DocumentSection } from '@/lib/types/sections'
import { toast } from 'sonner'

interface SectionPreviewProps {
  section: DocumentSection
  onClose: () => void
}

export default function SectionPreview({ section, onClose }: SectionPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown'>('preview')
  const [renderedContent, setRenderedContent] = useState<{
    markdown: string
    html: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRenderedContent()
  }, [section.id])

  const loadRenderedContent = async () => {
    try {
      setLoading(true)
      
      // If section has rendered content, use it directly
      if (section.renderedContent) {
        setRenderedContent({
          markdown: section.renderedContent,
          html: section.renderedHtml || section.renderedContent
        })
        setLoading(false)
        return
      }

      // Otherwise, fetch from API
      const markdownResponse = await fetch(`/api/sections/${section.id}/render?format=markdown`)
      const htmlResponse = await fetch(`/api/sections/${section.id}/render?format=html`)

      if (!markdownResponse.ok || !htmlResponse.ok) {
        throw new Error('Failed to load rendered content')
      }

      const markdown = await markdownResponse.text()
      const html = await htmlResponse.text()

      setRenderedContent({ markdown, html })
    } catch (error) {
      console.error('Error loading rendered content:', error)
      toast.error('Failed to load section content')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(`${type} copied to clipboard`)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${filename}`)
  }

  const formatSectionKey = (key: string) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-5xl mx-4 max-h-[90vh]">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading section preview...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!renderedContent) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <X className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Content Not Available</h3>
            <p className="text-muted-foreground mb-4">
              Unable to load the rendered content for this section.
            </p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Section Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatSectionKey(section.sectionKey)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {renderedContent.markdown && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(
                    renderedContent.markdown,
                    `${section.sectionKey}.md`,
                    'text/markdown'
                  )}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download MD
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full">
            <div className="border-b px-6 py-2">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="markdown" className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  Markdown
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="m-0 h-[calc(90vh-200px)]">
              <div className="h-full overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Rendered Preview</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(renderedContent.html, 'HTML')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy HTML
                    </Button>
                  </div>
                  
                  {/* Document-style preview */}
                  <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="prose prose-sm max-w-none p-8 min-h-[600px]"
                      style={{ 
                        fontFamily: '"Times New Roman", serif',
                        lineHeight: '1.6',
                        fontSize: '14px'
                      }}
                      dangerouslySetInnerHTML={{ __html: renderedContent.html }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="markdown" className="m-0 h-[calc(90vh-200px)]">
              <div className="h-full overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Markdown Source</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(renderedContent.markdown, 'Markdown')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Markdown
                    </Button>
                  </div>
                  
                  <div className="bg-muted rounded-lg border border-border overflow-hidden">
                    <pre className="p-4 text-sm overflow-auto max-h-[500px] whitespace-pre-wrap">
                      <code className="text-foreground">{renderedContent.markdown}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Footer with metadata */}
        <div className="border-t px-6 py-3 bg-muted/30">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Last rendered: {section.renderedAt ? new Date(section.renderedAt).toLocaleString() : 'Never'}</span>
              <span>Word count: {renderedContent.markdown.split(/\s+/).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">Section ID: {section.id}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}