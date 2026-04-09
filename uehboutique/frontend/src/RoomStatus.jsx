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
    const [toastMessage, setToastMessage] = useState("");

    // --- STATE MỚI CHO BỘ LỌC VÀ PHÂN TRANG ---
    const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Empty', 'Currently', 'Dirty'
    const [currentPage, setCurrentPage] = useState(1);
    const roomsPerPage = 30; // Chia 30 phòng mỗi trang

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const resRooms = await axios.get('http://localhost:8080/api/rooms');
                let roomsData = resRooms.data;

                roomsData = roomsData.map(room => ({
                    ...room,
                    typeName: room.roomType?.typeName || 'Chưa rõ'
                }));

                try {
                    const resBookings = await axios.get('http://localhost:8080/api/bookings');
                    const bookingsData = resBookings.data;

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

                try {
                    const resStaff = await axios.get('http://localhost:8080/api/staff?role=Housekeeper');
                    setHousekeepers(resStaff.data);
                } catch (error) {
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
        const updatedRooms = rooms.map(room => {
            if (room.roomId === selectedRoom.roomId) {
                return { ...room, status: 'Empty' };
            }
            return room;
        });

        setRooms(updatedRooms);
        setToastMessage(`Đã điều phối nhân viên dọn dẹp cho phòng ${selectedRoom.roomNumber}!`);
        setShowCleanModal(false);

        setTimeout(() => {
            setToastMessage("");
        }, 3000);
    };

    // --- LOGIC LỌC TÌM KIẾM & TRẠNG THÁI ---
    const filteredRooms = rooms.filter(room => {
        const matchSearch = room.roomNumber.toLowerCase().includes(searchRoomNumber.toLowerCase());
        const matchStatus = filterStatus === 'All' ? true : room.status === filterStatus;
        return matchSearch && matchStatus;
    });

    // --- LOGIC PHÂN TRANG ---
    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
    const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

    // Reset về trang 1 khi đổi bộ lọc hoặc tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [searchRoomNumber, filterStatus]);

    // --- TẠO MẢNG TAB ĐỂ RENDER ---
    const filterTabs = [
        { id: 'All', label: 'Tất cả' },
        { id: 'Empty', label: 'Trống' },
        { id: 'Currently', label: 'Đang ở' },
        { id: 'Dirty', label: 'Cần dọn' }
    ];

    return (
        <div style={{ padding: '30px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f5f7f9', minHeight: '100vh', position: 'relative' }}>

            {/* BANNER CHUẨN ĐỒNG BỘ */}
            <div style={bannerStyle}>
                <h1 style={{ color: '#125c61', margin: 0, fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    🏨 ĐIỀU PHỐI PHÒNG
                </h1>
                <p style={{ color: '#7f8c8d', fontSize: '15px', marginTop: '8px', marginBottom: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    HOTEL UEH BOUTIQUE - HỆ THỐNG ĐIỀU PHỐI THÔNG MINH
                </p>
            </div>

            <div style={cardStyle}>
                {/* THANH CÔNG CỤ: TABS BỘ LỌC VÀ TÌM KIẾM */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>

                    {/* TABS LỌC TRẠNG THÁI */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {filterTabs.map(tab => {
                            const isActive = filterStatus === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: isActive ? '#125c61' : '#f0f2f5',
                                        color: isActive ? 'white' : '#555',
                                        border: 'none',
                                        borderRadius: '25px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s',
                                        boxShadow: isActive ? '0 4px 10px rgba(18, 92, 97, 0.2)' : 'none'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Ô TÌM KIẾM */}
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                        {showSearchBox && (
                            <input
                                type="text"
                                placeholder="🔍 Nhập số phòng... (VD: 101)"
                                value={searchRoomNumber}
                                onChange={(e) => setSearchRoomNumber(e.target.value)}
                                style={{
                                    padding: '12px 20px', borderRadius: '25px', border: '1px solid #125c61',
                                    marginRight: '10px', outline: 'none', width: '250px',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)', transition: 'all 0.3s'
                                }}
                            />
                        )}
                        <button
                            onClick={() => {
                                setShowSearchBox(!showSearchBox);
                                if (showSearchBox) setSearchRoomNumber("");
                            }}
                            style={{
                                backgroundColor: '#f39c12', color: 'white', border: 'none',
                                borderRadius: '50%', width: '45px', height: '45px',
                                cursor: 'pointer', fontSize: '20px', boxShadow: '0 5px 10px rgba(0,0,0,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            🔍
                        </button>
                    </div>
                </div>

                {/* DANH SÁCH PHÒNG (ĐÃ PHÂN TRANG) */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', minHeight: '300px', alignContent: 'flex-start' }}>
                    {currentRooms.length > 0 ? currentRooms.map((room, index) => {
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
                        <div style={{ textAlign: 'center', width: '100%', color: '#7f8c8d', marginTop: '50px' }}>
                            <h2>🛑 Không tìm thấy phòng nào phù hợp!</h2>
                        </div>
                    )}
                </div>

                {/* THANH PHÂN TRANG (PAGINATION) */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', gap: '8px' }}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                style={{
                                    padding: '8px 16px',
                                    border: `1px solid ${currentPage === page ? '#125c61' : '#ccc'}`,
                                    backgroundColor: currentPage === page ? '#125c61' : 'white',
                                    color: currentPage === page ? 'white' : '#333',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {page}
                            </button>
                        ))}
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
                            <button onClick={() => setShowCleanModal(false)} style={{ ...closeBtnStyle, backgroundColor: '#95a5a6', marginTop: 0 }}>Hủy</button>
                            <button onClick={confirmCleaning} style={{ ...closeBtnStyle, backgroundColor: '#f39c12', marginTop: 0 }}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM TOAST MESSAGE */}
            {toastMessage && (
                <div style={toastNotificationStyle}>
                    <span style={{ fontSize: '20px' }}>✅</span>
                    <span>{toastMessage}</span>
                </div>
            )}

        </div>
    );
}

// --- CÁC BIẾN STYLE DÙNG CHUNG ---
const bannerStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', textAlign: 'center' };
const cardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const closeBtnStyle = { marginTop: '25px', padding: '12px 20px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold', fontSize: '14px' };

const toastNotificationStyle = {
    position: 'fixed',
    top: '30px',
    right: '30px',
    backgroundColor: '#fff',
    borderLeft: '5px solid #2ecc71',
    color: '#333',
    padding: '16px 24px',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    fontWeight: '500',
    transition: 'all 0.3s ease-in-out',
    animation: 'slideInRight 0.4s ease-out forwards'
};

export default RoomStatus;