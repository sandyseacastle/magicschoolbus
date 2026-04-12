# VR Excursions

A classroom VR tour app. Teachers upload 360° images, host sessions with a PIN code, and students join on mobile devices for synchronized VR viewing.

## Running with Docker (recommended)

```bash
docker compose up
```

The app will be available at http://localhost:3456.

Data (database and uploaded images) is persisted in Docker volumes across restarts.

## Running without Docker

**Requirements:** Node.js 22+

### First-time setup

```bash
npm install
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma generate
npx prisma migrate dev --name init
```

### Development

```bash
npm run dev
```

App runs at http://localhost:3456 with hot reload.

### Production

```bash
npm run build
npm run start
```

## How it works

1. Teacher creates an excursion and uploads 360° images (or imports from Wikimedia)
2. Teacher starts a session — a 6-digit PIN is generated
3. Students navigate to the app on their phones and enter the PIN
4. Teacher controls which scene students see in real time
