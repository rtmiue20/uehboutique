
# Hệ thống quản lý khách sạn UEH Boutique

Đây là đồ án môn học Công nghệ phần mềm. Dự án quản lý khách sạn bao gồm Front-end (ReactJS) và Back-end (Spring Boot).

## Công nghệ sử dụng
* **Back-end:** Java, Spring Boot, Spring Data JPA
* **Cơ sở dữ liệu:** MariaDB
* **Front-end:** ReactJS, Vite, Axios
* **Dữ liệu mẫu:** Python Scripts (Tự động gọi API để sinh dữ liệu)

## Hướng dẫn cài đặt và chạy dự án

### 1. Chạy Back-end (Spring Boot)
* Mở thư mục `backend` bằng IntelliJ IDEA.
* Cấu hình database MariaDB trong file `application.properties`:
  * `server.port=8080`
  * `spring.datasource.url=jdbc:mariadb://localhost:3306/ueh_boutique_db`
  * `spring.datasource.username=root`
  * `spring.datasource.password=049206`
  * `spring.datasource.driver-class-name=org.mariadb.jdbc.Driver`
  * `spring.jpa.hibernate.ddl-auto=update`
  * `spring.jpa.show-sql=true`
  * `spring.jpa.properties.hibernate.format_sql=true`
  * `spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MariaDBDialect`
* Chạy file `HotelManagementApplication.java`. Server sẽ khởi chạy tại `http://localhost:8080`.

### 2. Chạy Front-end (React)
* Mở Terminal, di chuyển vào thư mục `frontend`.
* Chạy lệnh cài đặt thư viện: `npm install`
* Chạy ứng dụng: `npm run dev`
* Truy cập ứng dụng tại `http://localhost:5173` (hoặc port Vite cung cấp).

### 3. Tạo dữ liệu mẫu (Mock Data)
* Chạy file `GenerateHotelData.py`, `GenerateCustomers.py`, `BindCus.py` bằng Python để tự động bơm dữ liệu khách hàng, phòng và hóa đơn vào database thông qua API.

**1. GenerateHotelData.py**
[GenerateHotelData.py](https://github.com/user-attachments/files/26809122/GenerateHotelData.py)
import mysql.connector
import random
from datetime import date, timedelta

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "049206",
    "database": "ueh_boutique_db"
}

# Đổi toàn bộ key thành room_type_id
ROOM_TEMPLATES = [
    {"room_type_id": 1, "capacity": 2},
    {"room_type_id": 2, "capacity": 2},
    {"room_type_id": 3, "capacity": 4},
    {"room_type_id": 4, "capacity": 5}
]


def get_capacity_by_type(type_id):
    for template in ROOM_TEMPLATES:
        if template["room_type_id"] == type_id:
            return template["capacity"]
    return 2


def main():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        print("Đang kết nối Database và dọn dẹp dữ liệu cũ...")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        cursor.execute("TRUNCATE TABLE booking;")
        cursor.execute("TRUNCATE TABLE room;")
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

        # ==========================================
        # BƯỚC 1: TẠO 268 PHÒNG
        # ==========================================
        print(" Đang tạo 268 phòng khách sạn...")
        rooms_to_insert = []
        room_number_counter = 101
        floor = 1

        for i in range(268):
            template = random.choice(ROOM_TEMPLATES)

            rooms_to_insert.append((
                str(room_number_counter),
                "Empty",
                template["room_type_id"]  # Cực kỳ quan trọng: truyền giá trị từ key room_type_id
            ))

            room_number_counter += 1
            if room_number_counter % 100 > 30:
                floor += 1
                room_number_counter = floor * 100 + 1

        # Cực kỳ quan trọng: Tên cột phải là room_type_id
        sql_insert_room = """
                          INSERT INTO room (room_number, status, room_type_id)
                          VALUES (%s, %s, %s) \
                          """
        cursor.executemany(sql_insert_room, rooms_to_insert)
        conn.commit()

        # ==========================================
        # BƯỚC 2: BỐC 200 KHÁCH & CHIA NHÓM
        # ==========================================
        print("Đang bốc ngẫu nhiên 200 khách từ bảng Guest...")
        # Lấy theo guest_id
        cursor.execute("SELECT guest_id FROM guest ORDER BY RAND() LIMIT 200;")
        guests = [row["guest_id"] for row in cursor.fetchall()]

        if len(guests) < 200:
            print("Cảnh báo: Bảng Guest của bạn không có đủ 200 người!")
            return

        groups = []
        while guests:
            group_size = random.randint(1, min(5, len(guests)))
            groups.append(guests[:group_size])
            guests = guests[group_size:]

        # ==========================================
        # BƯỚC 3: XẾP PHÒNG VÀ TẠO BOOKING
        # ==========================================
        # Select ra phải là room_id và room_type_id
        cursor.execute("SELECT room_id, room_type_id FROM room WHERE status = 'Empty'")
        available_rooms = cursor.fetchall()

        bookings_to_insert = []
        rooms_to_update = []
        staff_id = 1

        for group in groups:
            group_size = len(group)
            main_guest_id = group[0]

            suitable_room = None
            for room in available_rooms:
                room_capacity = get_capacity_by_type(room["room_type_id"])
                if room_capacity >= group_size:
                    suitable_room = room
                    available_rooms.remove(room)
                    break

            if suitable_room:
                room_id = suitable_room["room_id"]
                rooms_to_update.append((room_id,))

                check_in_date = date.today()
                check_out_date = check_in_date + timedelta(days=random.randint(1, 5))

                bookings_to_insert.append((
                    main_guest_id, room_id, staff_id, check_in_date, check_out_date, "Check-in"
                ))

        # Update theo room_id
        sql_update_room = "UPDATE room SET status = 'Currently' WHERE room_id = %s"
        cursor.executemany(sql_update_room, rooms_to_update)

        # Insert booking phải xài snake_case hết
        sql_insert_booking = """
                             INSERT INTO booking (guest_id, room_id, staff_id, check_in_date, check_out_date, status)
                             VALUES (%s, %s, %s, %s, %s, %s) \
                             """
        cursor.executemany(sql_insert_booking, bookings_to_insert)
        conn.commit()

        print("HOÀN TẤT! Đã bơm dữ liệu chuẩn chỉnh vào Database.")
        print(f"Số phòng đang được sử dụng: {len(rooms_to_update)} phòng.")
        print(f"Số phòng còn trống: {268 - len(rooms_to_update)} phòng.")

    except mysql.connector.Error as err:
        print(f"Lỗi MySQL: {err}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()


if __name__ == "__main__":
    main()

**2. GenerateCustomers.py**
[GenerateCustomers.py](https://github.com/user-attachments/files/26809214/GenerateCustomers.py)
import pandas as pd
from faker import Faker
import random

# Sử dụng locale tiếng Việt để tạo tên, địa chỉ chuẩn Việt Nam
fake = Faker('vi_VN')

# Số lượng khách hàng cần tạo
NUM_CUSTOMERS = 10000

print(f"Đang tạo {NUM_CUSTOMERS} khách hàng. Vui lòng đợi vài giây...")

customers = []
for i in range(1, NUM_CUSTOMERS + 1):
    gender = random.choice(['Nam', 'Nữ'])

    # Tạo tên theo giới tính cho logic
    if gender == 'Nam':
        name = fake.name_male()
    else:
        name = fake.name_female()

    customer = {
        "Mã KH": f"KH{i:05d}",
        "Họ và tên": name,
        "Giới tính": gender,
        "Ngày sinh": fake.date_of_birth(minimum_age=18, maximum_age=65).strftime('%d/%m/%Y'),
        "Số điện thoại": fake.phone_number(),
        "Email": fake.ascii_email(),
        "Địa chỉ": fake.address(),
        "Nghề nghiệp": fake.job()
    }
    customers.append(customer)

# Chuyển dữ liệu sang dạng bảng của Pandas
df = pd.DataFrame(customers)

# Xuất ra file CSV
csv_filename = "10000_khach_hang.csv"
df.to_csv(csv_filename, index=False, encoding='utf-8-sig')

# Xuất ra file Excel (Mở khoá dòng dưới nếu bạn muốn file .xlsx)
# excel_filename = "10000_khach_hang.xlsx"
# df.to_excel(excel_filename, index=False)

print(f"Xong! Đã lưu dữ liệu vào file: {csv_filename}")

**3. BindCus.py**
[BindCus.py](https://github.com/user-attachments/files/26809220/BindCus.py)
import pandas as pd
from faker import Faker
from sqlalchemy import create_engine
import random

fake = Faker('vi_VN')
NUM_CUSTOMERS = 10000
guests = []

print("Đang tạo 10.000 khách hàng chuẩn xịn cho bảng guest...")

for i in range(1, NUM_CUSTOMERS + 1):
    guest = {
        "id_card": str(fake.random_number(digits=12, fix_len=True)), # CCCD 12 số
        "guest_name": fake.name(),
        "phone": fake.phone_number()[:15], # Lấy tối đa 15 ký tự cho khỏi lỗi
        "preferences": random.choice(["Thích phòng view biển", "Phòng yên tĩnh", "Gần thang máy", "Không có yêu cầu", "Giường đôi lớn", "Thích phòng tầng cao"])
    }
    guests.append(guest)

df = pd.DataFrame(guests)

# TẠI ĐÂY: Nhớ thay "pass_cua_ban" bằng mật khẩu root MariaDB của bạn nhé (nếu không có pass thì để trống: root:@localhost...)
db_url = "mysql+pymysql://root:049206@localhost:3306/ueh_boutique_db"
engine = create_engine(db_url)

# Dùng if_exists='append' để THÊM data mới vào, không làm mất anh "Nguyễn Văn Khách" của bạn
df.to_sql(name='guest', con=engine, if_exists='append', index=False)

print("Đã bơm xong 10.000 người vào bảng guest! Quay lại MariaDB check thôi ")
