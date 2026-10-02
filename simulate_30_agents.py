import time
import random
import requests
import datetime
import sys
from datetime import timedelta

# Reconfigure stdout for Windows console UTF-8 support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://127.0.0.1:8000/api/v1/telemetry"

# สร้างรายชื่ออุปกรณ์จำลอง 30 เครื่อง
DEVICES = [
    # 10 Servers
    {"tag": "SERVER-01", "name": "Main Database Server", "type": "Server"},
    {"tag": "SERVER-02", "name": "Web Application Server 1", "type": "Server"},
    {"tag": "SERVER-03", "name": "Web Application Server 2", "type": "Server"},
    {"tag": "SERVER-04", "name": "File & Storage Server", "type": "Server"},
    {"tag": "SERVER-05", "name": "Backup Server (Heavy Load)", "type": "Server"},
    {"tag": "SERVER-06", "name": "Active Directory Domain Controller", "type": "Server"},
    {"tag": "SERVER-07", "name": "Mail Server", "type": "Server"},
    {"tag": "SERVER-08", "name": "Virtualization Host Alpha", "type": "Server"},
    {"tag": "SERVER-09", "name": "Virtualization Host Beta", "type": "Server"},
    {"tag": "SERVER-10", "name": "ERP Database Server", "type": "Server"},

    # 15 Workstations / PCs
    {"tag": "PC-01", "name": "Accounting Workstation 01", "type": "PC"},
    {"tag": "PC-02", "name": "Accounting Workstation 02", "type": "PC"},
    {"tag": "PC-03", "name": "HR Workstation 01", "type": "PC"},
    {"tag": "PC-04", "name": "Graphic Design Workstation 01", "type": "PC"},
    {"tag": "PC-05", "name": "Graphic Design Workstation 02", "type": "PC"},
    {"tag": "PC-06", "name": "IT Helpdesk PC", "type": "PC"},
    {"tag": "PC-07", "name": "Sales Manager PC", "type": "PC"},
    {"tag": "PC-08", "name": "Marketing Specialist PC", "type": "PC"},
    {"tag": "PC-09", "name": "Reception Desk PC", "type": "PC"},
    {"tag": "PC-10", "name": "Engineering CAD Workstation", "type": "PC"},
    {"tag": "PC-11", "name": "Warehouse Management PC", "type": "PC"},
    {"tag": "PC-12", "name": "Customer Support PC 01", "type": "PC"},
    {"tag": "PC-13", "name": "Customer Support PC 02", "type": "PC"},
    {"tag": "PC-14", "name": "Executive Director Laptop", "type": "PC"},
    {"tag": "PC-15", "name": "R&D Lab Testing PC", "type": "PC"},

    # 5 Network Equipment
    {"tag": "NET-SW01", "name": "Core Switch Layer 3", "type": "Network"},
    {"tag": "NET-SW02", "name": "Floor 1 Access Switch", "type": "Network"},
    {"tag": "NET-SW03", "name": "Floor 2 Access Switch", "type": "Network"},
    {"tag": "NET-GW01", "name": "Main Firewall & Gateway", "type": "Network"},
    {"tag": "NET-AP01", "name": "Main Office Wi-Fi AP Controller", "type": "Network"},
]

def seed_database_with_30_devices():
    """สร้างข้อมูลตั้งต้น 30 เครื่องพร้อมสุ่มประวัติ PM และ Threshold"""
    import database, models
    db = next(database.get_db())

    print("🌱 กำลังเตรียมข้อมูลตั้งต้นสำหรับอุปกรณ์ 30 เครื่อง...")
    now = datetime.datetime.utcnow()

    for i, dev in enumerate(DEVICES):
        asset = db.query(models.Asset).filter(models.Asset.asset_tag == dev["tag"]).first()
        
        # สุ่มช่วงเวลา PM (บางเครื่อง Overdue, บางเครื่อง Due Soon, บางเครื่อง Normal)
        if i % 5 == 0:
            # Overdue (ทำล่าสุดเมื่อ 120 วันก่อน)
            last_pm = now - timedelta(days=120)
            next_pm = last_pm + timedelta(days=90)
        elif i % 3 == 0:
            # Due Soon (ทำล่าสุดเมื่อ 85 วันก่อน -> เหลือ 5 วัน)
            last_pm = now - timedelta(days=85)
            next_pm = last_pm + timedelta(days=90)
        else:
            # Normal (ทำล่าสุดเมื่อ 30 วันก่อน)
            last_pm = now - timedelta(days=30)
            next_pm = last_pm + timedelta(days=90)

        if not asset:
            asset = models.Asset(
                asset_tag=dev["tag"],
                name=dev["name"],
                cpu_threshold=80.0 if dev["type"] == "Server" else 85.0,
                ram_threshold=85.0 if dev["type"] == "Server" else 90.0,
                disk_threshold=90.0,
                last_pm_date=last_pm,
                next_pm_date=next_pm,
                pm_interval_days=90,
                last_seen=now,
                status="Normal"
            )
            db.add(asset)
        else:
            asset.name = dev["name"]
            asset.last_pm_date = last_pm
            asset.next_pm_date = next_pm

    db.commit()
    print("✅ บันทึกข้อมูลอุปกรณ์ 30 เครื่องลงฐานข้อมูลเรียบร้อยแล้ว!")

def run_simulation_loop():
    """ส่งข้อมูล Telemetry จำลองสำหรับ 30 เครื่องทุกๆ 5 วินาที"""
    print("🚀 เริ่มการจำลองการทำงานของเครื่องคอมพิวเตอร์ 30 เครื่อง (Sending Telemetry loop)...")
    print("💡 กด Ctrl+C เพื่อหยุดสคริปต์จำลอง")

    cycle = 0
    while True:
        cycle += 1
        print(f"\n🔄 --- รอบการส่งข้อมูล Telemetry ครั้งที่ {cycle} ---")
        
        for dev in DEVICES:
            tag = dev["tag"]

            # จำลองค่าทรัพยากร (กำหนดให้บางเครื่องมีโหลดสูงผิดปกติ เพื่อทดสอบ Alert)
            if tag in ["SERVER-05", "PC-04", "NET-GW01"]:
                # High Load Machines -> Trigger Policy Alert!
                cpu = round(random.uniform(86.0, 98.0), 1)
                ram = round(random.uniform(88.0, 96.0), 1)
                disk = round(random.uniform(91.0, 97.0), 1)
            elif tag in ["PC-14", "NET-AP01"]:
                # Moderate/Spike Load
                cpu = round(random.uniform(60.0, 82.0), 1)
                ram = round(random.uniform(70.0, 86.0), 1)
                disk = round(random.uniform(75.0, 88.0), 1)
            else:
                # Normal Machines
                cpu = round(random.uniform(10.0, 55.0), 1)
                ram = round(random.uniform(25.0, 65.0), 1)
                disk = round(random.uniform(30.0, 70.0), 1)

            params = {
                "asset_tag": tag,
                "cpu": cpu,
                "ram": ram,
                "disk": disk
            }

            try:
                res = requests.post(API_URL, params=params, timeout=3)
                if res.status_code == 200:
                    data = res.json()
                    status_flag = "🚨 ALERT" if data.get("alert") else "✅ OK"
                    print(f"[{status_flag}] {tag} ({dev['name']}): CPU={cpu}%, RAM={ram}%, Disk={disk}%")
            except Exception as e:
                print(f"⚠️ [{tag}] ไม่สามารถยิง API ได้ (Backend อาจยังไม่เปิด): {e}")

        time.sleep(5)

if __name__ == "__main__":
    seed_database_with_30_devices()
    run_simulation_loop()
