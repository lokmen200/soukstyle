# SoukStyle Backend API Documentation

This document provides a complete guide to the SoukStyle backend API, a RESTful service built with Node.js, Express.js, and MongoDB. It powers an e-commerce platform connecting local artisans with customers in Algeria, supporting features like user authentication, shop and product management, order processing, reviews, notifications, and more.

## Introduction

The SoukStyle backend API is designed to support an e-commerce platform where:
- **Users** browse shops, purchase products, and leave reviews.
- **Shop Owners** create and manage shops, products, and coupons.
- **Employees** assist shop owners with order and inventory management.
- **Admins** oversee the platform, managing users, shops, and categories.

All endpoints are prefixed with `/api/`. This documentation ensures frontend developers have everything needed to integrate with the backend.

## Setup Instructions

### Prerequisites
- **Node.js**: v14 or higher
- **MongoDB**: Local or cloud instance (e.g., MongoDB Atlas)
- **npm** or **yarn**: Package manager

### Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/lokmen200/soukstyle.git
   cd soukstyle-backend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Set Up Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/soukstyle
   JWT_SECRET=your_jwt_secret_key
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   ```
4. **Start the Server**:
   ```bash
   npm start
   ```
   The server runs on `http://localhost:5000` by default.

### Database Configuration
- **Connection**: Configured in `config/db.js` using `MONGO_URI`.
- **Seeding**: Use a script in `utils/seed.js` or a MongoDB client to populate initial data (e.g., categories).

## Technologies Used

- **Node.js**: Server-side runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication tokens
- **Bcrypt.js**: Password hashing
- **Nodemailer**: Email notifications
- **Winston**: Logging (configured in `utils/logger.js`)

## Authentication

### Obtaining a Token
- **Register**: `POST /api/users/register`
  - **Payload**: `{ "name": "string", "email": "string", "password": "string", "role": "user|shop_owner|employee" }`
  - **Response** (201): `{ "token": "jwt_token" }`
- **Login**: `POST /api/users/login`
  - **Payload**: `{ "email": "string", "password": "string" }`
  - **Response** (200): `{ "token": "jwt_token" }`

### Using the Token
Include in headers for protected endpoints:
```http
x-auth-token: your_jwt_token
```

### Roles
- **`user`**: Customers browsing and shopping.
- **`shop_owner`**: Shop creators and managers.
- **`employee`**: Shop staff managing orders and inventory.
- **`admin`**: Platform overseers.

## Error Handling

Errors are returned in JSON:
```json
{
  "message": "Error description",
  "error": "Detailed error (optional)"
}
```

### Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not found
- **500**: Server error

## API Endpoints

### Users
| Method | Endpoint            | Description                     | Authentication       |
|--------|---------------------|---------------------------------|----------------------|
| POST   | `/users/register`   | Register a new user             | None                 |
| POST   | `/users/login`      | Log in a user                   | None                 |
| GET    | `/users/me`         | Get user details                | Protected            |
| PUT    | `/users/me`         | Update user profile             | Protected            |
| DELETE | `/users/me`         | Delete user account             | Protected            |

- **PUT /users/me**: `{ "name": "string", "address": { "wilaya": "string", "city": "string", "street": "string" } }`
- **DELETE /users/me**: Returns `{ "message": "User deleted" }`

### Shops
| Method | Endpoint                        | Description                     | Authentication       |
|--------|---------------------------------|---------------------------------|----------------------|
| GET    | `/shops`                        | List shops                      | None                 |
| GET    | `/shops/:id`                    | Get shop details                | None                 |
| POST   | `/shops`                        | Create a shop                   | Shop Owner Only      |
| PUT    | `/shops/:id`                    | Update shop details             | Shop Owner Only      |
| DELETE | `/shops/:id`                    | Delete a shop                   | Shop Owner Only      |
| POST   | `/shops/:id/follow`             | Follow a shop                   | Protected            |
| POST   | `/shops/:id/unfollow`           | Unfollow a shop                 | Protected            |
| POST   | `/shops/:id/review`             | Submit a shop review            | Protected, Verified Buyers Only |
| POST   | `/shops/:shopId/employees`      | Add an employee                 | Shop Owner Only      |
| DELETE | `/shops/:shopId/employees/:employeeId` | Remove an employee       | Shop Owner Only      |
| GET    | `/shops/:shopId/employees`      | List shop employees             | Shop Owner Only      |

- **POST /shops/:shopId/employees**: `{ "employeeId": "string" }`

### Products
| Method | Endpoint             | Description                     | Authentication       |
|--------|----------------------|---------------------------------|----------------------|
| GET    | `/products`          | List products                   | None                 |
| GET    | `/products/:id`      | Get product details             | None                 |
| POST   | `/products`          | Create a product                | Shop Owner Only      |
| PUT    | `/products/:id`      | Update product details          | Shop Owner Only      |
| DELETE | `/products/:id`      | Delete a product                | Shop Owner Only      |
| POST   | `/products/:id/review`| Submit a product review         | Protected, Verified Buyers Only |

- **POST /products**: `{ "name": "string", "price": "number", "variants": [{ "size": "string", "color": "string", "stock": "number" }], "shopId": "string" }`

### Orders
| Method | Endpoint                  | Description                          | Authentication            |
|--------|---------------------------|--------------------------------------|---------------------------|
| GET    | `/orders/me`              | Get user’s order history             | Protected                 |
| GET    | `/orders/:id`             | Get order details                    | Protected                 |
| POST   | `/orders`                 | Place a new order                    | Protected                 |
| GET    | `/orders/shop/:shopId`    | Get shop’s orders with failed rate   | Shop Owner or Employee Only |
| PUT    | `/orders/:id/status`      | Update order status                  | Shop Owner or Employee Only |

- **GET /orders/shop/:shopId**: Includes `buyerFailedDeliveryRate` for each order.

### Carts
| Method | Endpoint             | Description                     | Authentication       |
|--------|----------------------|---------------------------------|----------------------|
| GET    | `/cart`              | Get user’s cart                 | Protected            |
| POST   | `/cart`              | Add/update cart item            | Protected            |
| DELETE | `/cart/:productId`   | Remove item from cart           | Protected            |
| DELETE | `/cart`              | Clear entire cart               | Protected            |

### Coupons
| Method | Endpoint             | Description                     | Authentication       |
|--------|----------------------|---------------------------------|----------------------|
| GET    | `/coupons/shop`      | Get shop’s coupons              | Shop Owner Only      |
| POST   | `/coupons`           | Create a new coupon             | Shop Owner Only      |
| DELETE | `/coupons/:id`       | Delete a coupon                 | Shop Owner Only      |

### Categories
| Method | Endpoint             | Description                     | Authentication       |
|--------|----------------------|---------------------------------|----------------------|
| GET    | `/categories`        | List all categories             | None                 |
| POST   | `/categories`        | Create a new category           | Admin Only           |
| PUT    | `/categories/:id`    | Update a category               | Admin Only           |
| DELETE | `/categories/:id`    | Delete a category               | Admin Only           |

### Admin
| Method | Endpoint                  | Description                     | Authentication       |
|--------|---------------------------|---------------------------------|----------------------|
| GET    | `/admin/users`            | List all users                  | Admin Only           |
| GET    | `/admin/shops`            | List all shops                  | Admin Only           |
| DELETE | `/admin/users/:id`        | Delete a user                   | Admin Only           |
| DELETE | `/admin/shops/:id`        | Delete a shop                   | Admin Only           |
| PUT    | `/admin/users/:id/role`   | Update user role                | Admin Only           |

### Reviews
| Method | Endpoint             | Description                     | Authentication       |
|--------|----------------------|---------------------------------|----------------------|
| POST   | `/products/:id/review`| Submit a product review         | Protected, Verified Buyers Only |
| POST   | `/shops/:id/review`  | Submit a shop review            | Protected, Verified Buyers Only |

### Notifications
| Method | Endpoint             | Description                     | Authentication       |
|--------|----------------------|---------------------------------|----------------------|
| GET    | `/notifications`     | Get user’s notifications        | Protected            |
| POST   | `/notifications`     | Send a notification             | Admin Only           |
| DELETE | `/notifications/:id` | Delete a notification           | Protected            |

## Data Models

### User
```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "user|shop_owner|employee|admin",
  "address": { "wilaya": "string", "city": "string", "street": "string" },
  "failedDeliveryRate": "number",
  "deliveryRating": "number",
  "ratingCount": "number"
}
```

### Shop
```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "owner": "string",
  "employees": ["string"],
  "followers": ["string"],
  "avgRating": "number",
  "ratingCount": "number",
  "ratings": [
    { "user": "string", "order": "string", "rating": "number", "review": "string", "createdAt": "date" }
  ]
}
```

### Product
```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "variants": [
    { "size": "string", "color": "string", "stock": "number" }
  ],
  "shop": "string",
  "avgRating": "number",
  "ratingCount": "number",
  "ratings": [
    { "user": "string", "order": "string", "rating": "number", "review": "string", "createdAt": "date" }
  ]
}
```

### Order
```json
{
  "_id": "string",
  "user": "string",
  "shop": "string",
  "products": [
    { "product": "string", "quantity": "number", "variant": { "size": "string", "color": "string" } }
  ],
  "total": "number",
  "status": "pending|shipped|delivered|returned",
  "createdAt": "date"
}
```

### Cart
```json
{
  "items": [
    { "product": "string", "quantity": "number", "variant": { "size": "string", "color": "string" } }
  ]
}
```

### Coupon
```json
{
  "_id": "string",
  "code": "string",
  "discount": "number",
  "expirationDate": "date",
  "shop": "string"
}
```

### Category
```json
{
  "_id": "string",
  "name": "string"
}
```

### Notification
```json
{
  "_id": "string",
  "user": "string",
  "message": "string",
  "createdAt": "date"
}
```

## Examples

### Register a User
**Request**:
```bash
POST /api/users/register
Content-Type: application/json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass",
  "role": "employee"
}
```
**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Add Employee to Shop
**Request**:
```bash
POST /api/shops/shop123/employees
Content-Type: application/json
x-auth-token: your_jwt_token
{
  "employeeId": "user456"
}
```
**Response**:
```json
{
  "message": "Employee added to shop"
}
```

### Get Shop Orders with Failed Delivery Rate
**Request**:
```bash
GET /api/orders/shop/shop123
x-auth-token: your_jwt_token
```
**Response**:
```json
[
  {
    "_id": "order789",
    "user": "user456",
    "items": [{ "product": "prod123", "quantity": 1, "variant": { "size": "M", "color": "Blue" } }],
    "total": 25.99,
    "status": "pending",
    "buyerFailedDeliveryRate": 10.5
  }
]
```

## Contributing Guidelines

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m "Add feature"`.
4. Push and submit a pull request: `git push origin feature/your-feature`.

## License

MIT License (see `LICENSE` file in the repository).
```

---

### Instructions
- **Save this as `README.md`** in the `soukstyle-backend/` directory of your project.
- This single file includes all sections, endpoints, models, examples, and setup details, ensuring frontend developers have a complete reference without needing multiple files.

Let me know if you’d like any adjustments or additional details included! This version should cover everything we’ve built, including the employee role and failed delivery rate, in a concise yet thorough format.