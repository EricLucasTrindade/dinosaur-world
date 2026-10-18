package com.dinosaurworld.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed")
public record SeedProperties(boolean enabled, String fonte) {

    /** true só quando a fonte explícita é java. Default (csv ou vazio) usa o CSV. */
    public boolean usaJava() {
        return fonte != null && "java".equalsIgnoreCase(fonte.trim());
    }
}
