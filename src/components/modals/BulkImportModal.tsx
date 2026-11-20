'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  parseDoctorRows,
  parsePatientRows,
  parseExcelOrCsv,
  downloadSampleTemplate,
  ParsedDoctorRow,
  ParsedPatientRow,
} from '@/lib/bulkParser';
import { apiUrl } from '@/lib/api';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  RefreshCw,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ModalPortal } from '@/components/ui/ModalPortal';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'doctors' | 'patients';
}

export function BulkImportModal({ isOpen, onClose, type }: BulkImportModalProps) {
  const { doctors, bulkAddDoctors, bulkAddPatients } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<(ParsedDoctorRow | ParsedPatientRow)[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const title = type === 'doctors' ? 'Bulk Import Doctors' : 'Bulk Import Patients';
  const subtitle =
    type === 'doctors'
      ? 'Upload Excel (.xlsx, .xls), CSV, or PDF documents containing doctor directories.'
      : 'Upload Excel (.xlsx, .xls), CSV, or PDF documents containing patient cohorts.';

  const validCount = useMemo(() => parsedRows.filter((r) => r.isValid).length, [parsedRows]);
  const invalidCount = useMemo(() => parsedRows.filter((r) => !r.isValid).length, [parsedRows]);

  if (!isOpen) return null;

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setErrorMsg(null);
    setIsParsing(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileProcess = async (selectedFile: File) => {
    setErrorMsg(null);
    setFile(selectedFile);
    setIsParsing(true);

    try {
      const fileName = selectedFile.name.toLowerCase();

      // Excel or CSV: Parse in browser using SheetJS
      if (
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        fileName.endsWith('.csv') ||
        fileName.endsWith('.tsv')
      ) {
        const rawObjects = await parseExcelOrCsv(selectedFile);
        if (!rawObjects || rawObjects.length === 0) {
          throw new Error('The spreadsheet appears to be empty or contains no readable rows.');
        }

        if (type === 'doctors') {
          const rows = parseDoctorRows(rawObjects);
          setParsedRows(rows);
        } else {
          const rows = parsePatientRows(rawObjects, doctors);
          setParsedRows(rows);
        }
      }
      // PDF File: Parse via server API with pdf-parse
      else if (fileName.endsWith('.pdf')) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('type', type);

        const res = await fetch(apiUrl('/api/parse-document'), {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to extract records from PDF file.');
        }

        if (!json.rawRows || json.rawRows.length === 0) {
          throw new Error('No doctor or patient records could be identified in this PDF document.');
        }

        if (type === 'doctors') {
          const rows = parseDoctorRows(json.rawRows);
          setParsedRows(rows);
        } else {
          const rows = parsePatientRows(json.rawRows, doctors);
          setParsedRows(rows);
        }
      } else {
        throw new Error('Unsupported format. Please select an Excel (.xlsx, .xls), CSV, or PDF file.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMsg(err.message || 'Error parsing document.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    const validOnly = parsedRows.filter((r) => r.isValid);
    if (validOnly.length === 0) return;

    setIsImporting(true);
    try {
      if (type === 'doctors') {
        const res = await bulkAddDoctors(validOnly);
        if (res.success) {
          handleReset();
          onClose();
        }
      } else {
        const res = await bulkAddPatients(validOnly);
        if (res.success) {
          handleReset();
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Bulk commit failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#102B2A]/70 backdrop-blur-sm animate-in fade-in-20">
        <div
          className="w-full max-w-4xl bg-white rounded-2xl shadow-elevated border border-[#E2E8E5] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-[#E2E8E5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2EE] border border-[#C7DFD9] flex items-center justify-center text-[#176B60] shadow-sm">
                {type === 'doctors' ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#253746] leading-tight">{title}</h3>
                  <span className="text-[10px] font-semibold text-[#176B60] bg-[#EAF2EE] border border-[#C7DFD9] px-2 py-0.5 rounded-full">
                    Excel • CSV • PDF
                  </span>
                </div>
                <p className="text-xs text-[#718096] mt-0.5">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadSampleTemplate(type, 'csv')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#253746] bg-white hover:bg-[#F5F7F5] border border-[#E2E8E5] rounded-xl transition-colors shadow-sm"
                title="Download standard CSV template"
              >
                <Download className="w-3.5 h-3.5 text-[#718096]" />
                <span>Sample Template</span>
              </button>

              <button
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="p-1.5 text-[#718096] hover:text-[#253746] rounded-lg hover:bg-[#F5F7F5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Instructions Accordion */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden text-xs text-slate-600">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full px-4 py-2.5 flex items-center justify-between font-semibold text-slate-800 hover:bg-slate-100/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <span>Required Columns & Format Requirements for Execution</span>
              </span>
              {showInstructions ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showInstructions && (
              <div className="p-4 pt-2 border-t border-slate-200 space-y-3 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">
                      {type === 'doctors' ? 'Doctors Required Columns:' : 'Patients Required Columns:'}
                    </h5>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      {type === 'doctors' ? (
                        <>
                          <li><strong className="text-slate-700">Doctor Name:</strong> Full name (e.g. Dr. Tariqul Islam)</li>
                          <li><strong className="text-slate-700">Specialization:</strong> Any of the 180+ Bangladesh specialties or custom</li>
                          <li><strong className="text-slate-700">Hospital:</strong> Medical center / clinic affiliation</li>
                          <li><strong className="text-slate-700">Phone:</strong> Exact 11-digit mobile number (017...)</li>
                          <li><strong className="text-slate-700">Email (Optional):</strong> Official email address (must be unique if provided)</li>
                          <li><strong className="text-slate-700">Address (Optional):</strong> Chamber, practice, or hospital location</li>
                        </>
                      ) : (
                        <>
                          <li><strong className="text-slate-700">Patient Name:</strong> Full legal patient name</li>
                          <li><strong className="text-slate-700">Age:</strong> Numerical age (1-130)</li>
                          <li><strong className="text-slate-700">Gender:</strong> Male, Female, or Other</li>
                          <li><strong className="text-slate-700">Condition:</strong> Critical, Serious, Stable, Recovering, or Routine Checkup</li>
                          <li><strong className="text-slate-700">Phone:</strong> Patient contact number</li>
                          <li><strong className="text-slate-700">Email (Optional):</strong> Patient email address</li>
                          <li><strong className="text-slate-700">Address (Optional):</strong> Patient residence or chamber address</li>
                          <li><strong className="text-slate-700">Assigned Doctor:</strong> Doctor Name or Doctor ID</li>
                        </>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 mb-1">Supported File Types:</h5>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                      <li><strong className="text-slate-700">Excel Spreadsheets (.xlsx, .xls):</strong> Auto-reads first active sheet.</li>
                      <li><strong className="text-slate-700">Comma-Separated Values (.csv):</strong> Standard UTF-8 CSV exports.</li>
                      <li><strong className="text-slate-700">PDF Documents (.pdf):</strong> Auto-parses tabular and line records.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Area (If no rows parsed yet) */}
          {parsedRows.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/60 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mb-4 shadow-sm">
                {isParsing ? (
                  <RefreshCw className="w-7 h-7 animate-spin" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              <h4 className="text-base font-bold text-slate-800">
                {isParsing ? 'Processing and parsing document...' : 'Click to select or drag and drop your file'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Supports Excel (.xlsx, .xls), CSV sheets, and formatted PDF lists.
              </p>

              <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400 font-medium">
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.XLSX</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.XLS</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.CSV</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">.PDF</span>
              </div>
            </div>
          ) : (
            /* Parsed Summary & Verification Table */
            <div className="space-y-4 animate-in fade-in-50">
              {/* File Info Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block truncate max-w-xs sm:max-w-md">
                      {file?.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Total {parsedRows.length} records parsed from file
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{validCount} Ready to Import</span>
                  </span>

                  {invalidCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{invalidCount} Issues</span>
                    </span>
                  )}

                  <button
                    onClick={handleReset}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-1"
                    title="Upload different file"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden shadow-subtle max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Name</th>
                      {type === 'doctors' ? (
                        <>
                          <th className="py-2.5 px-3">Specialization</th>
                          <th className="py-2.5 px-3">Hospital</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Email</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2.5 px-3">Age/Sex</th>
                          <th className="py-2.5 px-3">Condition</th>
                          <th className="py-2.5 px-3">Phone</th>
                          <th className="py-2.5 px-3">Assigned Doctor</th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {parsedRows.map((row, idx) => {
                      const docRow = row as ParsedDoctorRow;
                      const patRow = row as ParsedPatientRow;

                      return (
                        <tr
                          key={idx}
                          className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/30 hover:bg-rose-50/50'}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Valid</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 cursor-help"
                                title={row.errors.join(' • ')}
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                                <span>{row.errors[0] || 'Error'}</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[140px]">
                            {row.name || '—'}
                          </td>

                          {type === 'doctors' ? (
                            <>
                              <td className="py-2.5 px-3 truncate max-w-[150px]">
                                {docRow.specialization || '—'}
                              </td>
                              <td className="py-2.5 px-3 truncate max-w-[150px]">
                                {docRow.hospital || '—'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                                {docRow.phone || '—'}
                              </td>
                              <td className="py-2.5 px-3 truncate max-w-[150px] font-mono text-[11px]">
                                <div>{docRow.email || '—'}</div>
                                {docRow.address && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-[120px] font-sans">
                                    {docRow.address}
                                  </div>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                {patRow.age} yrs • {patRow.gender}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {patRow.condition}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                                <div>{patRow.phone || '—'}</div>
                                {patRow.address && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-[120px] font-sans">
                                    {patRow.address}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 truncate max-w-[140px]">
                                <div className="font-medium text-slate-800">{patRow.doctorName || 'Assigned'}</div>
                                {patRow.notes && patRow.notes.includes('Blood Group') && (
                                  <div className="text-[10px] text-brand-600 font-semibold">
                                    {patRow.notes}
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Import Error</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && (
              <span>
                Ready to commit <strong className="text-slate-800">{validCount}</strong> records to MongoDB Atlas
                {invalidCount > 0 && ` (${invalidCount} rows will be skipped)`}.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              disabled={isImporting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            {parsedRows.length > 0 && (
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={validCount === 0 || isImporting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing to Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Import {validCount} {type === 'doctors' ? 'Doctors' : 'Patients'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

