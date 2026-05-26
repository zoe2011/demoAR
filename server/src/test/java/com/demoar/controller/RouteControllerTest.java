package com.demoar.controller;

import com.demoar.service.AuthService;
import com.demoar.service.TencentMapService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RouteController.class)
class RouteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TencentMapService tencentMapService;

    @MockBean
    private AuthService authService;

    @Test
    void planRoute_shouldReturn400_whenMissingOrigin() throws Exception {
        mockMvc.perform(post("/api/route/plan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"destination\":\"39.92,116.40\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void planRoute_shouldReturn400_whenMissingDestination() throws Exception {
        mockMvc.perform(post("/api/route/plan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"origin\":\"39.90,116.40\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void planRoute_shouldReturn400_whenEmptyBody() throws Exception {
        mockMvc.perform(post("/api/route/plan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400));
    }
}
