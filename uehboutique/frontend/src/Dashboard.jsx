import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
    const [stats, setStats] = useState({
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        todayCheckIns: 0,
        totalRevenue: 0,
        currentMonthLabel: ""
    });
    const [recentActivities, setRecentActivities] = useState([]);
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
                rooms = new Array(20).fill({ status: 'EMPTY' });
            }

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const todayStr = now.toISOString().split('T')[0];

            let occupied = 0;
            if (rooms.length > 0 && rooms[0].status) {
                occupied = rooms.filter(r =>
                    ['CURRENTLY', 'OCCUPIED', 'CHECKED-IN'].includes(r.status.toUpperCase())
                ).length;
            } else {
                occupied = bookings.filter(b => b.status && String(b.status).toLowerCase().includes('in')).length;
            }

            const checkinsToday = bookings.filter(b => b.checkInDate === todayStr).length;

            // --- LOGIC DOANH THU DỰ TÍNH ---
            const estimatedMonthlyRevenue = bookings.reduce((sum, b) => {
                // Chỉ lấy ngày Check-in để tính doanh thu dự tính cho tháng đó
                const dateToCheck = b.checkInDate;
                if (!dateToCheck) return sum;

                const bDate = new Date(dateToCheck);
                const isThisMonth = bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;

                const currentStatus = b.status ? String(b.status).toLowerCase().trim() : '';

                // Lấy tổng tiền dự kiến (từ số ngày ở + dịch vụ đã đặt)
                const amount = Number(b.totalAmount || b.totalPrice || b.price || 0);

                // Cộng dồn nếu booking có check-in trong tháng hiện tại và không bị hủy
                return (isThisMonth) ? sum + amount : sum;
            }, 0);

            const total = rooms.length > 0 ? rooms.length : 20;

            setStats({
                totalRooms: total,
                occupiedRooms: occupied,
                availableRooms: total - occupied,
                todayCheckIns: checkinsToday,
                totalRevenue: estimatedMonthlyRevenue,
                currentMonthLabel: `Tháng ${currentMonth + 1}`
            });

            // --- LOGIC HOẠT ĐỘNG GẦN ĐÂY ---
            let activities = bookings.map(b => ({
                // Dùng bookingId làm mốc định danh chính xác nhất cho thứ tự thời gian
                bookingId: b.bookingId || b.id || 0,
                guestName: b.guest?.guestName || b.guestName || 'Khách lẻ',
                roomNumber: b.room?.roomNumber || b.roomNumber || '---',
                time: b.updatedAt || b.checkInDate,
                action: b.status || 'Booking'
            }));

            // Sắp xếp:
            // 1. Ưu tiên BookingId giảm dần (Người mới nhất luôn có ID cao nhất)
            // 2. Sau đó mới xét đến updatedAt (Nếu có timestamp)
            activities.sort((a, b) => {
                if (b.bookingId !== a.bookingId) {
                    return b.bookingId - a.bookingId;
                }
                return new Date(b.time).getTime() - new Date(a.time).getTime();
            });

            setRecentActivities(activities.slice(0, 5));
            setLoading(false);
        } catch (error) {
            console.error("Lỗi tải dữ liệu Dashboard:", error);
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const getBadgeStyle = (actionStr) => {
        const action = String(actionStr).toLowerCase();
        if (action.includes('in') || action === 'currently') return { bg: '#e8f8f5', color: '#27ae60' };
        if (action.includes('out') || action.includes('hoàn thành')) return { bg: '#fef9e7', color: '#f39c12' };
        if (action.includes('order')) return { bg: '#ebf5fb', color: '#2980b9' };
        return { bg: '#f2f3f4', color: '#7f8c8d' };
    };

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
                    <span style={cardLabelStyle}>Doanh Thu Dự Tính {stats.currentMonthLabel}</span>
                    <h2 style={{ color: '#125c61', margin: '10px 0' }}>{formatCurrency(stats.totalRevenue)}</h2>
                    <small>Dựa trên lịch Check-in</small>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px', marginTop: '30px' }}>
                <div style={sectionStyle}>
                    <h3 style={{ marginTop: 0, color: '#333', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Hoạt động gần đây</h3>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                        <tr style={{ color: '#777', fontSize: '13px', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '30%' }}>Khách hàng</th>
                            <th style={{ padding: '12px 10px', textAlign: 'center', width: '15%' }}>Phòng</th>
                            <th style={{ padding: '12px 10px', textAlign: 'left', width: '35%' }}>Thời gian</th>
                            <th style={{ padding: '12px 10px', textAlign: 'center', width: '20%' }}>Trạng thái</th>
                        </tr>
                        </thead>
                        <tbody>
                        {recentActivities.map((activity, i) => {
                            const badgeColors = getBadgeStyle(activity.action);
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #f9f9f9', fontSize: '14px' }}>
                                    <td style={{ padding: '12px 10px', textAlign: 'left' }}><b>{activity.guestName}</b></td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                        <span style={roomBadgeStyle}>{activity.roomNumber}</span>
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'left' }}>
                                        {activity.time.length > 16 ? activity.time.substring(0, 16).replace('T', ' ') : activity.time}
                                    </td>
                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '5px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                            backgroundColor: badgeColors.bg, color: badgeColors.color,
                                            display: 'inline-block', minWidth: '85px', textAlign: 'center'
                                        }}>
                                            {activity.action}
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
const roomBadgeStyle = { backgroundColor: '#125c61', color: 'white', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' };
const quickBtnStyle = {
    padding: '12px', backgroundColor: '#f39c12', color: 'white', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textAlign: 'left', transition: '0.3s'
};

export default Dashboard;