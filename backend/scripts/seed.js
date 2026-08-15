import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('Starting database seeding...');

  
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3309', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'store_rating_db';

  let connection;
  try {
    
    connection = await mysql.createConnection({ host, port, user, password });
    console.log('Connected to MySQL server.');

    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.log(`Database "${database}" verified/created.`);
    await connection.end();

    
    connection = await mysql.createConnection({ host, port, user, password, database });
    console.log(`Connected to database "${database}".`);

    
    console.log('Dropping existing tables to start fresh...');
    await connection.query('DROP TABLE IF EXISTS user_sessions;');
    await connection.query('DROP TABLE IF EXISTS ratings;');
    await connection.query('DROP TABLE IF EXISTS stores;');
    await connection.query('DROP TABLE IF EXISTS users;');
    console.log('Existing tables dropped.');

    
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log('Executing schema.sql queries to recreate tables...');
    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('use ')) {
        continue;
      }
      await connection.query(statement);
    }
    console.log('Schema tables created successfully.');

    
    const plainPassword = 'Password@123';
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    console.log(`Hashed password "${plainPassword}" for seed users.`);

    
    const usersToSeed = [
      {
        id: uuidv4(),
        name: 'Anusha Mahantesh Harlapur',
        email: 'admin@storerate.com',
        password_hash: passwordHash,
        address: '123 Admin HQ Way, Suite 500, TechCity, CA 94016',
        role: 'SYSTEM_ADMIN'
      },
      {
        id: uuidv4(),
        name: 'Ranganath Subramaniam Iyer',
        email: 'owner@storerate.com',
        password_hash: passwordHash,
        address: '456 Retail Boulevard, Storefront A, MarketTown, NY 10001',
        role: 'STORE_OWNER'
      },
      {
        id: uuidv4(),
        name: 'Siddharth Roy Chowdhury',
        email: 'siddharth.owner@storerate.com',
        password_hash: passwordHash,
        address: '987 Corporate Square, Block C, Calcutta, WB 700001',
        role: 'STORE_OWNER'
      },
      {
        id: uuidv4(),
        name: 'Vikramaditya Pratap Singh',
        email: 'user@storerate.com',
        password_hash: passwordHash,
        address: '789 Residential Avenue, Apt 4B, Suburbia, TX 75001',
        role: 'NORMAL_USER'
      },
      {
        id: uuidv4(),
        name: 'Sarah Eleanor Connor-Jones',
        email: 'sarah.user@storerate.com',
        password_hash: passwordHash,
        address: '12-A Freedom Fighter Road, Cyberdyne Hills, NM 87101',
        role: 'NORMAL_USER'
      }
    ];

    console.log('Seeding clean user records...');
    for (const user of usersToSeed) {
      await connection.query(
        `INSERT INTO users (id, name, email, password_hash, address, role) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email, user.password_hash, user.address, user.role]
      );
      console.log(`Seeded user: ${user.name} (${user.email} - ${user.role})`);
    }

    
    const owner1 = usersToSeed.find(u => u.email === 'owner@storerate.com');
    const owner2 = usersToSeed.find(u => u.email === 'siddharth.owner@storerate.com');

    const storesToSeed = [
      {
        id: uuidv4(),
        name: 'Super Premium Tech Store',
        email: 'store@storerate.com',
        address: '456 Retail Boulevard, Storefront A, MarketTown, NY 10001',
        owner_id: owner1.id
      },
      {
        id: uuidv4(),
        name: 'Gourmet Bakery and Cafe Plaza',
        email: 'bakery@storerate.com',
        address: '987 Corporate Square, Block C, Calcutta, WB 700001',
        owner_id: owner2.id
      }
    ];

    console.log('Seeding clean store records...');
    for (const store of storesToSeed) {
      await connection.query(
        `INSERT INTO stores (id, name, email, address, owner_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [store.id, store.name, store.email, store.address, store.owner_id]
      );
      console.log(`Seeded store: ${store.name} (${store.email})`);
    }

    console.log('Database seeding completed successfully.');

  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

seed();
