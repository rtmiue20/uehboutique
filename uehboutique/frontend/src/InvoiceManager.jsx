import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InvoiceManager() {
    const [activeBookings, setActiveBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Modal Checkout
    const [showModal, setShowModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        fetchActiveRooms();
    }, []);

    const fetchActiveRooms = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/bookings');
            // Lọc: Chỉ hiện những phòng đang ở (Status = Checked-in hoặc Room Status = Currently)
            const currentGuests = res.data.filter(b => b.status === 'Checked-in');
            setActiveBookings(currentGuests);
        } catch (err) {
            console.error("Lỗi lấy danh sách phòng:", err);
            // Data giả để test UI nếu backend chưa phản hồi
            setActiveBookings([
                { bookingId: 1, room: { roomNumber: '102', roomType: { typeName: 'Family Standard' } }, customerName: 'Hạnh Lê', checkInDate: '2026-03-19' }
            ]);
        }
    };

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleCheckout = async () => {
        if (!selectedBooking) return;
        setLoading(true);
        try {
            // Gọi API POST bác đã viết trong InvoiceController
            const response = await axios.post(
                `http://localhost:8080/api/invoices/checkout/${selectedBooking.bookingId}`,
                null,
                { params: { paymentMethod: paymentMethod } }
            );

            const totalAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(response.data.totalAmount);

            triggerToast(`✅ Check-out thành công Phòng ${selectedBooking.room?.roomNumber}. Tổng tiền: ${totalAmount}`);
            setShowModal(false);
            fetchActiveRooms(); // Load lại danh sách (phòng vừa check-out sẽ biến mất khỏi đây)
        } catch (err) {
            triggerToast("❌ Lỗi Check-out: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f5f7f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>

            {/* CSS ANIMATION MỜ DẦN */}
            <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateX(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateX(20px); }
        }
        .toast-box {
          position: fixed; bottom: 30px; right: 30px;
          backgroundColor: white; padding: 18px 25px; borderRadius: '12px';
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)'; zIndex: 9999;
          borderLeft: '6px solid #125c61'; minWidth: '300px';
          animation: fadeOut 3s forwards;
        }
      `}</style>

            {/* TOAST MESSAGE */}
            {toast.show && (
                <div className="toast-box">
                    <div style={{ fontWeight: 'bold', color: '#125c61', marginBottom: '4px' }}>Hệ thống Hóa đơn</div>
                    <div style={{ color: '#444', fontSize: '14px' }}>{toast.message}</div>
                </div>
            )}

            {/* TIÊU ĐỀ */}
            <div style={headerStyle}>
                <h2 style={{ color: '#125c61', margin: 0 }}>🧾 QUẢN LÝ THANH TOÁN & CHECK-OUT</h2>
                <p style={{ color: '#7f8c8d', margin: '5px 0 0 0' }}>Danh sách khách hàng đang lưu trú tại UEH Boutique</p>
            </div>

            {/* BẢNG DANH SÁCH PHÒNG ĐANG Ở */}
            <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#125c61', color: 'white' }}>
                        <th style={thStyle}>PHÒNG</th>
                        <th style={thStyle}>KHÁCH HÀNG</th>
                        <th style={thStyle}>NGÀY ĐẾN</th>
                        <th style={thStyle}>HÀNH ĐỘNG</th>
                    </tr>
                    </thead>
                    <tbody>
                    {activeBookings.length > 0 ? activeBookings.map(b => (
                        <tr key={b.bookingId} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#125c61' }}>{b.room?.roomNumber}</td>
                            <td style={tdStyle}>{b.customerName || 'Khách lẻ'}</td>
                            <td style={tdStyle}>{b.checkInDate}</td>
                            <td style={tdStyle}>
                                <button
                                    onClick={() => { setSelectedBooking(b); setShowModal(true); }}
                                    style={checkoutBtnStyle}
                                >
                                    Trả Phòng (Check-out)
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#999' }}>Hiện không có phòng nào đang ở.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* MODAL XÁC NHẬN THANH TOÁN */}
            {showModal && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ borderBottom: '2px solid #f1f1f1', paddingBottom: '10px', color: '#125c61' }}>
                            Xác nhận Check-out - Phòng {selectedBooking?.room?.roomNumber}
                        </h3>

                        <div style={{ margin: '20px 0' }}>
                            <p><b>Khách hàng:</b> {selectedBooking?.customerName}</p>
                            <p><b>Loại phòng:</b> {selectedBooking?.room?.roomType?.typeName}</p>
                            <p><b>Ngày nhận phòng:</b> {selectedBooking?.checkInDate}</p>

                            <label style={{ display: 'block', marginTop: '15px', fontWeight: 'bold' }}>Phương thức thanh toán:</label>
                            <select
                                style={selectStyle}
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="Cash">Tiền mặt (Cash)</option>
                                <option value="Card">Thẻ ngân hàng (Card)</option>
                                <option value="Banking">Chuyển khoản (Banking)</option>
                            </select>
                        </div>

                        <p style={{ fontSize: '13px', color: '#e67e22', fontStyle: 'italic' }}>
                            * Hệ thống sẽ tự động tổng hợp tiền phòng và tất cả dịch vụ đã sử dụng.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            <button onClick={() => setShowModal(false)} style={cancelBtnStyle}>Hủy bỏ</button>
                            <button
                                onClick={handleCheckout}
                                disabled={loading}
                                style={{ ...confirmBtnStyle, opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? 'Đang xử lý...' : 'Xác nhận & In Hóa đơn'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- CSS IN JS ---
const headerStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' };
const cardStyle = { backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const thStyle = { padding: '15px', textAlign: 'left', fontSize: '14px', letterSpacing: '0.5px' };
const tdStyle = { padding: '15px', fontSize: '15px' };
const checkoutBtnStyle = { padding: '8px 16px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' };
const selectStyle = { width: '100%', padding: '12px', marginTop: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' };
const confirmBtnStyle = { flex: 2, padding: '12px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { flex: 1, padding: '12px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default InvoiceManager;