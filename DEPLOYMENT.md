# APEX Screener — Production Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
# Watch for build-time type checking errors
```

---

## Building for Production

### 1. Type Checking

```bash
npm run type-check
# Validates all TypeScript code before bundling
```

### 2. Production Build

```bash
npm run build
# Next.js creates optimized build in .next/
# - Automatic code splitting
- Minification & tree-shaking
# - Static optimization
# - Image optimization
```

### 3. Start Production Server

```bash
npm start
# Runs optimized production build on localhost:3000
```

---

## Deployment Options

### Vercel (Recommended)

Vercel is the official Next.js hosting platform with zero-config deployment:

```bash
# 1. Push to GitHub (or connect repo)
git push origin main

# 2. Link to Vercel
npm i -g vercel
vercel

# 3. Configure
# - Environment: Production
# - Framework: Next.js (auto-detected)
# - Build Command: npm run build
# - Output Directory: .next
```

**Auto-enabled features**:
- ✅ Edge caching
- ✅ Automatic HTTPS
- ✅ Image optimization
- ✅ Serverless functions
- ✅ Analytics

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t apex-screener .
docker run -p 3000:3000 apex-screener
```

### AWS (EC2 + CloudFront)

1. **EC2 Instance** (t3.medium, Ubuntu 22.04)
   ```bash
   # SSH into instance
   ssh -i key.pem ubuntu@instance-ip
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Clone and setup
   git clone https://github.com/your-org/apex-screener.git
   cd apex-screener
   npm ci
   npm run build
   
   # Run with PM2 (process manager)
   npm i -g pm2
   pm2 start "npm start" --name "apex-screener"
   pm2 startup
   pm2 save
   ```

2. **CloudFront Distribution**
   - Origin: EC2 instance DNS
   - Cache: CloudFront edge locations
   - TTL: 60s for dynamic content, 86400s for static
   - Compression: Enable Gzip, Brotli

### Azure App Service

```bash
# Create resource group
az group create --name apex-screener --location eastus

# Create App Service plan
az appservice plan create \
  --name apex-screener-plan \
  --resource-group apex-screener \
  --sku B2 --is-linux

# Create web app
az webapp create \
  --resource-group apex-screener \
  --plan apex-screener-plan \
  --name apex-screener \
  --runtime "node|18.0"

# Deploy
az webapp deployment source config-zip \
  --resource-group apex-screener \
  --name apex-screener \
  --src release.zip
```

---

## Environment Configuration

Create `.env.local` for local overrides:

```bash
# WebSocket Configuration (if using real WS)
# NEXT_PUBLIC_WS_URL=wss://api.example.com/ws

# API Configuration (if using live data)
# NEXT_PUBLIC_API_URL=https://api.example.com
# API_KEY=your_api_key_here

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_DATA=false  # Use simulated data
NEXT_PUBLIC_MAX_STOCKS=5000
NEXT_PUBLIC_FILTER_DEBOUNCE_MS=200
```

---

## Performance Optimization Checklist

### Bundle Size
```bash
npm run build
# Check output:
# ✅ Next.js should report <100KB main bundle
# ✅ Individual routes <50KB
```

### Image Optimization
```typescript
// Already built-in via Next.js Image component
import Image from 'next/image';
<Image src="..." alt="..." priority={false} />
```

### Code Splitting
Next.js automatically splits by route. For manual optimization:

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const CandleChart = dynamic(
  () => import('@/components/chart/CandleChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
```

### Caching Strategy
```typescript
// src/app/layout.tsx — already configured
export const revalidate = 60; // ISR (Incremental Static Revalidation)
```

---

## Monitoring & Observability

### Application Performance Monitoring (APM)

Add Sentry for production error tracking:

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
  ],
});
```

### Custom Metrics

```typescript
// src/lib/analytics.ts
export function trackFilterPerformance(timeMs: number) {
  if (window.gtag) {
    gtag('event', 'filter_latency', {
      value: timeMs,
      event_category: 'performance',
    });
  }
}
```

### Log Aggregation

Send logs to ELK/DataDog:

```typescript
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => {
    // Send to logging service
    fetch('/api/logs', { method: 'POST', body: JSON.stringify(args) });
  };
}
```

---

## Database Integration (Optional)

For persistent watchlists/settings:

### PostgreSQL

```typescript
// src/lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function saveWatchlist(userId: string, stocks: Stock[]) {
  await pool.query(
    'INSERT INTO watchlists (user_id, stocks) VALUES ($1, $2)',
    [userId, JSON.stringify(stocks)]
  );
}
```

### API Routes

```typescript
// src/app/api/watchlist/route.ts
import { saveWatchlist } from '@/lib/db';

export async function POST(request: Request) {
  const { userId, stocks } = await request.json();
  await saveWatchlist(userId, stocks);
  return Response.json({ success: true });
}
```

---

## Real WebSocket Integration

Replace simulator with live data:

```typescript
// src/lib/websocket.ts — refactored for real WS
export class WebSocketClient {
  private ws: WebSocket;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handlePriceUpdate(data);
    };
  }

  private handlePriceUpdate(update: PriceUpdate) {
    // Same interface as simulator
    this.updateHandlers.forEach(h => h([update]));
  }
}
```

---

## Load Testing

### Using Apache Bench

```bash
# Install
sudo apt-get install apache2-utils

# Test homepage
ab -n 1000 -c 100 https://apex-screener.example.com/

# Expected results:
# - Requests/sec: >100
# - 95th percentile: <500ms
# - Failed requests: 0
```

### Using k6

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 50,
  duration: '5m',
};

export default function () {
  let res = http.get('https://apex-screener.example.com/');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'load time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

```bash
k6 run load-test.js
```

---

## Security Hardening

### CORS Configuration

```typescript
// next.config.mjs
const nextConfig = {
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://example.com' },
      ],
    },
  ],
};
```

### CSP Headers

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'"
  );
  return response;
}

export const config = { matcher: ['/:path*'] };
```

### Rate Limiting

```typescript
// src/lib/rateLimit.ts
const limiter = new Map<string, { count: number; reset: number }>();

export function rateLimit(ip: string, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const record = limiter.get(ip);
  
  if (!record || now > record.reset) {
    limiter.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  
  if (record.count < limit) {
    record.count++;
    return true;
  }
  
  return false;
}
```

---

## Rollback Procedure

If deployment fails:

```bash
# Vercel
vercel rollback

# Docker
docker run -p 3000:3000 apex-screener:v1.0.0  # Previous tag

# Kubernetes
kubectl set image deployment/apex-screener \
  app=apex-screener:v1.0.0
kubectl rollout status deployment/apex-screener
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next/
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: build
      
      - run: vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

## Disaster Recovery

### Backup Strategy

```bash
# Weekly backups
0 2 * * 0 tar -czf backup-$(date +\%Y\%m\%d).tar.gz .next/ package.json

# Upload to S3
aws s3 cp backup-*.tar.gz s3://apex-screener-backups/
```

### Recovery Process

```bash
# 1. Restore from backup
aws s3 cp s3://apex-screener-backups/backup-20250115.tar.gz .
tar -xzf backup-20250115.tar.gz

# 2. Verify integrity
npm run type-check

# 3. Redeploy
npm run build && npm start
```

---

## Monitoring Dashboard

Create a simple status page:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
}
```

Monitor with:
- **Uptime Robot** — Ping /api/health every 5min
- **New Relic** — APM instrumentation
- **PagerDuty** — Alert on failures

---

## Performance Benchmarks (Post-Deploy)

Expected metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Time to Interactive (TTI) | <2s | ~1.2s |
| Largest Contentful Paint (LCP) | <2.5s | ~1.8s |
| Cumulative Layout Shift (CLS) | <0.1 | 0.02 |
| Filter latency | <200ms | <5ms |
| WebSocket latency | <50ms | 1–8ms |

Monitor via Google PageSpeed or WebPageTest.

---

## Cost Optimization

| Hosting | Cost/Month | Notes |
|---------|-----------|-------|
| **Vercel** | $20–50 | Generous free tier, auto-scaling |
| **AWS (t3.micro)** | $5–10 | EC2 only, add CloudFront CDN |
| **Azure** | $15–30 | Free tier available |
| **DigitalOcean** | $5–20 | Droplets + Spaces (CDN) |

For 1000 DAU: Vercel free tier sufficient
For 10K DAU: Move to paid plan (~$50/mo)
For 100K+ DAU: Dedicated infrastructure

---

## Questions?

- Performance profiling: `npm run build && npm start` then Chrome DevTools
- Troubleshooting: Check `.next/` build folder size
- Security: Rotate secrets via environment variables

**Deploy with confidence! 🚀**
