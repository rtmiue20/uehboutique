package com.uehboutique.controller;

import com.uehboutique.entity.Room;
import com.uehboutique.service.RoomService;
import com.uehboutique.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.swing.text.html.parser.Entity;
import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:5173") // Cho phép Frontend (React/Vue) gọi API mà không bị chặn lỗi CORS
@RequiredArgsConstructor
public class RoomController {
    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<?> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/status")
    public ResponseEntity<?> getAllRoomStatus(@RequestParam String status) {
        return ResponseEntity.ok(roomService.getRoomsByStatus(status));
    }

    @PutMapping("/{roomId}/clean")
    public ResponseEntity<?> cleanRoom(@PathVariable Integer roomId) {
        try{
            return ResponseEntity.ok(roomService.cleanRoom(roomId));
        }
        catch (Exception e){
            return ResponseEntity.badRequest().body("Mistakes made while cleaning the room: " + e.getMessage());
        }
    }


    // 2. Thêm phòng mới (VD: Khách sạn xây thêm phòng 107)
    // Dùng @RequestBody vì truyền một cục JSON
    @PostMapping
    public ResponseEntity<?> addRoom(@RequestBody Room room) {
        try {
            return ResponseEntity.ok(roomService.addRoom(room));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error add room: " + e.getMessage());
        }
    }

}
