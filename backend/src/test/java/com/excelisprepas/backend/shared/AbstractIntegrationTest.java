package com.excelisprepas.backend.shared;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;

public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:18")
            .withDatabaseName("excelis_test")
            .withUsername("test")
            .withPassword("test");

    static {
        POSTGRES.start();
    }
}