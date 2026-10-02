import time
import requests
import psutil
import socket
import os

# กำหนดที่อยู่ของ Backend Server
API_URL = "http://127.0.0.1:8000/api/v1/telemetry"

# รหัสอ้างอิงของเครื่องนี้ (Asset Tag) - หากไม่กำหนดจะใช้ Hostname ของเครื่องอัตโนมัติ
ASSET_TAG = os.environ.get("ASSET_TAG", "SERVER-01")

# ระยะเวลาเว้นช่วงส่งข้อมูล (วินาที)
INTERVAL_SECONDS = 5

def get_disk_usage():
    try:
        # บน Windows ใช้ 'C:\\' หรือ Root Drive บน Linux/Mac ใช้ '/'
        path = 'C:\\' if os.name == 'nt' else '/'
        return psutil.disk_usage(path).percent
    except Exception:
        return 0.0

def collect_and_send_telemetry():
    try:
        # 1. ดึงค่าฮาร์ดแวร์จริงจากเครื่องคอมพิวเตอร์ด้วย psutil
        cpu_usage = psutil.cpu_percent(interval=1)
        ram_usage = psutil.virtual_memory().percent
        disk_usage = get_disk_usage()

        print(f"📊 [Agent] [{ASSET_TAG}] ดึงค่าสถานะเครื่อง: CPU={cpu_usage}%, RAM={ram_usage}%, Disk={disk_usage}%")

        # 2. ส่งข้อมูลผ่าน REST API ไปยัง Backend
        params = {
            "asset_tag": ASSET_TAG,
            "cpu": cpu_usage,
            "ram": ram_usage,
            "disk": disk_usage
        }
        
        response = requests.post(API_URL, params=params, timeout=5)
        
        if response.status_code == 200:
            result = response.json()
            dev_status = result.get("device_status", "Normal")
            if result.get("alert"):
                print(f"🚨 [Agent Alert] ทรัพยากรสูงเกิน Threshold! (Status: {dev_status})")
            else:
                print(f"✅ [Agent] ส่งข้อมูลสถานะสำเร็จ (Status: {dev_status})")
        else:
            print(f"❌ [Agent Error] ไม่สามารถส่งข้อมูลได้ HTTP Status: {response.status_code}")

    except Exception as e:
        print(f"⚠️ [Agent Error] เกิดข้อผิดพลาดในการดึงข้อมูลหรือยิง API: {e}")

if __name__ == "__main__":
    hostname = socket.gethostname()
    print(f"🚀 เริ่มต้นการทำงานของ Client Agent สำหรับเครื่อง [{ASSET_TAG}] (Host: {hostname})...")
    print(f"🔄 กำหนดส่งข้อมูลทุกๆ {INTERVAL_SECONDS} วินาที (กด Ctrl+C เพื่อเลิกทำงาน)")
    
    while True:
        collect_and_send_telemetry()
        time.sleep(INTERVAL_SECONDS)