# WatchDog

WatchDog is a mobile observability application built with Expo.

## Repository layout

```text
WatchDog/
├── frontend/   # Expo application for iOS, Android, and web
├── backend/    # API, authentication, and observability services
└── infra/      # Local and deployment infrastructure
```

Repository-level configuration, contributor instructions, and licensing remain at the root.

## Run the backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend uses SQLite and creates its local database under `backend/data/`.

## Run the mobile application

```bash
cd frontend
npm install
cp .env.example .env
npx expo start --dev-client
```

Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to an address the phone can reach, such as the development computer's LAN IP and port `4000`.

The infrastructure directory remains reserved for future deployment and observability services. SQLite does not require local infrastructure configuration.
