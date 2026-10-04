# Make MI API

Make MI's Node.js/Express ES module backend with MongoDB/Mongoose, JWT auth, local image uploads, and Stripe Payment Intents (mock mode when `STRIPE_SECRET_KEY` is blank).

## Run locally

1. Install Node.js 18+ and start MongoDB locally, or provide a MongoDB Atlas connection string.
2. From this directory run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGO_URI` and a private `JWT_SECRET`. Set `STRIPE_SECRET_KEY` to enable Stripe test mode; leave it blank for mock payments.
4. Run `npm run seed` to create the admin and 42 sample products. Admin login: `admin@example.com` / `Admin@123`.
5. Run `npm run dev`. The API listens on `http://localhost:5000` by default.

To remove all database records, run `npm run seed:destroy`. Uploaded images are served from `/uploads`; admin product create/update accepts multipart field `images`.

## API

All successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "message": ... }`. Protected routes need `Authorization: Bearer <token>`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register`, `/api/auth/login` | Public | Register/login; returns access token |
| GET | `/api/auth/me` | User | Current user |
| GET | `/api/products` | Public | Filters: `search,category,minPrice,maxPrice,rating,color,brand,sort,page,limit`; sort: `price,-price,rating,newest` |
| GET | `/api/products/suggestions?q=` | Public | Search suggestions |
| GET | `/api/products/:id`, `/related` | Public | Product and related items |
| GET/POST | `/api/products/:id/reviews` | Public/User | Reviews; submit requires a delivered order |
| GET/POST/PUT/DELETE | `/api/cart` and `/api/cart/:itemId` | User | Read, add, update quantity, remove, clear cart |
| GET/POST/DELETE | `/api/wishlist` and `/api/wishlist/:productId` | User | Read, add, remove wishlist items |
| POST | `/api/orders` | User | Place order from product IDs and shipping address |
| GET | `/api/orders/my`, `/api/orders/:id` | User | Own orders and order detail |
| PUT | `/api/orders/:id/cancel` | User | Cancel an eligible order |
| POST | `/api/payment/create-intent` | User | Stripe Payment Intent or mock intent |
| PUT | `/api/users/profile` | User | Update name/email/password |
| POST/PUT/DELETE | `/api/users/addresses[/:addressId]` | User | Manage addresses |
| POST/GET/DELETE | `/api/users/color-profile` | User | Save/read/delete color profile (no photo field accepted) |
| POST/PUT/DELETE | `/api/admin/products[/:id]` | Admin | Product CRUD; multipart `images` upload |
| GET | `/api/admin/orders`, `/api/admin/users`, `/api/admin/stats` | Admin | Admin data and monthly sales |
| PUT | `/api/admin/orders/:id/status` | Admin | Change order status |

See `requests.http` for requests covering the API. Product listing uses MongoDB text search. Payment intent creation is separate from order placement; integrate client-side Stripe confirmation before submitting an order in a production checkout.
