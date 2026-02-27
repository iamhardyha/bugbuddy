package me.iamhardyha.bugbuddy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class BugbuddyApplication {

    public static void main(String[] args) {
        SpringApplication.run(BugbuddyApplication.class, args);
    }
}
