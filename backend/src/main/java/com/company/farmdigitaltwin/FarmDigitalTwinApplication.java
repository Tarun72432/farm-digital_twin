package com.company.farmdigitaltwin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class FarmDigitalTwinApplication {
    public static void main(String[] args) {
        SpringApplication.run(FarmDigitalTwinApplication.class, args);
    }
}
