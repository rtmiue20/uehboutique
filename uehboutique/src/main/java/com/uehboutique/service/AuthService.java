package com.uehboutique.service;

import com.uehboutique.entity.Staff;
import com.uehboutique.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final StaffRepository staffRepository;

    public Staff login(String username, String password) {
        // 1. Tìm nhân viên theo username
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Wrong username or password")) ;
        // 2. Kiểm tra password (ở đây so sánh chuỗi cơ bản)
        if(!staff.getPassword().equals(password)){
            throw new RuntimeException("Wrong username or password");
        }
        // 3. Đúng hết thì trả về thông tin nhân viên
        return staff;
    }

    public String logout(){
        return "Logout successfully";
    }
}
