from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import sys
import io
import requests
import qrcode
import models, database

# ป้องกันปัญหา Unicode Error เมื่อ print ข้อความภาษาไทย/emoji บน Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# สร้างโครงสร้างตารางข้อมูลอัตโนมัติ
models.Base.metadata.create_all(bind=database.engine)

# สร้างบัญชีผู้ดูแลเริ่มต้นอัตโนมัติ หากยังไม่มีในระบบ (Self-healing Default Admin)
def init_default_admin():
    db = next(database.get_db())
    try:
        import hashlib
        admin_email = "admin@itcare.com"
        existing = db.query(models.User).filter(models.User.email == admin_email).first()
        if not existing:
            default_admin = models.User(
                email=admin_email,
                password_hash=hashlib.sha256("admin123".encode("utf-8")).hexdigest(),
                full_name="IT Administrator",
                role="IT Administrator"
            )
            db.add(default_admin)
            db.commit()
            print("👤 [Init] สร้างบัญชีผู้ดูแลระบบเริ่มต้นสำเร็จ: admin@itcare.com / admin123")
    except Exception as e:
        print(f"⚠️ [Init Error] {e}")
    finally:
        db.close()

init_default_admin()

app = FastAPI(title="IT CARE API System", version="2.0")

# ปลดล็อก CORS เพื่อให้ Frontend (Next.js) ดึงข้อมูลได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LINE Notification Tokens (รองรับทั้ง LINE Messaging API และ LINE Notify)
LINE_CONFIG = {
    "channel_access_token": "", # สำหรับ LINE Messaging API (LINE Official Account)
    "user_or_group_id": "",     # User ID หรือ Group ID (ถ้าไม่ใส่จะ broadcast)
    "notify_token": ""          # สำหรับ LINE Notify
}

def send_line_message(message_text: str):
    """ส่งข้อความเข้า LINE ผ่าน LINE Messaging API หรือ LINE Notify"""
    sent = False
    
    # 1. LINE Messaging API (LINE Official Account)
    if LINE_CONFIG["channel_access_token"]:
        try:
            token = LINE_CONFIG["channel_access_token"]
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            if LINE_CONFIG["user_or_group_id"]:
                url = "https://api.line.me/v2/bot/message/push"
                payload = {
                    "to": LINE_CONFIG["user_or_group_id"],
                    "messages": [{"type": "text", "text": message_text}]
                }
            else:
                url = "https://api.line.me/v2/bot/message/broadcast"
                payload = {
                    "messages": [{"type": "text", "text": message_text}]
                }
            
            res = requests.post(url, headers=headers, json=payload, timeout=5)
            if res.status_code == 200:
                print(f"📲 [LINE Messaging API] ส่งข้อความสำเร็จ!")
                sent = True
            else:
                print(f"⚠️ [LINE Messaging API Error] {res.status_code}: {res.text}")
        except Exception as e:
            print(f"⚠️ [LINE Messaging API Error] {e}")

    # 2. LINE Notify
    if not sent and LINE_CONFIG["notify_token"]:
        try:
            url = "https://notify-api.line.me/api/notify"
            headers = {"Authorization": f"Bearer {LINE_CONFIG['notify_token']}"}
            data = {"message": f"\n{message_text}"}
            res = requests.post(url, headers=headers, data=data, timeout=5)
            if res.status_code == 200:
                print(f"📲 [LINE Notify] ส่งข้อความสำเร็จ!")
                sent = True
            else:
                print(f"⚠️ [LINE Notify Error] {res.status_code}: {res.text}")
        except Exception as e:
            print(f"⚠️ [LINE Notify Error] {e}")

    if not sent and not LINE_CONFIG["channel_access_token"] and not LINE_CONFIG["notify_token"]:
        print(f"💡 [LINE Mock Log] (ยังไม่ได้ใส่ Token): {message_text}")
    
    return sent


def trigger_line_notification(asset_tag: str, message_text: str, db: Session):
    """ส่งข้อความแจ้งเตือนผ่าน LINE พร้อมระบบ Cooldown 15 นาที"""
    fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
    recent_alert = db.query(models.AlertLog).filter(
        models.AlertLog.asset_tag == asset_tag,
        models.AlertLog.sent_at >= fifteen_mins_ago
    ).first()

    if recent_alert:
        print(f"⏳ [LINE Cooldown] ชะลอการส่งแจ้งเตือนสำหรับ {asset_tag} (เพิ่งส่งไปเมื่อ {recent_alert.sent_at.strftime('%H:%M:%S')})")
        return False

    # บันทึก Alert Log
    alert_log = models.AlertLog(
        asset_tag=asset_tag,
        alert_type="POLICY_WARNING",
        message=message_text,
        sent_at=datetime.utcnow()
    )
    db.add(alert_log)
    db.commit()

    print(f"🚨 [ALERT LOG] บันทึกการแจ้งเตือน: {message_text}")
    full_message = f"🚨 [IT CARE Alert]\n📌 อุปกรณ์: {asset_tag}\n⚠️ {message_text}\n⏰ เวลา: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}"
    send_line_message(full_message)
    return True


# Pydantic Schemas
class PMRecordCreate(BaseModel):
    technician_name: str
    action_taken: str
    details: str = ""
    status: str = "Completed"

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "IT Support"


import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# API ระบบผู้ใช้งานและการเข้าสู่ระบบ (Email Login & Authentication)
@app.post("/api/v1/auth/login")
def login(credentials: UserLogin, db: Session = Depends(database.get_db)):
    pwd_hash = hash_password(credentials.password)
    user = db.query(models.User).filter(
        models.User.email == credentials.email.lower().strip(),
        models.User.password_hash == pwd_hash
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")

    return {
        "status": "success",
        "message": "เข้าสู่ระบบสำเร็จ",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        },
        "token": f"session_token_{user.id}_{int(datetime.utcnow().timestamp())}"
    }

@app.post("/api/v1/auth/register")
def register_user(user_data: UserRegister, db: Session = Depends(database.get_db)):
    email_clean = user_data.email.lower().strip()
    existing = db.query(models.User).filter(models.User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="อีเมลนี้มีอยู่ในระบบแล้ว")

    new_user = models.User(
        email=email_clean,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "status": "success",
        "message": "ลงทะเบียนผู้ดูแลระบบสำเร็จ",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }


@app.get("/")
def read_root():
    return {
        "system": "IT CARE Monitoring System",
        "status": "Online",
        "version": "2.0"
    }


# 1. API รับค่าจาก Telemetry Agent และประมวลผล Policy Alerting
@app.post("/api/v1/telemetry")
def receive_telemetry(asset_tag: str, cpu: float, ram: float, disk: float, db: Session = Depends(database.get_db)):
    now = datetime.utcnow()
    
    # บันทึก Telemetry Log ลง Database
    log = models.TelemetryLog(asset_tag=asset_tag, cpu_usage=cpu, ram_usage=ram, disk_usage=disk, created_at=now)
    db.add(log)

    # ค้นหาอุปกรณ์ หรือสร้างใหม่อัตโนมัติถ้ายังไม่มี
    asset = db.query(models.Asset).filter(models.Asset.asset_tag == asset_tag).first()
    if not asset:
        asset = models.Asset(
            asset_tag=asset_tag, 
            name=asset_tag, 
            cpu_threshold=80.0, 
            ram_threshold=85.0, 
            disk_threshold=90.0,
            last_pm_date=now,
            next_pm_date=now + timedelta(days=90)
        )
        db.add(asset)
    
    # อัปเดตการติดต่อล่าสุดและสถานะ
    asset.last_seen = now

    alert_triggered = False
    reasons = []
    if cpu > asset.cpu_threshold:
        reasons.append(f"CPU สูงเกินกำหนด ({cpu}% > {asset.cpu_threshold}%)")
    if ram > asset.ram_threshold:
        reasons.append(f"RAM สูงเกินกำหนด ({ram}% > {asset.ram_threshold}%)")
    if disk > asset.disk_threshold:
        reasons.append(f"Disk Space สูงเกินกำหนด ({disk}% > {asset.disk_threshold}%)")

    if reasons:
        alert_triggered = True
        asset.status = "Critical" if len(reasons) > 1 else "Warning"
        msg = f"คำเตือนใช้งานฮาร์ดแวร์สูง: {', '.join(reasons)}"
        trigger_line_notification(asset_tag, msg, db)
    else:
        asset.status = "Normal"

    db.commit()
    db.refresh(asset)

    return {
        "status": "success", 
        "asset_tag": asset_tag, 
        "alert": alert_triggered,
        "device_status": asset.status,
        "last_seen": asset.last_seen.strftime("%Y-%m-%d %H:%M:%S")
    }


# 2. API ดึงรายการอุปกรณ์ทั้งหมดพร้อมประเมิน Online/Offline & PM Status
@app.get("/api/v1/assets")
def get_all_assets(db: Session = Depends(database.get_db)):
    assets = db.query(models.Asset).all()
    now = datetime.utcnow()
    result = []

    for a in assets:
        # เช็กสถานะ Online/Offline (หากไม่ได้รับการติดต่อภายใน 30 วินาทีถือว่า Offline)
        is_online = False
        status = a.status or "Normal"

        if a.last_seen:
            diff_seconds = (now - a.last_seen).total_seconds()
            if diff_seconds <= 35:
                is_online = True
            else:
                status = "Offline"
        else:
            status = "Offline"

        # ดึง Log ล่าสุดของอุปกรณ์
        latest_log = db.query(models.TelemetryLog).filter(models.TelemetryLog.asset_tag == a.asset_tag).order_by(models.TelemetryLog.id.desc()).first()

        # ประเมินสถานะรอบ PM
        next_pm = a.next_pm_date if a.next_pm_date else (now + timedelta(days=a.pm_interval_days))
        pm_days_left = (next_pm - now).days

        if pm_days_left < 0:
            pm_status_text = "Overdue (เลยกำหนด)"
        elif pm_days_left <= 7:
            pm_status_text = "Due Soon (ใกล้ถึงกำหนด)"
        else:
            pm_status_text = "Upcoming (ตามแผน)"

        result.append({
            "id": a.id,
            "asset_tag": a.asset_tag,
            "name": a.name,
            "is_online": is_online,
            "status": status,
            "cpu_threshold": a.cpu_threshold,
            "ram_threshold": a.ram_threshold,
            "disk_threshold": a.disk_threshold,
            "last_pm_date": a.last_pm_date.strftime("%Y-%m-%d") if a.last_pm_date else "ยังไม่มีข้อมูล",
            "next_pm_date": next_pm.strftime("%Y-%m-%d"),
            "pm_days_left": pm_days_left,
            "pm_status": pm_status_text,
            "last_seen": a.last_seen.strftime("%Y-%m-%d %H:%M:%S") if a.last_seen else "N/A",
            "telemetry": {
                "cpu": latest_log.cpu_usage if latest_log else 0.0,
                "ram": latest_log.ram_usage if latest_log else 0.0,
                "disk": latest_log.disk_usage if latest_log else 0.0,
                "updated_at": latest_log.created_at.strftime("%H:%M:%S") if latest_log else "N/A"
            }
        })

    return result


# 3. API ดึงรายละเอียดอุปกรณ์ชิ้นเดียว + ประวัติ Telemetry ล่าสุด 20 รายการ
@app.get("/api/v1/assets/{asset_tag}")
def get_asset_detail(asset_tag: str, db: Session = Depends(database.get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_tag == asset_tag).first()
    if not asset:
        raise HTTPException(status_code=404, detail="ไม่พบอุปกรณ์นี้ในระบบ")

    logs = db.query(models.TelemetryLog).filter(
        models.TelemetryLog.asset_tag == asset_tag
    ).order_by(models.TelemetryLog.id.desc()).limit(20).all()

    pm_logs = db.query(models.PMHistory).filter(
        models.PMHistory.asset_tag == asset_tag
    ).order_by(models.PMHistory.id.desc()).all()

    now = datetime.utcnow()
    is_online = (asset.last_seen and (now - asset.last_seen).total_seconds() <= 35)

    return {
        "asset": {
            "id": asset.id,
            "asset_tag": asset.asset_tag,
            "name": asset.name,
            "is_online": is_online,
            "status": "Offline" if not is_online else (asset.status or "Normal"),
            "cpu_threshold": asset.cpu_threshold,
            "ram_threshold": asset.ram_threshold,
            "disk_threshold": asset.disk_threshold,
            "last_pm_date": asset.last_pm_date.strftime("%Y-%m-%d") if asset.last_pm_date else "N/A",
            "next_pm_date": asset.next_pm_date.strftime("%Y-%m-%d") if asset.next_pm_date else "N/A",
            "pm_interval_days": asset.pm_interval_days,
            "last_seen": asset.last_seen.strftime("%Y-%m-%d %H:%M:%S") if asset.last_seen else "N/A"
        },
        "recent_logs": [
            {
                "time": l.created_at.strftime("%H:%M:%S"),
                "cpu": l.cpu_usage,
                "ram": l.ram_usage,
                "disk": l.disk_usage
            } for l in reversed(logs)
        ],
        "pm_history": [
            {
                "id": p.id,
                "technician_name": p.technician_name,
                "action_taken": p.action_taken,
                "details": p.details,
                "status": p.status,
                "performed_at": p.performed_at.strftime("%Y-%m-%d %H:%M")
            } for p in pm_logs
        ]
    }


# 4. API บันทึกการทำ PM (Preventive Maintenance Log)
@app.post("/api/v1/assets/{asset_tag}/pm-logs")
def add_pm_log(asset_tag: str, record: PMRecordCreate, db: Session = Depends(database.get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_tag == asset_tag).first()
    if not asset:
        raise HTTPException(status_code=404, detail="ไม่พบข้อมูลอุปกรณ์")

    now = datetime.utcnow()
    new_log = models.PMHistory(
        asset_tag=asset_tag,
        technician_name=record.technician_name,
        action_taken=record.action_taken,
        details=record.details,
        status=record.status,
        performed_at=now
    )
    db.add(new_log)

    # อัปเดตวัน PM ล่าสุด และคำนวณรอบถัดไป
    asset.last_pm_date = now
    asset.next_pm_date = now + timedelta(days=asset.pm_interval_days)

    db.commit()
    db.refresh(new_log)
    db.refresh(asset)

    # ส่งแจ้งเตือน LINE เมื่อมีการทำ PM สำเร็จ
    pm_msg = f"🛠️ [PM COMPLETED]\n📌 อุปกรณ์: {asset_tag}\n👷 ผู้ดำเนินการ: {record.technician_name}\n🔧 งาน: {record.action_taken}\n📅 กำหนด PM ครั้งถัดไป: {asset.next_pm_date.strftime('%Y-%m-%d')}"
    send_line_message(pm_msg)

    return {
        "message": "บันทึกประวัติการบำรุงรักษาเรียบร้อยแล้ว",
        "last_pm_date": asset.last_pm_date.strftime("%Y-%m-%d"),
        "next_pm_date": asset.next_pm_date.strftime("%Y-%m-%d"),
        "pm_log": {
            "id": new_log.id,
            "technician": new_log.technician_name,
            "action": new_log.action_taken
        }
    }


# 7. APIs สำหรับจัดการและการตั้งค่า LINE Notification
class LineConfigRequest(BaseModel):
    channel_access_token: str = ""
    user_or_group_id: str = ""
    notify_token: str = ""

@app.get("/api/v1/line/config")
def get_line_config():
    return {
        "channel_access_token": (LINE_CONFIG["channel_access_token"][:6] + "..." + LINE_CONFIG["channel_access_token"][-4:]) if LINE_CONFIG["channel_access_token"] else "",
        "user_or_group_id": LINE_CONFIG["user_or_group_id"],
        "notify_token": (LINE_CONFIG["notify_token"][:6] + "..." + LINE_CONFIG["notify_token"][-4:]) if LINE_CONFIG["notify_token"] else "",
        "is_configured": bool(LINE_CONFIG["channel_access_token"] or LINE_CONFIG["notify_token"])
    }

@app.post("/api/v1/line/config")
def update_line_config(config: LineConfigRequest):
    if config.channel_access_token is not None:
        LINE_CONFIG["channel_access_token"] = config.channel_access_token.strip()
    if config.user_or_group_id is not None:
        LINE_CONFIG["user_or_group_id"] = config.user_or_group_id.strip()
    if config.notify_token is not None:
        LINE_CONFIG["notify_token"] = config.notify_token.strip()
    return {
        "status": "success", 
        "message": "อัปเดตการตั้งค่า LINE สำเร็จ", 
        "is_configured": bool(LINE_CONFIG["channel_access_token"] or LINE_CONFIG["notify_token"])
    }

@app.post("/api/v1/line/test")
def test_line_notification():
    test_msg = f"🔔 [IT CARE Test]\nข้อความทดสอบการเชื่อมต่อระบบแจ้งเตือน LINE สำเร็จ!\n⏰ เวลา: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}"
    sent = send_line_message(test_msg)
    return {
        "status": "success" if sent else "simulated",
        "sent": sent,
        "message": "ส่งข้อความทดสอบไปยัง LINE สำเร็จ!" if sent else "ยังไม่ได้ตั้งค่า Token (จำลองการส่งบันทึกใน Log)"
    }


def get_local_ip():
    """ค้นหา IPv4 ของเครื่องในวง LAN/Wi-Fi อัตโนมัติ เพื่อให้มือถือสแกน QR Code แล้วเปิดได้ทันที"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# 5. API สำหรับเจนเนอเรตภาพ QR Code ของอุปกรณ์
@app.get("/api/v1/assets/{asset_tag}/qr")
def generate_qr_code(asset_tag: str, host: str = Query(None)):
    # หากผู้ใช้ส่ง host หรือ ip มาให้ใช้ค่านั้น ไม่งั้นจะใช้ LAN IP อัตโนมัติ
    target_host = host if host else get_local_ip()
    target_url = f"http://{target_host}:3000/assets/{asset_tag}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=3,
    )
    qr.add_data(target_url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return Response(content=buf.getvalue(), media_type="image/png")


# 6. API ดึงคำนวณ PM Schedule สรุป
@app.get("/api/v1/assets/{asset_tag}/pm-schedule")
def get_pm_schedule(asset_tag: str, db: Session = Depends(database.get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_tag == asset_tag).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    base_date = asset.last_pm_date if asset.last_pm_date else datetime.utcnow()
    next_pm = base_date + timedelta(days=asset.pm_interval_days)
    
    return {
        "asset_tag": asset.asset_tag,
        "name": asset.name,
        "last_pm_date": asset.last_pm_date.strftime("%Y-%m-%d") if asset.last_pm_date else "ยังไม่มีข้อมูล",
        "next_pm_date": next_pm.strftime("%Y-%m-%d"),
        "interval_days": asset.pm_interval_days
    }
