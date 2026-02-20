package com.khathabook.ai.utils;

public class LabelMapper {

    // 🔴 THESE NAMES MUST MATCH DB product names
    private static final String[] LABELS = {
        "Rice",
        "Sugar",
        "Oil",
        "Wheat",
        "Soap"
    };

    public static String map(int index) {
        if (index < 0 || index >= LABELS.length) {
            return "UNKNOWN";
        }
        return LABELS[index];
    }

    public static int argmax(float[] probs) {
        int maxIdx = 0;
        for (int i = 1; i < probs.length; i++) {
            if (probs[i] > probs[maxIdx]) {
                maxIdx = i;
            }
        }
        return maxIdx;
    }
}
