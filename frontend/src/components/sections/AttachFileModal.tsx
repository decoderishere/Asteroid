"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Upload, 
  X, 
  Search,
  File,
  Image,
  FileSpreadsheet,
  Download
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface ProjectFile {
  id: string
  name: string
  category: string
  size: number
  mimeType: string
  uploadedAt: string
  url?: string
  thumbnailUrl?: string
}

interface AttachFileModalProps {
  category: string
  onAttach: (fileId: string, fileName: string) => void
  onClose: () => void
  currentFileId?: string
}

export default function AttachFileModal({ 
  category, 
  onAttach, 
  onClose, 
  currentFileId 
}: AttachFileModalProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<ProjectFile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedFileId, setSelectedFileId] = useState<string>(currentFileId || '')

  useEffect(() => {
    loadProjectFiles()
  }, [])

  useEffect(() => {
    // Filter files by category and search term
    let filtered = files.filter(file => 
      file.category === category || category === 'general'
    )

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredFiles(filtered)
  }, [files, category, searchTerm])

  const loadProjectFiles = async () => {
    try {
      setLoading(true)
      // Mock data - in production, this would fetch from the API
      const mockFiles: ProjectFile[] = [
        {
          id: 'file-1',
          name: 'Site_Location_Map.pdf',
          category: 'maps',
          size: 2048000,
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'file-2',
          name: 'Electrical_Single_Line_Diagram.dwg',
          category: 'single_line_diagrams',
          size: 1024000,
          mimeType: 'application/acad',
          uploadedAt: '2024-01-14T15:30:00Z'
        },
        {
          id: 'file-3',
          name: 'Battery_System_Datasheet.pdf',
          category: 'technical_specs',
          size: 512000,
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-13T09:15:00Z'
        },
        {
          id: 'file-4',
          name: 'Environmental_Baseline_Study.pdf',
          category: 'environmental',
          size: 4096000,
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-12T14:45:00Z'
        },
        {
          id: 'file-5',
          name: 'Financial_Model_v2.xlsx',
          category: 'financial',
          size: 256000,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          uploadedAt: '2024-01-11T16:20:00Z'
        },
        {
          id: 'file-6',
          name: 'Permit_Requirements_List.pdf',
          category: 'permits',
          size: 128000,
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-10T11:10:00Z'
        }
      ]
      
      setFiles(mockFiles)
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load project files')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    }
    if (mimeType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleFileSelect = (file: ProjectFile) => {
    setSelectedFileId(file.id)
  }

  const handleAttach = () => {
    const selectedFile = files.find(f => f.id === selectedFileId)
    if (selectedFile) {
      onAttach(selectedFile.id, selectedFile.name)
    }
  }

  const handleUploadNew = () => {
    // In production, this would open a file upload dialog
    toast.info('File upload functionality would be implemented here')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attach File
              <Badge variant="outline" className="ml-2 capitalize">
                {category}
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Upload */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleUploadNew}>
              <Upload className="h-4 w-4 mr-2" />
              Upload New
            </Button>
          </div>

          {/* Files List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files found in the {category} category</p>
                <Button variant="link" onClick={handleUploadNew} className="mt-2">
                  Upload the first file
                </Button>
              </div>
            ) : (
              filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFileId === file.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {file.category}
                        </Badge>
                      </div>
                    </div>
                    {file.url && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedFileId ? `Selected: ${files.find(f => f.id === selectedFileId)?.name}` : 'Select a file to attach'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAttach}
                disabled={!selectedFileId}
              >
                Attach File
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}