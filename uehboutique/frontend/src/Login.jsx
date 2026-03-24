import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Thêm công cụ chuyển trang

const hotelBackgroundImage = 'url(https://th.bing.com/th/id/R.9b7be32cbf8aadb87903dfb4104165fe?rik=RETbHgb3kPR0zQ&pid=ImgRaw&r=0)';

function Login() {
    const [currentScreen, setCurrentScreen] = useState('login');
    const [modalState, setModalState] = useState('none');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate(); // Khởi tạo xe ôm chở đi trang khác

    const handleLogin = (e) => {
        e.preventDefault();
        if (email === 'test@sai.com') {
            setModalState('errorAccountNotFound');
        } else if (password === 'sai') {
            setModalState('errorPassword');
        } else if (email && password) {
            // ĐĂNG NHẬP THÀNH CÔNG -> CHUYỂN SANG TRANG HOME
            navigate('/home');
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        setModalState('success');
    };

    // --- Bác giữ nguyên toàn bộ phần CSS (pageStyle, formCardStyle,...) ở đây ---
    const pageStyle = { backgroundImage: hotelBackgroundImage, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" };
    const formCardStyle = { backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(12px)', padding: '60px 80px', borderRadius: '30px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', width: '450px', textAlign: 'center', position: 'relative', transition: 'all 0.3s ease' };
    const inputStyle = { width: '100%', padding: '15px 20px', margin: '10px 0 20px 0', borderRadius: '10px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box', backgroundColor: 'white' };
    const submitButtonStyle = { backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '10px', padding: '15px', fontSize: '18px', fontWeight: 'bold', width: '100%', cursor: 'pointer', transition: 'background-color 0.3s' };
    const linkStyle = { color: '#3498db', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' };
    const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
    const modalCardStyle = { backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(15px)', padding: '40px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)', maxWidth: '380px' };
    const modalIconStyle = (color) => ({ fontSize: '60px', color: color, marginBottom: '20px' });
    const modalTextStyle = { fontSize: '18px', color: '#333', marginBottom: '30px' };

    return (
        <div style={pageStyle}>
            {/* Pop-up */}
            {modalState !== 'none' && (
                <div style={modalOverlayStyle} onClick={() => setModalState('none')}>
                    <div style={modalCardStyle} onClick={e => e.stopPropagation()}>
                        {modalState === 'success' && (<><div style={modalIconStyle('#2ecc71')}>✓</div><p style={modalTextStyle}>Liên kết đặt lại mật khẩu đã được gửi đến email.</p><button style={{...submitButtonStyle, width: 'auto', padding: '10px 40px'}} onClick={() => setModalState('none')}>OK</button></>)}
                        {modalState === 'errorPassword' && (<><div style={modalIconStyle('#e74c3c')}>✕</div><p style={modalTextStyle}>Sai mật khẩu</p><button style={{...submitButtonStyle, width: 'auto', padding: '10px 40px'}} onClick={() => setModalState('none')}>Thử lại</button></>)}
                        {modalState === 'errorAccountNotFound' && (<><div style={modalIconStyle('#e74c3c')}>✕</div><p style={modalTextStyle}>Tài khoản đăng nhập không tồn tại!</p><button style={{...submitButtonStyle, width: 'auto', padding: '10px 40px'}} onClick={() => setModalState('none')}>Thử lại</button></>)}
                    </div>
                </div>
            )}

            {/* Form Card */}
            <div style={formCardStyle}>
                <div style={{fontSize: '50px', marginBottom: '15px'}}>🏨</div>
                <div style={{fontSize: '12px', color: '#666', marginBottom: '25px'}}>UEH BOUTIQUE HOTEL</div>

                {currentScreen === 'login' ? (
                    <form onSubmit={handleLogin}>
                        <h2 style={{textTransform: 'uppercase', marginBottom: '35px', color: '#333'}}>CHÀO MỪNG TRỞ LẠI!</h2>
                        <div style={{textAlign: 'left'}}>
                            <label style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>Email *</label>
                            <input type="email" style={inputStyle} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                            <label style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>Mật khẩu *</label>
                            <div style={{position: 'relative'}}>
                                <input type={showPassword ? 'text' : 'password'} style={inputStyle} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                                <span style={{position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#999', fontSize: '20px'}} onClick={() => setShowPassword(!showPassword)}>{showPassword ? '👁️' : '👁️‍🗨️'}</span>
                            </div>
                        </div>
                        <div style={{textAlign: 'left', marginBottom: '35px'}}><a style={linkStyle} onClick={() => setCurrentScreen('forgotPassword')}>Quên mật khẩu?</a></div>
                        <button type="submit" style={submitButtonStyle}>Đăng nhập</button>
                    </form>
                ) : (
                    <>
                        <button style={{position: 'absolute', top: '20px', right: '20px', fontSize: '24px', cursor: 'pointer', color: '#666', background: 'none', border: 'none'}} onClick={() => setCurrentScreen('login')}>✕</button>
                        <form onSubmit={handleForgotPassword}>
                            <h2 style={{textTransform: 'uppercase', marginBottom: '35px', color: '#333'}}>QUÊN MẬT KHẨU?</h2>
                            <div style={{textAlign: 'left'}}>
                                <label style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>Email của bạn *</label>
                                <input type="email" style={inputStyle} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" style={submitButtonStyle}>Đặt lại mật khẩu</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default Login; // Đổi tên xuất ra là Login