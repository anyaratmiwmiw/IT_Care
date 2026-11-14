import os
import sys
import time
import socket
import requests
import psutil

# ป้องกันปัญหาข้อความภาษาไทย/emoji บน Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. กำหนดที่อยู่ของ Backend Server บน Cloud (Render.com)
DEFAULT_API_URL = "https://it-care-backend-sy29.onrender.com/api/v1/telemetry"
API_URL = os.environ.get("API_URL", DEFAULT_API_URL)

# 2. รหัสอ้างอิงของเครื่องนี้ (Asset Tag)
ASSET_TAG = os.environ.get("ASSET_TAG", os.environ.get("DEVICE_ID", "SERVER-01"))

# 3. ความถี่การส่งข้อมูลตาม Policy ใน Blueprint (ทุก 30 วินาที)
INTERVAL_SECONDS = int(os.environ.get("INTERVAL_SECONDS", "30"))

def get_disk_usage_percent():
    """คำนวณการใช้งาน Disk ตามระบบปฏิบัติการ"""
    try:
        drive_path = 'C:\\' if os.name == 'nt' else '/'
        return psutil.disk_usage(drive_path).percent
    except Exception:
        return 0.0

def get_operating_hours():
    """คำนวณชั่วโมงการเปิดใช้งานเครื่องต่อเนื่อง (Uptime in hours)"""
    try:
        uptime_seconds = time.time() - psutil.boot_time()
        return round(uptime_seconds / 3600, 2)
    except Exception:
        return 0.0

def send_heartbeat():
    """อ่านค่าสถานะฮาร์ดแวร์และส่งข้อมูลขึ้น Cloud ตลอด 24 ชม."""
    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory().percent
        disk = get_disk_usage_percent()
        operating_hours = get_operating_hours()

        # ส่งค่าแบบ Query Parameters (params) และใช้ชื่อตัวแปรตามที่ Backend กำหนด
        params = {
            "asset_tag": ASSET_TAG,
            "cpu": cpu,
            "ram": ram,
            "disk": disk,
            "operating_hours": operating_hours
        }

        print(f"📊 [Agent] [{ASSET_TAG}] อ่านค่า: CPU={cpu}%, RAM={ram}%, Disk={disk}%, Uptime={operating_hours} hrs")

        response = requests.post(API_URL, params=params, timeout=60)

        if response.status_code == 200:
            result = response.json()
            dev_status = result.get("device_status", result.get("status", "Normal"))
            if result.get("alert"):
                print(f"🚨 [Agent Alert] ทรัพยากรสูงเกินเกณฑ์ Policy! (สถานะ: {dev_status})")
            else:
                print(f"✅ [Agent] ส่งข้อมูลเข้า Cloud สำเร็จ (สถานะ: {dev_status})")
        else:
            print(f"❌ [Agent Error] เซิร์ฟเวอร์ตอบกลับรหัส: {response.status_code} ({response.text})")

    except requests.exceptions.RequestException as req_err:
        print(f"⚠️ [Agent Warning] ไม่สามารถเชื่อมต่อกับ Cloud API ({API_URL}): {req_err}")
    except Exception as e:
        print(f"⚠️ [Agent Warning] เกิดข้อผิดพลาดไม่คาดคิด: {e}")

if __name__ == "__main__":
    hostname = socket.gethostname()
    print("=" * 60)
    print("🚀 IT CARE — Client Agent (Cloud Production Mode)")
    print(f"📌 Asset Tag    : {ASSET_TAG} (Hostname: {hostname})")
    print(f"🌐 Cloud Target : {API_URL}")
    print(f"⏱️ Interval     : ส่งข้อมูลทุกๆ {INTERVAL_SECONDS} วินาที")
    print("=" * 60)
    print("กด Ctrl+C เพื่อหยุดการทำงาน\n")

    try:
        while True:
            send_heartbeat()
            time.sleep(INTERVAL_SECONDS)
    except KeyboardInterrupt:
        print("\n🛑 หยุดการทำงานของ Client Agent เรียบร้อยแล้ว")