# Make MI

Make MI is an e-commerce application with a Node/Express API and a React/Vite client.

## Run the backend

1. Start MongoDB locally or set an Atlas URL in `server/.env`.
2. In `server`, copy `.env.example` to `.env`, then set `MONGO_URI` and `JWT_SECRET`.
3. Run `npm install`, `npm run seed`, and `npm run dev`.

The API is available at `http://localhost:5000`.

## Run the frontend

1. In a second terminal, change to `client` and run `npm install`.
2. Copy `.env.example` to `.env` if you want to set a different API URL. The default is `http://localhost:5000/api`.
3. Run `npm run dev` and open the Vite URL printed in the terminal (usually `http://localhost:5173`).

The Vite development server proxies `/api` and `/uploads` to the backend. You can also run `npm run build` to create a production build.

## Frontend delivery stages

- Stage (a): shared layout, auth, and route guards.
- Stage (b): home discovery, URL-synced product listing, and product details with review eligibility.
- Stage (c): cart, wishlist, checkout, and orders.
- Stage (d): profile, saved addresses, color profile controls, and admin dashboard, catalog, order, and user management.

The current client implements stages (a) through (d): guest and account carts, wishlist, checkout with mock or Stripe test payment, order history and tracking, profile management, and admin tools.

| Route | Access | Purpose |
| --- | --- | --- |
| `/cart` | Guest or signed-in | Local guest cart or backend account cart; update quantities and continue checkout |
| `/wishlist` | Signed-in | Saved products, remove, and move to cart |
| `/checkout` | Signed-in | Shipping address, order review, and mock or Stripe test payment |
| `/orders` | Signed-in | Order history |
| `/orders/:id` | Signed-in | Order details, status tracker, cancellation, and delivered-item review links |
| `/profile` | Signed-in | Edit account details, saved addresses, and color profile |
| `/admin` | Admin | Sales totals, monthly sales chart, and recent orders |
| `/admin/products` | Admin | Search, paginate, add, edit, and delete products with image uploads and color swatches |
| `/admin/orders` | Admin | Review orders and update fulfillment status |
| `/admin/users` | Admin | View registered users and roles |

Guest carts persist in `localStorage` and merge into the account cart after login. For real Stripe test payments, set `STRIPE_SECRET_KEY` in `server/.env` and `VITE_STRIPE_PUBLISHABLE_KEY` in `client/.env`; with no Stripe secret the checkout uses its mock test payment.

### Check the stage (c) shopping flow

1. As a guest, add a product to the cart (choose a color and size on product detail when shown), then open `/cart` and confirm the cart badge and guest cart persist after refreshing.
2. Register or sign in. The guest cart merges into the account cart; check that the items remain and that the guest storage is cleared.
3. Save a product with its heart button, open `/wishlist`, then try remove and move-to-cart. Confirm the navbar wishlist and cart counts update.
4. Open checkout, enter or select a shipping address, review the order, then pay. With `STRIPE_SECRET_KEY` blank, enter a test name, accept the mock payment checkbox, and choose **Pay now**.
5. Open the order from the confirmation page or `/orders`. Verify its items and address, status tracker, and **Cancel order** confirmation. A newly placed order is cancellable while it is `Placed` or `Packed`; delivered orders show a **Write a review** link per item.

### Check profile and admin tools (stage d)

1. Sign in with the seeded admin account `admin@example.com` / `Admin@123` and open `/admin`. The dashboard shows sales, order, user, and product totals, the monthly sales chart, and up to five recent orders.
2. Open **Products**, add a product with PNG/JPEG/WebP/GIF images and named colors with hex values, then edit it and delete it. Images upload to the server's `/uploads` directory.
3. Open **Orders**, inspect an order's address and items, then change its status. Open **Users** and verify the user list and role badges.
4. Sign out, sign in with a normal user account, and visit `/admin`; the user returns to the store with an admin access toast. Open `/profile`, edit account details, and add/edit/delete a saved address. Saved addresses appear as checkout options.
5. In `/profile`, a saved color profile shows skin depth, undertone, and palette swatches. Delete it to verify the action; without a profile, use **Find My Colors** to open `/color-match`.

## Color Match

Make MI Color Match uses locally served `@vladmandic/face-api` models and browser canvas sampling to suggest a style palette from one face. The camera remains in the browser; camera streams stop after capture and when leaving the page. Photo uploads also stay in browser memory and are never posted or written to storage. Only a signed-in user’s skin depth, undertone, and suggested color palette are sent to the existing color-profile endpoint. Guests can view their result for the current tab session; no photo preview is stored in session storage.

The result uses broad CIELAB lightness ranges and a rule-based warm/cool/neutral estimate. Color rendering varies with light, camera white balance, and image quality, so suggestions are for styling only and are not a scientific, medical, or identity assessment. Use even natural light, no filters, and one unobstructed face. Camera access requires browser permission and a secure context (HTTPS, or localhost); the local upload option is available when camera access is unavailable. The face detector and landmark files must be present in `client/public/models` and are loaded from `/models` without runtime downloads.

The client tests the color conversion, classification, and all 15 palette combinations with Vitest. From `client`, run `npm test`.

## Deployment

### MongoDB Atlas

1. Create an Atlas cluster and database user.
2. Add your Render backend outbound IPs to Atlas Network Access, or use `0.0.0.0/0` for a quick test environment.
3. Copy the Atlas connection string and set the database name, for example `make-mi`.

### Backend on Render

Create a Render Web Service connected to this repository.

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Optional seed command after first deploy: open a Render shell and run `npm run seed`

Set these Render environment variables:

| Variable | Example | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Enables production mode. |
| `PORT` | Render provides this | `server.js` listens on `process.env.PORT`. You usually do not need to set it manually. |
| `MONGO_URI` | `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/make-mi?retryWrites=true&w=majority` | MongoDB Atlas connection string. |
| `JWT_SECRET` | `use-a-long-random-secret` | Required for auth tokens. |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime. |
| `CLIENT_URL` | `https://your-app.vercel.app` | Use comma-separated origins for previews/custom domains, for example `https://your-app.vercel.app,https://www.example.com`. |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Optional. Leave blank to use the mock payment flow. |

Uploaded images are served from `/uploads`. The seeded product images live in `server/uploads/products` and are included in the project. If you expect admin uploads to persist across Render deploys/restarts, add a Render persistent disk mounted at `server/uploads` or move uploads to object storage later.

### Frontend on Vercel

Create a Vercel project connected to this repository.

- Root Directory: `client`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

Set these Vercel environment variables:

| Variable | Example | Notes |
| --- | --- | --- |
| `VITE_API_URL` | `https://your-render-service.onrender.com/api` | Required for all API calls and upload image URLs. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | Optional unless using Stripe test payments. |

The Vercel SPA rewrite is configured in `client/vercel.json`, so direct visits to routes like `/products` and `/orders/:id` load `index.html` correctly.

### Final checks

1. Deploy the backend first and confirm `https://your-render-service.onrender.com/api/products` returns JSON.
2. Set the deployed frontend URL in Render `CLIENT_URL` and redeploy/restart the backend.
3. Set `VITE_API_URL` in Vercel to the Render API URL ending in `/api`, then deploy the frontend.
4. Register or sign in, load product images, add to cart, place a mock order, and test Color Match over HTTPS.
