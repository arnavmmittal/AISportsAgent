'use client';

/**
 * BulkImport - CSV upload for historical game data
 *
 * Features:
 * - CSV file upload and parsing
 * - Template download for coaches
 * - Batch create PerformanceMetric records
 * - Validation and error handling
 * - Progress tracking during upload
 */

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface BulkImportProps {
  sport: string;
  onImportComplete?: (count: number) => void;
}

interface ParsedRow {
  athleteId: string;
  athleteName: string;
  gameDate: string;
  opponentName: string;
  outcome: string;
  stats: Record<string, number>;
  rowNumber: number;
}

interface ImportError {
  rowNumber: number;
  athleteName: string;
  error: string;
}

export function BulkImport({ sport, onImportComplete }: BulkImportProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV template structure
  const getCsvTemplate = () => {
    const headers = [
      'Athlete ID',
      'Athlete Name',
      'Game Date (YYYY-MM-DD)',
      'Opponent',
      'Outcome (win/loss/draw)',
      'Points',
      'Shooting %',
      '3PT %',
      'FT %',
      'Assists',
      'Rebounds',
      'Steals',
      'Blocks',
      'Turnovers',
      'Minutes Played',
    ];

    const exampleRow = [
      'athlete-123',
      'John Smith',
      '2024-12-01',
      'Oregon State',
      'win',
      '24',
      '52.3',
      '40.0',
      '85.7',
      '6',
      '8',
      '2',
      '1',
      '3',
      '32',
    ];

    return [headers.join(','), exampleRow.join(',')].join('\n');
  };

  const downloadTemplate = () => {
    const csvContent = getCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `game-stats-template-${sport.toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template downloaded', {
      description: 'Fill in the template and upload to import historical data',
    });
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      if (values.length < 5) continue; // Skip empty or invalid rows

      const row: ParsedRow = {
        athleteId: values[0],
        athleteName: values[1],
        gameDate: values[2],
        opponentName: values[3],
        outcome: values[4].toLowerCase(),
        stats: {},
        rowNumber: i + 1,
      };

      // Parse stats (columns 6+)
      const statFields = [
        'points',
        'shooting_pct',
        'three_point_pct',
        'free_throw_pct',
        'assists',
        'rebounds',
        'steals',
        'blocks',
        'turnovers',
        'minutes_played',
      ];

      statFields.forEach((field, index) => {
        const value = parseFloat(values[5 + index]);
        if (!isNaN(value)) {
          row.stats[field] = value;
        }
      });

      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type', {
        description: 'Please upload a CSV file',
      });
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error('No data found', {
          description: 'The CSV file appears to be empty',
        });
        return;
      }

      setParsedRows(rows);
      toast.success(`Parsed ${rows.length} rows`, {
        description: 'Review the data and click "Import" to proceed',
      });
    } catch (error) {
      toast.error('Failed to parse CSV', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setProgress(0);
    setErrors([]);
    setSuccessCount(0);

    const importErrors: ImportError[] = [];
    let successCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];

      try {
        const response = await fetch('/api/performance/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            athleteId: row.athleteId,
            gameDate: row.gameDate,
            opponentName: row.opponentName,
            outcome: row.outcome,
            stats: row.stats,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          importErrors.push({
            rowNumber: row.rowNumber,
            athleteName: row.athleteName,
            error: error.error || 'Failed to save',
          });
        } else {
          successCount++;
        }
      } catch (error) {
        importErrors.push({
          rowNumber: row.rowNumber,
          athleteName: row.athleteName,
          error: error instanceof Error ? error.message : 'Network error',
        });
      }

      setProgress(((i + 1) / parsedRows.length) * 100);
      setSuccessCount(successCount);
    }

    setErrors(importErrors);
    setImporting(false);

    if (importErrors.length === 0) {
      toast.success('Import complete!', {
        description: `Successfully imported ${successCount} game records`,
        icon: <CheckCircle className="w-4 h-4" />,
      });
      setParsedRows([]);
      onImportComplete?.(successCount);
    } else {
      toast.error('Import completed with errors', {
        description: `${successCount} successful, ${importErrors.length} failed`,
        icon: <AlertCircle className="w-4 h-4" />,
      });
    }
  };

  const handleCancel = () => {
    setParsedRows([]);
    setErrors([]);
    setSuccessCount(0);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Bulk Import Game Stats
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Upload historical game data from a CSV file
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Download Template */}
        <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">Download CSV Template</h4>
              <p className="text-sm text-blue-800 mb-3">
                Get the template with the correct format for {sport} game stats
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </div>
          </div>
        </div>

        {/* Step 2: Upload CSV */}
        <div className="border-l-4 border-secondary bg-secondary/10 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-secondary mb-1">Upload Completed CSV</h4>
              <p className="text-sm text-secondary mb-3">
                Fill in the template with your game data and upload it here
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={importing}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose CSV File
              </Button>
            </div>
          </div>
        </div>

        {/* Parsed Data Preview */}
        {parsedRows.length > 0 && !importing && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-gray-900 mb-2">Preview</h4>
            <p className="text-sm text-gray-600 mb-3">
              {parsedRows.length} game records ready to import
            </p>
            <div className="flex gap-2">
              <Button onClick={handleImport} className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import {parsedRows.length} Records
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importing && (
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="font-semibold text-blue-900">Importing...</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-blue-800">
              {successCount} of {parsedRows.length} records imported ({Math.round(progress)}%)
            </p>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="border border-muted-foreground rounded-lg p-4 bg-muted-foreground/10">
            <h4 className="font-semibold text-chrome mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Import Errors ({errors.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-muted-foreground bg-muted-foreground/20 p-2 rounded">
                  <strong>Row {error.rowNumber} ({error.athleteName}):</strong> {error.error}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
