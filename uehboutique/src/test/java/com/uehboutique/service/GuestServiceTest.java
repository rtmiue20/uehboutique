package com.uehboutique.service;

import com.uehboutique.entity.Guest;
import com.uehboutique.repository.GuestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GuestServiceTest {

    @Mock
    private GuestRepository guestRepository;

    @InjectMocks
    private GuestService guestService;

    private Guest mockGuest;

    @BeforeEach
    void setUp() {
        // Chuẩn bị dữ liệu mẫu chung cho các test
        mockGuest = new Guest();
        // Nếu Entity của bạn có setGuestId, hãy set vào đây. Ví dụ: mockGuest.setGuestId(1);
        mockGuest.setGuestName("Nguyen Van A");
        mockGuest.setPhone("0123456789");
    }

    // ==========================================
    // 1. TEST THÊM KHÁCH HÀNG
    // ==========================================
    @Test
    void testSaveGuest() {
        // Arrange
        when(guestRepository.save(any(Guest.class))).thenReturn(mockGuest);

        // Act
        Guest result = guestService.saveGuest(mockGuest);

        // Assert
        assertNotNull(result);
        assertEquals("Nguyen Van A", result.getGuestName());
        verify(guestRepository, times(1)).save(mockGuest);
    }

    // ==========================================
    // 2. TEST LẤY DANH SÁCH CÓ PHÂN TRANG
    // ==========================================
    @Test
    void testGetAllGuests() {
        // Arrange
        Guest guest2 = new Guest();
        guest2.setGuestName("Tran Thi B");
        List<Guest> guestList = Arrays.asList(mockGuest, guest2);

        // Giả lập Page (Trang) chứa danh sách khách hàng
        Page<Guest> mockPage = new PageImpl<>(guestList);
        when(guestRepository.findAll(any(PageRequest.class))).thenReturn(mockPage);

        // Act (Lấy trang 0, mỗi trang 10 người)
        Page<Guest> result = guestService.getAllGuests(0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("Nguyen Van A", result.getContent().get(0).getGuestName());
        verify(guestRepository, times(1)).findAll(any(PageRequest.class));
    }

    // ==========================================
    // 3. TEST TÌM KHÁCH THEO ID
    // ==========================================
    @Test
    void testGetGuestById_Found() {
        when(guestRepository.findById(1)).thenReturn(Optional.of(mockGuest));

        Optional<Guest> result = guestService.getGuestById(1);

        assertTrue(result.isPresent());
        assertEquals("Nguyen Van A", result.get().getGuestName());
    }

    @Test
    void testGetGuestById_NotFound() {
        when(guestRepository.findById(99)).thenReturn(Optional.empty());

        Optional<Guest> result = guestService.getGuestById(99);

        assertFalse(result.isPresent());
    }

    // ==========================================
    // 4. TEST TÌM KHÁCH THEO SĐT
    // ==========================================
    @Test
    void testGetGuestByPhone() {
        when(guestRepository.findByPhone("0123456789")).thenReturn(Optional.of(mockGuest));

        Optional<Guest> result = guestService.getGuestByPhone("0123456789");

        assertTrue(result.isPresent());
        assertEquals("0123456789", result.get().getPhone());
    }

    // ==========================================
    // 5. TEST CẬP NHẬT THÔNG TIN KHÁCH HÀNG
    // ==========================================
    @Test
    void testUpdateGuest_Success() {
        // Arrange
        Guest updateDetails = new Guest();
        updateDetails.setGuestName("Nguyen Van A - Updated");
        updateDetails.setPhone("0987654321");

        when(guestRepository.findById(1)).thenReturn(Optional.of(mockGuest));
        when(guestRepository.save(any(Guest.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Guest result = guestService.updateGuest(1, updateDetails);

        // Assert
        assertNotNull(result);
        assertEquals("Nguyen Van A - Updated", result.getGuestName());
        assertEquals("0987654321", result.getPhone());

        verify(guestRepository, times(1)).save(mockGuest);
    }

    @Test
    void testUpdateGuest_NotFound_ThrowsException() {
        Guest updateDetails = new Guest();
        when(guestRepository.findById(99)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            guestService.updateGuest(99, updateDetails);
        });

        assertEquals("Không tìm thấy khách hàng ID: 99", exception.getMessage());
        verify(guestRepository, never()).save(any());
    }
}