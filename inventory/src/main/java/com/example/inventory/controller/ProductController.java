package com.example.inventory.controller;

import com.example.inventory.dto.StockRequest;
import com.example.inventory.model.Product;
import com.example.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/products")
public class ProductController {
    private final ProductService productService;


    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    public Product addProduct(@Valid @RequestBody Product product){
        return productService.addProduct(product);
    }

    @GetMapping
    public List<Product> getAllProducts(){
        return productService.getAllProducts();
    }
    @GetMapping("/{id}")
    public Product findById(@PathVariable String id){
        return productService.findById(id);
    }
    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable String id, @RequestBody Product product){
        return productService.updateProduct(id,product);
    }
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
    }
    @GetMapping("/low-stock")
    public List<Product> LowStockProducts(){
        return productService.getLowStockProducts();
    }
    @GetMapping("/category/{category}")
    public List<Product> getProductsByCategory(@PathVariable String category){
        return productService.ElectronicProducts(category);
    }

    @PutMapping("/{id}/stock-out")
    public Product stockOut(@PathVariable String id,
                            @RequestBody StockRequest request) {

        return productService.stockOut(id, request.getQuantity());
    }

    @PutMapping("/{id}/stock-in")
    public Product stockIn(@PathVariable String id, @RequestBody StockRequest request){
        return productService.stockIn(id,request.getQuantity());
    }


}
