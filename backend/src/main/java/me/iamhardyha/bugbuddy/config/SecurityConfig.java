package me.iamhardyha.bugbuddy.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import me.iamhardyha.bugbuddy.auth.CustomOAuth2UserService;
import me.iamhardyha.bugbuddy.auth.JwtAuthFilter;
import me.iamhardyha.bugbuddy.auth.OAuth2SuccessHandler;
import me.iamhardyha.bugbuddy.global.response.ApiResponse;
import me.iamhardyha.bugbuddy.global.response.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public SecurityConfig(
            JwtAuthFilter jwtAuthFilter,
            CustomOAuth2UserService customOAuth2UserService,
            OAuth2SuccessHandler oAuth2SuccessHandler,
            ObjectMapper objectMapper
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(401);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
                            response.getWriter().write(
                                    objectMapper.writeValueAsString(
                                            ApiResponse.fail(ErrorCode.UNAUTHORIZED.name(), ErrorCode.UNAUTHORIZED.getMessage())
                                    )
                            );
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/refresh", "/oauth2/**", "/login/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()  // WebSocket 핸드셰이크는 STOMP 레벨에서 JWT 인증
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/questions", "/api/questions/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/{userId}", "/api/users/{userId}/questions", "/api/users/{userId}/answers", "/api/users/{userId}/stats", "/api/users/{userId}/xp-events").permitAll()
                        .requestMatchers("/api/auth/me", "/api/questions/**", "/api/uploads/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/users/me").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/users/me").authenticated()
                        .requestMatchers("/api/chat/**").authenticated()
                        .requestMatchers("/api/reports").authenticated()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(endpoint -> endpoint.userService(customOAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
