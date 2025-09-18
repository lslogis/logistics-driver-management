"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDropZone } from "@/components/import/FileDropZone";
import { toast } from "react-hot-toast";
import {
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  FIXED_DAILY: "고정일대",
  FIXED_MONTHLY: "고정월대",
  CONSIGNED_MONTHLY: "고정지입",
  CHARTER_PER_RIDE: "건별용차",
};

type FixedContractsImportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

type PreviewRow = {
  id: string;
  rowNumber?: number;
  centerName: string;
  routeName?: string;
  operatingDaysLabel?: string;
  centerContractType?: string;
  centerAmount?: number | null;
  driverContractType?: string;
  driverAmount?: number | null;
  driverName?: string;
  phone?: string;
  vehicleNumber?: string;
  startDate?: string | null;
  endDate?: string | null;
  status: "valid" | "error";
  errorMessage?: string;
};

type ImportSummary = {
  total: number;
  valid: number;
  invalid: number;
  imported?: number;
};

const formatOperatingDays = (value?: number[] | string | null): string => {
  if (!value) return "-";
  if (Array.isArray(value)) {
    return value.map((day) => WEEKDAY_LABELS[day] ?? day).join(", ");
  }
  return value;
};

const formatAmount = (value?: number | string | null): string => {
  if (value === undefined || value === null || value === "") return "-";
  const numeric =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[,\s]/g, ""));
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toLocaleString("ko-KR");
};

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return trimmed.replace(/[.]/g, "-").split("T")[0];
};

export function FixedContractsImportModal({
  open,
  onOpenChange,
  onSuccess,
}: FixedContractsImportModalProps) {
  const [step, setStep] = useState<"upload" | "review" | "import" | "complete">(
    "upload",
  );
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreviewRows([]);
    setSummary(null);
    setIsLoading(false);
    setProgress(0);
    setErrorMessage(null);
  }, []);

  const closeModal = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
    setErrorMessage(null);
    setPreviewRows([]);
    setSummary(null);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await fetch("/api/import/fixed-contracts");
      if (!response.ok) {
        throw new Error("템플릿 다운로드 실패");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `고정계약_가져오기_템플릿.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("템플릿 다운로드 완료");
    } catch (error) {
      console.error("Fixed contracts template download failed:", error);
      toast.error("템플릿 다운로드에 실패했습니다");
    }
  }, []);

  const buildPreviewRow = useCallback(
    (
      data: any,
      status: "valid" | "error",
      message?: string,
      rowNumber?: number,
    ): PreviewRow => {
      const operatingDaysLabel = formatOperatingDays(
        data?.operatingDays ?? data?.operatingDaysString,
      );
      const centerTypeCode = data?.centerContractType;
      const driverTypeCode = data?.driverContractType;
      return {
        id: `${status}-${rowNumber ?? Math.random().toString(36).slice(2)}`,
        rowNumber,
        centerName: data?.centerName || data?.["센터명"] || "-",
        routeName: data?.routeName || data?.["노선명"] || "-",
        operatingDaysLabel,
        centerContractType: centerTypeCode
          ? CONTRACT_TYPE_LABELS[centerTypeCode] || centerTypeCode
          : data?.["센터계약"] || "-",
        centerAmount: data?.centerAmount ?? data?.["센터금액"] ?? null,
        driverContractType: driverTypeCode
          ? CONTRACT_TYPE_LABELS[driverTypeCode] || driverTypeCode
          : data?.["기사계약"] || "-",
        driverAmount: data?.driverAmount ?? data?.["기사금액"] ?? null,
        driverName: data?.driverName || data?.["기사명"] || "-",
        phone: data?.phone || data?.["연락처"] || "-",
        vehicleNumber: data?.vehicleNumber || data?.["차량번호"] || "-",
        startDate: data?.startDate || data?.["시작일자"] || null,
        endDate: data?.endDate || data?.["종료일자"] || null,
        status,
        errorMessage: message,
      };
    },
    [],
  );

  const runValidation = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "simulate");

      const response = await fetch("/api/import/fixed-contracts", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "검증에 실패했습니다");
      }

      const result = await response.json();
      const results = result?.data?.results;
      if (!results) {
        throw new Error("검증 결과를 불러올 수 없습니다");
      }

      const validPreview = (results.preview || []).map(
        (item: any, index: number) =>
          buildPreviewRow(item, "valid", undefined, index + 2),
      );

      const errorPreview = (results.errors || []).map(
        (item: any, index: number) =>
          buildPreviewRow(item.data || {}, "error", item.error, item.row),
      );

      setPreviewRows([...validPreview, ...errorPreview]);
      setSummary({
        total: results.total || validPreview.length + errorPreview.length,
        valid: results.valid ?? validPreview.length,
        invalid: results.invalid ?? errorPreview.length,
      });
      setProgress(100);
      setStep("review");
    } catch (error) {
      console.error("Fixed contracts validation failed:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "검증 중 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  }, [buildPreviewRow, file]);

  const runImport = useCallback(async () => {
    if (!file) return;

    const validCount = previewRows.filter(
      (row) => row.status === "valid",
    ).length;
    if (validCount === 0) {
      setErrorMessage("가져올 수 있는 유효한 고정계약이 없습니다");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setProgress(5);
    setStep("import");

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "commit");

      const response = await fetch("/api/import/fixed-contracts", {
        method: "POST",
        body: formData,
      });

      window.clearInterval(progressTimer);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "가져오기에 실패했습니다");
      }

      const result = await response.json();
      const results = result?.data?.results;
      setProgress(100);
      toast.success(
        result?.data?.message || "고정계약 가져오기가 완료되었습니다",
      );

      if (results) {
        setSummary({
          total: results.total ?? summary?.total ?? validCount,
          valid: results.valid ?? validCount,
          invalid: results.invalid ?? 0,
          imported: results.imported ?? validCount,
        });

        if (results.errors && results.errors.length > 0) {
          setErrorMessage(
            `${results.errors.length}건의 데이터는 오류로 건너뛰었습니다.`,
          );
        }
      }

      setStep("complete");
      onSuccess?.();
    } catch (error) {
      window.clearInterval(progressTimer);
      console.error("Fixed contracts import failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "가져오기 중 오류가 발생했습니다",
      );
      setStep("review");
    } finally {
      setIsLoading(false);
    }
  }, [file, onSuccess, previewRows, summary]);

  const stats = useMemo(() => {
    const total = summary?.total ?? previewRows.length;
    const valid = previewRows.filter((row) => row.status === "valid").length;
    const invalid = total - valid;
    return {
      total,
      valid,
      invalid,
    };
  }, [previewRows, summary]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeModal();
      }}
    >
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            고정계약 가져오기
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {step === "upload" && (
            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  파일 준비
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  CSV 또는 Excel 파일로 고정계약 정보를 업로드 할 수 있습니다.
                </p>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-xs text-gray-500">
                    필요한 필드: 센터명, 노선명, 운행요일, 센터계약
                    (기사명/연락처/금액 등 추가 정보 포함 가능)
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    템플릿 다운로드
                  </Button>
                </div>
              </div>

              <FileDropZone
                onFileSelect={handleFileSelect}
                acceptedTypes={[".csv", ".xlsx", ".xls"]}
                maxSize={10}
                isLoading={isLoading}
                progress={progress}
                error={errorMessage || undefined}
              />
            </div>
          )}

          {step === "review" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    검증 결과
                  </h3>
                  <p className="text-sm text-gray-600">
                    전체 {stats.total}개 중 {stats.valid}개 정상,{" "}
                    {stats.invalid}개 오류
                  </p>
                </div>
                <Badge variant={stats.invalid === 0 ? "success" : "secondary"}>
                  성공률{" "}
                  {stats.total > 0
                    ? Math.round((stats.valid / stats.total) * 100)
                    : 0}
                  %
                </Badge>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    검증 데이터 미리보기
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      정상
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      오류
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          상태
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          센터명
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          노선명
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          운행요일
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          센터계약
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          센터금액
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          기사계약
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          기사금액
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          기사명 / 연락처
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          차량번호
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          시작일
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          오류사유
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {previewRows.map((row) => (
                        <tr
                          key={row.id}
                          className={cn(
                            "text-sm",
                            row.status === "error" && "bg-red-50/60",
                          )}
                        >
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                row.status === "valid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700",
                              )}
                            >
                              {row.status === "valid" ? "정상" : "오류"}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.centerName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.routeName || "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.operatingDaysLabel || "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.centerContractType || "-"}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {formatAmount(row.centerAmount)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.driverContractType || "-"}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {formatAmount(row.driverAmount)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span>{row.driverName || "-"}</span>
                              <span className="text-xs text-gray-500">
                                {row.phone || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.vehicleNumber || "-"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatDate(row.startDate)}
                          </td>
                          <td
                            className="px-3 py-2 text-xs text-red-600 whitespace-nowrap"
                            title={row.errorMessage}
                          >
                            {row.errorMessage || "-"}
                          </td>
                        </tr>
                      ))}
                      {previewRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={12}
                            className="px-3 py-6 text-center text-sm text-gray-500"
                          >
                            검증 결과가 없습니다. 파일을 다시 검증해주세요.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === "import" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-gray-600">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <div className="text-center">
                <p className="text-base font-medium">
                  고정계약을 등록하는 중입니다...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  잠시만 기다려주세요.
                </p>
              </div>
            </div>
          )}

          {step === "complete" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  가져오기가 완료되었습니다
                </h3>
                <p className="text-sm text-gray-600">
                  총 {summary?.total ?? previewRows.length}건 중{" "}
                  {summary?.imported ??
                    summary?.valid ??
                    previewRows.filter((r) => r.status === "valid").length}
                  건의 고정계약이 등록되었습니다.
                </p>
                {errorMessage && (
                  <p className="text-sm text-red-600">{errorMessage}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          {step === "upload" && (
            <>
              <div className="text-xs text-gray-500">
                지원 형식: .csv, .xlsx, .xls (최대 10MB)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={runValidation}
                  disabled={!file || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      검증 중...
                    </>
                  ) : (
                    <>
                      검증하기
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                이전
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={runImport}
                  disabled={isLoading || stats.valid === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  가져오기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {step === "import" && (
            <div className="w-full flex justify-end">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isLoading}
              >
                취소
              </Button>
            </div>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <Button
                onClick={closeModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                확인
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FixedContractsImportModal;
