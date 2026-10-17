package com.dinosaurworld.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Libera o Vite local para quando o frontend for criado.
 * Não substitui um SecurityFilterChain — este backend ainda não tem autenticação.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;
    private final ApiProperties apiProperties;
    private final EscritaApiInterceptor escritaApiInterceptor;

    public CorsConfig(
            CorsProperties corsProperties,
            ApiProperties apiProperties,
            EscritaApiInterceptor escritaApiInterceptor
    ) {
        this.corsProperties = corsProperties;
        this.apiProperties = apiProperties;
        this.escritaApiInterceptor = escritaApiInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origens = corsProperties.origensPermitidas();
        if (origens.length == 0) {
            return;
        }
        String[] metodos = apiProperties.escrita()
                ? new String[]{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
                : new String[]{"GET", "OPTIONS"};
        registry.addMapping("/api/**")
                .allowedOrigins(origens)
                .allowedMethods(metodos)
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(escritaApiInterceptor).addPathPatterns("/api/**");
    }
}
