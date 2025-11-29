-- Run this in TablePlus to clear all data and reset IDs
TRUNCATE TABLE messages, requests, project_members, projects, users RESTART IDENTITY CASCADE;
