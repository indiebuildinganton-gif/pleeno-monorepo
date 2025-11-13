'use client'

import * as React from 'react'
import { Download, Maximize2, Minimize2, X, FileText, AlertCircle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent } from '../ui/dialog'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export interface DocumentViewerProps {
  documentUrl: string
  filename: string
  isOpen: boolean
  onClose: () => void
}

type DocumentType = 'pdf' | 'image' | 'unsupported'

function getDocumentType(filename: string): DocumentType {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png'].includes(extension || '')) return 'image'
  return 'unsupported'
}

export function DocumentViewer({ documentUrl, filename, isOpen, onClose }: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [hasError, setHasError] = React.useState(false)

  const documentType = getDocumentType(filename)

  // Reset loading and error states when document changes
  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setHasError(false)
    }
  }, [documentUrl, isOpen])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `${documentUrl}?download=true`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'flex flex-col',
          isFullscreen
            ? 'h-screen max-h-screen w-screen max-w-none rounded-none p-0'
            : 'max-h-[90vh] h-[80vh] max-w-4xl p-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/10 px-4 py-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate" title={filename}>
              {filename}
            </span>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {/* Download Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              </span>
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 relative bg-muted/5 overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2 text-center px-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-semibold">Failed to load document</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  The document could not be loaded. It may have been deleted or moved.
                </p>
                <Button variant="outline" onClick={handleDownload} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Try downloading instead
                </Button>
              </div>
            </div>
          )}

          {/* Unsupported Format */}
          {documentType === 'unsupported' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center space-y-2 text-center px-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-semibold">Preview not available</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  This file type cannot be previewed in the browser. Please download the file to view
                  it.
                </p>
                <Button variant="default" onClick={handleDownload} className="mt-4">
                  <Download className="h-4 w-4 mr-2" />
                  Download {filename}
                </Button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {documentType === 'pdf' && !hasError && (
            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              title={filename}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}

          {/* Image Viewer */}
          {documentType === 'image' && !hasError && (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={documentUrl}
                alt={filename}
                className="max-w-full max-h-full object-contain"
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
