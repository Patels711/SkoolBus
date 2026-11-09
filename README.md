# SkoolBus Transit

SkoolBus Transit is a cross-platform school transportation app for students, bus drivers, and administrators. The Expo app provides role-specific screens for account access, bus routes, student attendance, and bus location information. An Express API stores user and transit data in MongoDB.

## Features

- Student, bus driver, and administrator experiences.
- Account registration and login.
- Map and route interfaces with location support.
- Bus location and student attendance tracking.
- Push notification support through Expo Notifications.
- iOS, Android, and web targets through Expo.

## Built with

- React Native and Expo
- React Navigation
- Express and Node.js
- MongoDB
- Expo Location and Notifications

## Setup

Install Node.js and npm. From the repository root:

```bash
npm install
```

Configure the API's MongoDB connection and any required service settings in `skoolbus-server/.env` (see the repository's environment example if present). Start the API with `npm run server`. In a second terminal, start Expo with `npm start`, then select a device target.

The root `npm start` script starts the server and the iOS Expo target together. Use `npm run app`, `npm run android`, `npm run ios`, or `npm run web` to launch a specific client target.
