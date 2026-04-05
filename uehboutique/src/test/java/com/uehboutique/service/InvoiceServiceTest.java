package com.uehboutique.service;

import com.uehboutique.entity.Booking;
import com.uehboutique.entity.Invoice;
import com.uehboutique.entity.Room;
import com.uehboutique.entity.RoomType;
import com.uehboutique.entity.ServiceUsage;
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
        // 1. Tạo dữ liệu giả cho RoomType (Giá phòng 500k)
        RoomType mockRoomType = new RoomType();
        mockRoomType.setBasePrice(new BigDecimal("500000"));

        // 2. Tạo dữ liệu giả cho Room
        mockRoom = new Room();
        mockRoom.setRoomNumber("101");
        mockRoom.setStatus("Occupied");
        mockRoom.setRoomType(mockRoomType);

        // 3. Tạo dữ liệu giả cho Booking (Ở 2 ngày)
        mockBooking = new Booking();
        mockBooking.setBookingId(1);
        mockBooking.setStatus("Checked-in");
        mockBooking.setCheckInDate(LocalDate.now().minusDays(2));
        mockBooking.setRoom(mockRoom);

        // 4. Tạo dữ liệu giả cho Service (Sử dụng 2 dịch vụ, mỗi cái 20k -> Tổng 40k)
        com.uehboutique.entity.Service mockService = new com.uehboutique.entity.Service();
        mockService.setUnitPrice(new BigDecimal("20000"));

        ServiceUsage usage = new ServiceUsage();
        usage.setService(mockService);
        usage.setQuantity(2);

        mockUsages = new ArrayList<>();
        mockUsages.add(usage);
    }

    // ==========================================
    // TEST HÀM: checkout()
    // ==========================================
    @Test
    void testCheckout_Success() {
        // Giả lập Repository trả về mock data
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(serviceUsageRepository.findByBooking_BookingId(1)).thenReturn(mockUsages);

        // Khi gọi save Invoice, trả về chính cái Invoice đó
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        // Thực thi hàm
        Invoice result = invoiceService.checkout(1, "Cash");

        // Kiểm tra kết quả
        assertNotNull(result);
        assertEquals("Cash", result.getPaymentMethod());

        // Tiền phòng: 500k * 2 ngày = 1.000.000
        // Tiền dịch vụ: 40k
        // Tổng: 1.040.000
        assertEquals(new BigDecimal("1040000"), result.getTotalAmount());

        // Kiểm tra trạng thái đã đổi chưa
        assertEquals("Check-out", mockBooking.getStatus());
        assertEquals("Dirty", mockRoom.getStatus());

        // Kiểm tra xem các hàm lưu vào DB có được gọi không
        verify(bookingRepository, times(1)).save(mockBooking);
        verify(roomRepository, times(1)).save(mockRoom);
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
    }

    @Test
    void testCheckout_BookingNotFound_ThrowsException() {
        when(bookingRepository.findById(99)).thenReturn(Optional.empty());

        Exception exception = assertThrows(RuntimeException.class, () -> invoiceService.checkout(99, "Cash"));
        assertEquals("Không tìm thấy Booking!", exception.getMessage());

        // Đảm bảo không lưu bậy bạ vào DB
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    void testCheckout_AlreadyCheckedOut_ThrowsException() {
        mockBooking.setStatus("Check-out");
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));

        Exception exception = assertThrows(RuntimeException.class, () -> invoiceService.checkout(1, "Cash"));
        assertEquals("Phòng này đã được check-out rồi!", exception.getMessage());
    }

    // ==========================================
    // TEST HÀM: previewCheckout()
    // ==========================================
    @Test
    void testPreviewCheckout_Success() {
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(serviceUsageRepository.findByBooking_BookingId(1)).thenReturn(mockUsages);

        Map<String, Object> preview = invoiceService.previewCheckout(1);

        assertNotNull(preview);
        assertEquals(2L, preview.get("daysStayed"));
        assertEquals(new BigDecimal("1000000"), preview.get("roomTotal"));
        assertEquals(new BigDecimal("40000"), preview.get("serviceTotal"));
        assertEquals(new BigDecimal("1040000"), preview.get("grandTotal"));
    }

    @Test
    void testPreviewCheckout_BookingNotFound_ThrowsException() {
        when(bookingRepository.findById(99)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> invoiceService.previewCheckout(99));
    }

    // ==========================================
    // TEST HÀM: getAllInvoices()
    // ==========================================
    @Test
    void testGetAllInvoices() {
        List<Invoice> mockInvoices = new ArrayList<>();
        mockInvoices.add(new Invoice());
        mockInvoices.add(new Invoice());

        when(invoiceRepository.findAll()).thenReturn(mockInvoices);

        List<Invoice> result = invoiceService.getAllInvoices();

        assertEquals(2, result.size());
        verify(invoiceRepository, times(1)).findAll();
    }
}