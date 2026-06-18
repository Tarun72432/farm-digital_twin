package com.company.farmdigitaltwin.utils;

import com.company.farmdigitaltwin.entity.Role;
import com.company.farmdigitaltwin.entity.User;
import com.company.farmdigitaltwin.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("No users found in database. Seeding default users...");

            // 1. Seed Super Admin
            User admin = User.builder()
                    .username("admin")
                    .email("admin@farmtwin.com")
                    .password(passwordEncoder.encode("AdminPassword@123"))
                    .role(Role.SUPER_ADMIN)
                    .build();
            userRepository.save(admin);
            log.info("Default Super Admin created: admin / AdminPassword@123");

            // 2. Seed Field Operator
            User operator = User.builder()
                    .username("operator")
                    .email("operator@farmtwin.com")
                    .password(passwordEncoder.encode("OperatorPassword@123"))
                    .role(Role.FIELD_OPERATOR)
                    .build();
            userRepository.save(operator);
            log.info("Default Field Operator created: operator / OperatorPassword@123");
        } else {
            log.info("Database already contains users. Skipping data seeding.");
        }
    }
}
