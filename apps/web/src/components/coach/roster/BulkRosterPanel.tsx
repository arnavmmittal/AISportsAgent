'use client';

/**
 * BulkRosterPanel - Bulk roster operations for large teams
 *
 * Features:
 * - Export current roster to CSV
 * - Import athletes from CSV
 * - Bulk invite athletes via email
 * - Template download for easy data entry
 */

import { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Users,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/shared/ui/button';
import { Switch } from '@/components/shared/ui/switch';
import { Label } from '@/components/shared/ui/label';
import { cn } from '@/lib/utils';

interface BulkRosterPanelProps {
  onImportComplete?: (count: number) => void;
  inviteCode?: string;
  currentRosterSize?: number;
  demo?: boolean;
}

interface ParsedAthlete {
  name: string;
  email: string;
  sport: string;
  year?: string;
  position?: string;
  rowNumber: number;
}

interface ImportResult {
  created: Array<{ name: string; email: string; status: string }>;
  existing: Array<{ name: string; email: string; status: string }>;
  errors: Array<{ name: string; email: string; error: string }>;
}

export default function BulkRosterPanel({
  onImportComplete,
  inviteCode,
  currentRosterSize = 0,
  demo = false,
}: BulkRosterPanelProps) {
  const [mode, setMode] = useState<'idle' | 'import' | 'importing' | 'results'>('idle');
  const [parsedAthletes, setParsedAthletes] = useState<ParsedAthlete[]>([]);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [sendInvites, setSendInvites] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSV template
  const getCsvTemplate = () => {
    const headers = ['Name', 'Email', 'Sport', 'Year', 'Position'];
    const examples = [
      ['Alex Johnson', 'alex.johnson@university.edu', 'Basketball', 'Junior', 'Guard'],
      ['Taylor Smith', 'taylor.smith@university.edu', 'Basketball', 'Senior', 'Forward'],
      ['Jordan Williams', 'jordan.w@university.edu', 'Basketball', 'Freshman', 'Center'],
    ];
    return [headers.join(','), ...examples.map((row) => row.join(','))].join('\n');
  };

  const downloadTemplate = () => {
    const csvContent = getCsvTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'roster-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template downloaded', {
      description: 'Fill in athlete information and upload to import',
    });
  };

  const exportRoster = async () => {
    if (demo) {
      toast.success('Roster exported (demo mode)');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/coach/roster?export=csv');

      if (!response.ok) {
        throw new Error('Failed to export');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `roster-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Roster exported', {
        description: `${currentRosterSize} athletes exported to CSV`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export roster');
    } finally {
      setIsExporting(false);
    }
  };

  const parseCSV = (text: string): ParsedAthlete[] => {
    const lines = text.trim().split('\n');
    const athletes: ParsedAthlete[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length >= 2 && values[0] && values[1]) {
        athletes.push({
          name: values[0],
          email: values[1],
          sport: values[2] || 'General',
          year: values[3],
          position: values[4],
          rowNumber: i + 1,
        });
      }
    }

    return athletes;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid file type', { description: 'Please upload a CSV file' });
      return;
    }

    try {
      const text = await file.text();
      const athletes = parseCSV(text);

      if (athletes.length === 0) {
        toast.error('No data found', { description: 'The CSV file appears to be empty' });
        return;
      }

      // Validate emails
      const invalidEmails = athletes.filter(
        (a) => !a.email.includes('@') || !a.email.includes('.')
      );
      if (invalidEmails.length > 0) {
        toast.warning(`${invalidEmails.length} rows have invalid emails`, {
          description: 'These will be skipped during import',
        });
      }

      setParsedAthletes(athletes.filter((a) => a.email.includes('@')));
      setMode('import');
      toast.success(`Parsed ${athletes.length} athletes`, {
        description: 'Review and click Import to proceed',
      });
    } catch (error) {
      toast.error('Failed to parse CSV', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleImport = async () => {
    if (parsedAthletes.length === 0) return;

    if (demo) {
      setMode('importing');
      setProgress(0);

      // Simulate import
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((r) => setTimeout(r, 200));
        setProgress(i);
      }

      setImportResults({
        created: parsedAthletes.slice(0, Math.ceil(parsedAthletes.length * 0.7)).map((a) => ({
          name: a.name,
          email: a.email,
          status: 'Created and invited',
        })),
        existing: parsedAthletes.slice(Math.ceil(parsedAthletes.length * 0.7)).map((a) => ({
          name: a.name,
          email: a.email,
          status: 'Already on roster',
        })),
        errors: [],
      });
      setMode('results');
      toast.success('Import complete (demo mode)');
      return;
    }

    setMode('importing');
    setProgress(0);

    try {
      const response = await fetch('/api/coach/roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athletes: parsedAthletes,
          sendInvites,
        }),
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const data = await response.json();
      setImportResults(data.results);
      setProgress(100);
      setMode('results');

      toast.success('Import complete!', {
        description: `${data.summary.created} created, ${data.summary.existing} existing, ${data.summary.errors} errors`,
      });

      onImportComplete?.(data.summary.created);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed');
      setMode('import');
    }
  };

  const handleCancel = () => {
    setMode('idle');
    setParsedAthletes([]);
    setImportResults(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
      toast.success('Invite code copied');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Bulk Roster Management</h3>
            <p className="text-sm text-muted-foreground">
              {currentRosterSize} athletes on roster
            </p>
          </div>
        </div>
      </div>

      {/* Invite Code Quick Share */}
      {inviteCode && (
        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Team Invite Code</div>
            <div className="text-xs text-muted-foreground">Athletes can join using this code</div>
          </div>
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 bg-background border border-border rounded-md font-mono text-sm">
              {inviteCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyInviteCode}>
              {codeCopied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {mode === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Section */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Export Roster</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Download your current roster as a CSV file for backup or external use.
            </p>
            <Button
              variant="outline"
              onClick={exportRoster}
              disabled={isExporting || currentRosterSize === 0}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export to CSV
            </Button>
          </div>

          {/* Import Section */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-success" />
              <h4 className="font-medium">Import Athletes</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a CSV file to add multiple athletes at once.
            </p>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex-1"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Template
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview */}
      {mode === 'import' && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
            <div>
              <span className="font-medium">Review Import</span>
              <span className="text-sm text-muted-foreground ml-2">
                {parsedAthletes.length} athletes to import
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-4">
            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Sport</th>
                    <th className="text-left p-2 font-medium">Year</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedAthletes.slice(0, 10).map((athlete, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="p-2">{athlete.name}</td>
                      <td className="p-2 text-muted-foreground">{athlete.email}</td>
                      <td className="p-2">{athlete.sport}</td>
                      <td className="p-2">{athlete.year || '-'}</td>
                    </tr>
                  ))}
                  {parsedAthletes.length > 10 && (
                    <tr className="border-t border-border bg-muted/50">
                      <td colSpan={4} className="p-2 text-center text-muted-foreground">
                        ...and {parsedAthletes.length - 10} more athletes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Send Invites Option */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Send invite emails</Label>
                  <p className="text-xs text-muted-foreground">
                    New athletes will receive signup invitations
                  </p>
                </div>
              </div>
              <Switch checked={sendInvites} onCheckedChange={setSendInvites} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleImport} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Import {parsedAthletes.length} Athletes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Importing Progress */}
      {mode === 'importing' && (
        <div className="border border-primary/30 rounded-lg p-6 bg-primary/5">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="font-medium">Importing athletes...</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Processing {parsedAthletes.length} athletes ({Math.round(progress)}%)
          </p>
        </div>
      )}

      {/* Import Results */}
      {mode === 'results' && importResults && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-success/10 px-4 py-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium">Import Complete</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-success">
                  {importResults.created.length}
                </div>
                <div className="text-xs text-muted-foreground">Created</div>
              </div>
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-muted-foreground">
                  {importResults.existing.length}
                </div>
                <div className="text-xs text-muted-foreground">Existing</div>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-destructive">
                  {importResults.errors.length}
                </div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>

            {/* Error Details */}
            {importResults.errors.length > 0 && (
              <div className="border border-destructive/30 rounded-lg p-3 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="font-medium text-destructive">Errors</span>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResults.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      <strong>{err.name}</strong> ({err.email}): {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleCancel} className="w-full">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
