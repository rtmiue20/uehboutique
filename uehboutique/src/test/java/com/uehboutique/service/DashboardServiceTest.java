package com.uehboutique.service;

import com.uehboutique.entity.Invoice;
import com.uehboutique.entity.Room;
import com.uehboutique.repository.InvoiceRepository;
import com.uehboutique.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        // Có thể setup biến chung ở đây nếu cần
    }

    // ==========================================
    // 1. TEST CÓ DỮ LIỆU ĐẦY ĐỦ
    // ==========================================
    @Test
    void testGetDashboardStats_WithData() {
        // --- ARRANGE ---
        // 1. Chuẩn bị dữ liệu Phòng: 2 phòng Trống, 1 phòng Đang ở, 1 phòng Bẩn
        Room r1 = new Room(); r1.setStatus("Empty");
        Room r2 = new Room(); r2.setStatus("Empty");
        Room r3 = new Room(); r3.setStatus("Currently");
        Room r4 = new Room(); r4.setStatus("Dirty");

        when(roomRepository.findAll()).thenReturn(Arrays.asList(r1, r2, r3, r4));

        // 2. Chuẩn bị dữ liệu Hóa đơn
        Invoice inv1 = new Invoice();
        inv1.setTotalAmount(new BigDecimal("1000000"));
        // Lưu ý: Mình giả lập setPaymentDate dựa trên kiểu LocalDateTime. Nếu Entity của bạn là LocalDate, hãy đổi lại.
        inv1.setPaymentDate(LocalDateTime.now()); // Hóa đơn hôm nay (1 triệu)

        Invoice inv2 = new Invoice();
        inv2.setTotalAmount(new BigDecimal("500000"));
        inv2.setPaymentDate(LocalDateTime.now()); // Hóa đơn hôm nay (500k)

        Invoice inv3 = new Invoice();
        inv3.setTotalAmount(new BigDecimal("2000000"));
        inv3.setPaymentDate(LocalDateTime.now().minusDays(1)); // Hóa đơn HÔM QUA (sẽ không được cộng)

        Invoice invNull = new Invoice(); // Hóa đơn lỗi (null tiền, null ngày)

        when(invoiceRepository.findAll()).thenReturn(Arrays.asList(inv1, inv2, inv3, invNull));

        // --- ACT ---
        Map<String, Object> stats = dashboardService.getDashboardStats();

        // --- ASSERT ---
        assertNotNull(stats);

        // 1. Kiểm tra Tổng phòng (4 phòng)
        assertEquals(4, stats.get("totalRooms"));

        // 2. Kiểm tra Thống kê trạng thái phòng
        @SuppressWarnings("unchecked")
        Map<String, Long> roomStats = (Map<String, Long>) stats.get("roomStatistics");
        assertEquals(2L, roomStats.get("Empty"));
        assertEquals(1L, roomStats.get("Currently"));
        assertEquals(1L, roomStats.get("Dirty"));

        // 3. Kiểm tra Tổng doanh thu (Chỉ cộng hóa đơn hôm nay: 1tr + 500k = 1.500.000)
        // Chú ý: Nếu chạy Test bị Fail doanh thu = 0, hãy đọc lại phần "Bắt Bug" phía trên của mình để sửa file Service nhé.
        BigDecimal expectedRevenue = new BigDecimal("1500000");
        assertEquals(expectedRevenue, stats.get("todayRevenue"));
    }

    // ==========================================
    // 2. TEST KHÔNG CÓ DỮ LIỆU (KHÁCH SẠN MỚI MỞ)
    // ==========================================
    @Test
    void testGetDashboardStats_EmptyData() {
        // Arrange
        when(roomRepository.findAll()).thenReturn(Collections.emptyList());
        when(invoiceRepository.findAll()).thenReturn(Collections.emptyList());

        // Act
        Map<String, Object> stats = dashboardService.getDashboardStats();

        // Assert
        assertEquals(0, stats.get("totalRooms"));
        assertEquals(BigDecimal.ZERO, stats.get("todayRevenue"));

        @SuppressWarnings("unchecked")
        Map<String, Long> roomStats = (Map<String, Long>) stats.get("roomStatistics");
        assertTrue(roomStats.isEmpty());
    }
}