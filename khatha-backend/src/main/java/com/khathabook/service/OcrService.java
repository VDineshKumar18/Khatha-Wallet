package com.khathabook.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

@Service
public class OcrService {

    public String extractText(MultipartFile imageFile) {
        File convFile = null;
        File rot90 = null;
        File rot270 = null;
        
        try {
            convFile = convert(imageFile);
            
            Tesseract tesseract = new Tesseract();
            
            // Configure Tesseract data path (local tessdata folder)
            File tessDataFolder = new File("tessdata");
            tesseract.setDatapath(tessDataFolder.getAbsolutePath());
            tesseract.setLanguage("eng");
            tesseract.setPageSegMode(3); // Auto page segmentation
            
            System.out.println("✅ Tesseract configured with tessdata: " + tessDataFolder.getAbsolutePath());

            // Pass 1: Original orientation
            System.err.println("========================================");
            System.err.println("📖 OCR Pass 1: Original Image");
            String raw0 = tesseract.doOCR(convFile);
            System.err.println("📄 Raw Output (0°): [" + raw0.replace("\n", " ").trim() + "]");
            String result0 = extractBestText(raw0);
            if (!result0.isEmpty()) {
                System.err.println("✅ SUCCESS (0°): [" + result0 + "]");
                return result0;
            }

            // Pass 2: Rotated 90 degrees
            System.err.println("🔄 OCR Pass 2: Rotated 90°");
            rot90 = rotateImage(convFile, 90);
            String raw90 = tesseract.doOCR(rot90);
            System.err.println("📄 Raw Output (90°): [" + raw90.replace("\n", " ").trim() + "]");
            String result90 = extractBestText(raw90);
            if (!result90.isEmpty()) {
                System.err.println("✅ SUCCESS (90°): [" + result90 + "]");
                return result90;
            }

            // Pass 3: Rotated 270 degrees
            System.err.println("🔄 OCR Pass 3: Rotated 270°");
            rot270 = rotateImage(convFile, 270);
            String raw270 = tesseract.doOCR(rot270);
            System.err.println("📄 Raw Output (270°): [" + raw270.replace("\n", " ").trim() + "]");
            String result270 = extractBestText(raw270);
            if (!result270.isEmpty()) {
                System.err.println("✅ SUCCESS (270°): [" + result270 + "]");
                return result270;
            }

            System.err.println("❌ All OCR passes returned empty/invalid text");
            return "";

        } catch (Throwable e) { 
            System.err.println("❌ OCR CRASH: " + e.getMessage());
            e.printStackTrace();
            return "";
        } finally {
             deleteSafely(convFile);
             deleteSafely(rot90);
             deleteSafely(rot270);
        }
    }

    /**
     * Extract meaningful text from raw OCR output
     * Uses smart pattern matching for brands and measurements
     */
    private String extractBestText(String rawText) {
        if (rawText == null || rawText.trim().isEmpty()) {
            return "";
        }

        // Remove excessive whitespace and newlines
        String cleaned = rawText.replaceAll("\\s+", " ").trim();
        
        // If raw text is empty after basic cleanup, return empty
        if (cleaned.isEmpty()) {
            return "";
        }

        // Strategy 1: Look for brand names and measurements using regex
        StringBuilder result = new StringBuilder();
        
        // Find capitalized words (likely brand names) - at least 3 chars
        java.util.regex.Pattern brandPattern = java.util.regex.Pattern.compile("\\b[A-Z][A-Z]+\\b|\\b[A-Z][a-z]{2,}\\b");
        java.util.regex.Matcher brandMatcher = brandPattern.matcher(cleaned);
        
        while (brandMatcher.find()) {
            String word = brandMatcher.group();
            // Filter out common noise words
            if (!word.matches("(MRP|NET|USP|THE|FOR|WITH|AND)")) {
                result.append(word).append(" ");
            }
        }
        
        // Find measurements (50g, 100ml, 1.5kg, etc.)
        java.util.regex.Pattern measurePattern = java.util.regex.Pattern.compile("\\b\\d+(\\.\\d+)?\\s*(g|kg|ml|l|ltr|pcs|pc)\\b", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher measureMatcher = measurePattern.matcher(cleaned);
        
        while (measureMatcher.find()) {
            result.append(measureMatcher.group()).append(" ");
        }

        String smartResult = result.toString().trim();
        
        // If we found brand names or measurements, return them
        if (!smartResult.isEmpty()) {
            System.err.println("🎯 Smart extraction found: [" + smartResult + "]");
            return smartResult;
        }

        // Strategy 2: Extract all words 3+ characters (more lenient)
        // This catches "gentle", "clean", "lasting", etc.
        StringBuilder words = new StringBuilder();
        java.util.regex.Pattern wordPattern = java.util.regex.Pattern.compile("\\b[a-zA-Z]{3,}\\b");
        java.util.regex.Matcher wordMatcher = wordPattern.matcher(cleaned);
        
        while (wordMatcher.find()) {
            words.append(wordMatcher.group()).append(" ");
        }
        
        String wordsResult = words.toString().trim();
        if (!wordsResult.isEmpty()) {
            System.err.println("📝 Extracted words: [" + wordsResult + "]");
            return wordsResult;
        }

        // Strategy 3: Fallback - return cleaned raw text if it has decent content
        // Basic cleanup - remove special chars but keep alphanumeric and spaces
        String basic = cleaned.replaceAll("[^a-zA-Z0-9\\s%.-]", " ")
                             .replaceAll("\\s+", " ")
                             .trim();
        
        // Must have at least 3 characters total and contain a letter
        if (basic.length() >= 3 && basic.matches(".*[a-zA-Z].*")) {
            System.err.println("⚠️ Fallback returning basic cleanup: [" + basic + "]");
            return basic;
        }

        return "";
    }

    private File rotateImage(File inputFile, double angle) throws IOException {
        BufferedImage original = ImageIO.read(inputFile);
        int w = original.getWidth();
        int h = original.getHeight();
        
        // Swap dimensions for 90/270
        BufferedImage rotated = new BufferedImage(h, w, original.getType());
        Graphics2D g = rotated.createGraphics();
        
        if (angle == 90) {
            g.translate(h, 0);
            g.rotate(Math.toRadians(90));
        } else if (angle == 270) {
            g.translate(0, w);
            g.rotate(Math.toRadians(270));
        }
        
        g.drawImage(original, 0, 0, null);
        g.dispose();

        File tempFile = File.createTempFile("ocr_rot_", ".png");
        ImageIO.write(rotated, "png", tempFile);
        return tempFile;
    }

    private void deleteSafely(File f) {
        if (f != null && f.exists()) f.delete();
    }

    private File convert(MultipartFile file) throws IOException {
        File convFile = new File(System.getProperty("java.io.tmpdir") + "/" + file.getOriginalFilename());
        convFile.createNewFile();
        FileOutputStream fos = new FileOutputStream(convFile);
        fos.write(file.getBytes());
        fos.close();
        return convFile;
    }
}
