# Ema-John Server

<p align="center">
  <img src="./assets/project-cover.png" alt="Ema-John Server" style="max-width: 100%; height: auto;">
</p>

This is the server-side code for the Ema-John e-commerce website. It provides API endpoints for managing products, orders, and users.

## Table of Contents

1. [Introduction](#introduction)
   - [Project Oveview](#project-oveview)
2. [Project Structure](#project-structure)
3. [Dependencies](#dependencies)
4. [Configuration](#configuration)
5. [Database Connection](#database-connection)
6. [API Endpoints](#api-endpoints)
   - [Products API Routes](#products-api-routes)
     - [GET /products](#get-products)
     - [POST /products/add](#post-productsadd)
     - [PUT /products/update/:id](#put-productsupdateid)
     - [DELETE /products/delete/:id](#delete-productsdeleteid)
   - [Orders API Routes](#orders-api-routes)
     - [GET /orders](#get-orders)
     - [POST /orders/add](#post-ordersadd)
     - [DELETE /orders/:orderId](#delete-ordersorderid)
7. [Middleware](#middleware)
8. [Error Handling](#error-handling)
9. [Running the Server](#running-the-server)
10. [Contributing](#contributing)
11. [License](#license)

## Introduction

This is the server-side application for the Ema-John e-commerce platform. It provides a RESTful API for managing products and handling user interactions. The server is built using Node.js and Express, with MongoDB as the database.

### Project Overview

The Ema-John Server is the backend component of the Ema-John e-commerce platform. It is built using Node.js and Express.js, providing a robust and scalable RESTful API for managing products and handling user interactions. The server utilizes MongoDB as its database to store and retrieve data efficiently.

Key features of the Ema-John Server include:

1. Product management: API endpoints for retrieving, adding, updating, and deleting products.
2. Order processing: Endpoints for managing customer orders, including creation and retrieval.
3. Database integration: Seamless connection with MongoDB for data persistence.
4. Environment configuration: Use of environment variables for flexible deployment and security.
5. Error handling: Implemented middleware for consistent error management across the application.

The server is designed to support the frontend of the Ema-John e-commerce platform, enabling smooth communication between the client-side application and the database. It provides a solid foundation for building and scaling an online shopping experience.

## Project Structure

The main server file is `index.js`, which sets up the Express application, connects to the MongoDB database, and defines API routes. The project structure is organized as follows:

```plaintext
ema-john-server/
├── index.js
├── .env
├── package.json
├── README.md
└── node_modules/
```

Here's a brief explanation of each files and directories:

- `index.js`: The main server file that sets up the Express application, connects to the MongoDB database, and defines API routes.
- `.env`: Contains environment variables for configuration, such as database connection strings and API keys.
- `package.json`: Defines the project dependencies and scripts for running the application.
- `README.md`: Provides documentation and information about the project, including setup instructions and usage guidelines.
- `yarn.lock`: This file is an essential component of projects using the Yarn package manager. It serves several important purposes:

  - **Dependency Locking**: It locks the versions of all packages in your project's dependency tree, ensuring consistent installations across different environments.

  - **Reproducible Builds**: Guarantees that every team member and deployment pipeline uses exactly the same package versions, preventing "works on my machine" issues.

  - **Security**: By locking package versions, it helps prevent unexpected package updates that could introduce bugs or security vulnerabilities.

  - **Performance**: Yarn can optimize installations using the information in this file, making subsequent `yarn install` commands faster.

  The `yarn.lock` file is automatically generated and updated by Yarn and should be committed to version control.

## Dependencies

- express: Web application framework
- cors: Cross-Origin Resource Sharing middleware
- body-parser: Request body parsing middleware
- dotenv: Environment variable management
- mongodb: MongoDB driver for Node.js

## Configuration

The server uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:
`DB_USERNAME=your_mongodb_username
DB_PASSWORD=your_mongodb_password
PORT=3000`

## Database Connection

The server connects to a MongoDB Atlas cluster using the provided credentials. The connection string is constructed using environment variables for security. The `MongoClient` from the `mongodb` package is used to establish the connection.

```javascript
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.dkmkvf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
```

## API Endpoints

### Products API Routes Documentation

#### GET /products

Retrieves all products from the database.

- **Method:** GET
- **URL:** `/products`
- **Response:** JSON array of all products
- **Error Handling:** 500 Internal Server Error if retrieval fails

#### POST /products/add

Adds a new product to the database.

- **Method:** POST
- **URL:** `/products/add`
- **Body:** JSON object representing the new product
- **Response:**
  - Status: 201 Created
  - JSON object with success message and inserted product ID
- **Error Handling:** 500 Internal Server Error if insertion fails

#### PUT /products/update/:id

Updates an existing product in the database.

- **Method:** PUT
- **URL:** `/products/update/:id`
- **URL Parameters:** `id` (product ID)
- **Body:** JSON object with updated product data
- **Response:**
  - JSON object with success message and number of modified documents
  - 404 Not Found if product doesn't exist
- **Error Handling:** 500 Internal Server Error if update fails

#### DELETE /products/delete/:id

Deletes a specific product from the database.

- **Method:** DELETE
- **URL:** `/products/delete/:id`
- **URL Parameters:** `id` (product ID)
- **Response:**
  - JSON object with success message and number of deleted documents
  - 404 Not Found if product doesn't exist
- **Error Handling:** 500 Internal Server Error if deletion fails

All routes interact with the `productsCollection` (MongoDB) and include proper error handling. They follow RESTful API design principles and provide informative responses for successful operations and error cases.

### Orders API Routes Documentation

#### GET /orders

Retrieves all orders for a specific seller.

- **Method:** GET
- **URL:** `/orders`
- **Headers:**
  - `Authorization: Bearer <Firebase ID Token>`
- **Response:**
  - JSON object with success message and array of orders
- **Error Handling:**
  - 401 Unauthorized if no token provided
  - 500 Internal Server Error if retrieval fails

#### POST /orders/add

Creates a new order in the database.

- **Method:** POST
- **URL:** `/orders/add`
- **Body:** JSON object with order details
  - `customerId` (required)
  - `products` (required)
  - `totalAmount` (required)
- **Response:**
  - Status: 201 Created
  - JSON object with success message and created order details
- **Error Handling:**
  - 400 Bad Request if required fields are missing
  - 500 Internal Server Error if creation fails

#### DELETE /orders/:orderId

Deletes a specific order from the database.

- **Method:** DELETE
- **URL:** `/orders/:orderId`
- **URL Parameters:** `orderId` (order ID)
- **Response:**
  - JSON object with success message
  - 404 Not Found if order doesn't exist
- **Error Handling:**
  - 400 Bad Request if order ID is missing
  - 500 Internal Server Error if deletion fails

All routes interact with the `orders` collection in the database. They include proper error handling and follow RESTful API design principles. The GET /orders route requires Firebase authentication, while the others do not have explicit authentication checks in the provided code snippet.

## Middleware

The server uses the following middleware:

CORS: Enables Cross-Origin Resource Sharing

```javascript
app.use(cors());
```

Body Parser: Parses incoming request bodies

```javascript
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
```

## Error Handling

(Note: Specific error handling is not visible in the provided code snippet. You should implement and document error handling mechanisms here.)

## Running the Server

Install dependencies:

```bash
npm install
```

Set up environment variables in .env file
Start the server:

```bash
npm start
```

## Contributing

Contributions are welcome! Please follow these steps:

Fork the repository
Create a new branch: git checkout -b feature-branch-name
Make your changes and commit them:

```bash
git commit -m 'Add some feature'
```

Push to the branch: git push origin feature-branch-name
Create a pull request

## License

This project is licensed under the MIT License.
