import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

function Layout() {
    const location = useLocation(); // Dùng để biết đang ở trang nào để bôi đậm Menu

    // Thêm state để quản lý việc đóng/mở menu của user
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Danh sách các tab menu
    const menuItems = [
        { path: '/home', label: 'Trang chủ' },
        { path: '/booking', label: 'Thông tin đặt phòng' },
        { path: '/rooms', label: 'Tình trạng phòng' },
        { path: '/services', label: 'Dịch vụ' },
        { path: '/invoices', label: 'Hoá đơn' },
    ];

    return (
        <div style={{ backgroundColor: '#f5f7f9', minHeight: '100vh', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            {/* --- HEADER (LOGO) --- */}
            <div style={{ textAlign: 'center', padding: '15px 0', backgroundColor: 'white' }}>
                <h1 style={{ margin: 0, color: '#2c3e50', fontSize: '24px' }}>
                    <span style={{ color: '#27ae60' }}>🏨</span> UEH BOUTIQUE HOTEL
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: '#7f8c8d' }}>Your Intelligent Place To Relax</p>
            </div>

            {/* --- THANH MENU MÀU XANH --- */}
            <div style={{
                backgroundColor: '#125c61', // Màu xanh lục đậm theo thiết kế
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link key={item.path} to={item.path} style={{
                            textDecoration: 'none',
                            color: 'white',
                            padding: '15px 25px',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            backgroundColor: isActive ? '#0e4a4e' : 'transparent', // Màu nền đậm hơn nếu đang chọn
                            borderBottom: isActive ? '4px solid #f39c12' : '4px solid transparent',
                            transition: 'all 0.3s'
                        }}>
                            {item.label}
                        </Link>
                    );
                })}

                {/* --- Nút User bên góc phải (Đã được nâng cấp thành Dropdown) --- */}
                <div style={{ position: 'absolute', right: '30px' }}>
                    {/* Phần hiển thị tên và avatar (Click vào để mở menu) */}
                    <div
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{ display: 'flex', alignItems: 'center', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Hi, Trieu!
                        <div style={{
                            backgroundColor: '#f39c12', color: 'white', borderRadius: '50%', width: '35px', height: '35px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', marginLeft: '10px', fontSize: '18px'
                        }}>👤</div>
                    </div>

                    {/* Khung Dropdown Menu (Chỉ hiện khi isMenuOpen = true) */}
                    {isMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '50px', // Đẩy xuống dưới một chút để không đè lên avatar
                            right: '0',
                            backgroundColor: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            width: '180px',
                            overflow: 'hidden',
                            zIndex: 1000
                        }}>
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                <li style={dropdownItemStyle} onClick={() => { alert("Tính năng đang phát triển!"); setIsMenuOpen(false); }}>
                                    ✏️ Sửa thông tin
                                </li>
                                <li style={dropdownItemStyle} onClick={() => { alert("Tính năng đang phát triển!"); setIsMenuOpen(false); }}>
                                    🔒 Đổi mật khẩu
                                </li>
                                <li style={{ ...dropdownItemStyle, color: '#e74c3c', borderTop: '1px solid #eee' }}
                                    onClick={() => window.location.href = '/'}>
                                    🚪 Đăng xuất
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PHẦN NỘI DUNG THAY ĐỔI --- */}
            <div style={{ padding: '30px 50px' }}>
                <Outlet /> {/* Nơi các trang (Trang chủ, Đặt phòng...) sẽ hiện ra */}
            </div>
        </div>
    );
}

// CSS cho các mục trong Menu xổ xuống
const dropdownItemStyle = {
    padding: '12px 15px',
    cursor: 'pointer',
    color: '#333',
    fontSize: '14px',
    fontWeight: 'normal',
    transition: 'background 0.2s',
};

export default Layout;