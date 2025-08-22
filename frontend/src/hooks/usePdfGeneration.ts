import { useState } from 'react'
import html2pdf from 'html2pdf.js'
import { toast } from 'sonner'

interface PDFGenerationOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number | [number, number, number, number]
}

interface EnvironmentalStudyData {
  projectId: string
  projectName: string
  location: {
    region: string
    commune: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  technicalSpecs: {
    capacity: number
    batteryType: string
    area: number
    interconnectionVoltage: string
  }
  environmentalData: {
    landUse: string
    protectedAreas: string[]
    waterBodies: string[]
    vegetation: string
    wildlife: string[]
    archeologicalSites: boolean
    airQualityBaseline: string
  }
  stakeholders: {
    communities: string[]
    authorities: string[]
    environmentalGroups: string[]
  }
}

export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)

  const generateEnvironmentalStudyPDF = async (
    data: EnvironmentalStudyData,
    options: PDFGenerationOptions = {}
  ) => {
    setIsGenerating(true)
    setProgress(10)

    try {
      // Call the API to generate HTML
      setProgress(30)
      const response = await fetch('/api/pdf/environmental-study', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate study')
      }

      setProgress(50)
      const { html, filename } = await response.json()

      // Configure PDF options
      const pdfOptions = {
        margin: options.margin || [10, 10, 10, 10],
        filename: options.filename || filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          allowTaint: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: options.format || 'a4', 
          orientation: options.orientation || 'portrait' 
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      setProgress(70)

      // Create temporary element with the HTML
      const element = document.createElement('div')
      element.innerHTML = html
      element.style.width = '210mm' // A4 width
      element.style.minHeight = '297mm' // A4 height
      element.style.padding = '0'
      element.style.margin = '0'
      element.style.backgroundColor = 'white'
      
      // Temporarily add to DOM for rendering
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      document.body.appendChild(element)

      setProgress(90)

      // Generate and download PDF
      await html2pdf().set(pdfOptions).from(element).save()

      // Clean up
      document.body.removeChild(element)

      setProgress(100)
      toast.success('PDF generado exitosamente')

    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error(`Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      throw error
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  const generateFromHTML = async (
    html: string,
    filename: string,
    options: PDFGenerationOptions = {}
  ) => {
    setIsGenerating(true)
    setProgress(20)

    try {
      const pdfOptions = {
        margin: options.margin || [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true 
        },
        jsPDF: { 
          unit: 'mm', 
          format: options.format || 'a4', 
          orientation: options.orientation || 'portrait' 
        }
      }

      setProgress(50)

      // Create temporary element
      const element = document.createElement('div')
      element.innerHTML = html
      element.style.width = '210mm'
      element.style.backgroundColor = 'white'
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      document.body.appendChild(element)

      setProgress(80)

      await html2pdf().set(pdfOptions).from(element).save()

      document.body.removeChild(element)
      setProgress(100)
      toast.success('PDF generado exitosamente')

    } catch (error) {
      console.error('Error generating PDF from HTML:', error)
      toast.error('Error al generar PDF')
      throw error
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  return {
    generateEnvironmentalStudyPDF,
    generateFromHTML,
    isGenerating,
    progress
  }
}

// Sample data for testing
export const sampleEnvironmentalStudyData: EnvironmentalStudyData = {
  projectId: "BESS_COQUIMBO_001",
  projectName: "Coquimbo Solar + Storage Phase I",
  location: {
    region: "Coquimbo",
    commune: "La Serena",
    coordinates: {
      lat: -29.9027,
      lng: -71.2519
    }
  },
  technicalSpecs: {
    capacity: 50,
    batteryType: "Ion-Litio LFP",
    area: 2.5,
    interconnectionVoltage: "23 kV"
  },
  environmentalData: {
    landUse: "Terreno baldío con vegetación xerofítica",
    protectedAreas: ["Reserva Nacional Pingüino de Humboldt (15 km al norte)"],
    waterBodies: ["Río Elqui (3 km al este)"],
    vegetation: "Matorral xerofítico costero con especies como Atriplex atacamensis y Lycium stenophyllum",
    wildlife: ["Zorro culpeo (Lycalopex culpaeus)", "Chungungo (Lontra felina)", "Gaviota dominicana (Larus dominicanus)"],
    archeologicalSites: false,
    airQualityBaseline: "Buena calidad del aire según estación de monitoreo La Serena, con concentraciones de MP10 promedio de 35 μg/m³"
  },
  stakeholders: {
    communities: ["Junta de Vecinos Villa El Faro", "Asociación de Pescadores Artesanales Bahía La Herradura"],
    authorities: ["Municipalidad de La Serena", "SEREMI de Medio Ambiente Región de Coquimbo", "CNE Coquimbo"],
    environmentalGroups: ["ONG Conservación Marina", "Fundación Desierto Florido"]
  }
}