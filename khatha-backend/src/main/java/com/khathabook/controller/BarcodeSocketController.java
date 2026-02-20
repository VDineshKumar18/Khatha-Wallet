package com.khathabook.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class BarcodeSocketController {

    @MessageMapping("/barcode")
    @SendTo("/topic/barcode")
    public String receiveBarcode(String barcode) {
        System.out.println("Barcode received: " + barcode);
        return barcode;
    }
}
