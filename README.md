# Dev-Pulse: Autonomous SRE Dashboard

Dev-Pulse is an AI-powered Site Reliability Engineering (SRE) platform built for proactive visual monitoring. Unlike traditional logging tools that track server-side metrics, Dev-Pulse uses a headless browser "agent" to see exactly what your users see, catching UI regressions, layout breakages, and silent failures in real-time.

https://github.com/user-attachments/assets/bf9f8bae-74a1-4eb1-85e5-66dda14b4c82
## 🛰️ Core Features

### 1. Autonomous Visual Agent
- **Playwright-Powered Engine**: A headless Chromium backend that navigates to production URLs to capture high-fidelity DOM screenshots.
- **AI Regression Analysis**: Integrated with **Google Gemini 3.1 Flash**. The AI analyzes screenshots for:
    - Visible error messages (404, 500, etc.).
    - Layout regressions (overlapping elements, broken CSS).
    - Resource failures (massive whitespace or missing components).
- **Structured Reporting**: Returns AI-generated health reports with status levels (Healthy, Critical), confidence scores, and recommended fixes.

### 2. Operational Control Center (UI/UX)
- **Immersive "Mission Control" Theme**: A sleek, dark-mode technical interface featuring glass morphism, grid-based telemetry, and glowing status indicators.
- **Fleet Management**: Add and monitor multiple "Nodes" (production endpoints) from a unified grid.
- **Manual & Automated Triggers**: "Run Agent Scan" initiates the visual capture and AI analysis loop on demand.
- **Historical Reporting**: Scans are stored and displayed with timestamps and historical status data.

### 3. Enterprise Infrastructure
- **Full-Stack Architecture**: Built on **Express (Node.js)** and **React (Vite)** to handle both heavy browser automation and snappy UI interactions.
- **Firebase Backend**:
    - **Firestore**: Scalable NoSQL storage for projects and scan history.
    - **Google Authentication**: Secure, popup-based login to ensure system access is restricted to authorized engineers.
    - **Security Rules**: Attribute-Based Access Control (ABAC) implemented at the database level.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Framer Motion (for interface transitions).
- **Backend**: Express.js (Node.js version 20+).
- **Automation**: Playwright (Headless Chromium).
- **AI Engine**: Google Gemini API (@google/genai).
- **Database/Auth**: Google Firebase.

## 🚀 Getting Started

### Prerequisites
- **Gemini API Key**: Must be configured in the environment (`GEMINI_API_KEY`).
- **Firebase Setup**: The app is provisioned in the `asia-southeast1` region with enterprise-grade Firestore.

### Usage
1. **Initialize Session**: Click "Initialize Session" on the landing page to log in via Google.
2. **Register Node**: Use "New Node" to provide a name and production URL for monitoring.
3. **Trigger Scan**: Click the "Scan" icon on any node card.
4. **Analyze Results**: Review the glowing status pill and transition back to healthy once fixes are deployed.

## 📜 Metadata
- **Name**: Dev-Pulse
- **Description**: Autonomous SRE dashboard for real-time site monitoring and AI-powered visual regression analysis.

---
*Developed for Google AI Studio // SRE-CORE-01 Protocol*
