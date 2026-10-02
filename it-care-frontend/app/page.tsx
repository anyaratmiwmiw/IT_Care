"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Server,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Calendar,
  QrCode,
  Wrench,
  PlusCircle,
  RefreshCw,
  Cpu,
  HardDrive,
  AlertTriangle,
  X,
  Send,
  ExternalLink,
  LogOut,
  UserCheck,
  Bell,
  MessageSquare,
  Check
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetDetail, setAssetDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal States
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPmModal, setShowPmModal] = useState(false);
  const [showLineModal, setShowLineModal] = useState(false);
  const [qrAssetTag, setQrAssetTag] = useState("");

  // LINE Notification Config States
  const [lineChannelToken, setLineChannelToken] = useState("");
  const [lineUserGroupId, setLineUserGroupId] = useState("");
  const [lineNotifyToken, setLineNotifyToken] = useState("");
  const [lineConfigStatus, setLineConfigStatus] = useState<any>(null);
  const [lineSaving, setLineSaving] = useState(false);
  const [lineTesting, setLineTesting] = useState(false);
  const [lineTestResult, setLineTestResult] = useState("");

  // PM Form State
  const [technicianName, setTechnicianName] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [pmDetails, setPmDetails] = useState("");
  const [submittingPm, setSubmittingPm] = useState(false);

  const getApiBase = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
    return `http://${host}:8000`;
  };

  const fetchAssets = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${getApiBase()}/api/v1/assets`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
        if (data.length > 0 && !selectedAsset) {
          setSelectedAsset(data[0]);
        }
      }
    } catch (err) {
      console.error("Fetch assets error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAssetDetail = async (tag: string) => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/assets/${tag}`);
      if (res.ok) {
        const data = await res.json();
        setAssetDetail(data);
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
    }
  };

  const fetchLineConfig = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/line/config`);
      if (res.ok) {
        const data = await res.json();
        setLineConfigStatus(data);
      }
    } catch (err) {
      console.error("Fetch line config error:", err);
    }
  };

  const handleSaveLineConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLineSaving(true);
      const res = await fetch(`${getApiBase()}/api/v1/line/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_access_token: lineChannelToken,
          user_or_group_id: lineUserGroupId,
          notify_token: lineNotifyToken
        })
      });
      if (res.ok) {
        alert("บันทึกการตั้งค่า LINE สำเร็จ!");
        fetchLineConfig();
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกการตั้งค่า LINE");
    } finally {
      setLineSaving(false);
    }
  };

  const handleTestLine = async () => {
    try {
      setLineTesting(true);
      setLineTestResult("");
      const res = await fetch(`${getApiBase()}/api/v1/line/test`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLineTestResult(data.message);
      }
    } catch (err) {
      setLineTestResult("เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setLineTesting(false);
    }
  };

  useEffect(() => {
    fetchLineConfig();
  }, []);

  useEffect(() => {
    // เช็กล็อกอิน
    const savedUser = localStorage.getItem("it_care_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("User session parse error", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("it_care_user");
    localStorage.removeItem("it_care_token");
    setCurrentUser(null);
    router.push("/login");
  };

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(fetchAssets, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedAsset?.asset_tag) {
      fetchAssetDetail(selectedAsset.asset_tag);
    }
  }, [selectedAsset]);

  const handleOpenQr = (tag: string) => {
    setQrAssetTag(tag);
    setShowQrModal(true);
  };

  const handleOpenPmForm = (asset: any) => {
    setSelectedAsset(asset);
    setTechnicianName("");
    setActionTaken("");
    setPmDetails("");
    setShowPmModal(true);
  };

  const handleSubmitPm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !technicianName || !actionTaken) return;

    try {
      setSubmittingPm(true);
      const res = await fetch(`${getApiBase()}/api/v1/assets/${selectedAsset.asset_tag}/pm-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technician_name: technicianName,
          action_taken: actionTaken,
          details: pmDetails,
          status: "Completed"
        })
      });

      if (res.ok) {
        setShowPmModal(false);
        fetchAssets();
        if (selectedAsset?.asset_tag) fetchAssetDetail(selectedAsset.asset_tag);
      }
    } catch (err) {
      console.error("Submit PM error:", err);
    } finally {
      setSubmittingPm(false);
    }
  };

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL"); // ALL, ONLINE, OFFLINE, WARNING, OVERDUE

  // Filtered Assets Calculation
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === "ONLINE") return asset.is_online;
    if (filterCategory === "OFFLINE") return !asset.is_online;
    if (filterCategory === "WARNING") return asset.status === "Warning" || asset.status === "Critical";
    if (filterCategory === "OVERDUE") return asset.pm_days_left < 0;

    return true;
  });

  // Summary Metrics
  const totalAssets = assets.length;
  const onlineAssets = assets.filter(a => a.is_online).length;
  const offlineAssets = assets.filter(a => !a.is_online).length;
  const alertAssets = assets.filter(a => a.status === "Warning" || a.status === "Critical").length;
  const overduePm = assets.filter(a => a.pm_days_left < 0).length;

  const currentAsset = selectedAsset || (assets.length > 0 ? assets[0] : null);
  const currentTelemetry = currentAsset?.telemetry || { cpu: 0, ram: 0, disk: 0 };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              IT CARE
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
              v2.0 System
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            ระบบติดตามสถานะและแจ้งเตือนการบำรุงรักษาเชิงป้องกันสำหรับอุปกรณ์คอมพิวเตอร์ (Preventive Maintenance & Alerting)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <div>
                <span className="font-bold text-slate-200 block">{currentUser.email}</span>
                <span className="text-[10px] text-blue-400">{currentUser.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800 transition"
                title="ออกจากระบบ"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <UserCheck className="w-4 h-4" /> เข้าสู่ระบบ (Login)
            </Link>
          )}

          <button
            onClick={() => setShowLineModal(true)}
            className="px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>ตั้งค่า LINE แจ้งเตือน</span>
            {lineConfigStatus?.is_configured && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={fetchAssets}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-400" : ""}`} />
            รีเฟรชข้อมูล
          </button>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400">Server Backend Running</span>
          </div>
        </div>
      </header>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">อุปกรณ์ทั้งหมด</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white">{totalAssets}</span>
            <Server className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">สถานะ ONLINE</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-emerald-400">{onlineAssets}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">สถานะ OFFLINE</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-rose-400">{offlineAssets}</span>
            <Clock className="w-5 h-5 text-rose-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">POLICY WARNING</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-amber-400">{alertAssets}</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg col-span-2 md:col-span-1">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">PM เลยกำหนด</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-purple-400">{overduePm}</span>
            <Calendar className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Grid Section: Left = Asset Hardware Telemetry, Right = PM Schedule & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* Realtime Telemetry Panel */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950 px-2.5 py-1 rounded border border-blue-800">
                  {currentAsset?.asset_tag || "SERVER-01"}
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">{currentAsset?.name || "Main Server"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">อัปเดตข้อมูลล่าสุดเมื่อ: {currentTelemetry?.updated_at || "N/A"}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => currentAsset && handleOpenQr(currentAsset.asset_tag)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-blue-400" /> สแกน QR Code
                </button>
                <button
                  onClick={() => currentAsset && handleOpenPmForm(currentAsset)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> บันทึกการทำ PM
                </button>
              </div>
            </div>

            {/* Hardware Telemetry Progress Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* CPU */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-blue-400" /> CPU Usage</span>
                  <span className="text-slate-200">{currentTelemetry.cpu}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${currentTelemetry.cpu > (currentAsset?.cpu_threshold || 80) ? "bg-rose-500" : "bg-blue-500"}`}
                    style={{ width: `${Math.min(currentTelemetry.cpu, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>Threshold: {currentAsset?.cpu_threshold || 80}%</span>
                  <span>{currentTelemetry.cpu > (currentAsset?.cpu_threshold || 80) ? "⚠️ เกินกำหนด" : "ปกติ"}</span>
                </div>
              </div>

              {/* RAM */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-purple-400" /> RAM Usage</span>
                  <span className="text-slate-200">{currentTelemetry.ram}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${currentTelemetry.ram > (currentAsset?.ram_threshold || 85) ? "bg-amber-500" : "bg-purple-500"}`}
                    style={{ width: `${Math.min(currentTelemetry.ram, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>Threshold: {currentAsset?.ram_threshold || 85}%</span>
                  <span>{currentTelemetry.ram > (currentAsset?.ram_threshold || 85) ? "⚠️ เกินกำหนด" : "ปกติ"}</span>
                </div>
              </div>

              {/* Disk */}
              <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-emerald-400" /> Disk Usage</span>
                  <span className="text-slate-200">{currentTelemetry.disk}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${currentTelemetry.disk > (currentAsset?.disk_threshold || 90) ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min(currentTelemetry.disk, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-2">
                  <span>Threshold: {currentAsset?.disk_threshold || 90}%</span>
                  <span>{currentTelemetry.disk > (currentAsset?.disk_threshold || 90) ? "⚠️ เกินกำหนด" : "ปกติ"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Log Summary */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-xs">
            <h3 className="font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> นโยบายการแจ้งเตือนและการส่ง LINE Notify
            </h3>
            <p className="text-slate-400 leading-relaxed">
              ระบบประเมินค่า Telemetry ทุก 5 วินาที หากค่าทรัพยากรสูงเกินกำหนด จะบันทึก Alert Log และส่งการแจ้งเตือนเข้า LINE Notify พร้อมระบบ Cooldown 15 นาที เพื่อป้องกันการแจ้งเตือนรบกวนซ้ำซ้อน
            </p>
          </div>
        </div>

        {/* Right Panel: Preventive PM Summary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" /> Preventive PM Planning
            </h2>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">วันที่บำรุงรักษาล่าสุด</span>
                <span className="text-lg font-semibold text-slate-200">{currentAsset?.last_pm_date || "ยังไม่มีข้อมูล"}</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">กำหนดการ PM ครั้งถัดไป</span>
                <span className="text-xl font-bold text-amber-400">{currentAsset?.next_pm_date || "กำลังคำนวณ..."}</span>
                <p className="text-slate-500 mt-1">รอบการบำรุงรักษาปกติทุก 90 วัน</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">สถานะรอบ PM</span>
                <span className="inline-block px-2.5 py-1 rounded font-semibold text-xs bg-blue-950 text-blue-300 border border-blue-800">
                  {currentAsset?.pm_status || "Scheduled"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <Link
              href={`/assets/${currentAsset?.asset_tag || "SERVER-01"}`}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <ExternalLink className="w-4 h-4" /> ดูหน้าประวัติอุปกรณ์บน Mobile View
            </Link>
          </div>
        </div>
      </div>

      {/* Asset Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-400" /> รายการอุปกรณ์และตารางการบำรุงรักษา (30 เครื่อง)
            </h2>
            <p className="text-xs text-slate-400 mt-1">คลิกที่แถวอุปกรณ์ใดๆ เพื่อเลือกดูรายละเอียดทรัพยากรด้านบน</p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="ค้นหา Asset Tag หรือชื่ออุปกรณ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">พบ {filteredAssets.length} / {assets.length}</span>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterCategory === "ALL"
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
          >
            ทั้งหมด ({assets.length})
          </button>
          <button
            onClick={() => setFilterCategory("ONLINE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterCategory === "ONLINE"
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
          >
            Online ({assets.filter(a => a.is_online).length})
          </button>
          <button
            onClick={() => setFilterCategory("OFFLINE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterCategory === "OFFLINE"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
          >
            Offline ({assets.filter(a => !a.is_online).length})
          </button>
          <button
            onClick={() => setFilterCategory("WARNING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterCategory === "WARNING"
                ? "bg-amber-600 text-white border-amber-500"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
          >
            Warning/Alert ({assets.filter(a => a.status === "Warning" || a.status === "Critical").length})
          </button>
          <button
            onClick={() => setFilterCategory("OVERDUE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterCategory === "OVERDUE"
                ? "bg-purple-600 text-white border-purple-500"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
              }`}
          >
            PM เลยกำหนด ({assets.filter(a => a.pm_days_left < 0).length})
          </button>
        </div>

        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-900 z-10 shadow">
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3">Asset Tag</th>
                <th className="p-3">ชื่ออุปกรณ์</th>
                <th className="p-3">สถานะเชื่อมต่อ</th>
                <th className="p-3">CPU / RAM / Disk</th>
                <th className="p-3">PM ล่าสุด</th>
                <th className="p-3">กำหนด PM ถัดไป</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAsset?.asset_tag === asset.asset_tag;
                return (
                  <tr
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`cursor-pointer transition ${isSelected ? "bg-blue-950/60 border-l-4 border-l-blue-500" : "hover:bg-slate-800/40"
                      }`}
                  >
                    <td className="p-3 font-semibold text-blue-400">{asset.asset_tag}</td>
                    <td className="p-3 font-medium text-slate-200">{asset.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${asset.is_online
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                          : "bg-rose-950/80 text-rose-400 border border-rose-800/50"
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${asset.is_online ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}></span>
                        {asset.is_online ? "ONLINE" : "OFFLINE"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      CPU: <span className="font-semibold">{asset.telemetry.cpu}%</span> | RAM: <span className="font-semibold">{asset.telemetry.ram}%</span> | Disk: <span className="font-semibold">{asset.telemetry.disk}%</span>
                    </td>
                    <td className="p-3 text-slate-400">{asset.last_pm_date}</td>
                    <td className="p-3 font-semibold text-amber-400">
                      {asset.next_pm_date}
                      {asset.pm_days_left < 0 && <span className="ml-1 text-[10px] text-rose-400 font-bold">(Overdue)</span>}
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenQr(asset.asset_tag)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg border border-slate-700 transition"
                          title="ดู QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenPmForm(asset)}
                          className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                          title="บันทึกการทำ PM"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Logs History Table */}
      {assetDetail?.pm_history && assetDetail.pm_history.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" /> ประวัติบันทึกการบำรุงรักษา (PM History Logs)
          </h2>
          <div className="space-y-3 text-xs">
            {assetDetail.pm_history.map((log: any) => (
              <div key={log.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-blue-300 text-sm">{log.action_taken}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                      {log.status}
                    </span>
                  </div>
                  {log.details && <p className="text-slate-400 leading-relaxed">{log.details}</p>}
                </div>
                <div className="text-right text-slate-500 shrink-0">
                  <p>ผู้ดำเนินการ: <span className="text-slate-300 font-medium">{log.technician_name}</span></p>
                  <p className="mt-0.5">{log.performed_at}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">QR Code สำหรับอุปกรณ์</h3>
            <p className="text-xs text-blue-400 font-semibold mb-4">{qrAssetTag}</p>

            <div className="bg-white p-4 rounded-xl inline-block border border-slate-700 shadow-inner mb-4">
              <img
                src={`${getApiBase()}/api/v1/assets/${qrAssetTag}/qr?host=${typeof window !== 'undefined' ? window.location.hostname : ''}`}
                alt={`QR Code ${qrAssetTag}`}
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-xs text-slate-400 mb-2">
              📱 สแกนด้วยกล้องมือถือ (ที่ต่อ Wi-Fi วงเดียวกัน) เพื่อเปิดดูสเปกและประวัติบำรุงรักษา
            </p>

            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 mb-4 text-[11px] text-slate-400 font-mono break-all select-all">
              {typeof window !== 'undefined' ? `http://${window.location.hostname}:3000/assets/${qrAssetTag}` : `/assets/${qrAssetTag}`}
            </div>

            <Link
              href={`/assets/${qrAssetTag}`}
              target="_blank"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-4 h-4" /> ทดสอบเปิดบนเครื่องนี้ (Direct Link)
            </Link>
          </div>
        </div>
      )}

      {/* PM Form Modal */}
      {showPmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setShowPmModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">บันทึกผลการบำรุงรักษา (PM)</h3>
            <p className="text-xs text-slate-400 mb-4">อุปกรณ์: <span className="text-blue-400 font-semibold">{selectedAsset?.asset_tag}</span> ({selectedAsset?.name})</p>

            <form onSubmit={handleSubmitPm} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อเจ้าหน้าที่ / ผู้ดำเนินการ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย IT Support"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">หัวข้อการบำรุงรักษา / Action Taken *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ทำความสะอาดฝุ่น, อัปเดตแพตช์ระบบ"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows={3}
                  placeholder="ระบุข้อสังเกต หรืออุปกรณ์ที่ทำการเปลี่ยน..."
                  value={pmDetails}
                  onChange={(e) => setPmDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPmModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingPm}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingPm ? "กำลังบันทึก..." : "บันทึกข้อมูล PM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINE Notification Settings Modal */}
      {showLineModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full relative shadow-2xl">
            <button
              onClick={() => setShowLineModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ตั้งค่าระบบแจ้งเตือน LINE</h3>
                <p className="text-xs text-slate-400">รองรับทั้ง LINE Messaging API (LINE OA) และ LINE Notify</p>
              </div>
            </div>

            {/* Current Config Status */}
            <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 mb-5 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400">สถานะการเชื่อมต่อ LINE:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  lineConfigStatus?.is_configured
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}>
                  {lineConfigStatus?.is_configured ? "พร้อมใช้งาน (Configured)" : "ยังไม่ได้ตั้งค่า Token (จำลอง Mock Log)"}
                </span>
              </div>
              {lineConfigStatus?.channel_access_token && (
                <p className="text-[11px] text-slate-400">Channel Token: <code className="text-slate-300">{lineConfigStatus.channel_access_token}</code></p>
              )}
              {lineConfigStatus?.notify_token && (
                <p className="text-[11px] text-slate-400">Notify Token: <code className="text-slate-300">{lineConfigStatus.notify_token}</code></p>
              )}
            </div>

            <form onSubmit={handleSaveLineConfig} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  LINE Messaging API - Channel Access Token (แนะนำ)
                </label>
                <input
                  type="text"
                  placeholder="ใส่ Channel Access Token (Long-lived) จาก LINE Developers..."
                  value={lineChannelToken}
                  onChange={(e) => setLineChannelToken(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  User ID หรือ Group ID (ไม่บังคับ - หากเว้นว่างจะ Broadcast ไปยังทุกคนที่เป็นเพื่อนกับ Bot)
                </label>
                <input
                  type="text"
                  placeholder="เช่น U1234567890abcdef หรือ C1234567890abcdef..."
                  value={lineUserGroupId}
                  onChange={(e) => setLineUserGroupId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div className="pt-1 border-t border-slate-800/80">
                <label className="block text-slate-300 font-semibold mb-1">
                  หรือใช้ LINE Notify Token (ทางเลือกเดิม)
                </label>
                <input
                  type="text"
                  placeholder="ใส่ LINE Notify Token..."
                  value={lineNotifyToken}
                  onChange={(e) => setLineNotifyToken(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              {lineTestResult && (
                <div className="p-3 bg-blue-950/80 border border-blue-800 text-blue-300 rounded-xl text-xs flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{lineTestResult}</span>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleTestLine}
                  disabled={lineTesting}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  {lineTesting ? "กำลังทดสอบ..." : "ทดสอบส่งข้อความ LINE"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLineModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                  >
                    ปิด
                  </button>
                  <button
                    type="submit"
                    disabled={lineSaving}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition shadow-lg"
                  >
                    <Check className="w-4 h-4" />
                    {lineSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}