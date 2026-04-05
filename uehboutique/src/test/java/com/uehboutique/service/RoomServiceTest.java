package com.uehboutique.service;

import com.uehboutique.entity.Room;
import com.uehboutique.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @InjectMocks
    private RoomService roomService;

    private Room mockRoom;

    @BeforeEach
    void setUp() {
        // Chuẩn bị dữ liệu mẫu cho một phòng
        mockRoom = new Room();
        mockRoom.setRoomNumber("101");
        mockRoom.setStatus("Dirty");
    }

    // ==========================================
    // 1. TEST LẤY TẤT CẢ PHÒNG
    // ==========================================
    @Test
    void testGetAllRooms() {
        // Arrange
        Room room2 = new Room();
        room2.setRoomNumber("102");
        room2.setStatus("Empty");

        when(roomRepository.findAll()).thenReturn(Arrays.asList(mockRoom, room2));

        // Act
        List<Room> result = roomService.getAllRooms();

        // Assert
        assertEquals(2, result.size());
        verify(roomRepository, times(1)).findAll();
    }

    // ==========================================
    // 2. TEST LẤY PHÒNG THEO TRẠNG THÁI
    // ==========================================
    @Test
    void testGetRoomsByStatus() {
        // Arrange
        when(roomRepository.findByStatus("Dirty")).thenReturn(Arrays.asList(mockRoom));

        // Act
        List<Room> result = roomService.getRoomsByStatus("Dirty");

        // Assert
        assertEquals(1, result.size());
        assertEquals("Dirty", result.get(0).getStatus());
        verify(roomRepository, times(1)).findByStatus("Dirty");
    }

    // ==========================================
    // 3. TEST THÊM PHÒNG MỚI
    // ==========================================
    @Test
    void testAddRoom() {
        // Arrange
        Room newRoom = new Room();
        newRoom.setRoomNumber("201");
        // Cố tình set trạng thái khác để xem hàm có ép về "Empty" không
        newRoom.setStatus("Currently");

        when(roomRepository.save(any(Room.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Room result = roomService.addRoom(newRoom);

        // Assert
        assertNotNull(result);
        assertEquals("201", result.getRoomNumber());
        // Trạng thái phải bị ép về "Empty" theo đúng logic code của bạn
        assertEquals("Empty", result.getStatus());
        verify(roomRepository, times(1)).save(newRoom);
    }

    // ==========================================
    // 4. TEST CHỨC NĂNG DỌN PHÒNG (CLEAN ROOM)
    // ==========================================
    @Test
    void testCleanRoom_Success() {
        // Arrange: Phòng hiện tại đang "Dirty"
        when(roomRepository.findById(1)).thenReturn(Optional.of(mockRoom));
        when(roomRepository.save(any(Room.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Room result = roomService.cleanRoom(1);

        // Assert: Dọn xong phải thành "Empty"
        assertEquals("Empty", result.getStatus());
        verify(roomRepository, times(1)).save(mockRoom);
    }

    @Test
    void testCleanRoom_RoomNotFound_ThrowsException() {
        // Arrange
        when(roomRepository.findById(99)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roomService.cleanRoom(99);
        });

        assertEquals("Can not find room with id: 99", exception.getMessage());
        verify(roomRepository, never()).save(any());
    }

    @Test
    void testCleanRoom_RoomNotDirty_ThrowsException() {
        // Arrange: Cố tình set phòng đang có khách hoặc đã trống
        mockRoom.setStatus("Currently");
        when(roomRepository.findById(1)).thenReturn(Optional.of(mockRoom));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            roomService.cleanRoom(1);
        });

        assertTrue(exception.getMessage().contains("can not clean"));
        verify(roomRepository, never()).save(any()); // Không được phép lưu
    }
}