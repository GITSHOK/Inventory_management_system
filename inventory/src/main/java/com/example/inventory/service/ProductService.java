package com.example.inventory.service;

import com.example.inventory.model.Product;
import com.example.inventory.repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.util.List;


@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository){
        this.productRepository = productRepository;
    }

    public Product addProduct(Product product){
        return productRepository.save(product);
    }
    public List<Product> getAllProducts(){
        return productRepository.findAll();
    }
    public Product findById(String id){
        return productRepository.findById(id).orElse(null);
    }
    public Product updateProduct(String id, Product product){
        Product existingProduct = findById(id);

        if(existingProduct == null){
            return null;
        }

        existingProduct.setName(product.getName());
        existingProduct.setPrice(product.getPrice());
        existingProduct.setQuantity(product.getQuantity());
        existingProduct.setCategory(product.getCategory());

        return productRepository.save(existingProduct);
    }

    public void deleteProduct(String id){
        productRepository.deleteById(id);
    }

    public List<Product> getLowStockProducts(){
        return productRepository.findByQuantityLessThan(5);
    }
    public List<Product> ElectronicProducts(String category){
            return productRepository.findByCategory(category);
    }
    public Product stockOut(String id, int quantity){
        Product product = productRepository.findById(id).orElse(null);


        if(product == null){
            return null;
        }
        if(product.getQuantity() < quantity){
            return null;
        }

        product.setQuantity(product.getQuantity() - quantity);
        return productRepository.save(product);

    }

    public Product stockIn(String id, int quantity){
        Product product = productRepository.findById(id).orElse(null);

        if(product == null){
            return null;
        }
        product.setQuantity(product.getQuantity() + quantity);
        return productRepository.save(product);
    }
}
