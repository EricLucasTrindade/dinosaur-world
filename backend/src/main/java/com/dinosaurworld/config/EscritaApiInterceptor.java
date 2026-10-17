package com.dinosaurworld.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Trava POST/PUT/DELETE quando app.api.escrita=false.
 * Interceptor MVC de propósito: OncePerRequestFilter quebrou a compilação
 * neste Spring Boot 4.1 / spring-boot-starter-webmvc.
 */
@Component
public class EscritaApiInterceptor implements HandlerInterceptor {

    private final ApiProperties apiProperties;

    public EscritaApiInterceptor(ApiProperties apiProperties) {
        this.apiProperties = apiProperties;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        if (apiProperties.escrita()) {
            return true;
        }
        String metodo = request.getMethod();
        if (HttpMethod.GET.matches(metodo)
                || HttpMethod.HEAD.matches(metodo)
                || HttpMethod.OPTIONS.matches(metodo)) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.getWriter().write("{\"detail\":\"API somente leitura\"}");
        return false;
    }
}
