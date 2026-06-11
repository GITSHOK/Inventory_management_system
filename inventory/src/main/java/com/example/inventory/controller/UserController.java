package com.example.inventory.controller;

import com.example.inventory.model.LoginRequest;
import com.example.inventory.model.Product;
import com.example.inventory.model.User;
import com.example.inventory.service.JwtService;
import com.example.inventory.service.ProductService;
import com.example.inventory.service.UserService;
import com.sun.source.tree.BreakTree;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/user")
public class UserController {
    private final UserService userService;
    private final JwtService jwtService;

    public UserController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }


    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody User user) {
        try {
            userService.addUser(user);
            return ResponseEntity.ok("User registered");
        } catch (RuntimeException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }
    @PostMapping("/login")
    public String login(@RequestBody LoginRequest request){

        String token = userService.login(
                request.getEmail(),
                request.getPassword()
        );

        if(token != null){
            return token;
        }

        return "Invalid Credentials";
    }
    @GetMapping("/validate")
    public String validate(@RequestParam String token){

        boolean valid = jwtService.validateToken(token);

        return valid ? "Valid" : "Invalid";
    }



}
