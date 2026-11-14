FROM python:3.11-slim

WORKDIR /app

# สร้างโฟลเดอร์สำหรับ Mount Persistent Volume ของ SQLite
RUN mkdir -p /data

# คัดลอกและติดตั้ง Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดระบบ Backend ทั้งหมด
COPY . .

# สั่งรัน FastAPI ด้วย Uvicorn บนพอร์ต 8080 สำหรับ Cloud Container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
