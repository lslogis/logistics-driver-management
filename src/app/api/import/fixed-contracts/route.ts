import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/rbac";
import { getCurrentUser, createAuditLog } from "@/lib/auth/server";
import {
  parseImportFile,
  validateFileSize,
  validateHeaders,
  generateCSV,
} from "@/lib/services/import.service";
import { CONTRACT_TYPE_LABELS } from "@/lib/validations/fixedContract";

// 템플릿 헤더 정의 (엑셀 내보내기와 동일한 순서)
const REQUIRED_HEADERS = ["센터명", "노선명", "운행요일", "센터계약"];
const TEMPLATE_HEADERS = [
  "센터명",
  "노선명",
  "기사명",
  "차량번호",
  "연락처",
  "운행요일",
  "센터계약",
  "센터금액",
  "기사계약",
  "기사금액",
  "시작일자",
  "종료일자",
  "비고",
];

// 요일 매핑 (짧은 형태와 긴 형태 모두 지원)
const WEEKDAY_MAP: Record<string, number> = {
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
  일: 0,
  월요일: 1,
  화요일: 2,
  수요일: 3,
  목요일: 4,
  금요일: 5,
  토요일: 6,
  일요일: 0,
};

// 계약형태 매핑
const CONTRACT_TYPE_MAP: Record<string, string> = {
  "고정(일대)": "FIXED_DAILY",
  고정일대: "FIXED_DAILY",
  일고정: "FIXED_DAILY",
  "고정(월대)": "FIXED_MONTHLY",
  고정월대: "FIXED_MONTHLY",
  월고정: "FIXED_MONTHLY",
  고정지입: "CONSIGNED_MONTHLY",
  "고정(지입)": "CONSIGNED_MONTHLY",
  월위탁: "CONSIGNED_MONTHLY",
  용차운임: "CHARTER_PER_RIDE",
  건별용차: "CHARTER_PER_RIDE",
};

// 운행요일 파싱 함수
function parseOperatingDays(dayString: string): number[] {
  if (!dayString || typeof dayString !== "string") {
    console.log("🔍 [parseOperatingDays] No valid dayString:", dayString);
    return [];
  }

  console.log("🔍 [parseOperatingDays] Input:", dayString);

  const days: number[] = [];
  const cleanString = dayString.replace(/[,\s]+/g, ",").trim();
  console.log("🔍 [parseOperatingDays] Cleaned string:", cleanString);

  for (const day of cleanString.split(",")) {
    const trimmedDay = day.trim();
    console.log(
      "🔍 [parseOperatingDays] Checking day:",
      trimmedDay,
      "Found in map:",
      WEEKDAY_MAP.hasOwnProperty(trimmedDay),
    );
    if (WEEKDAY_MAP.hasOwnProperty(trimmedDay)) {
      days.push(WEEKDAY_MAP[trimmedDay]);
    }
  }

  console.log("🔍 [parseOperatingDays] Result:", days);
  return [...new Set(days)].sort();
}

// 날짜 파싱 함수 (한국시간 기준)
function parseDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== "string") return null;

  const cleaned = dateString.trim();
  if (!cleaned) return null;

  try {
    // 한국시간 기준으로 날짜 파싱 (UTC 오프셋 없이)
    let dateStr = cleaned;

    // 다양한 날짜 형식 지원
    if (dateStr.includes("/")) {
      // 2025/09/01 형태
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // 월은 0부터 시작
        const day = parseInt(parts[2]);
        return new Date(year, month, day); // 로컬 시간으로 생성
      }
    } else if (dateStr.includes("-")) {
      // 2025-09-01 형태
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        return new Date(year, month, day); // 로컬 시간으로 생성
      }
    }

    // 기본 Date 파싱 (fallback)
    const date = new Date(cleaned);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// 금액 파싱 함수
function parseAmount(amountString: string): number | null {
  if (!amountString || typeof amountString !== "string") return null;

  const cleaned = amountString.replace(/[,\s]/g, "").trim();
  if (!cleaned) return null;

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? null : amount;
}

// CSV 데이터를 FixedContract 객체로 변환 (새로운 컬럼 순서에 맞게)
function csvRowToFixedContract(row: any) {
  console.log(
    "🔍 [csvRowToFixedContract] Raw row data:",
    JSON.stringify(row, null, 2),
  );
  console.log("🔍 [csvRowToFixedContract] Available keys:", Object.keys(row));

  // mapRowHeaders 사용하지 않고 직접 접근 시도
  const rawData: any = {
    centerName: row["센터명"]?.toString().trim(),
    routeName: row["노선명"]?.toString().trim(),
    driverName: row["기사명"]?.toString().trim() || undefined,
    vehicleNumber: row["차량번호"]?.toString().trim() || undefined,
    phone: row["연락처"]?.toString().trim() || undefined,
    operatingDaysString: row["운행요일"]?.toString().trim(),
    centerContractType: row["센터계약"]?.toString().trim(),
    centerAmount: row["센터금액"]?.toString().trim() || undefined,
    driverContractType: row["기사계약"]?.toString().trim() || undefined,
    driverAmount: row["기사금액"]?.toString().trim() || undefined,
    startDate: row["시작일자"]?.toString().trim() || undefined,
    endDate: row["종료일자"]?.toString().trim() || undefined,
    remarks: row["비고"]?.toString().trim() || undefined,
  };

  console.log("🔍 [csvRowToFixedContract] Parsed rawData:", rawData);

  // 운행요일 파싱
  const operatingDays = parseOperatingDays(rawData.operatingDaysString);

  // 계약형태 변환
  const centerContractType =
    CONTRACT_TYPE_MAP[rawData.centerContractType] || rawData.centerContractType;
  const driverContractType = rawData.driverContractType
    ? CONTRACT_TYPE_MAP[rawData.driverContractType] ||
      rawData.driverContractType
    : centerContractType;

  // 금액 파싱
  const centerAmount = parseAmount(rawData.centerAmount);
  const driverAmount = parseAmount(rawData.driverAmount);

  // 날짜 파싱
  const startDate = parseDate(rawData.startDate);
  const endDate = parseDate(rawData.endDate);

  return {
    centerName: rawData.centerName,
    routeName: rawData.routeName,
    driverName: rawData.driverName,
    vehicleNumber: rawData.vehicleNumber,
    phone: rawData.phone,
    operatingDays,
    centerContractType,
    driverContractType,
    centerAmount,
    driverAmount,
    startDate,
    endDate,
    remarks: rawData.remarks,
  };
}

/**
 * POST /api/import/fixed-contracts - 고정계약 CSV 일괄 등록
 */
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "로그인이 필요합니다",
            },
          },
          { status: 401 },
        );
      }

      const csvContent =
        "﻿" +
        generateCSV(TEMPLATE_HEADERS, [
          {
            센터명: "예시센터",
            노선명: "새벽배송 A코스",
            기사명: "홍길동",
            차량번호: "12가3456",
            연락처: "010-1234-5678",
            운행요일: "월,수,금",
            센터계약: "고정(일대)",
            센터금액: "450000",
            기사계약: "고정지입",
            기사금액: "350000",
            시작일자: "2025-01-01",
            종료일자: "",
            비고: "",
          },
        ]);

      const filename = `${new Date().toISOString().slice(0, 10)}_고정계약등록템플릿.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    } catch (error) {
      console.error("Fixed contracts template download error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "고정계약 템플릿 생성 중 오류가 발생했습니다",
          },
        },
        { status: 500 },
      );
    }
  },
  { resource: "fixed_contracts", action: "read" },
);

export const POST = withAuth(
  async (req: NextRequest) => {
    console.log("🔍 [Fixed Contracts Import] Starting import process");
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        console.log("❌ [Fixed Contracts Import] No user found");
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "로그인이 필요합니다",
            },
          },
          { status: 401 },
        );
      }

      // FormData 파싱
      console.log("📁 [Fixed Contracts Import] Parsing FormData");
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const mode = (formData.get("mode") as string) || "simulate";

      console.log("📋 [Fixed Contracts Import] File info:", {
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        mode,
      });

      if (!file) {
        console.log("❌ [Fixed Contracts Import] No file provided");
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "NO_FILE",
              message: "CSV 파일을 선택해주세요",
            },
          },
          { status: 400 },
        );
      }

      // 파일 형식 검증
      const allowedTypes = [".csv", ".xlsx", ".xls"];
      const fileExt = file.name.toLowerCase();
      if (!allowedTypes.some((type) => fileExt.endsWith(type))) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "INVALID_FILE_TYPE",
              message:
                "CSV 또는 Excel 파일만 업로드 가능합니다 (.csv, .xlsx, .xls)",
            },
          },
          { status: 400 },
        );
      }

      // 파일 크기 검증
      const fileSizeError = validateFileSize(file, 10);
      if (fileSizeError) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "FILE_TOO_LARGE",
              message: fileSizeError,
            },
          },
          { status: 400 },
        );
      }

      // 파일 파싱
      console.log("🔄 [Fixed Contracts Import] Parsing file");
      const parseResult = await parseImportFile(file);

      if (parseResult.errors.length > 0) {
        console.log(
          "❌ [Fixed Contracts Import] File parsing failed:",
          parseResult.errors,
        );
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "FILE_PARSE_ERROR",
              message: `파일 파싱 실패: ${parseResult.errors.join(", ")}`,
            },
          },
          { status: 400 },
        );
      }

      const csvData = parseResult.data;
      if (!csvData || csvData.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "EMPTY_FILE",
              message: "파일에 데이터가 없습니다",
            },
          },
          { status: 400 },
        );
      }

      // 헤더 검증
      console.log(
        "📋 [Fixed Contracts Import] CSV headers found:",
        Object.keys(csvData[0]),
      );
      console.log(
        "📋 [Fixed Contracts Import] Required headers:",
        REQUIRED_HEADERS,
      );

      const headerErrors = validateHeaders(csvData, REQUIRED_HEADERS);
      if (headerErrors.length > 0) {
        console.log(
          "❌ [Fixed Contracts Import] Header validation failed:",
          headerErrors,
        );
        const headers = csvData.length > 0 ? Object.keys(csvData[0]) : [];
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "INVALID_HEADERS",
              message: `헤더 검증 실패: ${headerErrors.join(", ")}. 현재 헤더: ${headers.join(", ")}`,
            },
          },
          { status: 400 },
        );
      }

      // 데이터 변환 및 검증
      const validContracts: any[] = [];
      const errors: Array<{ row: number; error: string; data?: any }> = [];

      for (let i = 0; i < csvData.length; i++) {
        const rowIndex = i + 2; // Excel 기준 (헤더 포함)
        const row = csvData[i];

        try {
          const contractData = csvRowToFixedContract(row);

          // 필수 필드 검증
          if (!contractData.centerName) {
            errors.push({
              row: rowIndex,
              error: "센터명은 필수입니다",
              data: row,
            });
            continue;
          }

          if (!contractData.routeName) {
            errors.push({
              row: rowIndex,
              error: "노선명은 필수입니다",
              data: row,
            });
            continue;
          }

          if (
            !contractData.operatingDays ||
            contractData.operatingDays.length === 0
          ) {
            errors.push({
              row: rowIndex,
              error: "운행요일은 필수입니다",
              data: row,
            });
            continue;
          }

          if (!contractData.centerContractType) {
            errors.push({
              row: rowIndex,
              error: "센터계약은 필수입니다",
              data: row,
            });
            continue;
          }

          validContracts.push(contractData);
        } catch (error) {
          console.error(`Row ${rowIndex} processing error:`, error);
          errors.push({
            row: rowIndex,
            error: `데이터 처리 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
            data: row,
          });
        }
      }

      // 시뮬레이션 모드
      if (mode === "simulate") {
        console.log("✅ [Fixed Contracts Import] Validation completed:", {
          total: csvData.length,
          valid: validContracts.length,
          invalid: errors.length,
          errorsDetail: errors,
        });

        return NextResponse.json({
          ok: true,
          data: {
            message: "검증이 완료되었습니다",
            results: {
              total: csvData.length,
              valid: validContracts.length,
              invalid: errors.length,
              imported: 0,
              errors,
              preview: validContracts,
            },
          },
        });
      }

      // 실제 가져오기 모드
      if (mode === "commit") {
        if (validContracts.length === 0) {
          return NextResponse.json(
            {
              ok: false,
              error: {
                code: "NO_VALID_DATA",
                message: "유효한 데이터가 없습니다",
              },
            },
            { status: 400 },
          );
        }

        let importedCount = 0;
        const importErrors: Array<{ row: number; error: string; data?: any }> =
          [];

        // 데이터베이스에 저장
        for (const contractData of validContracts) {
          try {
            // 센터 찾기
            const loadingPoint = await prisma.loadingPoint.findFirst({
              where: { centerName: contractData.centerName },
            });

            if (!loadingPoint) {
              importErrors.push({
                row: importedCount + 1,
                error: `센터 '${contractData.centerName}'를 찾을 수 없습니다`,
                data: contractData,
              });
              continue;
            }

            // 기사 찾기 (선택사항)
            let driver = null;
            if (contractData.driverName) {
              // 기사명으로 검색 (활성 기사만)
              driver = await prisma.driver.findFirst({
                where: {
                  name: contractData.driverName,
                  isActive: true,
                },
              });

              // 기사명으로 못 찾으면 오류 발생
              if (!driver) {
                importErrors.push({
                  row: importedCount + 1,
                  error: `기사 '${contractData.driverName}'를 찾을 수 없습니다. 기사 관리에서 먼저 등록해주세요.`,
                  data: contractData,
                });
                continue;
              }
            } else if (contractData.phone || contractData.vehicleNumber) {
              // 기사명이 없고 연락처나 차량번호만 있는 경우 검색
              const searchConditions = [];
              if (contractData.phone) {
                searchConditions.push({ phone: contractData.phone });
              }
              if (contractData.vehicleNumber) {
                searchConditions.push({
                  vehicleNumber: contractData.vehicleNumber,
                });
              }

              driver = await prisma.driver.findFirst({
                where: {
                  AND: [{ isActive: true }, { OR: searchConditions }],
                },
              });
            }

            // 중복 체크: 같은 센터(loadingPoint) + 같은 노선명 조합 확인
            const existingContract = await prisma.fixedContract.findFirst({
              where: {
                loadingPointId: loadingPoint.id,
                routeName: contractData.routeName,
                isActive: true, // 활성 상태인 것만 체크
              },
            });

            if (existingContract) {
              importErrors.push({
                row: importedCount + 1,
                error: `중복된 고정계약입니다. '${contractData.centerName} + ${contractData.routeName}' 조합이 이미 존재합니다.`,
                data: contractData,
              });
              continue;
            }

            // 고정계약 생성
            await prisma.fixedContract.create({
              data: {
                routeName: contractData.routeName,
                loadingPointId: loadingPoint.id,
                driverId: driver?.id,
                operatingDays: contractData.operatingDays,
                centerContractType: contractData.centerContractType,
                driverContractType:
                  contractData.driverContractType ||
                  contractData.centerContractType,
                centerAmount: contractData.centerAmount || 0,
                driverAmount: contractData.driverAmount,
                startDate: contractData.startDate,
                endDate: contractData.endDate,
                remarks: contractData.remarks,
                createdBy: user.id,
              },
            });

            importedCount++;
          } catch (error) {
            console.error("Import error:", error);
            importErrors.push({
              row: importedCount + 1,
              error: `저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
              data: contractData,
            });
          }
        }

        // 감사 로그 기록
        await createAuditLog(
          user,
          "IMPORT",
          "FIXED_CONTRACTS",
          "batch_import",
          undefined,
          {
            total: csvData.length,
            imported: importedCount,
            errors: errors.length + importErrors.length,
          },
        );

        return NextResponse.json({
          ok: true,
          data: {
            message: `${importedCount}개의 고정계약이 성공적으로 등록되었습니다`,
            results: {
              total: csvData.length,
              valid: validContracts.length,
              invalid: errors.length + importErrors.length,
              imported: importedCount,
              errors: [...errors, ...importErrors],
            },
          },
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_MODE",
            message: "유효하지 않은 모드입니다",
          },
        },
        { status: 400 },
      );
    } catch (error) {
      console.error("Fixed contracts import error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "고정계약 가져오기 중 오류가 발생했습니다",
          },
        },
        { status: 500 },
      );
    }
  },
  { resource: "fixed_contracts", action: "create" },
);
