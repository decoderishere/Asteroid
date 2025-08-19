"use client"

import { useState, Suspense, lazy } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, FileType2, FileText, FileJson, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DocRun } from '@/types/run'

// Lazy load ReactMarkdown for better performance
const ReactMarkdown = lazy(() => import('react-markdown'))

interface ResultPreviewProps {
  run: DocRun
}

export function ResultPreview({ run }: ResultPreviewProps) {
  const [activeTab, setActiveTab] = useState("html")

  const copyToClipboard = (content: string, type: string) => {
    if (!content) return
    
    navigator.clipboard.writeText(content).then(() => {
      toast.success(`${type} copied to clipboard`)
    }).catch(() => {
      toast.error('Failed to copy to clipboard')
    })
  }

  const copyRunLink = () => {
    const url = `${window.location.origin}/results/${run.run_id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Run link copied to clipboard')
    }).catch(() => {
      toast.error('Failed to copy run link')
    })
  }

  return (
    <Card className="xl:sticky xl:top-20">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b px-6 pt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html" className="flex items-center gap-2">
                <FileType2 className="h-4 w-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="markdown" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Markdown
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            {/* HTML Tab */}
            <TabsContent value="html" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">HTML Preview</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(run.html || '', 'HTML')}
                    disabled={!run.html}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="border rounded-lg bg-background max-h-[75vh] overflow-auto">
                  {run.html ? (
                    <div 
                      className="prose max-w-none safe-output p-6"
                      dangerouslySetInnerHTML={{ __html: run.html }}
                    />
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      No HTML content available
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Markdown Tab */}
            <TabsContent value="markdown" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Markdown Preview</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(run.markdown || '', 'Markdown')}
                    disabled={!run.markdown}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                
                <div className="border rounded-lg bg-background max-h-[75vh] overflow-auto">
                  {run.markdown ? (
                    <div className="prose max-w-none safe-output p-6">
                      <Suspense fallback={
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      }>
                        <ReactMarkdown>{run.markdown}</ReactMarkdown>
                      </Suspense>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      No Markdown content available
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* JSON Tab */}
            <TabsContent value="json" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Raw JSON Data</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyRunLink}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy run link
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(run, null, 2), 'JSON')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy JSON
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg bg-muted max-h-[75vh] overflow-auto">
                  <pre className="p-4 text-sm">
                    <code>{JSON.stringify(run, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}