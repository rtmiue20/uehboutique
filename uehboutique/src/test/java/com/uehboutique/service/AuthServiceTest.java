package com.uehboutique.service;

import com.uehboutique.entity.Staff;
import com.uehboutique.repository.StaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private StaffRepository staffRepository;

    @InjectMocks
    private AuthService authService;

    private Staff mockStaff;

    @BeforeEach
    void setUp() {
        // Chuẩn bị một nhân viên giả để test
        mockStaff = new Staff();
        mockStaff.setUsername("admin");
        mockStaff.setPassword("123456");
    }

    // ==========================================
    // 1. TEST ĐĂNG NHẬP THÀNH CÔNG
    // ==========================================
    @Test
    void testLogin_Success() {
        // Arrange: Dạy cho mock repository trả về nhân viên giả khi tìm "admin"
        when(staffRepository.findByUsername("admin")).thenReturn(Optional.of(mockStaff));

        // Act: Gọi hàm login với đúng tài khoản mật khẩu
        Staff result = authService.login("admin", "123456");

        // Assert: Xác nhận kết quả trả về đúng nhân viên đó
        assertNotNull(result);
        assertEquals("admin", result.getUsername());
        assertEquals("123456", result.getPassword());

        // Đảm bảo hàm findByUsername thực sự được gọi 1 lần
        verify(staffRepository, times(1)).findByUsername("admin");
    }

    // ==========================================
    // 2. TEST ĐĂNG NHẬP SAI USERNAME (Không tìm thấy)
    // ==========================================
    @Test
    void testLogin_WrongUsername_ThrowsException() {
        // Arrange: Dạy cho repository trả về rỗng khi tìm tài khoản lạ
        when(staffRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

        // Act & Assert: Xác nhận sẽ ném ra lỗi RuntimeException với đúng câu thông báo
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login("unknown_user", "123456");
        });

        assertEquals("Wrong username or password", exception.getMessage());
        verify(staffRepository, times(1)).findByUsername("unknown_user");
    }

    // ==========================================
    // 3. TEST ĐĂNG NHẬP SAI PASSWORD
    // ==========================================
    @Test
    void testLogin_WrongPassword_ThrowsException() {
        // Arrange: Vẫn tìm ra tài khoản "admin"
        when(staffRepository.findByUsername("admin")).thenReturn(Optional.of(mockStaff));

        // Act & Assert: Nhưng khi gọi truyền sai mật khẩu thì sẽ quăng lỗi
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authService.login("admin", "wrong_password");
        });

        assertEquals("Wrong username or password", exception.getMessage());
        verify(staffRepository, times(1)).findByUsername("admin");
    }

    // ==========================================
    // 4. TEST ĐĂNG XUẤT
    // ==========================================
    @Test
    void testLogout_Success() {
        // Act
        String result = authService.logout();

        // Assert
        assertEquals("Logout successfully", result);
    }
}