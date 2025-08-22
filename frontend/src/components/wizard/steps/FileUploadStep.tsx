/**
 * File upload step for the document wizard
 */

import React, { useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDropzone } from 'react-dropzone';

interface FileUploadStepProps {
  files: File[];
  onUpdate: (files: File[]) => void;
  isOptional?: boolean;
}

const acceptedFileTypes = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'message/rfc822': ['.eml'],
  'application/x-bibtex': ['.bib'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'application/acad': ['.dwg'],
  'application/dxf': ['.dxf'],
};

const maxFileSize = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileCategory(file: File): string {
  const name = file.name.toLowerCase();
  
  if (name.includes('environmental') || name.includes('impact') || name.includes('dia')) {
    return 'environmental';
  } else if (name.includes('technical') || name.includes('spec') || name.includes('dwg') || name.includes('dxf')) {
    return 'technical';
  } else if (name.includes('permit') || name.includes('regulatory') || name.includes('compliance')) {
    return 'regulatory';
  }
  
  return 'other';
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('image')) return '🖼️';
  if (type.includes('text')) return '📃';
  if (type.includes('acad') || type.includes('dxf')) return '📐';
  return '📎';
}

export function FileUploadStep({ files, onUpdate, isOptional }: FileUploadStepProps) {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles);
    }
    
    // Filter out duplicate files by name
    const uniqueFiles = acceptedFiles.filter(
      newFile => !files.some(existingFile => existingFile.name === newFile.name)
    );
    
    onUpdate([...files, ...uniqueFiles]);
  }, [files, onUpdate]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    multiple: true,
  });

  const removeFile = (indexToRemove: number) => {
    onUpdate(files.filter((_, index) => index !== indexToRemove));
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const categoryGroups = files.reduce((groups, file) => {
    const category = getFileCategory(file);
    if (!groups[category]) groups[category] = [];
    groups[category].push(file);
    return groups;
  }, {} as Record<string, File[]>);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-blue-600">Drop files here</p>
                <p className="text-sm text-blue-500">Release to upload</p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isOptional ? 'Optional: ' : ''}Upload supporting documents for your BESS project
                </p>
                <Button variant="outline" className="mb-4">
                  Select Files
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Accepted formats: PDF, DOC, DOCX, TXT, EML, BIB, PNG, JPG, DWG, DXF</p>
                  <p>Maximum file size: 10MB per file</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Rejection Errors */}
      {fileRejections.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some files were rejected:
            <ul className="list-disc list-inside mt-2">
              {fileRejections.map(({ file, errors }, index) => (
                <li key={index} className="text-sm">
                  <strong>{file.name}</strong>: {errors.map(e => e.message).join(', ')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {files.length} file{files.length === 1 ? '' : 's'} uploaded
                  </span>
                </div>
                <Badge variant="secondary">
                  Total: {formatFileSize(totalSize)}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Files by Category */}
          {Object.entries(categoryGroups).map(([category, categoryFiles]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg capitalize flex items-center gap-2">
                  {category === 'environmental' && '🌱'}
                  {category === 'technical' && '⚙️'}
                  {category === 'regulatory' && '📋'}
                  {category === 'other' && '📄'}
                  {category} Files
                  <Badge variant="secondary" className="ml-auto">
                    {categoryFiles.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {categoryFiles.map((file, index) => {
                  const globalIndex = files.indexOf(file);
                  
                  return (
                    <div
                      key={globalIndex}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xl">{getFileIcon(file)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatFileSize(file.size)} • {file.type.split('/').pop()?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(globalIndex)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File Suggestions */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
            Recommended File Types
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Environmental:</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 mt-1">
                <li>• Environmental baseline studies</li>
                <li>• Species inventories</li>
                <li>• Soil and water analyses</li>
                <li>• Stakeholder consultation records</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Technical:</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 mt-1">
                <li>• Equipment specifications</li>
                <li>• Site plans and drawings</li>
                <li>• One-line diagrams</li>
                <li>• Test reports and certificates</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">Regulatory:</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-1 mt-1">
                <li>• Previous permit applications</li>
                <li>• Compliance documentation</li>
                <li>• Legal agreements</li>
                <li>• Correspondence with authorities</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isOptional ? (
          <p className="text-blue-600 dark:text-blue-400">
            ℹ️ This step is optional. You can skip it and continue without uploading files.
          </p>
        ) : files.length > 0 ? (
          <p className="text-green-600 dark:text-green-400">
            ✓ {files.length} file{files.length === 1 ? '' : 's'} uploaded successfully
          </p>
        ) : (
          <p className="text-amber-600 dark:text-amber-400">
            ⚠️ No files uploaded yet. Consider adding supporting documents to improve document quality.
          </p>
        )}
      </div>
    </div>
  );
}