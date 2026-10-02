"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Server,
  Activity,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Wrench,
  ArrowLeft,
  RefreshCw,
  PlusCircle,
  X,
  Send,
  Bell,
  Cpu,
  HardDrive
} from "lucide-react";
import Link from "next/link";

export default function AssetMobileView() {
  const params = useParams();
  const assetTag = params?.tag as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mobile PM Modal State
  const [showPmModal, setShowPmModal] = useState(false);
  const [technicianName, setTechnicianName] = useState("");
  const [actionTaken, setActionTaken] = useState("เป่าฝุ่นและทำความสะอาดอุปกรณ์");
  const [pmDetails, setPmDetails] = useState("");
  const [submittingPm, setSubmittingPm] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const getApiBase = () => {
    const host = typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
    return `http://${host}:8000`;
  };

  const fetchDetail = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`${getApiBase()}/api/v1/assets/${assetTag}`);
      if (!res.ok) throw new Error("ไม่พบข้อมูลอุปกรณ์ในระบบ");
      const json = await res.json();
      setData(json);
      setError("");
    } catch (err: any) {
      if (!silent) setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (assetTag) {
      fetchDetail();
      const interval = setInterval(() => fetchDetail(true), 3500);
      return () => clearInterval(interval);
    }
  }, [assetTag]);

  const handleSubmitPm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!technicianName || !actionTaken) return;

    try {
      setSubmittingPm(true);
      const res = await fetch(`${getApiBase()}/api/v1/assets/${assetTag}/pm-logs`, {
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
        setSuccessToast("บันทึก PM สำเร็จ และส่งการแจ้งเตือนไปยัง LINE เรียบร้อยแล้ว! 🎉");
        setPmDetails("");
        fetchDetail(true);
        setTimeout(() => setSuccessToast(""), 5000);
      } else {
        alert("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubmittingPm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">กำลังโหลดข้อมูลสเปกและสถานะอุปกรณ์...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">ไม่พบอุปกรณ์</h2>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <Link href="/" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าแดชบอร์ดหลัก
        </Link>
      </div>
    );
  }

  const { asset, recent_logs, pm_history } = data;
  const latestLog = recent_logs && recent_logs.length > 0 ? recent_logs[recent_logs.length - 1] : { cpu: 0, ram: 0, disk: 0 };

  const quickActions = [
    "เป่าฝุ่นและทำความสะอาดอุปกรณ์",
    "อัปเดตระบบและสแกนไวรัส",
    "ตรวจสอบพัดลมและเปลี่ยนซิลิโคน",
    "ตรวจสอบสายสัญญาณและสวิตช์"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Mobile Top Header */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 sticky top-0 z-40 flex items-center justify-between shadow-md">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> IT CARE Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${asset.is_online ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
          <span className={`text-xs font-bold uppercase tracking-wider ${asset.is_online ? "text-emerald-400" : "text-rose-400"}`}>
            {asset.is_online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-16 left-4 right-4 z-50 bg-emerald-950/95 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl text-xs flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      <main className="p-4 max-w-md mx-auto space-y-4">
        {/* Device Main Info Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-950/70 px-2.5 py-1 rounded-md border border-blue-800/40">
                {asset.asset_tag}
              </span>
              <h1 className="text-xl font-bold text-white mt-2.5 leading-snug">{asset.name}</h1>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                เช็กล่าสุด: {asset.last_seen}
              </p>
            </div>
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400">
              <Server className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Real-time Hardware Telemetry */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> สถานะฮาร์ดแวร์ปัจจุบัน (Real-time)
            </h2>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              Live Monitor
            </span>
          </div>

          <div className="space-y-4">
            {/* CPU */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" /> CPU Usage
                </span>
                <span className={latestLog.cpu > asset.cpu_threshold ? "text-rose-400 font-bold" : "text-slate-200 font-semibold"}>
                  {latestLog.cpu}% (Limit: {asset.cpu_threshold}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    latestLog.cpu > asset.cpu_threshold ? "bg-rose-500" : "bg-gradient-to-r from-blue-500 to-indigo-500"
                  }`}
                  style={{ width: `${Math.min(latestLog.cpu, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" /> RAM Memory
                </span>
                <span className={latestLog.ram > asset.ram_threshold ? "text-amber-400 font-bold" : "text-slate-200 font-semibold"}>
                  {latestLog.ram}% (Limit: {asset.ram_threshold}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    latestLog.ram > asset.ram_threshold ? "bg-amber-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}
                  style={{ width: `${Math.min(latestLog.ram, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Disk */}
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Disk Storage
                </span>
                <span className={latestLog.disk > asset.disk_threshold ? "text-rose-400 font-bold" : "text-slate-200 font-semibold"}>
                  {latestLog.disk}% (Limit: {asset.disk_threshold}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    latestLog.disk > asset.disk_threshold ? "bg-rose-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  }`}
                  style={{ width: `${Math.min(latestLog.disk, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* PM Schedule Plan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" /> รอบแผนบำรุงรักษา (Preventive Maintenance)
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1 text-[11px]">PM ล่าสุด</span>
              <span className="font-semibold text-slate-200">{asset.last_pm_date}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1 text-[11px]">กำหนด PM ถัดไป</span>
              <span className="font-bold text-amber-400">{asset.next_pm_date}</span>
            </div>
          </div>
        </div>

        {/* Maintenance Logs History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-400" /> ประวัติการบำรุงรักษา ({pm_history ? pm_history.length : 0})
            </h2>
          </div>

          {pm_history && pm_history.length > 0 ? (
            <div className="space-y-3">
              {pm_history.map((log: any) => (
                <div key={log.id} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-semibold text-blue-300">{log.action_taken}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                      {log.status}
                    </span>
                  </div>
                  {log.details && <p className="text-slate-400 mb-2 leading-relaxed text-[11px]">{log.details}</p>}
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-800/60">
                    <span>ผู้ทำ PM: <strong className="text-slate-300">{log.technician_name}</strong></span>
                    <span>{log.performed_at}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">ยังไม่มีประวัติการบำรุงรักษา</p>
          )}
        </div>
      </main>

      {/* Floating Action Button for Mobile PM Record */}
      <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-30">
        <button
          onClick={() => setShowPmModal(true)}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl flex items-center justify-center gap-2 text-sm transition transform active:scale-95 border border-indigo-400/30"
        >
          <PlusCircle className="w-5 h-5" /> บันทึกการทำ PM หน้างาน (ส่งแจ้งเตือน LINE)
        </button>
      </div>

      {/* Mobile PM Form Modal */}
      {showPmModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">บันทึกการทำ PM</h3>
                <p className="text-xs text-blue-400 font-semibold">{asset.asset_tag} - {asset.name}</p>
              </div>
              <button
                onClick={() => setShowPmModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPm} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อช่าง / ผู้ดำเนินการ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ช่างสมชาย IT Support"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">งานที่ปฏิบัติ / Action Taken *</label>
                <input
                  type="text"
                  required
                  placeholder="ระบุงานที่ทำ..."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs mb-2"
                />
                
                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setActionTaken(act)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                        actionTaken === act
                          ? "bg-blue-600 text-white border-blue-500 font-semibold"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">หมายเหตุ / รายละเอียดเพิ่มเติม</label>
                <textarea
                  rows={3}
                  placeholder="เช่น สภาพฝุ่นเยอะ, เปลี่ยนซิลิโคน CPU เรียบร้อย..."
                  value={pmDetails}
                  onChange={(e) => setPmDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPmModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingPm}
                  className="flex-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingPm ? "กำลังบันทึก..." : "บันทึกและส่ง LINE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
