package com.khathabook.service;

import ai.onnxruntime.*;
import com.khathabook.dto.AiProductResponse;
import com.khathabook.model.Product;
import com.khathabook.repository.ProductRepository;
import com.khathabook.ai.utils.ImagePreprocessor;
import com.khathabook.ai.utils.LabelMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.Optional;

@Service
public class AiProductService {

    private final ProductRepository productRepository;
    private final OcrService ocrService; // ✅ Re-enable
    private OrtEnvironment env;
    private OrtSession session;

    public AiProductService(ProductRepository productRepository, OcrService ocrService) {
        this.productRepository = productRepository;
        this.ocrService = ocrService;
    }

    @PostConstruct
    public void init() throws OrtException {
        try {
            this.env = OrtEnvironment.getEnvironment();
            // Load model from resources
            InputStream modelStream = getClass().getResourceAsStream("/models/product-detect.onnx");
            if (modelStream == null) {
                throw new RuntimeException("product-detect.onnx not found in resources!");
            }
            byte[] modelBytes = modelStream.readAllBytes();
            this.session = env.createSession(modelBytes, new OrtSession.SessionOptions());
            System.out.println("✅ ONNX Model Loaded Successfully");
        } catch (Exception e) {
            throw new RuntimeException("Failed to load ONNX model", e);
        }
    }

    // 🧠 AI Product Detection
    public AiProductResponse detectProduct(MultipartFile image) {
        try {
            // 1️⃣ Preprocess image
            FloatBuffer inputTensor =
                    ImagePreprocessor.preprocess(image.getInputStream());

            OnnxTensor tensor = OnnxTensor.createTensor(
                    env,
                    inputTensor,
                    new long[]{1, 3, 224, 224}
            );

            // 2️⃣ Run inference
            OrtSession.Result result = session.run(
                    java.util.Collections.singletonMap(
                            session.getInputNames().iterator().next(),
                            tensor
                    )
            );

            // 3️⃣ SAFELY READ MODEL OUTPUT
            Object output = result.get(0).getValue();
            float[] probabilities;

            if (output instanceof float[][][]) { probabilities = ((float[][][]) output)[0][0]; }
            else if (output instanceof float[][]) { probabilities = ((float[][]) output)[0]; }
            else if (output instanceof float[]) { probabilities = (float[]) output; }
            else { throw new RuntimeException("Unsupported ONNX output type"); }

            // 4️⃣ Prediction
            int predictedIndex = LabelMapper.argmax(probabilities);
            float confidence = probabilities[predictedIndex];

            String productName = LabelMapper.map(predictedIndex);
            
            System.out.println("🤖 AI Predicted: " + productName + " (" + confidence + ")");

            // 5️⃣ DB lookup (Use Fuzzy Search)
            Optional<Product> productOpt =
                    productRepository.findTopByNameContainingIgnoreCase(productName);
            
            // 🔄 ALWAYS RUN OCR (User Request: "extract text for all images")
            String ocrText = "Waiting for OCR...";
            if (ocrService != null) {
                 System.out.println("🔄 Running OCR (Unconditional)...");
                 try {
                     ocrText = ocrService.extractText(image);
                 } catch (Exception e) {
                     System.err.println("⚠️ OCR Error: " + e.getMessage());
                     ocrText = "";
                 }
            }

            if (productOpt.isEmpty()) {
                System.out.println("⚠️ Product not found in DB for label: " + productName);
                
                return new AiProductResponse(
                        null,
                        productName,
                        null,
                        0.0,
                        confidence,
                        ocrText // ✅ Return OCR text
                );
            }

            Product product = productOpt.get();
            System.out.println("✅ Found Product in DB: " + product.getName());

            return new AiProductResponse(
                    product.getId(),
                    product.getName(),
                    product.getBarcode(),
                    product.getPrice(),
                    confidence,
                    ocrText // ✅ Return OCR text even if found
            );

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("AI detection failed", e);
        }
    }

    // 🧹 Clean shutdown
    @PreDestroy
    public void destroy() throws Exception {
        if (session != null) session.close();
        if (env != null) env.close();
    }
}
