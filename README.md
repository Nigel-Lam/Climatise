# Climatise 🌤️

**A Bureau of Meteorology Data Visualization and Analytics Platform**

Climatise is an interactive weather data visualization platform designed to increase climate literacy in an era of climate uncertainty. Built for the FIT3164 Data Science Project at Monash University by Team DS_13, this application provides comprehensive weather analytics for Victorian weather stations using data from the Australian Bureau of Meteorology (BOM).

## 🎯 Project Overview

Climatise transforms complex meteorological data into intuitive, interactive visualizations that help users understand weather patterns, trends, and climate variability across Victoria. The platform serves as an educational tool to enhance climate literacy and awareness.

### Key Features

- **Interactive Victorian Map**: Visualize weather data across all Victorian weather stations
- **Dynamic Color Encoding**: Switch between different metrics (temperature, humidity, wind speed) for map visualization
- **Weather Analytics Dashboard**: Detailed weather metrics with sparkline visualizations
- **Date Range Filtering**: Analyze weather patterns across custom time periods
- **Station-Specific Data**: Drill down into individual weather station information
- **Real-time Data Processing**: Live data fetching and processing from SQLite database

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19.1.1 with TypeScript
- Tailwind CSS 4.1.12 with DaisyUI
- Vega-Lite for advanced data visualization
- Zustand for state management
- Vite for development and building

**Backend:**
- FastAPI with Python 3.13+
- SQLite database for weather data storage
- CORS-enabled API endpoints
- Pydantic for data validation

**Data Sources:**
- Australian Bureau of Meteorology (BOM) weather data
- Victorian weather station coordinates
- GeoJSON data for Victorian map boundaries

## 📊 Data Visualization Components

### VictoriaMap Component
- Interactive map showing all Victorian weather stations
- Dynamic color encoding based on selected metrics:
  - Average Temperature (°C)
  - Maximum Temperature (°C)
  - Minimum Temperature (°C)
  - Average Humidity (%)
  - Wind Speed (m/s)
- Tooltip information with comprehensive weather data
- Responsive design with professional styling

### StationWeather Component
- Weather metrics cards with sparkline visualizations
- Real-time data updates based on date range selection
- Comprehensive weather statistics including:
  - Temperature trends (max, min, average)
  - Humidity levels
  - Wind speed patterns
  - Solar radiation data

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher) and **npm**
- **Python 3.13+**
- **uv** (recommended) or **pip** for Python package management

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Climatise
   ```

2. **Install Python dependencies:**
   ```bash
   # Using uv (recommended)
   pip install uv
   uv sync
   
   # OR using pip
   pip install -e .
   ```

3. **Install Node.js dependencies:**
   ```bash
   # Install root dependencies (includes concurrently)
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Option 1: Run Both Servers Simultaneously (Recommended)
```bash
# From project root directory
npm run dev
```

This command runs:
- Backend server on `http://localhost:8000`
- Frontend server on `http://localhost:5173`

#### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
Run this in the root directory
```bash
uvicorn backend.server:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend:**
Run this in frontend directory (as seen in cd frontend)
```bash
cd frontend
npm run dev
```

### Accessing the Application

- **Frontend**: Open `http://localhost:5173` in your browser
- **Backend API**: Available at `http://localhost:8000`
  - API Documentation: `http://localhost:8000/docs`
  - Stations Endpoint: `http://localhost:8000/api/stations`
  - Weather Data Endpoint: `http://localhost:8000/api/weather`

## 📁 Project Structure

```
Climatise/
├── backend/
│   └── server.py                        # FastAPI server with weather endpoints
├── data/
│   ├── schema.py                        # Pydantic data models
│   ├── victoria.db                      # SQLite weather database
│   ├── victoria.json                    # Raw weather data snapshot
│   ├── last_download.json               # Metadata for last data fetch
│   └── vic/                             # Weather station folders (many subfolders)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── NavBar.tsx
│   │   │   ├── VictoriaMap.tsx
│   │   │   ├── WeatherStationFilter.tsx
│   │   │   └── WeatherStationFilterBoxes.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── StationWeather.tsx
│   │   │   └── StationWeatherMulti.tsx
│   │   ├── RouteMap.tsx
│   │   ├── store.ts
│   │   └── main.tsx
├── geojson/
│   ├── SA3_2021_AUST_GDA2020.json       # Victorian map boundaries
│   └── vic_map.json                     # Additional map data
├── scripts/
│   ├── data_collection.py               # Data collection utilities
│   ├── geopandas_loc_to_longlat.py      # Geopandas helper script
│   ├── new_data.py                      # New data ingestion
│   ├── preprocess.py                    # Data preprocessing
│   └── setup.py                         # Database setup script
├── db.json                              # Sample/mock DB (if used)
├── package.json                         # Root scripts (e.g., dev runner)
├── package-lock.json
├── pyproject.toml                       # Python dependencies
├── uv.lock                              # uv lockfile
└── README.md
```

## 🔧 API Endpoints

### GET /api/stations
Returns a list of all available weather station names.

**Response:**
```json
["MELBOURNE AIRPORT", "BALLARAT AERODROME", ...]
```

### GET /api/weather
Returns weather data for a specific station and date range.

**Parameters:**
- `station_name` (string): Name of the weather station
- `earliest` (datetime): Start date for data range
- `latest` (datetime): End date for data range

**Response:**
```json
{
  "maximum_temperature": [25.3, 24.1, 23.8],
  "minimum_temperature": [15.2, 14.8, 13.9],
  "average_temperature": [20.25, 19.45, 18.85],
  "average_humidity": [65.4, 68.2, 71.1],
  "wind_speed": [12.3, 8.7, 15.2]
}
```

## 🎨 Key Features

### Interactive Map Visualization
- **Dynamic Color Encoding**: Switch between different weather metrics
- **Professional Styling**: Clean, modern interface with Tailwind CSS
- **Responsive Design**: Works across desktop and mobile devices
- **Rich Tooltips**: Comprehensive weather information on hover

### Weather Analytics
- **Sparkline Visualizations**: Trend analysis for weather patterns
- **Real-time Updates**: Live data fetching based on user selections
- **Comprehensive Metrics**: Temperature, humidity, wind speed, and more
- **Date Range Analysis**: Custom time period selection

### User Experience
- **Intuitive Interface**: Easy-to-use date picker and station filters
- **State Management**: Persistent selections across components
- **Error Handling**: Graceful handling of data loading issues
- **Loading States**: Clear feedback during data fetching

## 🛠️ Development

### Frontend Development
- **Main Components**: Located in `frontend/src/components/`
- **Styling**: Tailwind CSS with DaisyUI components
- **State Management**: Zustand store in `frontend/src/store.ts`
- **Routing**: React Router configuration in `frontend/src/RouteMap.tsx`

### Backend Development
- **API Server**: FastAPI application in `backend/server.py`
- **Database**: SQLite with weather data in `data/victoria.db`
- **Data Models**: Pydantic schemas in `data/schema.py`

### Data Processing
- **Setup Script**: `scripts/setup.py` for database initialization
- **Data Collection**: Utilities in `scripts/data_collection.py`
- **Preprocessing**: Data cleaning in `scripts/preprocess.py`

## 🎓 Educational Context

This project was developed as part of the FIT3164 Data Science Project at Monash University by Team DS_13. The platform serves as both a practical data science application and an educational tool for climate literacy.

### Learning Objectives
- **Data Visualization**: Advanced techniques using Vega-Lite
- **Web Development**: Full-stack React and FastAPI development
- **Climate Science**: Understanding meteorological data and patterns
- **User Experience**: Creating intuitive interfaces for complex data

## 🤝 Contributing

This project is part of an academic course. For questions or contributions, please contact Team DS_13.

## 📄 License

This project is developed for educational purposes as part of FIT3164 Data Science Project at Monash University.

## 🔗 Links

- **Monash University**: https://www.monash.edu/
- **FIT3164 Course**: Data Science Project
- **Australian Bureau of Meteorology**: https://www.bom.gov.au/

---

**Team DS_13** | **FIT3164 Data Science Project** | **Monash University**
