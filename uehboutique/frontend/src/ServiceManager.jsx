import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ServiceManager() {
    const [services, setServices] = useState([]);
    const [activeBookings, setActiveBookings] = useState([]);

    // States cho Modals và Form
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [serviceForm, setServiceForm] = useState({ serviceId: '', serviceName: '', unitPrice: '' });
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderForm, setOrderForm] = useState({ bookingId: '', serviceId: '', quantity: 1 });

    // --- STATE TOAST (Góc dưới bên phải) ---
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resSrv = await axios.get('http://localhost:8080/api/services');
            setServices(resSrv.data);
            const resBook = await axios.get('http://localhost:8080/api/bookings');
            // Chỉ lấy phòng "Currently" hoặc "Checked-in"
            const currentlyStaying = resBook.data.filter(b => b.room?.status === 'Currently' || b.status === 'Checked-in');
            setActiveBookings(currentlyStaying);
        } catch (err) {
            setServices([{ serviceId: 1, serviceName: 'Coca Cola', unitPrice: 20000 }, { serviceId: 2, serviceName: 'Bò húc', unitPrice: 25000 }]);
            setActiveBookings([{ bookingId: 1, room: { roomNumber: '102' } }, { bookingId: 2, room: { roomNumber: '105' } }]);
        }
    };

    // Hàm hiện thông báo 3 giây và mờ dần
    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // --- XỬ LÝ LƯU DỊCH VỤ ---
    const handleSaveService = async () => {
        try {
            if (isEditing) {
                await axios.put(`http://localhost:8080/api/services/${serviceForm.serviceId}`, serviceForm);
                triggerToast(`Đã cập nhật: ${serviceForm.serviceName}`);
            } else {
                await axios.post('http://localhost:8080/api/services', serviceForm);
                triggerToast(`Đã thêm dịch vụ: ${serviceForm.serviceName}`);
            }
            setShowServiceModal(false);
            fetchData();
        } catch (err) { triggerToast("Lỗi thao tác!"); }
    };

    // --- XỬ LÝ XÓA ---
    const handleDelete = async (id, name) => {
        if (window.confirm(`Xóa ${name}?`)) {
            try {
                await axios.delete(`http://localhost:8080/api/services/${id}`);
                triggerToast(`Đã xóa món: ${name}`);
                fetchData();
            } catch (err) { triggerToast("Không thể xóa!"); }
        }
    };

    // --- XỬ LÝ ORDER ---
    const handleOrderSubmit = async () => {
        const selectedRoom = activeBookings.find(b => b.bookingId === parseInt(orderForm.bookingId));
        const selectedSrv = services.find(s => s.serviceId === parseInt(orderForm.serviceId));
        try {
            await axios.post('http://localhost:8080/api/service-usages', null, {
                params: { bookingId: orderForm.bookingId, serviceId: orderForm.serviceId, quantity: orderForm.quantity }
            });
            triggerToast(`Phòng ${selectedRoom?.room?.roomNumber} gọi Dịch vụ - ${orderForm.quantity} ${selectedSrv?.serviceName}`);
            setShowOrderModal(false);
        } catch (err) { triggerToast("Lỗi gọi món!"); }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div style={{ padding: '30px', backgroundColor: '#f5f7f9', minHeight: '100vh', position: 'relative' }}>

            {/* CSS CHO ANIMATION MỜ DẦN */}
            <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(20px); }
        }
        .toast-animate {
          animation: fadeOut 3s forwards;
        }
      `}</style>

            {/* TOAST MESSAGE GÓC DƯỚI BÊN PHẢI */}
            {toast.show && (
                <div className="toast-animate" style={toastStyle}>
                    <div style={{ fontWeight: 'bold', color: '#125c61', marginBottom: '3px' }}>Thông báo hệ thống</div>
                    <div style={{ color: '#555', fontSize: '14px' }}>{toast.message}</div>
                </div>
            )}

            {/* GIAO DIỆN CHÍNH */}
            <div style={bannerStyle}>
                <h1 style={{ color: '#125c61', margin: 0 }}>🍽️ DỊCH VỤ & ORDER</h1>
                <p style={{ color: '#7f8c8d', fontSize: '14px' }}>HOTEL UEH BOUTIQUE - QUẢN LÝ DỊCH VỤ</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => { setIsEditing(false); setServiceForm({serviceName:'', unitPrice:''}); setShowServiceModal(true); }} style={btnStyle}>➕ Thêm dịch vụ</button>
                <button onClick={() => setShowOrderModal(true)} style={{ ...btnStyle, backgroundColor: '#f39c12' }}>🛎️ Gọi dịch vụ (Order)</button>
            </div>

            <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#125c61', color: 'white' }}>
                        <th style={thStyle}>TÊN DỊCH VỤ</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>ĐƠN GIÁ</th>
                        <th style={thStyle}>HÀNH ĐỘNG</th>
                    </tr>
                    </thead>
                    <tbody>
                    {services.map(s => (
                        <tr key={s.serviceId} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tdStyle}>{s.serviceName}</td>
                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>{formatCurrency(s.unitPrice)}</td>
                            <td style={tdStyle}>
                                <button onClick={() => { setIsEditing(true); setServiceForm(s); setShowServiceModal(true); }} style={actionBtnStyle}>Sửa</button>
                                <button onClick={() => handleDelete(s.serviceId, s.serviceName)} style={{ ...actionBtnStyle, color: '#e74c3c' }}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODALS (Thêm/Sửa/Order) --- */}
            {showServiceModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>{isEditing ? 'Sửa dịch vụ' : 'Thêm dịch vụ'}</h3>
                        <input style={inputStyle} placeholder="Tên dịch vụ..." value={serviceForm.serviceName} onChange={e => setServiceForm({...serviceForm, serviceName: e.target.value})} />
                        <input type="number" style={inputStyle} placeholder="Giá tiền..." value={serviceForm.unitPrice} onChange={e => setServiceForm({...serviceForm, unitPrice: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowServiceModal(false)} style={cancelBtnStyle}>Hủy</button>
                            <button onClick={handleSaveService} style={confirmBtnStyle}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {showOrderModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: '#f39c12' }}>🛎️ Order Dịch Vụ</h3>
                        <label style={labelStyle}>Phòng đang ở:</label>
                        <select style={inputStyle} onChange={e => setOrderForm({...orderForm, bookingId: e.target.value})}>
                            <option value="">-- Chọn phòng --</option>
                            {activeBookings.map(b => <option key={b.bookingId} value={b.bookingId}>{b.room?.roomNumber}</option>)}
                        </select>
                        <label style={labelStyle}>Món gọi:</label>
                        <select style={inputStyle} onChange={e => setOrderForm({...orderForm, serviceId: e.target.value})}>
                            <option value="">-- Chọn món --</option>
                            {services.map(s => <option key={s.serviceId} value={s.serviceId}>{s.serviceName}</option>)}
                        </select>
                        <label style={labelStyle}>Số lượng:</label>
                        <input type="number" min="1" style={inputStyle} value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: e.target.value})} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => setShowOrderModal(false)} style={cancelBtnStyle}>Đóng</button>
                            <button onClick={handleOrderSubmit} style={{ ...confirmBtnStyle, backgroundColor: '#f39c12' }}>Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- STYLES ---
const toastStyle = {
    position: 'fixed', bottom: '30px', right: '30px',
    backgroundColor: 'white', padding: '15px 25px', borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 9999,
    borderLeft: '6px solid #125c61', minWidth: '250px'
};
const bannerStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px', textAlign: 'center' };
const cardStyle = { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' };
const thStyle = { padding: '15px', fontSize: '13px' };
const tdStyle = { padding: '15px', textAlign: 'center' };
const btnStyle = { padding: '10px 20px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const actionBtnStyle = { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '350px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666' };
const confirmBtnStyle = { flex: 1, padding: '10px', backgroundColor: '#125c61', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { flex: 1, padding: '10px', backgroundColor: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' };

export default ServiceManager;