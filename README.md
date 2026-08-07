## API Endpoints

 GET  `/api/consultants`  : List consultants with search, pagination, and sorting 
 GET  `/api/consultants/stats` : Dashboard totals 
 GET  `/api/consultants/{id}`: Get one consultant 
 POST  `/api/consultants` :  Add a consultant 
 PUT  `/api/consultants/{id}`:L Update a consultant 
 DELETE  `/api/consultants/{id}`:   Delete a consultant 
 POST  `/api/auth/register`: Create an account 
 POST  `/api/auth/login`: Log in and receive an auth token 

## Schema
`CREATE DATABASE IF NOT EXISTS consultant_management_system;
USE consultant_management_system;

CREATE TABLE IF NOT EXISTS consultants (
id BIGINT NOT NULL AUTO_INCREMENT,
name VARCHAR(120) NOT NULL UNIQUE,
email VARCHAR(160) NOT NULL UNIQUE,
phone VARCHAR(20) NOT NULL UNIQUE,
technology VARCHAR(120) NOT NULL,
experience INT NOT NULL,
status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
INDEX idx_consultants_technology (technology)
);

CREATE TABLE IF NOT EXISTS app_users (
id BIGINT NOT NULL AUTO_INCREMENT,
email VARCHAR(160) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (id)
);
`