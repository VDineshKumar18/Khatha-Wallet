package com.khathabook.ai.utils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.nio.FloatBuffer;

public class ImagePreprocessor {

    public static FloatBuffer preprocess(InputStream imageStream) throws Exception {

        BufferedImage image = ImageIO.read(imageStream);

        BufferedImage resized =
                new BufferedImage(224, 224, BufferedImage.TYPE_3BYTE_BGR);

        Graphics2D g = resized.createGraphics();
        g.drawImage(image, 0, 0, 224, 224, null);
        g.dispose();

        FloatBuffer buffer = FloatBuffer.allocate(3 * 224 * 224);

        for (int y = 0; y < 224; y++) {
            for (int x = 0; x < 224; x++) {
                int rgb = resized.getRGB(x, y);
                buffer.put(((rgb >> 16) & 0xFF) / 255f);
                buffer.put(((rgb >> 8) & 0xFF) / 255f);
                buffer.put((rgb & 0xFF) / 255f);
            }
        }

        buffer.rewind();
        return buffer;
    }
}
