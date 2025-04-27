# CliniCrush: Find your perfect match.

<div align="center">
  <img src="frontend/public/logo.png" alt="CliniCrush Logo" width="200px" />
  <br />
</div>

## 🧠 Overview

Finding a clinical trial shouldn't feel like solving a puzzle. **CliniCrush** is a gamified, swipe-based web application that helps patients match with clinical trials tailored to their medical profile. Inspired by the familiarity of dating apps, we make discovering trials intuitive, personalized, and even fun.

Built for **HackDKU 2025** in the **Biotech/Healthcare** track, CliniCrush aims to break down barriers in trial discovery and boost participation in life-changing medical research.

---

## 💡 Key Features

- 🎯 **Personalized Matching**: Users input medical conditions, age, gender, location, and preferences.
- 👉 **Tinder-Style Swiping**: Swipe right on trials you’re interested in; left to pass.
- 📍 **Location-Aware Discovery**: Prioritizes nearby trials with geocoding and distance calculation.
- 📋 **Rich Trial Info**: View eligibility, compensation, and contact details.
- 🎉 **Match Celebration**: Visual feedback for successful matches.
- 💾 **Local Match Storage**: Saves matched trials for future reference.

---

## 🔍 Matching Algorithm

Our custom ranking system assigns a match score based on:

- ✅ Condition Relevance — 50%  
- 🚻 Gender Eligibility — 15%  
- 🎂 Age Eligibility — 15%  
- 📍 Proximity to User — 20%  
- 💰 Compensation Offered — 10%

This ensures users see the most relevant trials first.

---

## 💻 Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **React Bootstrap 2.10.9**
- **React Context API** for state
- Libraries:
  - `react-confetti` (match celebration)
  - `react-icons` (UI)
  - `axios` (API requests)

### Backend
- **Flask 2.2.3** with Python
- **ClinicalTrials.gov API v2** for real-time trial data
- **Google Maps API** for geocoding and distance metrics
- **Flask-CORS** for cross-origin support

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- Python 3.8+
- Google Maps API key (for geolocation features)

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Then edit if needed
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Then edit if needed
python app.py
```

Frontend runs at [http://localhost:3000](http://localhost:3000)  
Backend runs at [http://localhost:2000](http://localhost:2000)

---

## 🏆 Hackathon Journey

CliniCrush was conceived and built at HackDKU 2025 in under 36 hours.  
Our key challenges included:

- 🧭 Implementing real-time distance calculations
- 🔄 Normalizing inconsistent trial data
- 🧪 Designing a medical-friendly UX for non-experts
- 🧠 Balancing user input against complex eligibility criteria

---

## 📈 What’s Next

- 📝 In-app trial enrollment
- 💬 Direct messaging with coordinators
- ⏰ Appointment reminders
- 📖 Enhanced health profiles
- 🔗 Share trials with family or doctors

---

## 👥 Who It's For

- Patients seeking alternatives to standard treatment
- People with rare or difficult-to-treat conditions
- Caregivers and healthcare providers
- Anyone curious about contributing to medical progress

---

## 📞 Contact

- Maintainers:  
  - [Ooha Lakkadi Reddy](https://github.com/oohalakkadi)  

> *CliniCrush: Swipe right for the future.*  