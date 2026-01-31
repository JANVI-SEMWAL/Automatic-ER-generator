const fs = require('fs');
const path = require('path');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, 'backend', '.env');
const envExample = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=ai_er_converter

# JWT Secret (change this to a secure random string in production)
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# Server Configuration
PORT=5000`;

if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envExample);
    console.log('✅ Created .env file in backend directory');
    console.log('⚠️  Please update the database credentials in backend/.env');
} else {
    console.log('ℹ️  .env file already exists');
}

console.log('\n📋 Setup Instructions:');
console.log('1. Update database credentials in backend/.env');
console.log('2. Create MySQL database: CREATE DATABASE ai_er_converter;');
console.log('3. Import schema: mysql -u root -p ai_er_converter < database/schema.sql');
console.log('4. Start backend: cd backend && npm start');
console.log('5. Open frontend/index.html in your browser');
console.log('\n🚀 Your AI ER Converter is ready to use!');
