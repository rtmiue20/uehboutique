package com.uehboutique.service;

import com.uehboutique.entity.*;
import com.uehboutique.repository.BookingRepository;
import com.uehboutique.repository.InvoiceRepository;
import com.uehboutique.repository.RoomRepository;
import com.uehboutique.repository.ServiceUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InvoiceServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private ServiceUsageRepository serviceUsageRepository;

    @InjectMocks
    private InvoiceService invoiceService;

    private Booking mockBooking;
    private Room mockRoom;
    private List<ServiceUsage> mockUsages;

    @BeforeEach
    void setUp() {
        // Chuẩn bị dữ liệu mẫu cho mỗi lần chạy test
        RoomType mockRoomType = new RoomType();
        mockRoomType.setBasePrice(new BigDecimal("500000"));

        mockRoom = new Room();
        mockRoom.setRoomNumber("101");
        mockRoom.setStatus("Occupied");
        mockRoom.setRoomType(mockRoomType);

        mockBooking = new Booking();
        mockBooking.setBookingId(1);
        mockBooking.setStatus("Checked-in");
        mockBooking.setCheckInDate(LocalDate.now().minusDays(1)); 
        mockBooking.setRoom(mockRoom);

        com.uehboutique.entity.Service mockService = new com.uehboutique.entity.Service();
        mockService.setUnitPrice(new BigDecimal("20000"));

        ServiceUsage usage = new ServiceUsage();
        usage.setService(mockService);
        usage.setQuantity(2);

        mockUsages = new ArrayList<>();
        mockUsages.add(usage);
    }

    @Test
    void testCheckout_Success() {
        // Giả lập các Repository trả về dữ liệu mẫu
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(serviceUsageRepository.findByBooking_BookingId(1)).thenReturn(mockUsages);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        // Gọi hàm thực tế
        Invoice result = invoiceService.checkout(1, "Cash");

        // Kiểm tra kết quả
        assertNotNull(result);
        assertEquals(new BigDecimal("540000"), result.getTotalAmount()); // 500k phòng + 40k dịch vụ
        assertEquals("Check-out", mockBooking.getStatus());
        assertEquals("Dirty", mockRoom.getStatus());
    }

    @Test
    void testCheckout_BookingNotFound() {
        when(bookingRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> invoiceService.checkout(99, "Cash"));
    }

    @Test
    void testPreviewCheckout() {
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(serviceUsageRepository.findByBooking_BookingId(1)).thenReturn(mockUsages);

        Map<String, Object> preview = invoiceService.previewCheckout(1);

        assertEquals(1L, preview.get("daysStayed"));
        assertEquals(new BigDecimal("540000"), preview.get("grandTotal"));
    }
}