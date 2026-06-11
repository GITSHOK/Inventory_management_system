package com.example.inventory.repository;

import com.example.inventory.model.Product;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ProductRepository
        extends MongoRepository<Product, String> {
        List<Product> findByQuantityLessThan(int quantity);
        List<Product> findByCategory(String category);
}