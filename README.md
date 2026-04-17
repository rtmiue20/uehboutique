
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

   **2. GenerateCustomers.py**
   [GenerateCustomers.py](https://github.com/user-attachments/files/26809214/GenerateCustomers.py)

   **3. BindCus.py**
   [BindCus.py](https://github.com/user-attachments/files/26809220/BindCus.py)
