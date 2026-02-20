package com.khathabook.controller;

import com.khathabook.dto.AiProductResponse;
import com.khathabook.service.AiProductService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/products")
@CrossOrigin
public class ProductAiController {

    private final AiProductService aiProductService;

    public ProductAiController(AiProductService aiProductService) {
        this.aiProductService = aiProductService;
    }

    // 📷 AI PRODUCT DETECTION
    @PostMapping(
        value = "/ai-detect",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<AiProductResponse> detectProduct(
            @RequestParam("image") MultipartFile image
    ) {
        return ResponseEntity.ok(
                aiProductService.detectProduct(image)
        );
    }
}
