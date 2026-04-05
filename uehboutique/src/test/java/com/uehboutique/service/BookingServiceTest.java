package com.uehboutique.service;

import com.uehboutique.entity.Booking;
import com.uehboutique.entity.Guest;
import com.uehboutique.entity.Room;
import com.uehboutique.entity.Staff;
import com.uehboutique.repository.BookingRepository;
import com.uehboutique.repository.GuestRepository;
import com.uehboutique.repository.RoomRepository;
import com.uehboutique.repository.StaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private RoomRepository roomRepository;
    @Mock
    private GuestRepository guestRepository;
    @Mock
    private StaffRepository staffRepository;

    @InjectMocks
    private BookingService bookingService;

    private Guest mockGuest;
    private Room mockRoom;
    private Staff mockStaff;
    private Booking mockBooking;

    @BeforeEach
    void setUp() {
        // Chuẩn bị dữ liệu mẫu
        mockGuest = new Guest();
        // Giả sử có setGuestId, tuỳ thuộc vào Entity của bạn

        mockRoom = new Room();
        mockRoom.setRoomNumber("101");
        mockRoom.setStatus("Empty");

        mockStaff = new Staff();

        mockBooking = new Booking();
        mockBooking.setGuest(mockGuest);
        mockBooking.setRoom(mockRoom);
        mockBooking.setStaff(mockStaff);
        mockBooking.setStatus("Reserved");
    }

    // ==========================================
    // 1. TEST CHỨC NĂNG CHECK-IN TRỰC TIẾP
    // ==========================================
    @Test
    void testProcessCheckIn_Success() {
        // Arrange
        when(guestRepository.findById(1)).thenReturn(Optional.of(mockGuest));
        when(roomRepository.findById(2)).thenReturn(Optional.of(mockRoom));
        when(staffRepository.findById(3)).thenReturn(Optional.of(mockStaff));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        LocalDate checkOutDate = LocalDate.now().plusDays(2);

        // Act
        Booking result = bookingService.processCheckIn(1, 2, 3, checkOutDate);

        // Assert
        assertNotNull(result);
        assertEquals("Check-in", result.getStatus());
        assertEquals("Currently", mockRoom.getStatus()); // Đảm bảo phòng đã đổi sang trạng thái đang ở

        verify(roomRepository, times(1)).save(mockRoom);
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    void testProcessCheckIn_RoomNotEmpty_ThrowsException() {
        // Arrange: Cố tình set phòng đang có người ở
        mockRoom.setStatus("Currently");
        when(guestRepository.findById(1)).thenReturn(Optional.of(mockGuest));
        when(roomRepository.findById(2)).thenReturn(Optional.of(mockRoom));
        when(staffRepository.findById(3)).thenReturn(Optional.of(mockStaff));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            bookingService.processCheckIn(1, 2, 3, LocalDate.now());
        });

        assertTrue(exception.getMessage().contains("not empty, can not Check-in"));
        verify(bookingRepository, never()).save(any());
    }

    // ==========================================
    // 2. TEST CHỨC NĂNG CHUYỂN PHÒNG (TRANSFER ROOM)
    // ==========================================
    @Test
    void testTransferRoom_Success() {
        // Arrange
        mockBooking.setStatus("Check-in"); // Đang ở mới được chuyển
        Room newRoom = new Room();
        newRoom.setRoomNumber("102");
        newRoom.setStatus("Empty"); // Phòng mới phải trống

        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(roomRepository.findById(99)).thenReturn(Optional.of(newRoom));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Booking result = bookingService.transferRoom(1, 99);

        // Assert
        assertEquals(newRoom, result.getRoom());
        assertEquals("Dirty", mockRoom.getStatus()); // Phòng cũ thành Dirty
        assertEquals("Currently", newRoom.getStatus()); // Phòng mới thành Currently

        verify(roomRepository, times(1)).save(mockRoom);
        verify(roomRepository, times(1)).save(newRoom);
        verify(bookingRepository, times(1)).save(mockBooking);
    }

    @Test
    void testTransferRoom_AlreadyCheckedOut_ThrowsException() {
        // Arrange
        mockBooking.setStatus("Check-out");
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            bookingService.transferRoom(1, 99);
        });
    }

    // ==========================================
    // 3. TEST CHỨC NĂNG ĐẶT PHÒNG TRƯỚC (RESERVE)
    // ==========================================
    @Test
    void testReserveRoom_Success() {
        // Arrange
        when(guestRepository.findById(1)).thenReturn(Optional.of(mockGuest));
        when(roomRepository.findById(2)).thenReturn(Optional.of(mockRoom));
        when(staffRepository.findById(3)).thenReturn(Optional.of(mockStaff));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Booking result = bookingService.reserveRoom(1, 2, 3, LocalDate.now(), LocalDate.now().plusDays(1));

        // Assert
        assertEquals("Reserved", result.getStatus());
        assertEquals("Booked", mockRoom.getStatus()); // Phòng bị khóa
        verify(roomRepository, times(1)).save(mockRoom);
    }

    // ==========================================
    // 4. TEST CHỨC NĂNG NHẬN PHÒNG ĐÃ ĐẶT
    // ==========================================
    @Test
    void testCheckInReservedRoom_Success() {
        // Arrange
        mockBooking.setStatus("Reserved");
        mockRoom.setStatus("Booked");
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Booking result = bookingService.checkInReservedRoom(1);

        // Assert
        assertEquals("Check-in", result.getStatus());
        assertEquals("Currently", result.getRoom().getStatus());
        verify(roomRepository, times(1)).save(mockRoom);
    }

    // ==========================================
    // 5. TEST CHỨC NĂNG HỦY PHÒNG (CANCEL)
    // ==========================================
    @Test
    void testCancelBooking_Success() {
        // Arrange
        mockBooking.setStatus("Reserved");
        mockRoom.setStatus("Booked");
        when(bookingRepository.findById(1)).thenReturn(Optional.of(mockBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Booking result = bookingService.cancelBooking(1);

        // Assert
        assertEquals("Canceled", result.getStatus());
        assertEquals("Empty", result.getRoom().getStatus()); // Nhả phòng lại
        verify(roomRepository, times(1)).save(mockRoom);
    }
}