import React, { useState, useEffect } from 'react';
import axios from 'axios';

function BookingInfo() {
    const [bookings, setBookings] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const bookingsPerPage = 8;

    const [searchPhone, setSearchPhone] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);

    // State cho Toast & Bill Modal
    const [toast, setToast] = useState({ show: false, message: '' });
    const [showBill, setShowBill] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = () => {
        axios.get('http://localhost:8080/api/bookings')
            .then(response => {
                setBookings(response.data);
            })
            .catch(error => {
                console.error("Lỗi khi tải dữ liệu:", error);
            });
    };

    // --- HÀM TÍCH CHỌN TỰ DO (Thích tích thì tích) ---
    const handleTogglePayment = (id) => {
        const updatedBookings = bookings.map(booking => {
            if (booking.bookingId === id) {
                // Nếu đang là Check-out thì đảo về Checked-in và ngược lại
                const isPaid = booking.status === 'Check-out' || booking.status === 'Checked-out';
                return {
                    ...booking,
                    status: isPaid ? 'Checked-in' : 'Check-out'
                };
            }
            return booking;
        });
        setBookings(updatedBookings);

        // Hiện thông báo nhẹ cho bác biết
        const target = updatedBookings.find(b => b.bookingId === id);
        const statusText = (target.status === 'Check-out') ? "Đã thanh toán" : "Chưa thanh toán";
        triggerToast(`🔔 Đã đổi trạng thái: ${statusText}`);
    };

    // --- HÀM XỬ LÝ XUẤT BILL TỪ NÚT INVOICE ---
    const handleInvoiceClick = async (booking) => {
        try {
            // Gọi API Backend của bác
            const res = await axios.post(`http://localhost:8080/api/invoices/checkout/${booking.bookingId}?paymentMethod=Cash`);

            setInvoiceData(res.data);
            setShowBill(true);
            triggerToast(`✅ Đã xuất hóa đơn cho khách: ${booking.guest?.guestName}`);

            // Load lại danh sách để đồng bộ status thật từ DB
            fetchBookings();
        } catch (err) {
            triggerToast("❌ Lỗi: " + (err.response?.data || "Không thể kết nối server"));
        }
    };

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    // --- LOGIC TÌM KIẾM & PHÂN TRANG ---
    const filteredBookings = bookings.filter((booking) => {
        if (!searchPhone) return true;
        const phone = booking.guest?.phone || "";
        return phone.includes(searchPhone);
    });

    const indexOfLastBooking = currentPage * bookingsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
    const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
    const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Styles cơ bản
    const thStyle = { padding: '12px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' };
    const tdStyle = { padding: '15px 10px', textAlign: 'center', borderBottom: '1px solid #eee', fontSize: '13px' };

    return (
        <div style={{ padding: '20px', fontFamily: "'Segoe UI', Tahoma, sans-serif", position: 'relative' }}>

            {/* CSS CHO TOAST MỜ DẦN (Góc dưới phải) */}
            <style>{`
                @keyframes fadeOutDown {
                    0% { opacity: 1; transform: translateY(0); }
                    70% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(20px); }
                }
                .toast-custom {
                    position: fixed; bottom: 30px; right: 30px;
                    background: white; padding: 15px 25px; borderRadius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15); z-index: 9999;
                    border-left: 6px solid #125c61; animation: fadeOutDown 3s forwards;
                }
            `}</style>

            {/* TOAST MESSAGE */}
            {toast.show && (
                <div className="toast-custom">
                    <b style={{ color: '#125c61' }}>Hệ thống</b>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>{toast.message}</p>
                </div>
            )}

            {/* Thanh công cụ Tìm kiếm */}
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

            {/* BẢNG DỮ LIỆU */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#83b5b7', color: '#1a4e52' }}>
                    <tr>
                        <th style={thStyle}>MÃ KH</th>
                        <th style={{...thStyle, textAlign: 'left'}}>TÊN KH</th>
                        <th style={thStyle}>SỐ ĐIỆN THOẠI</th>
                        <th style={thStyle}>CHECK IN</th>
                        <th style={thStyle}>CHECK OUT</th>
                        <th style={thStyle}>PHÒNG</th>
                        <th style={thStyle}>THANH TOÁN</th>
                        <th style={thStyle}>XUẤT BILL</th>
                        <th style={thStyle}></th>
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

                            {/* Ô CHECKBOX: THÍCH TÍCH THÌ TÍCH */}
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
                            <td style={tdStyle}><span style={{ cursor: 'pointer', color: '#7f8c8d' }}>✏️</span></td>
                        </tr>
                    )) : (
                        <tr><td colSpan="10" style={{...tdStyle, color: 'red'}}>Không tìm thấy khách hàng nào!</td></tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i+1}
                            onClick={() => paginate(i+1)}
                            style={{
                                ...btnPageStyle,
                                backgroundColor: currentPage === i+1 ? '#125c61' : 'transparent',
                                color: currentPage === i+1 ? 'white' : '#125c61',
                                border: '1px solid #125c61',
                                borderRadius: '4px'
                            }}
                        >
                            {i+1}
                        </button>
                    ))}
                </div>
            )}

            {/* MODAL BILL (Giữ nguyên giao diện in ấn bác thích) */}
            {showBill && invoiceData && (
                <div style={overlayStyle}>
                    <div style={billModalStyle}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#125c61', margin: 0 }}>UEH BOUTIQUE HOTEL</h2>
                            <p style={{ fontSize: '11px', color: '#777' }}>59C Nguyễn Đình Chiểu, Quận 3, TP.HCM</p>
                            <div style={{ borderBottom: '2px solid #333', margin: '10px 0' }}></div>
                            <h3 style={{ letterSpacing: '2px' }}>HÓA ĐƠN THANH TOÁN</h3>
                        </div>

                        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                            <p><b>Khách:</b> {invoiceData.booking?.guest?.guestName}</p>
                            <p><b>Phòng:</b> {invoiceData.booking?.room?.roomNumber}</p>
                            <p><b>Ngày:</b> {new Date(invoiceData.paymentDate).toLocaleString('vi-VN')}</p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                            <thead>
                            <tr style={{ borderBottom: '1px solid #333' }}>
                                <th style={{ textAlign: 'left', padding: '10px 0' }}>Diễn giải</th>
                                <th style={{ textAlign: 'right', padding: '10px 0' }}>Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <td style={{ padding: '10px 0' }}>Tổng (Phòng + Dịch vụ)</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(invoiceData.totalAmount)}</td>
                            </tr>
                            </tbody>
                        </table>

                        <div style={{ marginTop: '30px', borderTop: '2px solid #333', paddingTop: '10px', textAlign: 'right' }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>{formatCurrency(invoiceData.totalAmount)}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                            <button onClick={() => window.print()} style={{...btnConfirmStyle, backgroundColor: '#2ecc71'}}>In Bill</button>
                            <button onClick={() => setShowBill(false)} style={btnCancelStyle}>Đóng</button>
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
const billModalStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '4px', width: '450px', color: '#333' };
const btnConfirmStyle = { flex: 1, padding: '12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const btnCancelStyle = { flex: 1, padding: '12px', backgroundColor: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };

export default BookingInfo;