CREATE DATABASE IF NOT EXISTS consultant_management_system;
USE consultant_management_system;

CREATE TABLE IF NOT EXISTS consultants (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    technology VARCHAR(120) NOT NULL,
    experience INT NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    onboarding_source ENUM('MANUAL', 'EXCEL', 'PDF') NOT NULL DEFAULT 'MANUAL',
    import_file_name VARCHAR(255),
    imported_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_consultants_technology (technology),
    INDEX idx_consultants_onboarding_source (onboarding_source),
    INDEX idx_consultants_imported_at (imported_at)
);

CREATE TABLE IF NOT EXISTS app_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);
