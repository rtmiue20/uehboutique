import React, { useState, useEffect } from 'react';
import axios from 'axios';

function RoomStatus() {
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showCleanModal, setShowCleanModal] = useState(false);
    const [housekeepers, setHousekeepers] = useState([]);
    const [searchRoomNumber, setSearchRoomNumber] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Kéo danh sách Phòng từ DB
                const resRooms = await axios.get('http://localhost:8080/api/rooms');
                let roomsData = resRooms.data;

                // MAP NGAY LOẠI PHÒNG TỪ API ROOMS (Không cần chờ booking)
                roomsData = roomsData.map(room => ({
                    ...room,
                    typeName: room.roomType?.typeName || 'Chưa rõ'
                }));

                // 2. Kéo danh sách Đặt phòng để lấy Tên Khách & Ngày
                try {
                    const resBookings = await axios.get('http://localhost:8080/api/bookings');
                    const bookingsData = resBookings.data;

                    // Lắp ghép thông tin khách vào phòng Đang Ở
                    roomsData = roomsData.map(room => {
                        const activeBooking = bookingsData.find(b =>
                            b.room?.roomId === room.roomId &&
                            (b.status === 'Checked-in' || room.status === 'Currently')
                        );

                        if (activeBooking) {
                            return {
                                ...room,
                                currentGuest: activeBooking.guest?.guestName,
                                checkIn: activeBooking.checkInDate,
                                checkOut: activeBooking.checkOutDate
                            };
                        }
                        return room;
                    });
                } catch (error) {
                    console.warn("Lỗi khi ghép dữ liệu Đặt phòng:", error);
                }

                setRooms(roomsData);

                // 3. Kéo danh sách Nhân viên Lao công
                try {
                    const resStaff = await axios.get('http://localhost:8080/api/staff?role=Housekeeper');
                    setHousekeepers(resStaff.data);
                } catch (error) {
                    // TRẢ LẠI SỰ TRONG SẠCH CHO CÔ XUÂN PHẠM 😂 Lấy tên giả chuẩn làm lao công:
                    setHousekeepers([
                        { staff_id: 1, staff_name: 'Nguyễn Văn A (Lao công)', role: 'Housekeeper' },
                        { staff_id: 2, staff_name: 'Trần Thị B (Lao công)', role: 'Housekeeper' }
                    ]);
                }

            } catch (error) {
                console.error("Lỗi toàn tập API Phòng:", error);
            }
        };

        fetchAllData();
    }, []);

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        setShowInfoModal(true);
    };

    const handleCleanClick = (e, room) => {
        e.stopPropagation();
        setSelectedRoom(room);
        setShowCleanModal(true);
    };

    const confirmCleaning = () => {
        alert(`Đã điều phối nhân viên dọn dẹp cho phòng ${selectedRoom.roomNumber}!`);
        setShowCleanModal(false);
    };

    const filteredRooms = rooms.filter(room =>
        room.roomNumber.toLowerCase().includes(searchRoomNumber.toLowerCase())
    );

    // --- STYLE ---
    const titleContainerStyle = {
        backgroundColor: 'white', padding: '30px 40px', borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: '50px', textAlign: 'center'
    };
    const h1Style = {
        color: '#125c61', margin: '0 0 10px 0', fontSize: '32px', fontWeight: 'bold',
        textShadow: '1px 1px 2px rgba(0,0,0,0.08), 2px 2px 4px rgba(0,0,0,0.05)'
    };
    const h2Style = {
        color: '#7f8c8d', margin: '0', fontSize: '18px', textTransform: 'uppercase',
        letterSpacing: '2px', textShadow: '1px 1px 2px rgba(0,0,0,0.05)'
    };

    return (
        <div style={{ padding: '30px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f5f7f9', minHeight: '80vh' }}>

            <div style={titleContainerStyle}>
                <h1 style={h1Style}>🏨 HOTEL UEH BOUTIQUE</h1>
                <h2 style={h2Style}>HỆ THỐNG ĐIỀU PHỐI PHÒNG THÔNG MINH</h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '30px', position: 'relative' }}>
                {showSearchBox && (
                    <input
                        type="text"
                        placeholder="🔍 Nhập số phòng... (VD: 101)"
                        value={searchRoomNumber}
                        onChange={(e) => setSearchRoomNumber(e.target.value)}
                        style={{
                            padding: '12px 20px', borderRadius: '25px', border: '1px solid #125c61',
                            marginRight: '10px', outline: 'none', width: '280px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)', transition: 'all 0.3s'
                        }}
                    />
                )}
                <button
                    onClick={() => {
                        setShowSearchBox(!showSearchBox);
                        if(showSearchBox) setSearchRoomNumber("");
                    }}
                    style={{
                        backgroundColor: '#f39c12', color: 'white', border: 'none',
                        borderRadius: '50%', width: '50px', height: '50px',
                        cursor: 'pointer', fontSize: '22px', boxShadow: '0 5px 10px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    🔍
                </button>
            </div>

            {/* DANH SÁCH PHÒNG */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
                {filteredRooms.length > 0 ? filteredRooms.map((room, index) => {
                    let bgColor = room.status === 'Empty' ? '#2ecc71' : room.status === 'Dirty' ? '#f1c40f' : '#e74c3c';

                    return (
                        <div
                            key={room.roomId || index}
                            onClick={() => handleRoomClick(room)}
                            style={{
                                backgroundColor: bgColor, color: 'white', width: '160px', height: '130px',
                                borderRadius: '12px', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: '0 5px 10px rgba(0,0,0,0.1)', transition: 'all 0.2s', position: 'relative'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <h3 style={{ margin: '5px 0', fontSize: '20px' }}>{room.roomNumber}</h3>

                            {/* ĐÃ HIỂN THỊ SẴN LOẠI PHÒNG NGAY TRÊN THẺ CHO BÁC */}
                            <p style={{ margin: '0 0 5px 0', fontSize: '13px', opacity: 0.9 }}>
                                {room.typeName}
                            </p>

                            <span style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                {room.status}
              </span>

                            {room.status === 'Dirty' && (
                                <button
                                    onClick={(e) => handleCleanClick(e, room)}
                                    style={{
                                        marginTop: '8px', padding: '5px 10px', backgroundColor: 'white',
                                        color: '#f1c40f', border: 'none', borderRadius: '5px',
                                        cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                    Gọi Dọn Dẹp
                                </button>
                            )}
                        </div>
                    );
                }) : (
                    <div style={{ textAlign: 'center', width: '100%', color: '#7f8c8d', marginTop: '30px' }}>
                        <h2>🛑 Không tìm thấy phòng {searchRoomNumber}!</h2>
                    </div>
                )}
            </div>

            {/* POPUP INFO */}
            {showInfoModal && selectedRoom && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ marginTop: 0, color: '#125c61', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Phòng {selectedRoom.roomNumber}</h2>
                        <div style={{ textAlign: 'left', lineHeight: '1.9', fontSize: '14px' }}>
                            <p><b>Loại phòng:</b> {selectedRoom.typeName}</p>
                            <p><b>Trạng thái:</b> {selectedRoom.status}</p>
                            {selectedRoom.currentGuest ? (
                                <>
                                    <p><b>Khách hàng:</b> {selectedRoom.currentGuest}</p>
                                    <p><b>Check-in:</b> {selectedRoom.checkIn || 'N/A'}</p>
                                    <p><b>Check-out:</b> {selectedRoom.checkOut || 'N/A'}</p>
                                </>
                            ) : selectedRoom.status === 'Dirty' ? (
                                <p style={{ color: '#f1c40f', fontWeight: 'bold' }}>Phòng đang dơ, chờ dọn dẹp!</p>
                            ) : (
                                <p style={{ color: '#2ecc71', fontWeight: 'bold' }}>Phòng đang trống, sẵn sàng đón khách!</p>
                            )}
                        </div>
                        <button onClick={() => setShowInfoModal(false)} style={closeBtnStyle}>Đóng</button>
                    </div>
                </div>
            )}

            {/* POPUP HOUSEKEEPER */}
            {showCleanModal && selectedRoom && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h2 style={{ marginTop: 0, color: '#f39c12', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🧹 Điều phối lao công</h2>
                        <p style={{ fontSize: '14px' }}>Chọn nhân viên dọn dẹp cho <b>Phòng {selectedRoom.roomNumber}</b>:</p>
                        <select style={{ width: '100%', padding: '12px', margin: '15px 0', borderRadius: '5px', border: '1px solid #ccc' }}>
                            {housekeepers.map(staff => (
                                <option key={staff.staff_id} value={staff.staff_id}>
                                    {staff.staff_name}
                                </option>
                            ))}
                        </select>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                            <button onClick={() => setShowCleanModal(false)} style={{...closeBtnStyle, backgroundColor: '#95a5a6', marginTop: 0}}>Hủy</button>
                            <button onClick={confirmCleaning} style={{...closeBtnStyle, backgroundColor: '#f39c12', marginTop: 0}}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const closeBtnStyle = { marginTop: '25px', padding: '12px 20px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', fontSize: '14px' };

export default RoomStatus;