import time
import random
import requests
import datetime
import sys
from datetime import timedelta

# Reconfigure stdout for Windows console UTF-8 support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "https://it-care-backend-sy29.onrender.com/api/v1/telemetry"

# สร้างรายชื่ออุปกรณ์จำลอง 30 เครื่อง
DEVICES = [
    # 10 Servers
    {"tag": "COM-01", "name": "Computer 1", "type": "Com"},
    {"tag": "COM-02", "name": "Computer 2", "type": "Com"},
    {"tag": "COM-03", "name": "Computer 3", "type": "Com"},
    {"tag": "COM-04", "name": "Computer 4", "type": "Com"},
    {"tag": "COM-05", "name": "Computer 5", "type": "Com"},
    {"tag": "COM-06", "name": "Computer 6", "type": "Com"},
    {"tag": "COM-07", "name": "Computer 7", "type": "Com"},
    {"tag": "COM-08", "name": "Computer 8", "type": "Com"},
    {"tag": "COM-09", "name": "Computer 9", "type": "Com"},
    {"tag": "COM-10", "name": "Computer 10", "type": "Com"},
    {"tag": "COM-11", "name": "Computer 11", "type": "Com"},
    {"tag": "COM-12", "name": "Computer 12", "type": "Com"},
    {"tag": "COM-13", "name": "Computer 13", "type": "Com"},
    {"tag": "COM-14", "name": "Computer 14", "type": "Com"},
    {"tag": "COM-15", "name": "Computer 15", "type": "Com"},
    {"tag": "COM-16", "name": "Computer 16", "type": "Com"},
    {"tag": "COM-17", "name": "Computer 17", "type": "Com"},
    {"tag": "COM-18", "name": "Computer 18", "type": "Com"},
    {"tag": "COM-19", "name": "Computer 19", "type": "Com"},
    {"tag": "COM-20", "name": "Computer 20", "type": "Com"},
    {"tag": "COM-21", "name": "Computer 21", "type": "Com"},
    {"tag": "COM-22", "name": "Computer 22", "type": "Com"},
    {"tag": "COM-23", "name": "Computer 23", "type": "Com"},
    {"tag": "COM-24", "name": "Computer 24", "type": "Com"},
    {"tag": "COM-25", "name": "Computer 25", "type": "Com"},
    {"tag": "COM-26", "name": "Computer 26", "type": "Com"},
    {"tag": "COM-27", "name": "Computer 27", "type": "Com"},
    {"tag": "COM-28", "name": "Computer 28", "type": "Com"},
    {"tag": "COM-29", "name": "Computer 29", "type": "Com"},
    {"tag": "COM-31", "name": "Computer 31", "type": "Com"},
]

def seed_database_with_30_devices():
    """สร้างข้อมูลตั้งต้น 30 เครื่องพร้อมสุ่มประวัติ PM และ Threshold"""
    import database, models
    db = database.SessionLocal()

    print("🌱 กำลังเตรียมข้อมูลตั้งต้นสำหรับอุปกรณ์ 30 เครื่อง...", flush=True)
    now = datetime.datetime.now()

    try:
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
                    cpu_threshold=80.0, #if dev["type"] == "Server" else 85.0,
                    ram_threshold=85.0, #if dev["type"] == "Server" else 90.0,
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
        print("✅ บันทึกข้อมูลอุปกรณ์ 30 เครื่องลงฐานข้อมูลเรียบร้อยแล้ว!", flush=True)
    except Exception as e:
        print(f"⚠️ [Seed Error] {e}", flush=True)
        db.rollback()
    finally:
        db.close()

def run_simulation_loop():
    """ส่งข้อมูล Telemetry จำลองสำหรับ 30 เครื่องทุกๆ 30 วินาที"""
    print("🚀 เริ่มการจำลองการทำงานของเครื่องคอมพิวเตอร์ 30 เครื่อง (Sending Telemetry loop)...", flush=True)
    print("💡 กด Ctrl+C เพื่อหยุดสคริปต์จำลอง", flush=True)

    cycle = 0
    while True:
        cycle += 1
        print(f"\n🔄 --- รอบการส่งข้อมูล Telemetry ครั้งที่ {cycle} ---", flush=True)
        
        for dev in DEVICES:
            tag = dev["tag"]

            # จำลองค่าทรัพยากร (กำหนดให้บางเครื่องมีโหลดสูงผิดปกติ เพื่อทดสอบ Alert)
            if tag in ["COM-05", "COM-12", "COM-29"]:
                # High Load Machines -> Trigger Policy Alert!
                cpu = round(random.uniform(86.0, 98.0), 1)
                ram = round(random.uniform(88.0, 96.0), 1)
                disk = round(random.uniform(91.0, 97.0), 1)
            elif tag in ["COM-11", "COM-27"]:
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
                    print(f"[{status_flag}] {tag} ({dev['name']}): CPU={cpu}%, RAM={ram}%, Disk={disk}%", flush=True)
            except Exception as e:
                print(f"⚠️ [{tag}] ไม่สามารถยิง API ได้ (Backend อาจยังไม่เปิด): {e}", flush=True)

        time.sleep(5)

if __name__ == "__main__":
    seed_database_with_30_devices()
    run_simulation_loop()

