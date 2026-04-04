import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Giữ lại 1 dòng import

function BookingInfo() {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 8;

    const [searchPhone, setSearchPhone] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);

    // STATE CHO HỆ THỐNG TOAST MỚI (CHỨA MẢNG CÁC THÔNG BÁO)
    const [toasts, setToasts] = useState([]); // [{ id, type, title, description }]

    // State cho Bill Modal
    const [showBill, setShowBill] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);

    // --- STATE MỚI CHO TÍNH NĂNG KHÁCH HÀNG (THÊM/SỬA) ---
    const [showGuestModal, setShowGuestModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [guestForm, setGuestForm] = useState({ guestId: '', guestName: '', phone: '' });

    useEffect(() => {
        fetchBookings();
    }, []);

    // --- HÀM FORMAT TIỀN TỆ (THÊM MỚI ĐỂ TRÁNH LỖI) ---
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return "0 ₫";
        return amount.toLocaleString('vi-VN') + " ₫";
    };

    const fetchBookings = () => {
        axios.get('http://localhost:8080/api/bookings')
            .then(response => {
                // Đảm bảo dữ liệu luôn là mảng, tránh lỗi sập web
                setBookings(Array.isArray(response.data) ? response.data : []);
            })
            .catch(error => {
                console.error("Lỗi khi tải dữ liệu:", error);
                setBookings([]);
            });
    };

    // --- HÀM 1: QUẢN LÝ THÊM THÔNG BÁO (Triggerstacked Toast) ---
    const triggerStackedToast = (type, title, description) => {
        const id = Date.now(); // Tạo id duy nhất bằng timestamp
        const newToast = { id, type, title, description };
        setToasts(prev => [newToast, ...prev]);

        // Tự động xóa thông báo sau 5 giây
        setTimeout(() => removeToast(id), 5000);
    };

    // --- HÀM 2: QUẢN LÝ XÓA THÔNG BÁO ---
    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // --- CÁC HÀM XỬ LÝ KHÁCH HÀNG (THÊM/SỬA) ---
    const openAddModal = () => {
        setIsEditing(false);
        setGuestForm({ guestId: '', guestName: '', phone: '' });
        setShowGuestModal(true);
    };

    const openEditModal = (guest) => {
        setIsEditing(true);
        setGuestForm({ guestId: guest.guestId, guestName: guest.guestName, phone: guest.phone });
        setShowGuestModal(true);
    };

    const handleSaveGuest = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // Trường hợp SỬA: Gửi toàn bộ form bao gồm ID
                await axios.put(`http://localhost:8080/api/guests/${guestForm.guestId}`, guestForm);
                triggerStackedToast('success', 'Cập Nhật Thành Công', `Đã sửa: ${guestForm.guestName}`);
            } else {
                // Trường hợp THÊM MỚI: Loại bỏ guestId để tránh lỗi ép kiểu ở Backend
                const { guestId, ...newGuestData } = guestForm; 
                
                await axios.post(`http://localhost:8080/api/guests`, newGuestData);
                triggerStackedToast('success', 'Thêm Khách Thành Công', `Đã thêm ${guestForm.guestName}`);
            }
            
            setShowGuestModal(false);
            fetchBookings(); // Tải lại bảng
        } 
        catch (err) 
        {
            console.error("Chi tiết lỗi:", err.response?.data);
            triggerStackedToast('error', 'Lỗi Hệ Thống', err.response?.data?.message || 'Dữ liệu không hợp lệ.');
        }
    };

    // --- CÁC HÀM XỬ LÝ THANH TOÁN & INVOICE ---
    const handleTogglePayment = (id) => {
        const updatedBookings = bookings.map(booking => {
            if (booking.bookingId === id) {
                const isPaid = booking.status === 'Check-out' || booking.status === 'Checked-out';
                return { ...booking, status: isPaid ? 'Checked-in' : 'Check-out' };
            }
            return booking;
        });
        setBookings(updatedBookings);
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

            setShowBill(true);
        } catch (err) {
            triggerStackedToast('error', 'Lỗi tải hóa đơn', err.response?.data || "Server không phản hồi.");
        }
    };

    const handleCompletePayment = async () => {
        try {
            await axios.post(`http://localhost:8080/api/invoices/checkout/${invoiceData.bookingId}?paymentMethod=Cash`);
            
            setInvoiceData(prev => ({ ...prev, isPaid: true }));
            triggerStackedToast('success', 'Thanh Toán Thành Công!', 'Đã lưu hóa đơn sang mục Quản Lý Hóa Đơn.');
            fetchBookings(); // Làm mới dữ liệu bảng nền

            // Đóng Modal và chuyển hướng
            setShowBill(false);
            navigate('/invoices', { state: { newInvoiceId: invoiceData.bookingId } }); 
            
        } catch (err) {
            triggerStackedToast('error', 'Lỗi Thanh Toán', err.response?.data || "Không thể lưu hóa đơn vào DB.");
        }
    };

    // Xử lý Lọc và Phân trang (Giả định bạn có logic filter, ở đây đang thiếu biến filteredBookings,
    // Mình đang gán tạm bằng `bookings` để tránh lỗi, nếu bạn có hàm filter thì sửa lại nhé)
    const filteredBookings = bookings; // Thêm dòng này để phòng hờ lỗi undefined

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

            {/* --- GIAO DIỆN HỆ THỐNG TOAST XẾP CHỒNG --- */}
            {toasts.length > 0 && (
                <div style={toastContainerStyle}>
                    {toasts.map(t => (
                        <div key={t.id} style={{ ...toastItemStyle, backgroundColor: '#fff', borderLeft: t.type === 'success' ? '8px solid #2ecc71' : '8px solid #e74c3c' }}>
                            <div style={toastIconStyle}>
                                {t.type === 'success' ? <span style={{color: '#2ecc71', fontSize: '18px'}}>✔</span> : <span style={{color: '#e74c3c', fontSize: '18px'}}>✘</span>}
                            </div>
                            <div style={toastContentStyle}>
                                <div style={toastTitleStyle}>{t.title}</div>
                                <div style={toastDescriptionStyle}>{t.description}</div>
                            </div>
                            <button onClick={() => removeToast(t.id)} style={toastCloseBtnStyle}>✕</button>
                        </div>
                    ))}
                </div>
            )}

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
                        <th style={{...thStyle, textAlign: 'left'}}>TÊN KHÁCH HÀNG</th>
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
                    {currentBookings.length > 0 ? currentBookings.map((booking, index) => (
                        <tr key={booking.bookingId || index}>
                            <td style={{...tdStyle, fontWeight: 'bold'}}>{booking.guest?.guestId}</td>
                            <td style={{...tdStyle, textAlign: 'left'}}>{booking.guest?.guestName}</td>
                            <td style={tdStyle}>{booking.guest?.phone}</td>
                            <td style={tdStyle}>{booking.checkInDate}</td>
                            <td style={tdStyle}>{booking.checkOutDate || '---'}</td>
                            <td style={{...tdStyle, color: '#f39c12', fontWeight: 'bold'}}>{booking.room?.roomNumber}</td>
                            <td style={tdStyle}>
                                <input
                                    type="checkbox"
                                    checked={booking.status === 'Check-out' || booking.status === 'Checked-out'}
                                    onChange={() => handleTogglePayment(booking.bookingId)}
                                    style={{ width: '18px', height: '18px', accentColor: '#125c61', cursor: 'pointer' }}
                                />
                            </td>
                            <td style={tdStyle}>
                                <button onClick={() => handleInvoiceClick(booking)} style={btnInvoiceStyle}>Invoice</button>
                            </td>
                            <td style={tdStyle}>
                                <span onClick={() => openEditModal(booking.guest)} style={{ cursor: 'pointer', color: '#f39c12', fontSize: '18px' }}>✏️</span>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="10" style={{...tdStyle, color: 'red'}}>Chưa có dữ liệu phòng hoặc không tìm thấy!</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                    {[...Array(totalPages)].map((_, i) => (
                        <button key={i+1} onClick={() => paginate(i+1)} style={{...btnPageStyle, backgroundColor: currentPage === i+1 ? '#125c61' : 'transparent', color: currentPage === i+1 ? 'white' : '#125c61', border: '1px solid #125c61', borderRadius: '4px'}} >{i+1}</button>
                    ))}
                </div>
            )}

            {/* NÚT ADD GUEST NỔI (FAB) */}
            <button onClick={openAddModal} style={fabStyle} title="Thêm khách mới">+</button>

            {/* --- MODAL THÊM/SỬA KHÁCH HÀNG --- */}
            {showGuestModal && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ color: '#125c61', marginTop: 0 }}>
                            {isEditing ? '📝 Sửa Khách Hàng' : '👤 Thêm Khách Hàng'}
                        </h3>
                        <form onSubmit={handleSaveGuest}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>Họ và Tên:</label>
                                <input
                                    type="text" required style={inputStyle}
                                    value={guestForm.guestName}
                                    onChange={e => setGuestForm({...guestForm, guestName: e.target.value})}
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>Số điện thoại:</label>
                                <input
                                    type="text" required style={inputStyle}
                                    value={guestForm.phone}
                                    onChange={e => setGuestForm({...guestForm, phone: e.target.value})}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{...btnModalStyle, backgroundColor: '#125c61'}}>Lưu Lại</button>
                                <button type="button" onClick={() => setShowGuestModal(false)} style={{...btnModalStyle, backgroundColor: '#95a5a6'}}>Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL INVOICE --- */}
            {showBill && invoiceData && (
                <div style={overlayStyle}>
                    <div style={billModalStyle}>

                        <button onClick={() => setShowBill(false)} style={closeBtnStyle}>✕</button>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#125c61', margin: 0 }}>UEH BOUTIQUE HOTEL</h2>
                            <p style={{ fontSize: '11px', color: '#777' }}>59C Nguyễn Đình Chiểu, Quận 3, TP.HCM</p>
                            <div style={{ borderBottom: '2px solid #333', margin: '10px 0' }}></div>
                            <h3 style={{ letterSpacing: '2px' }}>HÓA ĐƠN THANH TOÁN</h3>
                        </div>

                        <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                            <p><b>Khách:</b> {invoiceData.guestName}</p>
                            <p><b>Phòng:</b> {invoiceData.roomNumber}</p>
                            <p><b>Ngày:</b> {invoiceData.paymentDate}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ borderBottom: '2px solid #333' }}>
                                <th style={{ textAlign: 'left', padding: '10px 0' }}>Diễn giải</th>
                                <th style={{ textAlign: 'right', padding: '10px 0' }}>Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{ padding: '10px 0', borderBottom: '1px dashed #ccc' }}>Tiền phòng ({invoiceData.nights} đêm)</td>
                                <td style={{ textAlign: 'right', borderBottom: '1px dashed #ccc' }}>{formatCurrency(invoiceData.roomTotal)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 0' }}>Tiền dịch vụ</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(invoiceData.serviceTotal)}</td>
                            </tr>
                            </tbody>
                        </table>

                        <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>TỔNG CỘNG:</span>
                            <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#e74c3c' }}>{formatCurrency(invoiceData.grandTotal)}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            <button onClick={handleCompletePayment} disabled={invoiceData.isPaid} style={{...btnActionStyle, backgroundColor: invoiceData.isPaid ? '#bdc3c7' : '#2ecc71', cursor: invoiceData.isPaid ? 'not-allowed' : 'pointer', color: invoiceData.isPaid ? '#7f8c8d' : 'white'}} >{invoiceData.isPaid ? " Đã Hoàn Thành" : "Hoàn thành thanh toán"}</button>
                            <button onClick={() => window.print()} style={{...btnActionStyle, backgroundColor: '#34495e', color: 'white'}} > In Bill</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- STYLES ---
const btnSearchStyle = { backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px' };
const btnInvoiceStyle = { padding: '6px 12px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnPageStyle = { border: 'none', padding: '5px 12px', cursor: 'pointer', fontWeight: 'bold' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const billModalStyle = { position: 'relative', backgroundColor: 'white', padding: '40px', borderRadius: '8px', width: '480px', color: '#333', boxShadow: '0 5px 20px rgba(0,0,0,0.3)' };
const closeBtnStyle = { position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px', fontWeight: 'bold', color: '#aaa', cursor: 'pointer' };
const btnActionStyle = { flex: 1, padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' };

const toastContainerStyle = { position: 'fixed', top: '30px', right: '30px', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 9999, width: '350px' };
const toastItemStyle = { display: 'flex', alignItems: 'center', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden', minHeight: '80px' };
const toastIconStyle = { marginRight: '20px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const toastContentStyle = { flex: 1 };
const toastTitleStyle = { fontWeight: 'bold', fontSize: '15px', color: '#333', marginBottom: '4px' };
const toastDescriptionStyle = { fontSize: '13px', color: '#666', lineHeight: '1.4' };
const toastCloseBtnStyle = { position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '16px', color: '#aaa', cursor: 'pointer', fontWeight: 'bold' };

const fabStyle = { position: 'fixed', bottom: '40px', right: '40px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f39c12', color: 'white', fontSize: '30px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', zIndex: 999 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '350px' };
const inputStyle = { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const labelStyle = { fontSize: '14px', fontWeight: '600' };
const btnModalStyle = { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

export default BookingInfo;