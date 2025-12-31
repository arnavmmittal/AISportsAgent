'use client';

import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

export default function ImportPerformancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [sport, setSport] = useState('Basketball');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    imported?: number;
    errors?: number;
    errorDetails?: Array<{ row: number; error: string }>;
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null); // Clear previous results
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sport', sport);

      const response = await fetch('/api/performance/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResult(data);

      // Clear file input on success
      if (data.success && data.errors === 0) {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templates = {
      Basketball: `Name,Date,Opponent,Points,Assists,Rebounds,Turnovers,Minutes,Outcome
Sarah Johnson,2024-12-15,UCLA,22,5,8,2,34,WIN
Sarah Johnson,2024-12-18,USC,18,4,6,3,32,WIN
Sarah Johnson,2024-12-22,Oregon,9,2,4,5,24,LOSS`,
      Soccer: `Name,Date,Opponent,Goals,Assists,Shots,Minutes,Outcome
Sarah Johnson,2024-12-15,UCLA,2,1,6,90,WIN
Sarah Johnson,2024-12-18,USC,0,2,4,85,DRAW`,
      Volleyball: `Name,Date,Opponent,Kills,Blocks,Digs,Aces,Outcome
Sarah Johnson,2024-12-15,UCLA,18,3,12,2,WIN
Sarah Johnson,2024-12-18,USC,15,2,10,1,LOSS`,
      'Track & Field': `Name,Date,Event,Time,Distance,Place,Outcome
Sarah Johnson,2024-12-15,100m Sprint,11.52,,1,WIN
Sarah Johnson,2024-12-18,Long Jump,,6.85,2,LOSS`,
    };

    const template = templates[sport as keyof typeof templates] || templates.Basketball;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sport.toLowerCase()}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Import Game Performance Stats
          </h1>
          <p className="text-gray-600">
            Upload CSV files with game statistics to enable performance correlation analysis
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            How to Import Stats
          </h2>

          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span>
                <strong>Download template:</strong> Click "Download Template" below to get a CSV file with the correct format
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span>
                <strong>Fill in your data:</strong> Open the CSV in Excel/Google Sheets and add your athletes' game stats
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span>
                <strong>Upload:</strong> Select your sport, choose the file, and click "Upload Stats"
              </span>
            </li>
          </ol>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Make sure athlete names exactly match the names in your system. The import will
              automatically link game stats with mood logs from the same date to calculate correlations.
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Upload CSV File</h2>

          {/* Sport Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sport
            </label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Basketball">Basketball</option>
              <option value="Soccer">Soccer</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Track & Field">Track & Field</option>
              <option value="Football">Football</option>
              <option value="Swimming">Swimming</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Download Template Button */}
          <button
            onClick={downloadTemplate}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {sport} Template
          </button>

          {/* File Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors ${
              !file || uploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Upload Stats'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div
            className={`rounded-2xl shadow-lg p-6 border ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </h3>
                <p
                  className={`text-sm mb-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.message}
                </p>

                {result.success && result.imported !== undefined && (
                  <div className="mt-3 text-sm text-green-800">
                    <p>✓ {result.imported} records imported successfully</p>
                    {result.errors && result.errors > 0 && (
                      <p className="text-amber-700 mt-1">
                        ⚠ {result.errors} rows had errors (see details below)
                      </p>
                    )}
                  </div>
                )}

                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-sm text-gray-900 mb-2">Error Details:</p>
                    <div className="max-h-48 overflow-y-auto bg-white rounded-lg p-3 space-y-1">
                      {result.errorDetails.map((error, idx) => (
                        <div key={idx} className="text-sm text-gray-700">
                          <span className="font-medium">Row {error.row}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Format Reference */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Format Reference</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Required Columns:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Name</code> - Athlete full name (must match system)</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Date</code> - Game date (YYYY-MM-DD format)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Optional Columns:</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Opponent</code> - Opponent team name</li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded">Outcome</code> - WIN/LOSS/DRAW</li>
                <li>Sport-specific stats (Points, Assists, Goals, etc.)</li>
              </ul>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-mono text-gray-800">
                Example: Sarah Johnson,2024-12-15,UCLA,22,5,8,2,34,WIN
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
