"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { api } from "@/lib/api"

interface CSVImportProps {
  termId: string
  onImportComplete: () => void
}

export function CSVImport({ termId, onImportComplete }: CSVImportProps) {
  const [csvContent, setCSVContent] = useState("")
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a .csv file")
      return
    }

    setFileName(file.name)
    setError("")

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCSVContent(content)
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsText(file)
  }

  const handlePreview = async () => {
    if (!csvContent.trim()) {
      setError("Please upload or paste CSV content first")
      return
    }

    try {
      setError("")
      setIsImporting(true)
      const result = await api.import.previewCSV(csvContent)
      setPreviewData(result)
      setIsPreviewOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview CSV")
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = async () => {
    if (!csvContent.trim() || !termId) {
      setError("Missing CSV content or term selection")
      return
    }

    try {
      setError("")
      setIsImporting(true)
      const result = await api.import.importSchedules(csvContent, termId)
      setImportResult(result)
      setPreviewData(null)
      
      // Clear the CSV content after successful import
      if (result.success) {
        setTimeout(() => {
          setCSVContent("")
          setFileName("")
          setImportResult(null)
          setIsPreviewOpen(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
          onImportComplete()
        }, 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import schedules")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Upload className="w-5 h-5" />
          Import Schedules from Teams CSV
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertDescription>
            <strong>Instructions:</strong> Upload or paste your Teams shift export CSV. 
            Format: Name, Email, Role, StartDate, StartTime, EndDate, EndTime, ...
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Note: Assumes earliest date in CSV is Monday. Students are matched by name.
            </span>
          </AlertDescription>
        </Alert>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Upload CSV File</label>
          <div className="flex gap-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="flex-1"
            />
            {fileName && (
              <Badge variant="secondary" className="self-center">
                {fileName}
              </Badge>
            )}
          </div>
        </div>

        {/* CSV Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Or Paste CSV Content</label>
          <Textarea
            placeholder="Paste CSV content here..."
            value={csvContent}
            onChange={(e) => setCSVContent(e.target.value)}
            className="font-mono text-xs min-h-[200px]"
            disabled={isImporting}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handlePreview}
            disabled={isImporting || !csvContent.trim()}
            variant="outline"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Preview
              </>
            )}
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || !csvContent.trim() || !termId}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Now
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Preview Results */}
        {isPreviewOpen && previewData && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold text-foreground">Preview Results</h3>
            <div className="flex gap-2">
              <Badge variant="secondary">
                Total: {previewData.summary.totalRows}
              </Badge>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Matched: {previewData.summary.matched}
              </Badge>
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                Unmatched: {previewData.summary.unmatched}
              </Badge>
            </div>

            {previewData.unmatchedStudents.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Unmatched students:</strong>{" "}
                  {previewData.unmatchedStudents.map((s: any) => s.csvName).join(", ")}
                  <br />
                  <span className="text-xs mt-1 block">
                    These students will be skipped. Please ensure their names match exactly.
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <AlertDescription>
              <strong className="text-green-800 dark:text-green-300">
                {importResult.message}
              </strong>
              <div className="mt-2 space-y-1 text-sm">
                <div>✅ Saved: {importResult.summary.saved} students</div>
                {importResult.summary.errors > 0 && (
                  <div className="text-red-600">⚠️ Errors: {importResult.summary.errors}</div>
                )}
                {importResult.summary.unmatched > 0 && (
                  <div className="text-yellow-600">⚠️ Unmatched: {importResult.summary.unmatched}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

