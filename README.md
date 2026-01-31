# Automatic ER Model Generator

## 📌 Project Description

The **Automatic ER Model Generator** is a DBMS-based web application designed to automatically generate **Entity Relationship (ER) diagrams** from structured database inputs.  
This project eliminates the need for manual ER diagram creation and helps users quickly visualize entities, attributes, and relationships in a clear and organized manner.

The application is particularly useful for:
- DBMS academic projects and lab work
- Understanding database design concepts
- Converting database logic into visual ER models
- Reducing manual effort and design errors

The backend server is built using **Node.js** and runs locally using **Nodemon** for development.

---

## 📂 Project Structure

```text
DBMS_FINAL/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── node_modules/
│   └── public/
│       └── dashboard.html
│
└── README.md

🚀 How to Run the Project
Follow the steps below to run the project on your local system.

Step 1: Install Prerequisites
Make sure the following are installed on your system:
Node.js
npm (Node Package Manager)
You can verify installation using:
node -v
npm -v

Step 2: Open Terminal / PowerShell
Open PowerShell (or Command Prompt) and navigate to the backend folder:
cd backend

Step 3: Install Project Dependencies
Run the following command (only required the first time):
npm install
This installs all required packages listed in package.json.

Step 4: Start the Development Server
Run the backend server using:
npm run dev

Step 5: Verify Server is Running
If the server starts successfully, you will see output similar to:

> dbms-backend@1.0.0 dev
> nodemon server.js

[nodemon] starting `node server.js`
Server running on port 5000

Step 6: Open the Application in Browser
Open any web browser and go to:
http://localhost:5000/dashboard.html
The dashboard of the Automatic ER Model Generator will be displayed.
