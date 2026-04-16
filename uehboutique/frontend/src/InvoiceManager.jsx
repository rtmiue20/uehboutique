import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InvoiceManager() {
    const [invoices, setInvoices] = useState([]);
    // State cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // Số lượng hóa đơn mỗi trang
    // State cho lọc ngày
    const [selectedDate, setSelectedDate] = useState('');
    // State cho sắp xếp (mặc định giảm dần theo ngày mới nhất)
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        axios.get('http://localhost:8080/api/invoices')
            .then(res => { setInvoices(res.data); })
            .catch(err => { console.error("Lỗi tải danh sách hóa đơn:", err); });
    }, []);

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const formatDate = (dateString) => {
        if (!dateString) return "---";
        const d = new Date(dateString);
        return d.toLocaleString('vi-VN');
    };

    // --- LOGIC XỬ LÝ DỮ LIỆU ---
    const filteredInvoices = selectedDate
        ? invoices.filter(inv => {
            const invDate = (inv.paymentDate || inv.payment_date || "").split('T')[0];
            return invDate === selectedDate;
        })
        : invoices;

    const sortedInvoices = [...filteredInvoices].sort((a, b) => {
        const dateA = new Date(a.paymentDate || a.payment_date);
        const dateB = new Date(b.paymentDate || b.payment_date);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInvoices = sortedInvoices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const pageBtnStyle = (isActive) => ({
        padding: '8px 12px',
        margin: '0 5px',
        cursor: 'pointer',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: isActive ? '#125c61' : 'white',
        color: isActive ? 'white' : '#333',
        fontWeight: 'bold'
    });

    const thStyle = { padding: '15px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' };
    const tdStyle = { padding: '15px 10px', textAlign: 'center', borderBottom: '1px solid #eee', fontSize: '14px' };

    return (
        <div style={{ padding: '30px', backgroundColor: '#f5f7f9', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>

            {/* --- HEADING GIỐNG SERVICEMANAGER --- */}
            <div style={bannerStyle}>
                <h1 style={{ color: '#125c61', margin: 0, fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                    <i className="fa-solid fa-file-invoice" style={{fontSize: '28px'}}></i> LỊCH SỬ HÓA ĐƠN
                </h1>
                <div style={{ width: '60px', height: '3px', backgroundColor: '#f39c12', margin: '15px auto' }}></div>
                <p style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '8px', marginBottom: 0,
                    fontWeight: '500', letterSpacing: '2px' }}>
                    HOTEL UEH BOUTIQUE - QUẢN LÝ HÓA ĐƠN
                </p>
            </div>

            {/* --- PHẦN NỘI DUNG CHÍNH (Card) --- */}
            <div style={cardStyle}>
                {/* BỘ LỌC VÀ SẮP XẾP */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
                    <div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '10px' }}>Lọc theo ngày:</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none' }}
                        />
                        {selectedDate && <button onClick={() => setSelectedDate('')} style={{ marginLeft: '10px', cursor: 'pointer', border: 'none', background: 'none', color: 'red' }}>Xóa lọc</button>}
                    </div>

                    <div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '10px' }}>Sắp xếp:</span>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                        >
                            <option value="desc">Mới nhất trước</option>
                            <option value="asc">Cũ nhất trước</option>
                        </select>
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#125c61', color: 'white' }}>
                    <tr>
                        <th style={{...thStyle, borderTopLeftRadius: '8px'}}>MÃ HÓA ĐƠN</th>
                        <th style={thStyle}>MÃ BOOKING</th>
                        <th style={thStyle}>NGÀY THANH TOÁN</th>
                        <th style={thStyle}>PHƯƠNG THỨC</th>
                        <th style={{...thStyle, borderTopRightRadius: '8px'}}>TỔNG TIỀN</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentInvoices.length > 0 ? currentInvoices.map((inv) => (
                        <tr key={inv.invoiceId || inv.invoice_id}>
                            <td style={{...tdStyle, fontWeight: 'bold', color: '#125c61'}}>#{inv.invoiceId || inv.invoice_id}</td>
                            <td style={tdStyle}>{inv.booking?.bookingId || inv.booking_id || "---"}</td>
                            <td style={tdStyle}>{formatDate(inv.paymentDate || inv.payment_date)}</td>
                            <td style={tdStyle}>
                                <span style={{ backgroundColor: '#eee', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                    {inv.paymentMethod || inv.payment_method}
                                </span>
                            </td>
                            <td style={{...tdStyle, color: '#e74c3c', fontWeight: 'bold'}}>
                                {formatCurrency(inv.totalAmount || inv.total_amount)}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#777' }}>
                                Không tìm thấy hóa đơn phù hợp.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

                {/* PHÂN TRANG (PAGINATION) */}
                {totalPages > 1 && (
                    <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => paginate(currentPage - 1)}
                            style={{...pageBtnStyle(false), opacity: currentPage === 1 ? 0.5 : 1}}
                        >
                            &lt;
                        </button>

                        {[...Array(totalPages)].map((_, index) => (
                            <button
                                key={index + 1}
                                onClick={() => paginate(index + 1)}
                                style={pageBtnStyle(currentPage === index + 1)}
                            >
                                {index + 1}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => paginate(currentPage + 1)}
                            style={{...pageBtnStyle(false), opacity: currentPage === totalPages ? 0.5 : 1}}
                        >
                            &gt;
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}

// --- KHAI BÁO STYLES ĐỂ ĐỒNG BỘ GIAO DIỆN ---
const bannerStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };

export default InvoiceManager;