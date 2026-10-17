package com.dinosaurworld;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class DinosaurWorldApplication {

    public static void main(String[] args) {
        SpringApplication.run(DinosaurWorldApplication.class, args);
    }
}
