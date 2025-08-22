import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for environmental study data
const EnvironmentalStudySchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  location: z.object({
    region: z.string(),
    commune: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }),
  technicalSpecs: z.object({
    capacity: z.number(), // MW
    batteryType: z.string(),
    area: z.number(), // hectares
    interconnectionVoltage: z.string()
  }),
  environmentalData: z.object({
    landUse: z.string(),
    protectedAreas: z.array(z.string()),
    waterBodies: z.array(z.string()),
    vegetation: z.string(),
    wildlife: z.array(z.string()),
    archeologicalSites: z.boolean(),
    airQualityBaseline: z.string()
  }),
  stakeholders: z.object({
    communities: z.array(z.string()),
    authorities: z.array(z.string()),
    environmentalGroups: z.array(z.string())
  })
})

type EnvironmentalStudyData = z.infer<typeof EnvironmentalStudySchema>

// Chilean environmental study template
const generateEnvironmentalStudyHTML = (data: EnvironmentalStudyData): string => {
  const currentDate = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Estudio de Impacto Ambiental - ${data.projectName}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            margin: 2cm;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 2cm;
            border-bottom: 2px solid #000;
            padding-bottom: 1cm;
        }
        .title {
            font-size: 18pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 0.5cm;
        }
        .subtitle {
            font-size: 14pt;
            margin-bottom: 0.3cm;
        }
        .section {
            margin-bottom: 1.5cm;
        }
        .section-title {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 0.5cm;
            border-bottom: 1px solid #666;
            padding-bottom: 0.2cm;
        }
        .subsection-title {
            font-size: 12pt;
            font-weight: bold;
            margin: 0.8cm 0 0.3cm 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.5cm 0;
        }
        .table th, .table td {
            border: 1px solid #000;
            padding: 0.3cm;
            text-align: left;
        }
        .table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        ul {
            margin: 0.3cm 0;
            padding-left: 1cm;
        }
        .coordinate {
            font-family: 'Courier New', monospace;
        }
        .page-break {
            page-break-before: always;
        }
        .footer {
            margin-top: 2cm;
            text-align: center;
            font-size: 10pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Estudio de Impacto Ambiental</div>
        <div class="subtitle">Proyecto de Sistema de Almacenamiento de Energía con Baterías (BESS)</div>
        <div class="subtitle">${data.projectName}</div>
        <div style="margin-top: 1cm;">
            <strong>Región:</strong> ${data.location.region}<br>
            <strong>Comuna:</strong> ${data.location.commune}<br>
            <strong>Fecha:</strong> ${currentDate}
        </div>
    </div>

    <div class="section">
        <div class="section-title">1. RESUMEN EJECUTIVO</div>
        <p>
            El presente estudio evalúa el impacto ambiental del proyecto "${data.projectName}", 
            un sistema de almacenamiento de energía con baterías de ${data.technicalSpecs.capacity} MW 
            ubicado en la región de ${data.location.region}, comuna de ${data.location.commune}.
        </p>
        <p>
            El proyecto contempla la instalación de tecnología ${data.technicalSpecs.batteryType} 
            en un área aproximada de ${data.technicalSpecs.area} hectáreas, con conexión al sistema 
            eléctrico nacional a través de línea de ${data.technicalSpecs.interconnectionVoltage}.
        </p>
    </div>

    <div class="section">
        <div class="section-title">2. DESCRIPCIÓN DEL PROYECTO</div>
        
        <div class="subsection-title">2.1 Características Técnicas</div>
        <table class="table">
            <tr>
                <th>Parámetro</th>
                <th>Valor</th>
                <th>Unidad</th>
            </tr>
            <tr>
                <td>Capacidad de Almacenamiento</td>
                <td>${data.technicalSpecs.capacity}</td>
                <td>MW</td>
            </tr>
            <tr>
                <td>Tecnología de Baterías</td>
                <td>${data.technicalSpecs.batteryType}</td>
                <td>-</td>
            </tr>
            <tr>
                <td>Área del Proyecto</td>
                <td>${data.technicalSpecs.area}</td>
                <td>hectáreas</td>
            </tr>
            <tr>
                <td>Tensión de Interconexión</td>
                <td>${data.technicalSpecs.interconnectionVoltage}</td>
                <td>kV</td>
            </tr>
        </table>

        <div class="subsection-title">2.2 Ubicación</div>
        <p><strong>Coordenadas geográficas:</strong></p>
        <ul>
            <li>Latitud: <span class="coordinate">${data.location.coordinates.lat}°S</span></li>
            <li>Longitud: <span class="coordinate">${data.location.coordinates.lng}°W</span></li>
        </ul>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">3. LÍNEA DE BASE AMBIENTAL</div>

        <div class="subsection-title">3.1 Medio Físico</div>
        <p><strong>Uso actual del suelo:</strong> ${data.environmentalData.landUse}</p>
        <p><strong>Calidad del aire (línea base):</strong> ${data.environmentalData.airQualityBaseline}</p>
        
        ${data.environmentalData.waterBodies.length > 0 ? `
        <p><strong>Recursos hídricos identificados:</strong></p>
        <ul>
            ${data.environmentalData.waterBodies.map(body => `<li>${body}</li>`).join('')}
        </ul>
        ` : '<p><strong>Recursos hídricos:</strong> No se identificaron cuerpos de agua en el área de influencia.</p>'}

        <div class="subsection-title">3.2 Medio Biótico</div>
        <p><strong>Vegetación predominante:</strong> ${data.environmentalData.vegetation}</p>
        
        ${data.environmentalData.wildlife.length > 0 ? `
        <p><strong>Fauna identificada:</strong></p>
        <ul>
            ${data.environmentalData.wildlife.map(species => `<li>${species}</li>`).join('')}
        </ul>
        ` : '<p><strong>Fauna:</strong> No se registraron especies de fauna relevante en el área del proyecto.</p>'}

        <div class="subsection-title">3.3 Medio Socioeconómico</div>
        
        ${data.environmentalData.protectedAreas.length > 0 ? `
        <p><strong>Áreas protegidas cercanas:</strong></p>
        <ul>
            ${data.environmentalData.protectedAreas.map(area => `<li>${area}</li>`).join('')}
        </ul>
        ` : '<p><strong>Áreas protegidas:</strong> No se identificaron áreas protegidas en el área de influencia directa.</p>'}

        <p><strong>Patrimonio arqueológico:</strong> ${data.environmentalData.archeologicalSites ? 
            'Se han identificado posibles sitios de interés arqueológico que requieren evaluación especializada.' : 
            'No se identificaron sitios de interés arqueológico en el área del proyecto.'}</p>
    </div>

    <div class="section">
        <div class="section-title">4. IDENTIFICACIÓN Y EVALUACIÓN DE IMPACTOS</div>

        <div class="subsection-title">4.1 Fase de Construcción</div>
        <table class="table">
            <tr>
                <th>Componente Ambiental</th>
                <th>Impacto Identificado</th>
                <th>Significancia</th>
                <th>Medidas de Mitigación</th>
            </tr>
            <tr>
                <td>Calidad del Aire</td>
                <td>Incremento temporal de material particulado</td>
                <td>Baja</td>
                <td>Humectación de caminos, control de velocidad</td>
            </tr>
            <tr>
                <td>Ruido</td>
                <td>Incremento de niveles sonoros</td>
                <td>Baja</td>
                <td>Restricción de horarios de trabajo, mantención de equipos</td>
            </tr>
            <tr>
                <td>Suelo</td>
                <td>Compactación y erosión</td>
                <td>Media</td>
                <td>Delimitación de áreas de trabajo, restauración posterior</td>
            </tr>
        </table>

        <div class="subsection-title">4.2 Fase de Operación</div>
        <p>Durante la fase operacional, el proyecto generará impactos positivos al sistema eléctrico nacional:</p>
        <ul>
            <li>Mejora de la estabilidad de la red eléctrica</li>
            <li>Facilitación de la integración de energías renovables</li>
            <li>Reducción de emisiones de gases de efecto invernadero</li>
        </ul>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <div class="section-title">5. PLAN DE MANEJO AMBIENTAL</div>

        <div class="subsection-title">5.1 Medidas de Prevención</div>
        <ul>
            <li>Capacitación ambiental del personal</li>
            <li>Demarcación de áreas sensibles</li>
            <li>Implementación de protocolos de emergencia ambiental</li>
        </ul>

        <div class="subsection-title">5.2 Plan de Monitoreo</div>
        <table class="table">
            <tr>
                <th>Parámetro</th>
                <th>Frecuencia</th>
                <th>Ubicación</th>
                <th>Duración</th>
            </tr>
            <tr>
                <td>Calidad del aire (MP10, MP2.5)</td>
                <td>Mensual</td>
                <td>Perímetro del proyecto</td>
                <td>Durante construcción</td>
            </tr>
            <tr>
                <td>Niveles de ruido</td>
                <td>Trimestral</td>
                <td>Receptores sensibles</td>
                <td>Construcción y operación</td>
            </tr>
            <tr>
                <td>Fauna</td>
                <td>Semestral</td>
                <td>Área de influencia</td>
                <td>Primeros 2 años de operación</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">6. PARTICIPACIÓN CIUDADANA</div>
        
        <div class="subsection-title">6.1 Grupos de Interés Identificados</div>
        
        ${data.stakeholders.communities.length > 0 ? `
        <p><strong>Comunidades locales:</strong></p>
        <ul>
            ${data.stakeholders.communities.map(community => `<li>${community}</li>`).join('')}
        </ul>
        ` : ''}

        ${data.stakeholders.authorities.length > 0 ? `
        <p><strong>Autoridades relevantes:</strong></p>
        <ul>
            ${data.stakeholders.authorities.map(authority => `<li>${authority}</li>`).join('')}
        </ul>
        ` : ''}

        ${data.stakeholders.environmentalGroups.length > 0 ? `
        <p><strong>Organizaciones ambientales:</strong></p>
        <ul>
            ${data.stakeholders.environmentalGroups.map(group => `<li>${group}</li>`).join('')}
        </ul>
        ` : ''}

        <div class="subsection-title">6.2 Mecanismos de Participación</div>
        <ul>
            <li>Reuniones informativas con la comunidad local</li>
            <li>Canal de comunicación permanente durante construcción</li>
            <li>Procedimiento de atención de consultas y reclamos</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">7. CONCLUSIONES</div>
        <p>
            El proyecto "${data.projectName}" presenta impactos ambientales de baja a media significancia, 
            siendo estos temporales y reversibles mediante la aplicación de medidas de mitigación apropiadas.
        </p>
        <p>
            Los beneficios ambientales a nivel nacional superan los impactos locales identificados, 
            contribuyendo significativamente a la transición energética del país y la reducción de 
            emisiones de gases de efecto invernadero.
        </p>
        <p>
            Se recomienda la aprobación del proyecto condicionada al cumplimiento estricto del 
            Plan de Manejo Ambiental propuesto.
        </p>
    </div>

    <div class="footer">
        <p>Este documento ha sido generado automáticamente por el Sistema de Gestión de Permisos BESS</p>
        <p>Proyecto ID: ${data.projectId} | Fecha de generación: ${currentDate}</p>
    </div>
</body>
</html>
`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = EnvironmentalStudySchema.parse(body)
    
    // Generate HTML content
    const htmlContent = generateEnvironmentalStudyHTML(validatedData)
    
    // Return HTML that can be converted to PDF on client side
    return NextResponse.json({
      success: true,
      html: htmlContent,
      filename: `EIA_${validatedData.projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`
    })
    
  } catch (error) {
    console.error('Error generating environmental study:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate environmental study' },
      { status: 500 }
    )
  }
}