# SkoolBus Transit

SkoolBus Transit is a role-based school transportation prototype. Students, bus drivers, and administrators have separate app screens for account access, route and bus maps, attendance, and student management. The Expo client talks to an Express API, which stores users and transit records in MongoDB.

## Features

- Student, bus driver, and administrator screens.
- Account registration and login with a generated user ID.
- Bus and student markers, driver location, and attendance endpoints.
- Map support using native map components and a Google Maps JavaScript view on web.
- Expo Location and notification packages.
- Expo targets for iOS, Android, and web.

## Technology

- React Native 0.81 and Expo SDK 54.
- React Navigation, Expo Location, Expo Notifications, and React Native Maps.
- Express 5, Node.js, and the MongoDB Node driver.
- Google Maps JavaScript API for the web map.

## Requirements

- Node.js and npm (use a Node version supported by the installed Expo SDK; see [Expo's setup guide](https://docs.expo.dev/get-started/set-up-your-environment/)).
- A MongoDB database and connection URI.
- A Google Maps API key for the map components that need Google Maps.
- For native device testing, Expo Go or the matching native build tools and a device/simulator.

## Configuration

Create a `.env` file in the repository root. `dotenv` loads `MONGO_URI` and `PORT` for the API; Expo reads the `EXPO_PUBLIC_` variable for the web Maps component:

```env
MONGO_URI=mongodb://127.0.0.1:27017/skoolbus
PORT=3000
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your_restricted_maps_key
```

Use a restricted development key and do not commit private credentials. The native Google Maps key is also configured in `app.json`; replace that configuration with your own restricted key before building for a device.

## Install and run

From the repository root:

```bash
npm install
```

To start the API and the iOS Expo target together:

```bash
npm start
```

Or start each part separately in its own terminal:

```bash
npm run server
npm run app
```

Other client targets are available with `npm run ios`, `npm run android`, and `npm run web`. Expo may ask which simulator, device, or browser to use.

### Device networking

Several client files contain fixed API host values (`localhost`, `0.0.0.0`, or a LAN address). A physical phone cannot usually reach the development computer through those values. Before device testing, update the API base URL constants in `screens/SignUp.js` and `components/markers.js` to the development computer's reachable LAN address and keep port `3000`. The same API base URL should be used by all app screens.

## Project layout

```text
App.js                         App navigation and role-specific screen routes
screens/                       Home, login, sign-up, student, driver, and admin screens
components/                    Map components, marker/API helpers, and shared UI
assets/                        App logos, icons, and map imagery
skoolbus-server/server.js      Express API routes
skoolbus-server/db.js          MongoDB connection setup
skoolbus-server/users.js       User, bus location, and attendance data helpers
package.json                   Expo app and API scripts/dependencies
app.json                       Expo platforms, permissions, and native configuration
```

## API overview

The Express server listens on `PORT` (default `3000`). Its routes include:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | API health response |
| `POST` | `/api/signup`, `/api/login` | Create an account or sign in |
| `GET`, `POST` | `/api/markers`, `/api/markers/:driverId` | Read and save bus/student map markers |
| `GET` | `/api/markers/student/:studentId` | Find the marker set associated with a student |
| `GET`, `POST` | `/api/bus-location/:driverId` | Read or update a driver's bus location |
| `GET`, `POST` | `/api/attendance/:studentId` | Read or update student attendance |
| `GET` | `/api/admin/students` | List student records for the admin screen |
| `POST` | `/api/admin/add-student` | Add a student record |

## Data and prototype status

This repository is a development prototype. The current `users.js` implementation stores submitted passwords directly in MongoDB rather than hashing them, and some client API addresses are hard-coded. Do not use real account credentials or deploy this configuration with personal student data without replacing those parts with secure production implementations.

## Sources

- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [MongoDB Node.js driver](https://www.mongodb.com/docs/drivers/node/current/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
