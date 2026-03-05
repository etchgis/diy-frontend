'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
  className?: string
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const renderChart = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#0b5583',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#0b5583',
            lineColor: '#4a5568',
            secondaryColor: '#6e9ab5',
            tertiaryColor: '#e5eaef',
            fontFamily: 'system-ui, sans-serif',
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
          },
        })

        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim())

        if (mounted) {
          setSvg(renderedSvg)
          setError(null)
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err)
        if (mounted) {
          setError('Error rendering diagram')
        }
      }
    }

    renderChart()

    return () => {
      mounted = false
    }
  }, [chart])

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  if (!svg) {
    return <div className={className}>Loading diagram...</div>
  }

  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
