import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const backgroundImages = [
    'url(https://th.bing.com/th/id/R.9b7be32cbf8aadb87903dfb4104165fe?rik=RETbHgb3kPR0zQ&pid=ImgRaw&r=0)',
    'url(https://hotel.ueh.edu.vn/wp-content/uploads/2021/02/01-1.jpg)',
    'url(https://hotel.ueh.edu.vn/wp-content/uploads/2021/02/04.jpg)',
    'url(https://hotel.ueh.edu.vn/wp-content/uploads/2021/02/06.jpg)',
    'url(https://vietnamluxuryexpress.com/wp-content/uploads/southern-vietnamese-food.jpg)',
    'url(https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2c/88/bf/20/hanoi-deepfried-pork.jpg?w=900&h=500&s=1)'
];

function Login() {
    const [currentScreen, setCurrentScreen] = useState('login');
    const [modalState, setModalState] = useState('none');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);

    const navigate = useNavigate();

    // 1. Hiệu ứng đổi ảnh nền
    useEffect(() => {
        const bgTimer = setInterval(() => {
            setBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(bgTimer);
    }, []);

    // 2. Hiệu ứng tự động tắt thông báo sau 3 giây
    useEffect(() => {
        if (modalState !== 'none') {
            const timer = setTimeout(() => {
                setModalState('none');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [modalState]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setModalState('errorEmailFormat');
            return;
        }
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        if (!hasLetter || !hasNumber) {
            setModalState('errorPasswordStrength');
            return;
        }
        if (email === 'test@sai.com') {
            setModalState('errorAccountNotFound');
        } else if (password === 'sai123') {
            setModalState('errorPassword');
        } else if (email && password) {
            navigate('/home');
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        if (!email.includes('@')) {
            setModalState('errorEmailFormat');
            return;
        }
        setModalState('success');
    };

    // --- STYLE ---
    const pageStyle = {
        backgroundImage: backgroundImages[bgIndex],
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        transition: 'background-image 1.5s ease-in-out',
        position: 'relative',
        overflow: 'hidden'
    };

    const toastStyle = {
        position: 'fixed',
        top: modalState !== 'none' ? '20px' : '-100px',
        right: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        padding: '15px 25px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        zIndex: 9999,
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        borderLeft: `6px solid ${modalState === 'success' ? '#2ecc71' : '#e74c3c'}`
    };

    const formCardStyle = { backgroundColor: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(12px)', padding: '60px 80px', borderRadius: '30px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', width: '450px', textAlign: 'center', position: 'relative', transition: 'all 0.3s ease' };
    const inputStyle = { width: '100%', padding: '15px 20px', margin: '10px 0 20px 0', borderRadius: '10px', border: '1px solid #ccc', fontSize: '16px', boxSizing: 'border-box', backgroundColor: 'white' };
    const submitButtonStyle = { backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '10px', padding: '15px', fontSize: '18px', fontWeight: 'bold', width: '100%', cursor: 'pointer', transition: 'background-color 0.3s' };
    const linkStyle = { color: '#3498db', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' };

    // Hàm lấy nội dung thông báo (đã thêm lại icon để hiển thị đẹp hơn)
    const getModalContent = () => {
        switch(modalState) {
            case 'success': return {text: 'Liên kết đã được gửi!' };
            case 'errorEmailFormat': return {text: 'Email không hợp lệ' };
            case 'errorPasswordStrength': return {text: 'Mật khẩu cần cả chữ và số' };
            case 'errorPassword': return {text: 'Sai mật khẩu' };
            case 'errorAccountNotFound': return {text: 'Không tìm thấy tài khoản' };
            default: return {text: '' };
        }
    };

    const content = getModalContent();

    return (
        <div style={pageStyle}>
            {/* Thanh thông báo Toast */}
            <div style={toastStyle}>
                <span style={{fontSize: '24px'}}>{content.icon}</span>
                <span style={{fontSize: '15px', fontWeight: '600', color: '#333'}}>{content.text}</span>
                <div
                    onClick={() => setModalState('none')}
                    style={{marginLeft: '10px', cursor: 'pointer', color: '#999', fontWeight: 'bold'}}
                >✕</div>
            </div>

            <div style={formCardStyle}>
                {/* LOGO MỚI */}
                <img
                    src="https://hotel.ueh.edu.vn/wp-content/uploads/2021/02/logo.svg"
                    alt="UEH Boutique Hotel Logo"
                    style={{ width: '220px', marginBottom: '30px', filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }}
                />

                {currentScreen === 'login' ? (
                    <form onSubmit={handleLogin}>
                        <h2 style={{textTransform: 'uppercase', marginBottom: '35px', color: '#333', letterSpacing: '1px'}}>Chào mừng trở lại!</h2>
                        <div style={{textAlign: 'left'}}>
                            <label style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>Email *</label>
                            <input type="text" style={inputStyle} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                            <label style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>Mật khẩu *</label>
                            <div style={{position: 'relative'}}>
                                <input type={showPassword ? 'text' : 'password'} style={inputStyle} placeholder="Mật khẩu (Gồm chữ và số)" value={password} onChange={e => setPassword(e.target.value)} required />
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
                            <h2 style={{textTransform: 'uppercase', marginBottom: '35px', color: '#333'}}>Quên mật khẩu?</h2>
                            <div style={{textAlign: 'left'}}>
                                <label style={{color: 'red', fontSize: '14px', fontWeight: 'bold'}}>Email của bạn *</label>
                                <input type="text" style={inputStyle} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" style={submitButtonStyle}>Đặt lại mật khẩu</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

export default Login;