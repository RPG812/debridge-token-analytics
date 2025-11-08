CREATE DATABASE IF NOT EXISTS analytics;

CREATE USER IF NOT EXISTS analytics_user
    IDENTIFIED WITH plaintext_password BY 'debridge';

GRANT ALL ON analytics.* TO analytics_user WITH GRANT OPTION;
