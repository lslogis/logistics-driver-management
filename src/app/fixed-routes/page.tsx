"use client";

export const dynamic = 'force-dynamic'

import React, { useState, useMemo } from "react";
import {
  Route,
  Plus,
  RefreshCw,
  Upload,
  Download,
  Filter,
  Search,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/hooks/useAuth";
import {
  FixedContractResponse,
  CreateFixedContractRequest,
  UpdateFixedContractRequest,
} from "@/lib/validations/fixedContract";
import {
  useFixedContracts,
  useCreateFixedContract,
  useUpdateFixedContract,
  useDeleteFixedContract,
  useToggleFixedContractStatus,
  useLoadingPointsForContracts,
} from "@/hooks/useFixedContracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  copyToClipboard,
  formatFixedContractInfo,
  sendSMS,
  shareToKakao,
  makePhoneCall,
} from "@/lib/utils/share";
import ManagementPageTemplate from "@/components/templates/ManagementPageTemplate";
import {
  getFixedContractColumns,
  getFixedContractContextMenuItems,
  FixedContractItem,
} from "@/components/templates/FixedContractsTemplateConfig";
import RegisterFixedContractModal from "@/components/forms/RegisterFixedContractModal";
import FixedRoutesTable from "@/components/fixedRoutes/FixedRoutesTable";
import FixedContractsImportModal from "@/components/fixedRoutes/FixedContractsImportModal";

export default function FixedRoutesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingFixedContract, setEditingFixedContract] =
    useState<FixedContractResponse | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Data fetching
  const { data, isLoading, error, refetch, isFetching } = useFixedContracts({
    search: searchTerm,
    isActive:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
  });

  const fixedContractsData = useMemo(() => {
    return (data as any)?.contracts || [];
  }, [data]);

  const totalCount = useMemo(() => {
    return (data as any)?.pagination?.totalCount || 0;
  }, [data]);

  // Fetch all fixed routes for statistics

  // Mutations
  const createMutation = useCreateFixedContract();
  const updateMutation = useUpdateFixedContract();
  const deleteMutation = useDeleteFixedContract();
  const toggleMutation = useToggleFixedContractStatus();

  // Loading points for form
  const { data: loadingPointsData } = useLoadingPointsForContracts();
  const loadingPoints = loadingPointsData || [];

  // Filter data based on search
  const filteredRoutesData = useMemo(() => {
    return fixedContractsData.filter((route: any) => {
      const matchesSearch =
        !searchTerm ||
        route.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.loadingPoint?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && route.isActive) ||
        (statusFilter === "inactive" && !route.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [fixedContractsData, searchTerm, statusFilter]);

  // Convert FixedContractResponse to FixedContractItem for template
  const templateData: FixedContractItem[] = fixedContractsData.map(
    (contract: any) => ({
      id: contract.id,
      routeName: contract.routeName,
      centerContractType: (contract as any).centerContractType,
      driverContractType: (contract as any).driverContractType,
      operatingDays: contract.operatingDays,
      driver: contract.driver,
      loadingPoint: contract.loadingPoint,
      centerAmount: (contract as any).centerAmount
        ? Number((contract as any).centerAmount)
        : undefined,
      driverAmount: (contract as any).driverAmount
        ? Number((contract as any).driverAmount)
        : undefined,
      monthlyOperatingCost: contract.monthlyOperatingCost
        ? Number(contract.monthlyOperatingCost)
        : undefined,
      dailyOperatingCost: contract.dailyOperatingCost
        ? Number(contract.dailyOperatingCost)
        : undefined,
      startDate: contract.startDate,
      endDate: contract.endDate,
      remarks: contract.remarks,
      isActive: contract.isActive,
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
    }),
  );

  // CRUD handlers
  const handleCreate = async (data: CreateFixedContractRequest) => {
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setCreateModalOpen(false);
          resolve();
        },
        onError: (error) => reject(error),
      });
    });
  };

  const handleUpdate = async (id: string, data: UpdateFixedContractRequest) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { id, data },
        {
          onSuccess: () => {
            setEditModalOpen(false);
            setEditingFixedContract(null);
            resolve();
          },
          onError: (error) => reject(error),
        },
      );
    });
  };

  const handleActivate = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDeactivate = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.success("데이터를 새로고침했습니다");
  };

  // Handle new route creation
  const handleCreateRoute = () => {
    setCreateModalOpen(true);
  };

  // Context menu handlers
  const handleCopyFixedContract = async (item: FixedContractItem) => {
    const contractInfo = formatFixedContractInfo(item as any);
    const success = await copyToClipboard(contractInfo);
    if (success) {
      toast.success("고정노선 정보가 클립보드에 복사되었습니다");
    } else {
      toast.error("클립보드 복사에 실패했습니다");
    }
  };

  const handleShareToKakao = async (item: FixedContractItem) => {
    try {
      const contractInfo = formatFixedContractInfo(item as any);
      await shareToKakao(`고정계약 정보 - ${item.routeName}`, contractInfo);
      toast.success("카카오톡으로 공유되었습니다");
    } catch (error) {
      console.error("카카오톡 공유 실패:", error);
      toast.error("카카오톡 공유에 실패했습니다");
    }
  };

  const handleSendSMS = (item: FixedContractItem) => {
    try {
      const phone = item.driver?.phone;
      if (!phone) {
        toast.error("기사의 연락처가 없습니다");
        return;
      }
      const contractInfo = formatFixedContractInfo(item as any);
      sendSMS(phone, contractInfo);
      toast.success("SMS 앱이 실행되었습니다");
    } catch (error) {
      console.error("SMS 발송 실패:", error);
      toast.error("SMS 발송에 실패했습니다");
    }
  };

  const handlePhoneCall = (item: FixedContractItem, phoneNumber: string) => {
    try {
      makePhoneCall(phoneNumber);
    } catch (error) {
      console.error("전화 걸기 실패:", error);
      toast.error("전화 걸기에 실패했습니다");
    }
  };

  const handleEditFixedContract = (item: FixedContractItem) => {
    setEditingFixedContract(
      fixedContractsData.find((fc: any) => fc.id === item.id) || null,
    );
    setEditModalOpen(true);
  };

  // Context menu items generator
  const getContextMenuItems = (item: FixedContractItem) => {
    return getFixedContractContextMenuItems(item, {
      onCopy: handleCopyFixedContract,
      onKakaoShare: handleShareToKakao,
      onSendSMS: handleSendSMS,
      onPhoneCall: handlePhoneCall,
      onEdit: handleEditFixedContract,
      onActivate: handleActivate,
      onDeactivate: handleDeactivate,
      onDelete: handleDelete,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl shadow-lg">
                <Route className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  고정노선 관리
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  정기 운송 노선을 체계적으로 관리하세요
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isFetching}
                className="flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                새로고침
              </Button>

              <PermissionGate resource="fixed-contracts" action="create">
                <Button
                  onClick={handleCreateRoute}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg"
                >
                  <Plus className="h-4 w-4" />새 고정노선 등록
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Table */}
        <Card className="bg-white shadow-lg border-indigo-100">
          <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <Filter className="h-5 w-5" />
                고정노선 목록
                <Badge
                  variant="secondary"
                  className="ml-2 bg-indigo-100 text-indigo-700"
                >
                  {filteredRoutesData.length}개
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <FixedRoutesTable
              data={filteredRoutesData}
              isLoading={isLoading}
              onEdit={(route) => {
                const contract = fixedContractsData.find(
                  (c: any) => c.id === route.id,
                );
                setEditingFixedContract(contract || null);
                setEditModalOpen(true);
              }}
              onDelete={handleDelete}
              onToggleStatus={handleActivate}
              onCopy={async (route) => {
                const contractInfo = formatFixedContractInfo(route as any);
                const success = await copyToClipboard(contractInfo);
                if (success) {
                  toast.success("고정노선 정보가 클립보드에 복사되었습니다");
                } else {
                  toast.error("클립보드 복사에 실패했습니다");
                }
              }}
              onShare={async (route) => {
                try {
                  const contractInfo = formatFixedContractInfo(route as any);
                  await shareToKakao(
                    `고정노선 정보 - ${route.routeName}`,
                    contractInfo,
                  );
                  toast.success("카카오톡으로 공유되었습니다");
                } catch (error) {
                  console.error("카카오톡 공유 실패:", error);
                  toast.error("카카오톡 공유에 실패했습니다");
                }
              }}
              onCall={(phone) => {
                try {
                  makePhoneCall(phone);
                } catch (error) {
                  console.error("전화 걸기 실패:", error);
                  toast.error("전화 걸기에 실패했습니다");
                }
              }}
              onMessage={(route) => {
                try {
                  const phone = route.driver?.phone;
                  if (!phone) {
                    toast.error("기사의 연락처가 없습니다");
                    return;
                  }
                  const contractInfo = formatFixedContractInfo(route as any);
                  sendSMS(phone, contractInfo);
                  toast.success("SMS 앱이 실행되었습니다");
                } catch (error) {
                  console.error("SMS 발송 실패:", error);
                  toast.error("SMS 발송에 실패했습니다");
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <RegisterFixedContractModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
        loadingPoints={loadingPoints}
      />

      {/* Edit Modal */}
      {editingFixedContract && (
        <RegisterFixedContractModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingFixedContract(null);
          }}
          onSubmit={(data) => handleUpdate(editingFixedContract.id, data)}
          isLoading={updateMutation.isPending}
          loadingPoints={loadingPoints}
          editData={editingFixedContract}
        />
      )}

      {/* Import Modal */}
      <FixedContractsImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
