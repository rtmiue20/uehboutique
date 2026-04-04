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

            // 1. Lấy dữ liệu bookings
            const bookingsRes = await axios.get('http://localhost:8080/api/bookings');
            const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

            // 2. Lấy dữ liệu phòng
            let rooms = [];
            try {
                const roomsRes = await axios.get('http://localhost:8080/api/rooms');
                rooms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
            } catch (e) {
                console.warn("Chưa có API phòng, dùng data ảo.");
                rooms = new Array(20).fill({ status: 'EMPTY' });
            }

            // --- LOGIC TÍNH TOÁN ĐÃ ĐƯỢC FIX ---
            const today = new Date().toISOString().split('T')[0];

            // FIX 1: Đếm phòng đang ở dựa vào API rooms (chính xác hơn với sơ đồ). 
            // Cover luôn các trường hợp chữ hoa/thường hoặc tên trạng thái khác nhau.
            let occupied = 0;
            if (rooms.length > 0 && rooms[0].status) {
                occupied = rooms.filter(r =>
                    r.status.toUpperCase() === 'CURRENTLY' ||
                    r.status.toUpperCase() === 'OCCUPIED' ||
                    r.status.toUpperCase() === 'CHECKED-IN'
                ).length;
            } else {
                // Fallback: nếu room không có status, đếm từ bookings
                occupied = bookings.filter(b => b.status && b.status.toLowerCase() === 'checked-in').length;
            }

            const checkinsToday = bookings.filter(b => b.checkInDate === today).length;

            const revenue = bookings.reduce((sum, b) => {
                const isPaid = b.status && (b.status.toLowerCase() === 'checked-out' || b.status.toLowerCase() === 'check-out');
                return isPaid ? sum + (b.totalAmount || 0) : sum;
            }, 0);

            // Xử lý tổng số phòng thực tế (tránh lỗi chia cho 0)
            const total = rooms.length > 0 ? rooms.length : 20;

            setStats({
                totalRooms: total,
                occupiedRooms: occupied,
                availableRooms: total - occupied,
                todayCheckIns: checkinsToday,
                totalRevenue: revenue
            });

            setRecentBookings(bookings.slice(0, 5));
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
                Tổng Quan Hệ Thống UEH Boutique
            </h2>

            <div style={statsGridStyle}>
                <div style={{ ...cardStyle, borderLeft: '5px solid #2ecc71' }}>
                    <span style={cardLabelStyle}>Phòng Trống</span>
                    <h2 style={{ color: '#2ecc71', margin: '10px 0' }}>{stats.availableRooms}</h2>
                    <small>Sẵn sàng đón khách</small>
                </div>
                <div style={{ ...cardStyle, borderLeft: '5px solid #e74c3c' }}>
                    <span style={cardLabelStyle}>Phòng Đang Ở</span>
                    <h2 style={{ color: '#e74c3c', margin: '10px 0' }}>{stats.occupiedRooms}</h2>
                    <small>Công suất: {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}%</small>
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
                            {recentBookings.map((b, i) => {
                                const isCheckedIn = b.status && b.status.toLowerCase() === 'checked-in';
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', fontSize: '14px' }}>
                                        <td style={{ padding: '12px 5px' }}><b>{b.guest?.guestName || 'Khách lẻ'}</b></td>
                                        <td><span style={roomBadgeStyle}>{b.room?.roomNumber || '---'}</span></td>
                                        <td>{b.checkInDate}</td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                                backgroundColor: isCheckedIn ? '#e8f8f5' : '#fef9e7',
                                                color: isCheckedIn ? '#27ae60' : '#f39c12'
                                            }}>
                                                {b.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

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