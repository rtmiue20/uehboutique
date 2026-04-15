import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function BookingInfo() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 8;
    const [searchPhone, setSearchPhone] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);

    // STATE CHO HỆ THỐNG TOAST
    const [toasts, setToasts] = useState([]);

    // State cho Bill Modal
    const [showBill, setShowBill] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [allRooms, setAllRooms] = useState([]);
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [guestForm, setGuestForm] = useState({
        guestId: '', guestName: '', idCard: '', phone: '',
        checkInDate: '', checkOutDate: '', roomType: 'Single Standard', roomId: ''
    });

    const todayStr = new Date().toISOString().split("T")[0];

    useEffect(() => {
        fetchBookings();
        fetchRooms();
    }, []);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return "0 ₫";
        return amount.toLocaleString('vi-VN') + " ₫";
    };

    const fetchBookings = () => {
        axios.get('http://localhost:8080/api/bookings')
            .then(response => {
                const data = response.data.content || response.data;
                setBookings(Array.isArray(data) ? data : []);
            })
            .catch(error => {
                console.error("Lỗi khi tải dữ liệu Booking:", error);
                setBookings([]);
            });
    };

    const fetchRooms = () => {
        axios.get('http://localhost:8080/api/rooms')
            .then(response => {
                const data = response.data.content || response.data;
                setAllRooms(Array.isArray(data) ? data : []);
            })
            .catch(error => console.error("Lỗi khi tải danh sách Phòng:", error));
    };

    // ==========================================
    // CẬP NHẬT LOGIC TOAST
    // ==========================================
    const triggerStackedToast = (type, title, description) => {
        const id = Date.now();
        const newToast = { id, type, title, description };
        setToasts(prev => [newToast, ...prev]);
        setTimeout(() => removeToast(id), 5000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const openAddModal = () => {
        setIsEditing(false);
        setGuestForm({ guestId: '', guestName: '', idCard: '', phone: '', checkInDate: '', checkOutDate: '', roomType: 'Single Standard', roomId: '' });
        setShowGuestModal(true);
    };

    const openEditModal = (guest) => {
        setIsEditing(true);
        setGuestForm({
            guestId: guest.guestId,
            guestName: guest.guestName,
            idCard: guest.idCard || '',
            phone: guest.phone,
            checkInDate: guest.checkInDate || '',
            checkOutDate: guest.checkOutDate || '',
            roomType: guest.roomType || 'Single Standard',
            roomId: ''
        });
        setShowGuestModal(true);
    };

    const availableRooms = allRooms.filter(room =>
        room.roomType?.typeName === guestForm.roomType &&
        room.status?.trim() === 'Empty'
    );

    const handleSaveGuest = async (e) => {
        e.preventDefault();
        try {
            const guestPayload = {
                guestName: guestForm.guestName,
                idCard: guestForm.idCard,
                phone: guestForm.phone
            };

            if (isEditing) {
                await axios.put(`http://localhost:8080/api/guests/${guestForm.guestId}`, guestPayload);
                triggerStackedToast('success', 'Thành Công', `Đã cập nhật thông tin khách hàng.`);
            } else {
                const { roomId, checkInDate, checkOutDate } = guestForm;
                if (!roomId) {
                    triggerStackedToast('error', 'Lỗi', 'Vui lòng chọn phòng trống!');
                    return;
                }
                const guestRes = await axios.post(`http://localhost:8080/api/guests`, guestPayload);
                const createdGuestId = guestRes.data?.guestId || guestRes.data;

                if (checkInDate === todayStr) {
                    const checkInPayload = { guestId: createdGuestId, roomId: parseInt(roomId), staffId: 1, checkOutDate: checkOutDate };
                    await axios.post(`http://localhost:8080/api/bookings/checkin`, checkInPayload);
                    triggerStackedToast('success', 'Nhận Phòng', `Check-in thành công phòng ${availableRooms.find(r => r.roomId === parseInt(roomId))?.roomNumber}`);
                } else {
                    await axios.post(`http://localhost:8080/api/bookings/reserve?guestId=${createdGuestId}&roomId=${roomId}&staffId=1&checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`);
                    triggerStackedToast('success', 'Đặt Trước', `Đã giữ chỗ cho khách hàng.`);
                }
            }
            setShowGuestModal(false);
            fetchBookings();
            fetchRooms();
        } catch (err) {
            triggerStackedToast('error', 'Thất Bại', err.response?.data?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.');
        }
    };

    const handleInvoiceClick = async (booking) => {
        try {
            const res = await axios.get(`http://localhost:8080/api/invoices/preview/${booking.bookingId}`);
            const data = res.data;
            setInvoiceData({
                bookingId: booking.bookingId,
                guestName: booking.guest?.guestName || "Khách lẻ",
                roomNumber: booking.room?.roomNumber || "---",
                paymentDate: new Date().toLocaleString('vi-VN'),
                nights: data.daysStayed || 1,
                roomTotal: data.roomTotal || 0,
                serviceTotal: data.serviceTotal || 0,
                grandTotal: data.grandTotal || 0,
                isPaid: booking.status === 'Check-out' || booking.status === 'Checked-out'
            });
            setPaymentMethod('Cash');
            setShowBill(true);
        } catch (err) {
            triggerStackedToast('error', 'Lỗi', "Không thể tải hóa đơn.");
        }
    };

    const handleCompletePayment = async () => {
        if (invoiceData.isPaid) {
            setShowBill(false);
            navigate('/invoices');
            return;
        }
        try {
            await axios.post(`http://localhost:8080/api/invoices/checkout/${invoiceData.bookingId}?paymentMethod=${paymentMethod}`);
            setInvoiceData(prev => ({ ...prev, isPaid: true }));
            triggerStackedToast('success', 'Hoàn Tất', 'Thanh toán thành công!');
            fetchBookings();
            setTimeout(() => { setShowBill(false); navigate('/invoices'); }, 1200);
        } catch (err) {
            triggerStackedToast('error', 'Lỗi', "Giao dịch không thành công.");
        }
    };

    const filteredBookings = bookings.filter((booking) => {
        if (!searchPhone) return true;
        const phone = booking.guest?.phone || "";
        return String(phone).includes(searchPhone);
    });

    const sortedBookings = [...filteredBookings].sort((a, b) => {
        const roomA = a.room?.roomNumber ? String(a.room.roomNumber) : "";
        const roomB = b.room?.roomNumber ? String(b.room.roomNumber) : "";
        return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: 'base' });
    });

    const indexOfLastBooking = currentPage * bookingsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
    const currentBookings = sortedBookings.slice(indexOfFirstBooking, indexOfLastBooking);
    const totalPages = Math.ceil(sortedBookings.length / bookingsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const thStyle = { padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' };
    const tdStyle = { padding: '15px 10px', textAlign: 'center', borderBottom: '1px solid #eee', fontSize: '13px' };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', Tahoma, sans-serif", position: 'relative', minHeight: '95vh' }}>

            {/* ==========================================
                JSX TOAST NÂNG CẤP (THEO HÌNH MẪU)
            ========================================== */}
            {toasts.length > 0 && (
                <div style={toastContainerStyle}>
                    {toasts.map(t => (
                        <div key={t.id} style={toastItemStyle}>
                            <div style={{
                                ...toastIconContainerStyle,
                                backgroundColor: t.type === 'success' ? '#2ecc71' : '#e74c3c'
                            }}>
                                {t.type === 'success' ? '✔' : '✖'}
                            </div>
                            <div style={toastContentStyle}>
                                <div style={toastTitleStyle}>{t.title}</div>
                                <div style={toastDescriptionStyle}>{t.description}</div>
                            </div>
                            <button onClick={() => removeToast(t.id)} style={toastCloseBtnStyle}>✕</button>

                            {/* Thanh Progress chạy ngầm bên dưới */}
                            <div style={{
                                ...toastProgressStyle,
                                backgroundColor: t.type === 'success' ? '#2ecc71' : '#e74c3c',
                            }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Phần Search và Table giữ nguyên */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                {showSearchBox && (
                    <input
                        type="text" placeholder="🔍 Tìm SĐT..." value={searchPhone}
                        onChange={(e) => { setSearchPhone(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #125c61', marginRight: '10px', outline: 'none' }}
                    />
                )}
                <button onClick={() => setShowSearchBox(!showSearchBox)} style={btnSearchStyle}>🔍</button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#83b5b7', color: '#1a4e52' }}>
                    <tr>
                        <th style={thStyle}>MÃ KHÁCH HÀNG</th>
                        <th style={{ ...thStyle, textAlign: 'left' }}>TÊN KHÁCH HÀNG</th>
                        <th style={thStyle}>SỐ ĐIỆN THOẠI</th>
                        <th style={thStyle}>CHECK IN</th>
                        <th style={thStyle}>CHECK OUT</th>
                        <th style={thStyle}>PHÒNG</th>
                        <th style={thStyle}>THANH TOÁN</th>
                        <th style={thStyle}>XUẤT BILL</th>
                        <th style={thStyle}>SỬA</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentBookings.map((booking, index) => {
                        const isPaid = booking.status === 'Check-out' || booking.status === 'Checked-out';
                        return (
                            <tr key={booking.bookingId || index}>
                                <td style={{ ...tdStyle, fontWeight: 'bold' }}>{booking.guest?.guestId}</td>
                                <td style={{ ...tdStyle, textAlign: 'left' }}>{booking.guest?.guestName}</td>
                                <td style={tdStyle}>{booking.guest?.phone}</td>
                                <td style={tdStyle}>{booking.checkInDate}</td>
                                <td style={tdStyle}>{booking.checkOutDate || '---'}</td>
                                <td style={{ ...tdStyle, color: '#f39c12', fontWeight: 'bold' }}>{booking.room?.roomNumber}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        color: isPaid ? '#2ecc71' : '#e74c3c', fontWeight: 'bold',
                                        padding: '4px 10px', borderRadius: '20px',
                                        backgroundColor: isPaid ? '#eafaf1' : '#fceae8', fontSize: '12px'
                                    }}>
                                        {isPaid ? 'Đã hoàn thành' : 'Chưa thanh toán'}
                                    </span>
                                </td>
                                <td style={tdStyle}><button onClick={() => handleInvoiceClick(booking)} style={btnInvoiceStyle}>Invoice</button></td>
                                <td style={tdStyle}><span onClick={() => openEditModal(booking.guest)} style={{ cursor: 'pointer', fontSize: '18px' }}>✏️</span></td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Pagination & Modals giữ nguyên */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                    {[...Array(totalPages)].map((_, i) => (
                        <button key={i + 1} onClick={() => paginate(i + 1)} style={{ ...btnPageStyle, backgroundColor: currentPage === i + 1 ? '#125c61' : 'transparent', color: currentPage === i + 1 ? 'white' : '#125c61', border: '1px solid #125c61', borderRadius: '4px' }} >{i + 1}</button>
                    ))}
                </div>
            )}

            <button onClick={openAddModal} style={fabStyle} title="Thêm khách & Đặt phòng mới">+</button>

            {showGuestModal && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ color: '#125c61', marginTop: 0 }}>{isEditing ? '📝 Sửa Khách Hàng' : '🛎️ Đặt Phòng Mới'}</h3>
                        <form onSubmit={handleSaveGuest}>
                            <div style={{ marginBottom: '10px' }}><label style={labelStyle}>Họ và Tên (*):</label><input type="text" required style={inputStyle} value={guestForm.guestName} onChange={e => setGuestForm({ ...guestForm, guestName: e.target.value })} /></div>
                            <div style={{ marginBottom: '10px' }}><label style={labelStyle}>CCCD/Passport (*):</label><input type="text" required style={inputStyle} value={guestForm.idCard} onChange={e => setGuestForm({ ...guestForm, idCard: e.target.value })} /></div>
                            <div style={{ marginBottom: '10px' }}><label style={labelStyle}>Số điện thoại:</label><input type="text" required style={inputStyle} value={guestForm.phone} onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} /></div>
                            <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}><label style={labelStyle}>Check-in:</label><input type="date" required style={inputStyle} min={todayStr} value={guestForm.checkInDate || ''} onChange={e => setGuestForm({ ...guestForm, checkInDate: e.target.value })} /></div>
                                <div style={{ flex: 1 }}><label style={labelStyle}>Check-out:</label><input type="date" required style={inputStyle} min={guestForm.checkInDate || todayStr} value={guestForm.checkOutDate || ''} onChange={e => setGuestForm({ ...guestForm, checkOutDate: e.target.value })} /></div>
                            </div>
                            {!isEditing && (
                                <>
                                    <div style={{ marginBottom: '10px' }}><label style={labelStyle}>Loại phòng:</label>
                                        <select required style={inputStyle} value={guestForm.roomType} onChange={e => setGuestForm({ ...guestForm, roomType: e.target.value, roomId: '' })}>
                                            <option value="Single Standard">Single Standard</option>
                                            <option value="Single Deluxe">Single Deluxe</option>
                                            <option value="Family Standard">Family Standard</option>
                                            <option value="Family Deluxe">Family Deluxe</option>
                                        </select>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}><label style={labelStyle}>Phòng trống:</label>
                                        <select required style={inputStyle} value={guestForm.roomId || ''} onChange={e => setGuestForm({ ...guestForm, roomId: e.target.value })}>
                                            <option value="">-- Chọn phòng --</option>
                                            {availableRooms.map(room => <option key={room.roomId} value={room.roomId}>Phòng {room.roomNumber}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" style={{ ...btnModalStyle, backgroundColor: '#125c61' }}>{isEditing ? 'Lưu Lại' : (guestForm.checkInDate === todayStr ? 'Nhận Phòng Ngay' : 'Đặt Phòng Trước')}</button>
                                <button type="button" onClick={() => setShowGuestModal(false)} style={{ ...btnModalStyle, backgroundColor: '#95a5a6' }}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBill && invoiceData && (
                <div style={overlayStyle}>
                    <div style={billModalStyle}>
                        <button onClick={() => setShowBill(false)} style={closeBtnStyle}>✕</button>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#125c61', margin: 0 }}>UEH BOUTIQUE HOTEL</h2>
                            <div style={{ borderBottom: '2px solid #333', margin: '10px 0' }}></div>
                            <h3 style={{ letterSpacing: '2px' }}>HÓA ĐƠN THANH TOÁN</h3>
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                            <p><b>Khách:</b> {invoiceData.guestName}</p>
                            <p><b>Phòng:</b> {invoiceData.roomNumber}</p>
                            <p><b>Ngày:</b> {invoiceData.paymentDate}</p>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead><tr style={{ borderBottom: '2px solid #333' }}><th style={{ textAlign: 'left', padding: '10px 0' }}>Diễn giải</th><th style={{ textAlign: 'right', padding: '10px 0' }}>Thành tiền</th></tr></thead>
                            <tbody>
                            <tr><td style={{ padding: '10px 0', borderBottom: '1px dashed #ccc' }}>Tiền phòng ({invoiceData.nights} đêm)</td><td style={{ textAlign: 'right', borderBottom: '1px dashed #ccc' }}>{formatCurrency(invoiceData.roomTotal)}</td></tr>
                            <tr><td style={{ padding: '10px 0' }}>Tiền dịch vụ</td><td style={{ textAlign: 'right' }}>{formatCurrency(invoiceData.serviceTotal)}</td></tr>
                            </tbody>
                        </table>
                        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                            <b>Hình thức:</b>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} disabled={invoiceData.isPaid} style={{ padding: '6px', borderRadius: '4px' }}>
                                <option value="Cash">Tiền mặt</option><option value="Card">Thẻ/Chuyển khoản</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '15px', borderTop: '2px solid #333', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TỔNG CỘNG:</span>
                            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#e74c3c' }}>{formatCurrency(invoiceData.grandTotal)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            <button onClick={handleCompletePayment} style={{ ...btnActionStyle, backgroundColor: invoiceData.isPaid ? '#3498db' : '#2ecc71', color: 'white' }}>{invoiceData.isPaid ? "Xem Hóa Đơn" : "Hoàn thành thanh toán"}</button>
                            <button onClick={() => window.print()} style={{ ...btnActionStyle, backgroundColor: '#34495e', color: 'white' }} >In Bill</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tích hợp CSS Animation cho Toast */}
            <style>
                {`
                    @keyframes toastProgress {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}
            </style>
        </div>
    );
}

// --- CẬP NHẬT STYLES CHO TOAST (THEO HÌNH MẪU) ---
const toastContainerStyle = {
    position: 'fixed', top: '20px', right: '20px',
    display: 'flex', flexDirection: 'column', gap: '12px',
    zIndex: 9999, width: '320px'
};

const toastItemStyle = {
    display: 'flex', alignItems: 'center',
    backgroundColor: '#fff', padding: '12px 16px',
    borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    position: 'relative', overflow: 'hidden',
    borderLeft: 'none' // Bỏ viền cũ, dùng icon và thanh progress
};

const toastIconContainerStyle = {
    width: '28px', height: '28px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '14px', marginRight: '15px', flexShrink: 0
};

const toastContentStyle = { flex: 1 };
const toastTitleStyle = { fontWeight: 'bold', fontSize: '14px', color: '#333' };
const toastDescriptionStyle = { fontSize: '12px', color: '#666', marginTop: '2px' };

const toastCloseBtnStyle = {
    background: 'none', border: 'none', fontSize: '14px',
    color: '#ccc', cursor: 'pointer', marginLeft: '10px'
};

const toastProgressStyle = {
    position: 'absolute', bottom: 0, left: 0,
    height: '3px', width: '100%',
    animation: 'toastProgress 5s linear forwards'
};

// --- STYLES CÒN LẠI GIỮ NGUYÊN ---
const btnSearchStyle = { backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px' };
const btnInvoiceStyle = { padding: '6px 12px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnPageStyle = { border: 'none', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const billModalStyle = { position: 'relative', backgroundColor: 'white', padding: '40px', borderRadius: '8px', width: '480px', color: '#333', boxShadow: '0 5px 20px rgba(0,0,0,0.3)' };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', fontWeight: 'bold', color: '#aaa', cursor: 'pointer' };
const btnActionStyle = { flex: 1, padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' };
const fabStyle = { position: 'fixed', bottom: '40px', right: '40px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f39c12', color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 999 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '380px' };
const inputStyle = { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const labelStyle = { fontSize: '14px', fontWeight: '600' };
const btnModalStyle = { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

export default BookingInfo;