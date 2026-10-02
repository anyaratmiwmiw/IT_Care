# Implementation Plan - พัฒนาระบบ IT CARE ให้สมบูรณ์ตามขอบเขตโครงงาน

แผนงานนี้มีเป้าหมายเพื่อยกระดับระบบ **IT CARE (Computer Equipment Monitoring & Preventive Maintenance System)** จากระดับ MVP ไปสู่ระบบที่ทำงานสมบูรณ์ตามข้อกำหนดในเอกสารโครงงาน (DOC 0002)

---

## User Review Required

> [!IMPORTANT]
> **ระบบแจ้งเตือน LINE (LINE Messaging API / LINE Notify):**
> ต้องมีการระบุ `LINE_NOTIFY_TOKEN` หรือ `LINE_CHANNEL_ACCESS_TOKEN` เพื่อให้ระบบส่งข้อความเข้ากลุ่ม LINE จริง หากยังไม่มี Token ในระหว่างการทดสอบ ระบบจะจำลองและบันทึก Log การส่งข้อความให้อัตโนมัติ (Mock notification log)

> [!NOTE]
> **การติดตั้ง Dependency เพิ่มเติม:**
> Backend จะใช้ไลบรารี `qrcode`, `pillow`, และ `python-jose` / `passlib` (สำหรับระบบ User/Auth)
> Frontend จะใช้ `lucide-react`, `recharts` หรือ UI Components เพื่อให้ Dashboard สวยงามระดับ Premium

---

## Proposed Changes

### 1. Database & Backend Models (`models.py`)

#### [MODIFY] [models.py](file:///c:/IT_Care/models.py)
- เพิ่มฟิลด์ `last_seen` และ `status` ในตาราง `Asset`
- สร้างตารางใหม่ `PMHistory` (เก็บบันทึกประวัติการบำรุงรักษา):
  - `id`, `asset_id`, `technician_name`, `action_taken`, `details`, `status` ('Completed', 'Pending'), `performed_at`
- สร้างตารางใหม่ `User` (สำหรับ User Management):
  - `id`, `username`, `hashed_password`, `full_name`, `role` ('IT Admin', 'IT Support')
- สร้างตารางใหม่ `AlertLog` (เก็บบันทึกประวัติการแจ้งเตือนและ Cooldown):
  - `id`, `asset_tag`, `alert_type`, `message`, `sent_at`

---

### 2. FastAPI Backend API Core (`main.py`)

#### [MODIFY] [main.py](file:///c:/IT_Care/main.py)
- **Telemetry & Online Status:**
  - อัปเดต `last_seen` ของ Asset ทุกครั้งที่ได้รับข้อมูล Telemetry
  - เช็กสถานะ Offline อัตโนมัติหาก `last_seen` เกิน 30 วินาที
- **LINE Notification Service:**
  - เพิ่มฟังก์ชันส่งข้อความ LINE Notify / LINE Bot พร้อมระบบ Alert Cooldown (เช่น แจ้งเตือนไม่เกิน 1 ครั้งต่อ 15 นาที สำหรับเครื่องเดิม)
- **PM History APIs:**
  - `POST /api/v1/assets/{asset_id}/pm-logs`: บันทึกประวัติการ PM
  - `GET /api/v1/assets/{asset_id}/pm-logs`: ดึงประวัติ PM ของอุปกรณ์
- **QR Code APIs:**
  - `GET /api/v1/assets/{asset_id}/qr`: สร้างภาพ QR Code ชี้ไปยัง URL รายละเอียดอุปกรณ์
- **Authentication APIs:**
  - `POST /api/v1/auth/login`, `GET /api/v1/auth/me`

---

### 3. Client Agent (`client_agent.py`)

#### [MODIFY] [client_agent.py](file:///c:/IT_Care/client_agent.py)
- เพิ่มการดึงค่าสเปกเครื่องเพิ่มเติม (เช่น Hostname, OS info)
- ปรับปรุง Error handling และ Reconnect loop

---

### 4. Next.js Web Frontend (`it-care-frontend`)

#### [MODIFY] [page.tsx](file:///c:/IT_Care/it-care-frontend/app/page.tsx)
- ออกแบบ Dashboard ใหม่ด้วยดีไซน์หรูหรา (Dark Mode + Vibrant Cards + Status Indicators)
- สรุปตัวเลขอุปกรณ์ทั้งหมด: Total, Online, Offline, Alert, Pending PM
- แสดงกราฟ Resource Usage (CPU, RAM, Disk)
- ปุ่มสแกน/ดู QR Code ของแต่ละเครื่อง
- Modal สำหรับบันทึกผลการบำรุงรักษา (PM Form)

#### [NEW] `app/assets/[tag]/page.tsx`
- หน้า Mobile Web Responsive สำหรับสแกนผ่าน QR Code ดูสเปกเครื่อง, สถานะปัจจุบัน, วันบำรุงรักษาถัดไป, และประวัติการทำ PM ย้อนหลัง

---

## Verification Plan

### Automated Tests
- ทดสอบ Backend Endpoints ผ่าน Python test script:
  - สั่งส่ง Telemetry -> เช็ก `last_seen` และ `alert`
  - สั่งสร้าง PM Log -> เช็กการบันทึกและคำนวณ `next_pm_date`
  - สั่งสร้าง QR Code -> เช็กการคืนค่า SVG / Image stream

### Manual Verification
- เรียกใช้ `client_agent.py` และตรวจสอบการแสดงผลบน Dashboard แบบ Real-time
- สแกน/กดดู QR Code และตรวจสอบการเปิดหน้า Mobile Detail View (`/assets/SERVER-01`)
- บันทึกการทำ PM และตรวจสอบการอัปเดตวัน PM ถัดไปในตาราง
