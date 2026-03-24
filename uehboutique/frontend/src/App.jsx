import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Layout from './Layout';
import Dashboard from './Dashboard';
import BookingInfo from './BookingInfo';
import RoomStatus from './RoomStatus'; // Đổi tên từ RoomStatus thành RoomStatus
import ServiceManager from './ServiceManager';
import Invoices from './InvoiceManager';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route Đăng nhập không có Menu */}
                <Route path="/" element={<Login />} />

                {/* Các Route nằm trong Layout (Có thanh Menu) */}
                <Route element={<Layout />}>
                    <Route path="/home" element={<Dashboard />} />
                    <Route path="/booking" element={<BookingInfo />} />
                    <Route path="/rooms" element={<RoomStatus />} />
                    <Route path="/services" element={<ServiceManager />} />
                    <Route path="/invoices" element={<Invoices />} />
                    {/* Thêm các route khác ở đây sau */}
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;