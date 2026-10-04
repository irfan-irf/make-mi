# Make MI Web Store

The Make MI client is a responsive React and Vite storefront for discovering products, managing a cart and wishlist, checking out, and tracking orders. Admin users can manage products, orders, and customer accounts.

## Run locally

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env` if you need to change `VITE_API_URL` (defaults to `http://localhost:5000/api`).
3. Run `npm run dev` and open the Vite URL, usually `http://localhost:5173`.

The Vite development server proxies API requests and `/uploads` to the Make MI server. Run `npm run build` to create a production build.

## Color Match

Open `/color-match` to get a browser-only palette suggestion from a camera capture or a local photo. The photo is never uploaded or saved; signed-in users can save only their skin depth, undertone, and palette. The result is a styling suggestion and can vary with lighting and camera settings. Local face detector and landmark models load from `public/models`; no model files are downloaded at runtime. Camera use requires permission and HTTPS or localhost. Run `npm test` for the Vitest color-engine tests.
