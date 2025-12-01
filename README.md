# 🌐 TinyLink — Minimal URL Shortener

TinyLink is a lightweight, fast, and modern URL shortener built with:

- **Node.js + Express**
- **Neon PostgreSQL**
- **HTML + Tailwind CSS**
- **REST API**
- **Modern UI with stats visualization**
- **Vercel-ready deployment**

It allows users to:

- Create short links  
- Customize short codes  
- View analytics (click count, last clicked time, created date)  
- Open target URLs  
- Copy short links  
- Delete links  
- Perform redirect tracking  

---

## 🚀 Live Demo (if deployed)

> Add your link here:

`https://your-vercel-url.vercel.app/`

---

## 📸 Screenshots

### Dashboard

- Create custom / auto-generated links  
- View table of all links  
- Copy / delete links  
- Filter / search links  

### Stats Page

- View analytics for each short link  
- Total clicks  
- Last clicked timestamp  
- Created at  
- Open target URL  

---

# 📦 Features

### 🔗 URL Shortening

- Auto-generated 6–8 character codes  
- Option to provide a custom short code  
- Validates URL format  
- Checks uniqueness before generating codes  

### 📊 Link Analytics

- Track click count  
- Track last clicked timestamp  
- Track creation date  
- Stats page for each short URL  

### 🔁 Redirect Handling

- `/:code` → Looks up DB → increments click count → redirects  
- Fast and reliable  

### 🧹 Clean Modern UI

- Tailwind CSS  
- Responsive layout  
- No scrollbars on stats page  
- Smooth UX with loading, empty, error, and success states  

### 🌐 API Endpoints

All main API routes:

- `POST /api/links` – Create a short link  
- `GET /api/links` – List all links  
- `GET /api/links/:code` – Get stats for one link  
- `DELETE /api/links/:code` – Delete a link  
- `GET /api/healthz` – Health check  
- `GET /:code` – Redirect to target URL  

---

# 🏗️ Project Structure

```text
tinylink/
│
├── index.html          # Dashboard UI
├── stats.html          # Analytics UI
├── server.js           # Express backend
├── package.json
├── README.md
├── .env.example
└── db.sql              # Database schema
