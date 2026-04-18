# GeoSense

GeoSense is an AI-powered geothermal intelligence platform that delivers a personalized geothermal feasibility report for any US property in under 15 seconds, for free. Built at HackPrinceton 2025.

🌐 **Live Demo:** [geosense-co.vercel.app](https://geosense-co.vercel.app)

---

## What It Does

A user enters any US property address and receives a fully personalized geothermal energy report covering:

- **Recommended system type** — horizontal closed-loop, vertical closed-loop, or open-loop, selected by a weighted geological scoring algorithm
- **System specifications** — trench length and burial depth for horizontal systems, borehole count and depth for vertical systems
- **Full financial breakdown** — gross installation cost, IRA 30% federal tax credit, state rebates, net cost, annual savings, payback period, and 25-year lifetime savings
- **Carbon impact** — annual CO₂ offset using EPA eGRID regional emission factors, with tree-year and flight equivalencies
- **Local installers** — IGSHPA-certified contractors near the property

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| AI | Groq API — llama-3.3-70b-versatile |
| Maps | Google Maps JavaScript API |
| Deployment | Vercel |

---

## Data Sources

| Source | Data Provided |
|---|---|
| **USGS** | Soil classification, thermal conductivity, bedrock depth, groundwater depth, drilling difficulty |
| **NOAA** | Heating Degree Days, Cooling Degree Days, ground temperature, climate zone |
| **EPA eGRID** | Regional carbon emission factors by state |

500+ US zip codes seeded into Supabase with real USGS and NOAA data.

---

## How It Works

```
User inputs address
        ↓
Zip code extracted → Supabase queried for USGS + NOAA data
        ↓
Weighted scoring algorithm evaluates 3 candidate systems (0-100)
        ↓
Financial calculations computed in TypeScript (hallucination-proof)
        ↓
Carbon offset calculated using EPA eGRID factors
        ↓
Groq generates narrative report as structured JSON
        ↓
Report saved to Supabase → rendered as 5-section interactive dashboard
```

---

## Financial Calculation Model

All financials are hardcoded in TypeScript before the AI is called.
The AI is forbidden from calculating financials — any deviation greater
than 10% is overwritten by the backend.

```
tons = ceil(home_size_sqft / 550)
gross_cost = tons × $4,500
federal_credit = gross_cost × 0.30
net_cost = gross_cost - federal_credit - state_rebate
annual_savings = annual_energy_cost × 0.55
payback_years = net_cost / annual_savings
lifetime_savings = annual_savings × 25
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Maps API key
- Groq API key

### Installation

```bash
git clone https://github.com/ashadsmh/geosense.git
cd geosense
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
GROQ_API_KEY=your_groq_api_key
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy

```bash
vercel --prod
```

---

## Project Structure

```
geosense/
├── app/
│   ├── page.tsx              # Landing page
│   ├── home/page.tsx         # Home screen
│   ├── analyze/page.tsx      # Loading animation
│   ├── report/[id]/page.tsx  # Report page
│   └── api/
│       ├── analyze/route.ts  # Core analysis pipeline
│       └── geodata/route.ts  # Zip code data lookup
├── components/
│   ├── AddressInput.tsx      # Google Places input
│   ├── ReportDisplay.tsx     # 5-section report dashboard
│   ├── LotDiagram.tsx        # Google Maps satellite overlay
│   └── ExportButton.tsx      # PDF export
├── lib/
│   ├── gemini.ts             # Groq AI integration
│   ├── systemSelector.ts     # Weighted scoring algorithm
│   ├── carbonMath.ts         # EPA eGRID carbon calculations
│   ├── iraCreditCalc.ts      # IRA tax credit calculations
│   └── supabase/             # Supabase client
└── types/
    └── report.ts             # TypeScript interfaces
```

---

## Supabase Schema

| Table | Description |
|---|---|
| `soil_data` | USGS soil records by zip code |
| `climate_data` | NOAA climate records by zip code |
| `state_rebates` | State geothermal rebate amounts |
| `reports` | Generated report storage |

---

## Demo

Enter **Poe Field, Princeton University, Princeton, NJ 08544** for the full demo experience — including a satellite map overlay of the proposed horizontal closed-loop system on Poe Field.

---

## License

MIT

---

## Author

Built by Ashad Shaik-Mohamed at HackPrinceton 2025.
