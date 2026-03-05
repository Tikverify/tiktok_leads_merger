import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, Filter } from "lucide-react";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { filterNorthAfricanLeads, detectPhoneColumns, extractCountryCode } from "@/lib/phoneFilter";

interface FileData {
  id: string;
  name: string;
  size: number;
  rows: number;
  columns: number;
  data: any[];
  headers: string[];
}

export default function Home() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [enableFiltering, setEnableFiltering] = useState(true);
  const [filterStats, setFilterStats] = useState<{
    totalRemoved: number;
    phoneColumnsDetected: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File): Promise<FileData | null> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);
      const headers = Object.keys(jsonData[0] || {});

      return {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        rows: jsonData.length,
        columns: headers.length,
        data: jsonData,
        headers: headers,
      };
    } catch (error) {
      toast.error(`Failed to process ${file.name}`);
      return null;
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.name.endsWith(".xlsx") || file.name.endsWith(".xls")
    );

    if (droppedFiles.length === 0) {
      toast.error("Please drop XLSX or XLS files only");
      return;
    }

    for (const file of droppedFiles) {
      const processedFile = await processFile(file);
      if (processedFile) {
        setFiles((prev) => [...prev, processedFile]);
        toast.success(`${file.name} uploaded successfully`);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    for (const file of selectedFiles) {
      const processedFile = await processFile(file);
      if (processedFile) {
        setFiles((prev) => [...prev, processedFile]);
        toast.success(`${file.name} uploaded successfully`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast.success("File removed");
  };

  const mergeFiles = async () => {
    if (files.length < 2) {
      toast.error("Please upload at least 2 files to merge");
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);
    setFilterStats(null);

    try {
      // Merge all data
      let mergedData: any[] = [];
      let allHeaders = new Set<string>();
      let totalFiltered = 0;
      let phoneColumnsDetected = new Set<string>();

      files.forEach((file) => {
        file.headers.forEach((h) => allHeaders.add(h));

        if (enableFiltering) {
          // Apply filtering to each file before merging
          const { filteredData, removedCount, phoneColumnsUsed } = filterNorthAfricanLeads(
            file.data,
            file.headers
          );
          mergedData = mergedData.concat(filteredData);
          totalFiltered += removedCount;
          phoneColumnsUsed.forEach((col) => phoneColumnsDetected.add(col));
        } else {
          mergedData = mergedData.concat(file.data);
        }
      });

      setMergeProgress(50);

      // Store filter stats
      if (enableFiltering) {
        setFilterStats({
          totalRemoved: totalFiltered,
          phoneColumnsDetected: Array.from(phoneColumnsDetected),
        });
      }

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(mergedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Merged Leads");

      setMergeProgress(80);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `tiktok_leads_merged_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);

      setMergeProgress(100);

      const finalLeadCount = mergedData.length;
      const originalLeadCount = files.reduce((sum, f) => sum + f.rows, 0);

      if (enableFiltering && totalFiltered > 0) {
        toast.success(
          `Merged ${files.length} files: ${finalLeadCount} leads kept (${totalFiltered} North African numbers removed)`
        );
      } else {
        toast.success(`Successfully merged ${files.length} files with ${finalLeadCount} total leads`);
      }

      // Reset after a brief delay
      setTimeout(() => {
        setFiles([]);
        setMergeProgress(0);
        setIsMerging(false);
      }, 1500);
    } catch (error) {
      toast.error("Failed to merge files");
      setIsMerging(false);
      setMergeProgress(0);
    }
  };

  const totalLeads = files.reduce((sum, f) => sum + f.rows, 0);
  const totalColumns = Math.max(...files.map((f) => f.columns), 0);

  // Calculate estimated filtered count
  let estimatedFiltered = 0;
  if (enableFiltering) {
    files.forEach((file) => {
      const phoneColumnIndices = detectPhoneColumns(file.headers);
      if (phoneColumnIndices.length > 0) {
        phoneColumnIndices.forEach((colIndex) => {
          const phoneColumn = file.headers[colIndex];
          file.data.forEach((row) => {
            const phone = row[phoneColumn];
            if (phone) {
              const { isNorthAfrican } = extractCountryCode(String(phone));
              if (isNorthAfrican) {
                estimatedFiltered++;
              }
            }
          });
        });
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-gray-50">
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-10">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">TikTok Leads Merger</h1>
              <p className="text-sm text-muted-foreground">
                Combine and filter multiple lead exports into one file
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload Zone */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-dashed border-border hover:border-accent transition-colors">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-12 text-center cursor-pointer transition-all ${
                  isDragging ? "bg-accent/5 border-accent" : ""
                }`}
              >
                <div className="flex justify-center mb-4">
                  <img
                    src="https://private-us-east-1.manuscdn.com/sessionFile/sTlbkUaHhhikr5kgmKLbSl/sandbox/7CZvRlq71iuMY5RgOrOn6G-img-3_1771835778000_na1fn_dXBsb2FkLXpvbmUtZ3JhcGhpYw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvc1RsYmtVYUhoaGlrcjVrZ21LTGJTbC9zYW5kYm94LzdDWnZSbHE3MWl1TVk1UmdPck9uNkctaW1nLTNfMTc3MTgzNTc3ODAwMF9uYTFmbl9kWEJzYjJGa0xYcHZibVV0WjNKaGNHaHBZdy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=CF0a4jRuJqdwEO8~cjbPVUZHRzV~4OL0F8-6nh5GJkFVRpLhl9fjsIFvyMf62u58u6fxNoLX0M-EOkhOAC93NVoRrRMh6-PttgaihG7krL~N9c435tFtzreSMiZF9LuLnGsYGFt4ZYJoyjzmNdu9IYC183N2CzGJZs~fRWqp84Msh6bUb1QC9EJcOMynCvKyye88EM~XTxBjAI01Ff8UP-TW0M2l6qGactWwrC0~TiLHRHgXWaJNVSpKsm8KqW3Y1neBQRPAm5FHlGLGKDxGsV6MJtK40pgWqB5LEa6Ru9L9TUqXEFVUGK9E3uTaJiH8-X2dPy8044PYFbi7wmTYVg__"
                    alt="Upload"
                    className="w-24 h-24"
                  />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isDragging ? "Drop files here" : "Drag & drop XLSX files"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  or click to browse from your computer
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </Card>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Uploaded Files ({files.length})
                </h2>
                <div className="space-y-3">
                  {files.map((file) => (
                    <Card key={file.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileSpreadsheet className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {file.rows.toLocaleString()} leads • {file.columns} columns •{" "}
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="ml-2 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary & Merge */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="font-semibold text-foreground mb-4">Merge Summary</h3>

              {files.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload files to see merge summary
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Total Files
                      </p>
                      <p className="text-2xl font-bold text-foreground">{files.length}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Total Leads
                      </p>
                      <p className="text-2xl font-bold text-accent">{totalLeads.toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Columns
                      </p>
                      <p className="text-2xl font-bold text-foreground">{totalColumns}</p>
                    </div>

                    {/* Filtering Stats */}
                    {enableFiltering && estimatedFiltered > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-xs text-red-700 uppercase tracking-wide mb-1 font-semibold">
                          Will Remove (North Africa)
                        </p>
                        <p className="text-2xl font-bold text-red-600">{estimatedFiltered}</p>
                        <p className="text-xs text-red-600 mt-2">
                          {totalLeads - estimatedFiltered} leads will remain
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Filter Toggle */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <label className="text-sm font-medium text-blue-900 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enableFiltering}
                          onChange={(e) => setEnableFiltering(e.target.checked)}
                          className="w-4 h-4 rounded"
                        />
                        Remove North African Numbers
                      </label>
                    </div>
                    <p className="text-xs text-blue-700">
                      Automatically removes leads with +213, +216, +212, +218, +20, +249
                    </p>
                  </div>

                  {isMerging && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-foreground">Merging...</p>
                        <p className="text-xs text-muted-foreground">{mergeProgress}%</p>
                      </div>
                      <Progress value={mergeProgress} className="h-2" />
                    </div>
                  )}

                  <Button
                    onClick={mergeFiles}
                    disabled={isMerging || files.length < 2}
                    className="w-full bg-accent hover:bg-accent/90 text-white font-medium"
                  >
                    {isMerging ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Merging...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Merge & Download
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {files.length < 2
                      ? "Upload at least 2 files to merge"
                      : "Click to merge all files into one"}
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
