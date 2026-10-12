# IRAS Backend - Setup & Running Guide

## Prerequisites
- Node.js >= 18.0.0
- MongoDB Atlas account or local MongoDB
- Cloudinary account
- Gmail account (for email)

## Setup Steps

### 1. Install Dependencies
npm install

### 2. Configure Environment
cp .env.example .env
# Edit .env with your actual values

### 3. Seed Database
npm run seed

### 4. Start Development Server
npm run dev

### 5. Start Production Server
npm start

## Seeder Commands
npm run seed          # Seed with sample data
npm run seed:clear    # Clear all data
npm run seed:fresh    # Clear and re-seed

## Default Login Credentials (after seeding)
Super Admin: superadmin@uswat.edu.pk / SuperAdmin@123
Admin:       admin@uswat.edu.pk / Admin@123456
HoD (CS):    hod.cs@uswat.edu.pk / HoD@123456
Teacher:     usman.tariq@uswat.edu.pk / Teacher@123
Student:     ali.khan.2023@uswat.edu.pk / Student@123

## API Health Check
GET http://localhost:5000/health

## API Documentation
GET http://localhost:5000/api/v1