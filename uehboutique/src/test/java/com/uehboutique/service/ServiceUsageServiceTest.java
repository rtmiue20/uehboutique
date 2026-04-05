package com.uehboutique.service;

import com.uehboutique.entity.Booking;
import com.uehboutique.entity.ServiceUsage;
import com.uehboutique.repository.BookingRepository;
import com.uehboutique.repository.ServiceRepository;
import com.uehboutique.repository.ServiceUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ServiceUsageServiceTest {

    @Mock
    private ServiceUsageRepository serviceUsageRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ServiceRepository serviceRepository;

    @InjectMocks
    private ServiceUsageService serviceUsageService;

    private Booking mockBooking;
    private com.uehboutique.entity.Service mockService;

    @BeforeEach
    void setUp() {
        // Chuẩn bị dữ liệu phiếu đặt phòng (Booking)
        mockBooking = new Booking();
        // Giả sử có setId, tùy thuộc vào Entity của bạn

        // Chuẩn bị dữ liệu Dịch vụ (Ví dụ: Nước suối)
        mockService = new com.uehboutique.entity.Service();
        mockService.setServiceName("Nước suối");
        mockService.setUnitPrice(new BigDecimal("10000"));
    }

    // ==========================================
    // 1. TEST THÊM DỊCH VỤ VÀO PHÒNG THÀNH CÔNG
    // ==========================================
    @Test
    void testAddServiceToBooking_Success() {
        // Arrange
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(serviceRepository.findById(2)).thenReturn(Optional.of(mockService));
        when(serviceUsageRepository.save(any(ServiceUsage.class))).thenAnswer(i -> i.getArgument(0));

        // Act (Khách gọi 3 chai nước suối)
        ServiceUsage result = serviceUsageService.addServiceToBooking(1, 2, 3);

        // Assert
        assertNotNull(result);
        assertEquals(mockBooking, result.getBooking());
        assertEquals(mockService, result.getService());
        assertEquals(3, result.getQuantity());
        assertNotNull(result.getUsageTime()); // Đảm bảo thời gian gọi đã được set

        verify(serviceUsageRepository, times(1)).save(any(ServiceUsage.class));
    }

    // ==========================================
    // 2. TEST LỖI KHÔNG TÌM THẤY BOOKING
    // ==========================================
    @Test
    void testAddServiceToBooking_BookingNotFound_ThrowsException() {
        // Arrange
        when(bookingRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            serviceUsageService.addServiceToBooking(99, 2, 1);
        });

        assertEquals("Booking not found", exception.getMessage());
        verify(serviceRepository, never()).findById(any()); // Không cần tìm Service nếu Booking đã lỗi
        verify(serviceUsageRepository, never()).save(any());
    }

    // ==========================================
    // 3. TEST LỖI KHÔNG TÌM THẤY SERVICE
    // ==========================================
    @Test
    void testAddServiceToBooking_ServiceNotFound_ThrowsException() {
        // Arrange
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(serviceRepository.findById(99)).thenReturn(Optional.empty()); // Lỗi ở bước tìm Service

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            serviceUsageService.addServiceToBooking(1, 99, 1);
        });

        assertEquals("Service not found", exception.getMessage());
        verify(serviceUsageRepository, never()).save(any());
    }
}