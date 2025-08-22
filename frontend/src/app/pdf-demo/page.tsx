"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileText, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePdfGeneration, sampleEnvironmentalStudyData } from '@/hooks/usePdfGeneration'

export default function PDFDemoPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { generateEnvironmentalStudyPDF, progress } = usePdfGeneration()

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true)
      await generateEnvironmentalStudyPDF(sampleEnvironmentalStudyData)
      toast.success('¡PDF generado exitosamente! Revisa tu carpeta de descargas.')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Error al generar el PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Demostración de Generación de PDF
        </h1>
        <p className="text-muted-foreground">
          Sistema de generación automática de Estudios de Impacto Ambiental para proyectos BESS en Chile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Generator Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generador de Estudio Ambiental
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Genera un Estudio de Impacto Ambiental completo usando datos del proyecto de muestra
              "Coquimbo Solar + Storage Phase I".
            </p>
            
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generar Estudio Ambiental PDF
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
          </CardContent>
        </Card>

        {/* Project Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Proyecto de Muestra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Proyecto:</p>
                <p className="text-foreground">{sampleEnvironmentalStudyData.projectName}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">ID:</p>
                <p className="text-foreground font-mono text-xs">{sampleEnvironmentalStudyData.projectId}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Región:</p>
                <p className="text-foreground">{sampleEnvironmentalStudyData.location.region}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Comuna:</p>
                <p className="text-foreground">{sampleEnvironmentalStudyData.location.commune}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Capacidad:</p>
                <p className="text-foreground">{sampleEnvironmentalStudyData.technicalSpecs.capacity} MW</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Tecnología:</p>
                <p className="text-foreground">{sampleEnvironmentalStudyData.technicalSpecs.batteryType}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Coordenadas:</p>
              <p className="text-xs font-mono bg-muted p-2 rounded">
                {sampleEnvironmentalStudyData.location.coordinates.lat}°S, {sampleEnvironmentalStudyData.location.coordinates.lng}°W
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Features Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Características del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">📋 Contenido Específico</h4>
              <p className="text-xs text-muted-foreground">
                100% específico del caso, sin texto genérico de relleno
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">🇨🇱 Cumplimiento Normativo</h4>
              <p className="text-xs text-muted-foreground">
                Alineado con regulaciones chilenas de EIA y SEIA
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">⚡ Generación Rápida</h4>
              <p className="text-xs text-muted-foreground">
                PDF completo generado en segundos con datos reales
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">📊 Datos Estructurados</h4>
              <p className="text-xs text-muted-foreground">
                Tablas, coordenadas y métricas técnicas precisas
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">🌱 Evaluación Ambiental</h4>
              <p className="text-xs text-muted-foreground">
                Análisis de impactos y medidas de mitigación específicas
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">👥 Stakeholders</h4>
              <p className="text-xs text-muted-foreground">
                Identificación de actores y plan de participación ciudadana
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}