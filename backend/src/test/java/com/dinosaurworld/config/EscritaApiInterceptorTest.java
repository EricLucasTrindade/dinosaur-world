package com.dinosaurworld.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EscritaApiInterceptorTest {

    @Test
    void escritaLigada_deixaPostPassar() throws Exception {
        EscritaApiInterceptor interceptor = new EscritaApiInterceptor(new ApiProperties(true));
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean segue = interceptor.preHandle(postTaxons(), response, new Object());

        assertTrue(segue);
        assertEquals(200, response.getStatus());
    }

    @Test
    void escritaDesligada_deixaGetPassar() throws Exception {
        EscritaApiInterceptor interceptor = new EscritaApiInterceptor(new ApiProperties(false));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/taxons/arvore");

        boolean segue = interceptor.preHandle(request, response, new Object());

        assertTrue(segue);
    }

    @Test
    void escritaDesligada_bloqueiaPostCom403() throws Exception {
        EscritaApiInterceptor interceptor = new EscritaApiInterceptor(new ApiProperties(false));
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean segue = interceptor.preHandle(postTaxons(), response, new Object());

        assertFalse(segue);
        assertEquals(403, response.getStatus());
        assertEquals("{\"detail\":\"API somente leitura\"}", response.getContentAsString());
    }

    private static MockHttpServletRequest postTaxons() {
        return new MockHttpServletRequest("POST", "/api/taxons");
    }
}
