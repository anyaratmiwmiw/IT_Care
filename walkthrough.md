# Walkthrough - สรุปการพัฒนาระบบ IT CARE และระบบ Email Login

ระบบ **IT CARE (Computer Equipment Monitoring and Preventive Maintenance System)** ได้รับการพัฒนาเพิ่ม **ระบบเข้าสู่ระบบด้วยอีเมล (Email Authentication)** สำหรับผู้ดูแลระบบเรียบร้อยแล้วครับ

---

## 🔐 ระบบล็อกอินด้วยอีเมล (Email Authentication System)

1. **Database Model ([models.py](file:///c:/IT_Care/models.py)):**
   - เพิ่มฟิลด์ `email` (Unique, Index) และ `password_hash` (SHA-256) ในตาราง `users`
2. **Backend Authentication APIs ([main.py](file:///c:/IT_Care/main.py)):**
   - `POST /api/v1/auth/login`: ตรวจสอบอีเมลและรหัสผ่าน คืนค่า Session Token และข้อมูลผู้ใช้
   - `POST /api/v1/auth/register`: เพิ่มบัญชีผู้ดูแลใหม่
3. **Frontend Login UI ([app/login/page.tsx](file:///c:/IT_Care/it-care-frontend/app/login/page.tsx)):**
   - หน้าล็อกอินดีไซน์หรูหราด้วย Glassmorphic Card สำหรับกรอก Email และ Password
   - บันทึก Session ลง `localStorage` และสลับการแสดงผลในหน้า Dashboard หลัก
4. **Dashboard User Badge & Logout ([app/page.tsx](file:///c:/IT_Care/it-care-frontend/app/page.tsx)):**
   - แสดงสถานะอีเมลผู้ดูแลที่ล็อกอินอยู่ (เช่น `admin@itcare.com | IT Administrator`) พร้อมปุ่มกด ออกจากระบบ (Logout)

---

## 🔑 บัญชีผู้ดูแลระบบสำหรับทดสอบ (Demo Credentials)

* **Email:** `admin@itcare.com`
* **Password:** `admin123`
* **Role:** `IT Administrator`

---

## 🌐 เส้นทาง URL ในระบบ (App Routes)

* **หน้าแดชบอร์ดหลัก:** `http://localhost:3000/`
* **หน้าเข้าสู่ระบบ (Email Login):** `http://localhost:3000/login`
* **หน้าดูสเปก/ประวัติผ่าน QR Code (Mobile View):** `http://localhost:3000/assets/[tag]`
