# Saral ERP

Saral ERP is a comprehensive, lightweight Enterprise Resource Planning system designed for MSMEs. It streamlines business operations including invoicing, inventory management, financial tracking, and GST compliance.

## 🚀 Features

- **Dashboard**: Real-time overview of business performance, sales, and financial health.
- **Invoicing**: Create professional invoices with automatic GST calculations (CGST/SGST/IGST), stock adjustments, and PDF generation.
- **Inventory Management**: Track stock levels, product variants, and stock movements.
- **Customer Management**: Manage customer details, GSTIN, and billing/shipping addresses.
- **Transactions & Payments**: Record payments, track outstanding balances, and manage cash flow.
- **GST Filing Console**: Automated aggregation of invoices and transactions to generate GSTR-1/GSTR-3B summaries and track filing status.
- **Finance Helper**: Built-in tool to explore financing options (NBFCs) tailored for MSMEs.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, React Bootstrap, React Query.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose).
- **Authentication**: JWT-based auth with organization-level scoping.

## 📂 Project Structure

```
erp_project/
├── backend/         # Node.js/Express API
│   ├── controllers/ # Request handlers
│   ├── models/      # Mongoose schemas (Invoice, Item, GstReturn, etc.)
│   ├── routes/      # API endpoints
│   ├── services/    # Business logic
│   └── utils/       # Helpers (PDF, Async handlers)
└── frontend/        # React Client
    ├── src/
    │   ├── components/ # Reusable UI components
    │   ├── pages/      # Application pages (Dashboard, GST, etc.)
    │   └── services/   # API client wrappers
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (Local or Atlas connection string)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd erp_project
```

### 2. Setup Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `backend/` directory with the following:
   ```env
   PORT=8000
   MONGODB_URL=mongodb://localhost:27017/saral_erp  # Or your Atlas URL
   ACCESS_TOKEN_SECRET=your_access_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_refresh_secret
   REFRESH_TOKEN_EXPIRY=30d
   CORS_ORIGIN=*
   CLOUDINARY_CLOUD_NAME=... # Optional
   CLOUDINARY_API_KEY=...    # Optional
   CLOUDINARY_API_SECRET=... # Optional
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   The API will run on `http://localhost:8000`.

### 3. Setup Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will open at `http://localhost:5173`.

## 🧪 Running Tests

The backend includes integration tests for the GST module.

```bash
cd backend
npm run test:gst
```

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
