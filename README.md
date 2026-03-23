# ExpenseTracker 🚀

A full-stack Personal Expense and Loan Manager built with **Spring Boot** and **React**. This project helps users track their financial activities, manage loans, and visualize their spending habits with interactive charts.

---

## ✨ Features

* **User Authentication**: Secure JWT-based login and registration.
* **Expense Tracking**: Add, edit, delete, and categorize expenses.
* **Loan Management**: Keep track of personal loans and repayments.
* **Data Visualization**: Gain insights into spending patterns with interactive Recharts.
* **AI-Powered Insights**: Integrated with Gemini API for financial suggestions.
* **Responsive Design**: Fully mobile-responsive UI built with React Bootstrap.

---

## 🛠️ Tech Stack

### Frontend

* **React 18**
* **React Bootstrap** (UI Components)
* **Recharts** (Data Visualization)
* **Axios** (API Communication)
* **React Router** (Client-side Routing)

### Backend

* **Java 17** & **Spring Boot 3**
* **Spring Security** (JWT Authentication)
* **Spring Data JPA**
* **PostgreSQL** (Hosted on Supabase)
* **Gemini AI** (Financial Analysis)

---

## 🌐 Live Links

* 🌍 Frontend: https://expense-tracker-ten-amber-47.vercel.app
* ⚙️ Backend: https://expense-tracker-lhgx.onrender.com
* 📄 Swagger API Docs: https://expense-tracker-lhgx.onrender.com/swagger-ui.html

---

## 🚀 Getting Started

### Prerequisites

* **Java 17** or higher
* **Node.js 18** or higher
* **Docker & Docker Compose** (Optional, for containerized setup)
* **PostgreSQL** (Supabase recommended)

### 🐳 Option 1: Quick Start with Docker (Recommended)

The easiest way to get started is using Docker Compose:

```bash
docker compose up --build
```

Access the app at `http://localhost:3000`.

### 🛠️ Option 2: Manual Setup

#### 1. Backend Setup

1. Navigate to the `backend` directory.
2. Create a `.env` file based on the environment variables needed (DB details, JWT secret, Gemini key).
3. Build and run:

   ```bash
   mvn clean spring-boot:run
   ```

#### 2. Frontend Setup

1. Navigate to the `frontend` directory.
2. Install dependencies:

   ```bash
   npm install
   ```
3. Run the development server:

   ```bash
   npm start
   ```

Access the app at `http://localhost:3000`.

---

## 📁 Project Structure

```bash
expense-tracker/
├── backend/            # Spring Boot application
│   ├── src/            # Java source code
│   ├── Dockerfile      # Backend container configuration
│   └── .env            # Backend environment variables
├── frontend/           # React application
│   ├── src/            # React components and logic
│   ├── Dockerfile      # Frontend container configuration
│   └── .env            # Frontend environment variables
├── docker-compose.yml  # Root orchestration
└── DOCKER.md           # Docker usage instructions
```
