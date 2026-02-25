export interface ImportJobResult {
  jobId: string
  rowsProcessed: number
  rowsFailed: number
  errors: ImportError[]
  warnings: ImportWarning[]
}

export interface CSVRow {
  [key: string]: string
}

export interface ImportError {
  rowNumber: number
  field: string
  message: string
}

export interface ImportWarning {
  rowNumber: number
  message: string
}

export interface CSVMapping {
  [requiredField: string]: string
}
