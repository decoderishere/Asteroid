'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>
  uploading: boolean
  className?: string
}

export default function FileUpload({ onFileUpload, uploading, className }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !uploading) {
      await onFileUpload(acceptedFiles[0])
    }
  }, [onFileUpload, uploading])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'message/rfc822': ['.eml'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploading
  })

  return (
    <div className={clsx('w-full', className)}>
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          {
            'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/50': isDragActive && !isDragReject,
            'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/50': isDragReject,
            'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700': !isDragActive && !uploading,
            'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-800 cursor-not-allowed opacity-50': uploading
          }
        )}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Procesando archivo...</p>
          </div>
        ) : isDragReject ? (
          <div className="flex flex-col items-center">
            <DocumentIcon className="h-8 w-8 text-red-400 dark:text-red-500 mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              Tipo de archivo no soportado
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
              Solo PDF, DOC, DOCX, TXT, EML (máx. 10MB)
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <CloudArrowUpIcon className={clsx(
              'h-8 w-8 mb-2',
              isDragActive ? 'text-primary-500 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
            )} />
            <p className={clsx(
              'text-sm font-medium',
              isDragActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
            )}>
              {isDragActive ? 'Suelte el archivo aquí' : 'Arrastre archivos o haga clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              PDF, DOC, DOCX, TXT, EML (máx. 10MB)
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-2">Tipos de documentos recomendados:</p>
        <ul className="space-y-1 pl-4">
          <li>• Estudios técnicos y especificaciones</li>
          <li>• Documentos ambientales y permisos previos</li>
          <li>• Correspondencia con autoridades</li>
          <li>• Planos y diagramas técnicos (en formato texto)</li>
          <li>• Análisis de impacto y mitigación</li>
        </ul>
      </div>
    </div>
  )
}