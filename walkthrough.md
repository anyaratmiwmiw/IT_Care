# Walkthrough - สรุปการพัฒนาระบบ IT CARE และระบบ Public Cloud Deployment

ระบบ **IT CARE (Computer Equipment Monitoring and Preventive Maintenance System)** ได้รับการอัปเกรดให้พร้อมสำหรับการใช้งานระดับ Production และเข้าถึงผ่าน Public HTTPS ทั่วโลกตามพิมพ์เขียว (System Blueprint) เรียบร้อยแล้วครับ

---

## 🚀 สรุปสิ่งที่ดำเนินการตามพิมพ์เขียว (Blueprint Deployment)

### 1. ไฟล์สำหรับการขึ้น Cloud Container
* **[Dockerfile](file:///c:/IT_Care/Dockerfile):** กำหนด Container ด้วย Python 3.11-slim, ติดตั้ง dependencies และตั้งค่ารัน Uvicorn พอร์ต 8080 พร้อมรองรับ Mount Volume `/data`
* **[.dockerignore](file:///c:/IT_Care/.dockerignore):** กรองโฟลเดอร์ขนาดใหญ่ เช่น `venv/`, `it-care-frontend/`, `it_preventive.db` ป้องกันการส่งไฟล์ไม่จำเป็นขึ้นเซิร์ฟเวอร์

### 2. ฐานข้อมูลแบบ Hybrid Persistent ([database.py](file:///c:/IT_Care/database.py))
* รองรับทั้ง Persistent Volume บน Cloud (`/data/itcare.db` ผ่าน `SQLITE_PATH`) และ Fallback ใช้งาน Localhost (`./it_preventive.db`) โดยที่ข้อมูลไม่สูญหาย

### 3. Client Agent สำหรับ Cloud ([client_agent.py](file:///c:/IT_Care/client_agent.py))
* รองรับการยิงเข้าสู่ Cloud URL แบบอัตโนมัติ
* ส่งค่า `operating_hours` (Uptime ชั่วโมงการทำงาน) และสถานะ Hardware ครบถ้วน
* ส่งข้อมูลทุก **30 วินาที** ตามมาตรฐาน Policy Blueprint

### 4. API Heartbeat ใน Backend ([main.py](file:///c:/IT_Care/main.py))
* เพิ่ม Route `@app.post("/api/agent/heartbeat")` รองรับ JSON Schema จาก Client Agent โดยตรง
* อัปเดต QR Code Generation ให้รองรับ `PUBLIC_URL`

### 5. ระบบ Public HTTPS Tunnel ฟรี 100% ([run_cloud_tunnel.bat](file:///c:/IT_Care/run_cloud_tunnel.bat))
* ติดตั้ง `cloudflared.exe` (Cloudflare Tunnel) ไว้ในโฟลเดอร์โปรเจกต์
* ตั้งค่า Next.js Rewrite Proxy (`next.config.ts`) ให้ส่งต่อคำขอ `/api/*` ไปยัง FastAPI Port 8000
* ทำให้เข้าใช้งานได้ทุกส่วน ทั้ง Dashboard, ระบบล็อกอิน, และ Mobile QR Code Scan ผ่าน Public HTTPS โดเมนเดียวกัน โดยไม่ต้องผูกบัตรเครดิต

---

## 🛠️ วิธีการเปิดระบบทั้งหมด (One-Click Launch)

ดับเบิลคลิกไฟล์:
👉 **[START_ALL.bat](file:///c:/IT_Care/START_ALL.bat)**

ระบบจะเปิด 4 หน้าต่างโดยอัตโนมัติ:
1. **Backend Server** (FastAPI พอร์ต 8000)
2. **Frontend Web** (Next.js พอร์ต 3000)
3. **Simulation Agents** (จำลองอุปกรณ์ 30 เครื่อง)
4. **Cloudflare Public Tunnel** (เปิด Public HTTPS URL สำหรับมือถือและอินเทอร์เน็ตภายนอก)

---

## 🌐 การเข้าถึงระบบ (URLs)

* **Localhost Dashboard:** `http://localhost:3000`
* **Public Dashboard & QR Mobile:** สังเกตบรรทัด `https://xxxx.trycloudflare.com` ในหน้าต่าง **IT CARE - Public Tunnel**
* **Mobile Technician View:** `https://xxxx.trycloudflare.com/assets/[tag]` (เช่น `https://xxxx.trycloudflare.com/assets/COM-01`)
* **บัญชีผู้ดูแลเริ่มต้น:** `admin@itcare.com` / `admin123`
