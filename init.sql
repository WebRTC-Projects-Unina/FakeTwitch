CREATE DATABASE IF NOT EXISTS streaming_db;
USE streaming_db;

-- 1. TABELLA USERS (Anagrafica, stream_key e marche temporali di creazione/modifica)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    stream_key VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TABELLA USER_SESSIONS (Sessioni Cookie HttpOnly con creazione, modifica e scadenza)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_expires (expires_at)
);

-- 3. TABELLA SUBSCRIPTIONS (Iscrizioni con marca temporale di creazione e modifica)
CREATE TABLE IF NOT EXISTS subscriptions (
    follower_id INT NOT NULL,
    streamer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, streamer_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (streamer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_follow CHECK (follower_id <> streamer_id),
    INDEX idx_streamer_followers (streamer_id)
);

-- 4. TABELLA STREAMS (Dirette Live con tempi di stream + marche temporali del record)
CREATE TABLE IF NOT EXISTS streams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    streamer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'Diretta Live',
    status ENUM('live', 'ended') NOT NULL DEFAULT 'live',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (streamer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_streams_status (status, streamer_id)
);