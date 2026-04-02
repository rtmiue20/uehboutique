import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
    const [stats, setStats] = useState({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        todayCheckIns: 0,
        totalRevenue: 0
    });
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // 1. Lấy dữ liệu bookings để tính toán
            const bookingsRes = await axios.get('http://localhost:8080/api/bookings');
            const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

            // 2. Lấy dữ liệu phòng (Giả định ông có endpoint này, nếu chưa có hãy dùng tạm số hardcode)
            let rooms = [];
            try {
                const roomsRes = await axios.get('http://localhost:8080/api/rooms');
                rooms = roomsRes.data;
            } catch (e) { rooms = new Array(20).fill({}); } // Fallback nếu chưa có API phòng

            // --- LOGIC TÍNH TOÁN ---
            const today = new Date().toISOString().split('T')[0];

            const occupied = bookings.filter(b => b.status === 'Checked-in').length;
            const checkinsToday = bookings.filter(b => b.checkInDate === today).length;

            // Tính sơ bộ doanh thu từ các booking (nếu cần)
            const revenue = bookings.reduce((sum, b) => {
                // Chỉ tính các đơn đã check-out/thanh toán (tùy logic của ông)
                return (b.status === 'Checked-out' || b.status === 'Check-out') ? sum + (b.totalAmount || 0) : sum;
            }, 0);

            setStats({
                totalRooms: rooms.length,
                occupiedRooms: occupied,
                availableRooms: rooms.length - occupied,
                todayCheckIns: checkinsToday,
                totalRevenue: revenue
            });

            setRecentBookings(bookings.slice(0, 5)); // Lấy 5 booking mới nhất
            setLoading(false);
        } catch (error) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    if (loading) return <div style={{ padding: '20px' }}>Đang tải dữ liệu...</div>;

    return (
        <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
            <h2 style={{ color: '#125c61', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                📊 Tổng Quan Hệ Thống UEH Boutique
            </h2>

            {/* --- HÀNG THẺ THỐNG KÊ (STATS CARDS) --- */}
            <div style={statsGridStyle}>
                <div style={{ ...cardStyle, borderLeft: '5px solid #2ecc71' }}>
                    <span style={cardLabelStyle}>Phòng Trống</span>
                    <h2 style={{ color: '#2ecc71', margin: '10px 0' }}>{stats.availableRooms}</h2>
                    <small>Sẵn sàng đón khách</small>
                </div>
                <div style={{ ...cardStyle, borderLeft: '5px solid #e74c3c' }}>
                    <span style={cardLabelStyle}>Phòng Đang Ở</span>
                    <h2 style={{ color: '#e74c3c', margin: '10px 0' }}>{stats.occupiedRooms}</h2>
                    <small>Công suất: {Math.round((stats.occupiedRooms / stats.totalRooms) * 100) || 0}%</small>
                </div>
                <div style={{ ...cardStyle, borderLeft: '5px solid #f39c12' }}>
                    <span style={cardLabelStyle}>Check-in Hôm Nay</span>
                    <h2 style={{ color: '#f39c12', margin: '10px 0' }}>{stats.todayCheckIns}</h2>
                    <small>Lượt khách dự kiến</small>
                </div>
                <div style={{ ...cardStyle, borderLeft: '5px solid #125c61' }}>
                    <span style={cardLabelStyle}>Doanh Thu Dự Tính</span>
                    <h2 style={{ color: '#125c61', margin: '10px 0' }}>{formatCurrency(stats.totalRevenue)}</h2>
                    <small>Dựa trên hóa đơn Check-out</small>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginTop: '30px' }}>
                {/* --- DANH SÁCH ĐẶT PHÒNG GẦN ĐÂY --- */}
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0, color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Hoạt động gần đây</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: '#777', fontSize: '13px' }}>
                                <th style={{ padding: '12px 5px' }}>Khách hàng</th>
                                <th>Phòng</th>
                                <th>Ngày đến</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBookings.map((b, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', fontSize: '14px' }}>
                                    <td style={{ padding: '12px 5px' }}><b>{b.guest?.guestName}</b></td>
                                    <td><span style={roomBadgeStyle}>{b.room?.roomNumber}</span></td>
                                    <td>{b.checkInDate}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px',
                                            backgroundColor: b.status === 'Checked-in' ? '#e8f8f5' : '#fef9e7',
                                            color: b.status === 'Checked-in' ? '#27ae60' : '#f39c12'
                                        }}>
                                            {b.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- LỐI TẮT NHANH (QUICK ACTIONS) --- */}
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0, color: '#333' }}>Thao tác nhanh</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        <button style={quickBtnStyle} onClick={() => window.location.href = '/booking'}>➕ Tạo Booking Mới</button>
                        <button style={{ ...quickBtnStyle, backgroundColor: '#83b5b7' }} onClick={() => window.location.href = '/rooms'}>🏨 Xem Sơ Đồ Phòng</button>
                        <button style={{ ...quickBtnStyle, backgroundColor: '#95a5a6' }} onClick={() => window.location.href = '/invoices'}>📑 Xuất Báo Cáo Tháng</button>
                    </div>
                    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#eef2f3', borderRadius: '8px' }}>
                        <p style={{ fontSize: '13px', color: '#555', margin: 0 }}><b>💡 Ghi chú:</b> Hệ thống tự động đồng bộ dữ liệu mỗi khi có khách Check-in tại quầy.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- STYLES ---
const statsGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' };
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const cardLabelStyle = { fontSize: '13px', color: '#888', fontWeight: '600', textTransform: 'uppercase' };
const sectionStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const roomBadgeStyle = { backgroundColor: '#125c61', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' };
const quickBtnStyle = {
    padding: '12px', backgroundColor: '#f39c12', color: 'white', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', transition: '0.3s'
};

export default Dashboard;