package com.uehboutique.service;

import com.uehboutique.repository.ServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ServiceServiceTest {

    @Mock
    private ServiceRepository serviceRepository;

    @InjectMocks
    private ServiceService serviceService;

    // Phải dùng đường dẫn đầy đủ vì trùng tên với Annotation @Service
    private com.uehboutique.entity.Service mockService;

    @BeforeEach
    void setUp() {
        // Chuẩn bị dữ liệu mẫu (VD: 1 lon Bò húc giá 20k)
        mockService = new com.uehboutique.entity.Service();
        mockService.setServiceName("Bò húc");
        mockService.setUnitPrice(new BigDecimal("20000"));
    }

    // ==========================================
    // 1. TEST LẤY DANH SÁCH MENU DỊCH VỤ
    // ==========================================
    @Test
    void testGetAllServices() {
        // Arrange
        com.uehboutique.entity.Service service2 = new com.uehboutique.entity.Service();
        service2.setServiceName("Nước suối");
        service2.setUnitPrice(new BigDecimal("10000"));

        when(serviceRepository.findAll()).thenReturn(Arrays.asList(mockService, service2));

        // Act
        List<com.uehboutique.entity.Service> result = serviceService.getAllServices();

        // Assert
        assertEquals(2, result.size());
        assertEquals("Bò húc", result.get(0).getServiceName());
        verify(serviceRepository, times(1)).findAll();
    }

    // ==========================================
    // 2. TEST THÊM DỊCH VỤ MỚI
    // ==========================================
    @Test
    void testAddService() {
        // Arrange
        when(serviceRepository.save(any(com.uehboutique.entity.Service.class))).thenReturn(mockService);

        // Act
        com.uehboutique.entity.Service result = serviceService.addService(mockService);

        // Assert
        assertNotNull(result);
        assertEquals("Bò húc", result.getServiceName());
        assertEquals(new BigDecimal("20000"), result.getUnitPrice());
        verify(serviceRepository, times(1)).save(mockService);
    }

    // ==========================================
    // 3. TEST CẬP NHẬT DỊCH VỤ
    // ==========================================
    @Test
    void testUpdateService_Success() {
        // Arrange: Chuẩn bị thông tin muốn đổi (Giá tăng lên 25k, đổi tên)
        com.uehboutique.entity.Service updateDetails = new com.uehboutique.entity.Service();
        updateDetails.setServiceName("Bò húc (Lon lớn)");
        updateDetails.setUnitPrice(new BigDecimal("25000"));

        when(serviceRepository.findById(1)).thenReturn(Optional.of(mockService));
        when(serviceRepository.save(any(com.uehboutique.entity.Service.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        com.uehboutique.entity.Service result = serviceService.updateService(1, updateDetails);

        // Assert: Xác nhận dữ liệu đã được ghi đè thành công
        assertEquals("Bò húc (Lon lớn)", result.getServiceName());
        assertEquals(new BigDecimal("25000"), result.getUnitPrice());
        verify(serviceRepository, times(1)).save(mockService);
    }

    @Test
    void testUpdateService_NotFound_ThrowsException() {
        // Arrange
        when(serviceRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            serviceService.updateService(99, mockService);
        });

        assertEquals("Can not find service with id: 99", exception.getMessage());
        verify(serviceRepository, never()).save(any());
    }

    // ==========================================
    // 4. TEST XÓA DỊCH VỤ
    // ==========================================
    @Test
    void testDeleteService() {
        // Act
        serviceService.deleteService(1);

        // Assert: Đảm bảo hàm deleteById của Repository được gọi đúng 1 lần với ID là 1
        verify(serviceRepository, times(1)).deleteById(1);
    }
}