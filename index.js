// Standard Node.js modules
const path = require("path");

// Third-party packages
// ** Express and middleware imports **
const express = require("express"); // Main framework for creating the server
const cors = require("cors"); // Middleware to enable CORS (Cross-Origin Resource Sharing)
const bodyParser = require("body-parser"); // Middleware to parse incoming request bodies

// ** Configuration imports **
const dotenv = require("dotenv"); // Load environment variables from a .env file

// ** Database imports **
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb"); // MongoDB driver and utilities for database operations

// ** Authentication imports **
const admin = require("firebase-admin"); // Firebase Admin SDK for server-side Firebase operations

// ** Payment processing imports **
const Stripe = require("stripe"); // Stripe library for payment processing

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS) for all routes
app.use(bodyParser.json()); // Parse incoming JSON payloads
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies (as sent by HTML forms)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Initialize Stripe with the secret key from environment variables
// MongoDB connection configuration
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.dkmkvf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// MongoDB database and collection references
let database, productsCollection, ordersCollection, reviewsCollection;

// Connect to MongoDB
async function connectToDatabase() {
  // Task list:
  // • Establish connection to MongoDB
  // • Log successful connection
  // • Initialize database and collection references
  // • Handle and log any connection errors
  // • Implement connection retry mechanism
  // • Set up database indexes (if needed)

  try {
    // Attempt to connect to the MongoDB server
    await client.connect();

    // Log a success message if the connection is established
    console.log("Connected successfully to MongoDB");

    // Initialize the database reference using the environment variable
    database = client.db(process.env.DB_DATABASE);

    // Initialize the collection references using the environment variables
    productsCollection = database.collection(
      process.env.DB_PRODUCTS_COLLECTION
    );
    ordersCollection = database.collection(process.env.DB_ORDERS_COLLECTION);
    reviewsCollection = database.collection(process.env.DB_REVIEWS_COLLECTION);
  } catch (error) {
    // Log any errors that occur during the connection process
    console.error("Error connecting to MongoDB:", error);

    // Exit the process with a failure code if connection fails
    process.exit(1);
  }
}

// Route handlers

// PRODUCTS ROUTES

// Get all products
app.get("/products", async (req, res) => {
  // Task list:
  // • Retrieve all products from the database
  // • Shuffle the products
  // • Send the shuffled products as a JSON response
  // • Handle any errors that occur during the process

  try {
    // Query the productsCollection to find all documents and convert to an array
    const products = await productsCollection.find({}).toArray();

    // Shuffle the products array
    for (let i = products.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [products[i], products[j]] = [products[j], products[i]];
    }

    // Send the shuffled products as a JSON response
    res.json(products);
    console.log("Products fetched successfully");
  } catch (error) {
    // Log any errors that occur during the product retrieval process
    console.error("Error fetching products:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search products by name
app.get("/products/search", async (req, res) => {
  // Task list:
  // • Retrieve the search query from the request parameters
  // • Search for products in the database that match the query
  // • Send the matched products as a JSON response
  // • Handle any errors that occur during the process

  try {
    // Retrieve the search query from the request parameters
    const searchQuery = req.query.q;

    // If no search query is provided, return an error
    if (!searchQuery) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Create a case-insensitive regular expression for the search query
    const searchRegex = new RegExp(searchQuery, "i");

    // Query the productsCollection to find products with matching names
    const matchedProducts = await productsCollection
      .find({ name: { $regex: searchRegex } })
      .toArray();

    // Send the matched products as a JSON response
    res.json(matchedProducts);
  } catch (error) {
    // Log any errors that occur during the product search process
    console.error("Error searching products:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get paginated, shuffled products
app.get("/products/page", async (req, res) => {
  // Task list:
  // • Retrieve the requested page number from the query parameters
  // • Calculate the total number of products and pages
  // • Check if the requested page exists
  // • Retrieve a shuffled, paginated subset of products
  // • Send the paginated products along with pagination metadata as a JSON response
  // • Handle any errors that occur during the process

  try {
    // Parse the page number from the query parameters, defaulting to 1 if not provided
    const page = parseInt(req.query.page) || 1;

    // Set the number of products per page
    const pageSize = 10;

    // Count the total number of products in the collection
    const totalProducts = await productsCollection.countDocuments();

    // Calculate the total number of pages needed to display all products
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Check if the requested page number is greater than the total number of pages
    if (page > totalPages) {
      // If the page doesn't exist, return a 404 error
      return res.status(404).json({ error: "Page not found" });
    }

    // Use aggregation to shuffle and paginate the products
    const products = await productsCollection
      .aggregate([
        // Randomly sample all products to shuffle them
        { $sample: { size: totalProducts } },
        // Skip the products on previous pages
        { $skip: (page - 1) * pageSize },
        // Limit the result to the current page size
        { $limit: pageSize },
      ])
      .toArray();

    // Send the response as JSON, including products and pagination metadata
    res.json({
      products,
      currentPage: page,
      totalPages,
      pageSize,
      totalProducts, // Added to provide information about the total number of products
    });
  } catch (error) {
    // Log any errors that occur during the paginated product retrieval process
    console.error("Error fetching paginated products:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get a products of a specific seller
app.get("/products/seller/:uid", async (req, res) => {
  // Task list:
  // • Extract the seller's Firebase UID from the request parameters
  // • Retrieve all products for the specific seller from the database
  // • Send the products as a JSON response
  // • Handle any errors that occur during the process

  try {
    // Extract the seller's Firebase UID from the request parameters
    const sellerUid = req.params.uid;

    // Query the productsCollection to find all documents for the specific seller and convert to an array
    const sellerProducts = await productsCollection
      .find({ sellerID: sellerUid })
      .toArray();
    // Send the retrieved products as a JSON response
    res.json(sellerProducts);
  } catch (error) {
    // Log any errors that occur during the product retrieval process
    console.error("Error fetching seller products:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new product
app.post("/products/add", async (req, res) => {
  // Task list:
  // • Receive new product data from the request body
  // • Insert the new product into the database
  // • Send a success response with the inserted product's ID
  // • Handle any errors that occur during the process

  try {
    // Extract the new product data from the request body
    const newProduct = req.body;
    // Insert the new product into the productsCollection
    const result = await productsCollection.insertOne(newProduct);

    // Send a 201 Created status with a success message and the inserted product's ID
    res.status(201).json({
      message: "A new product added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    // Log any errors that occur during the product insertion process
    console.error("Error inserting product:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update a specific product
app.put("/products/update/:id", async (req, res) => {
  // Task list:
  // • Extract the product ID from the request parameters
  // • Retrieve the updated product data from the request body
  // • Update the product in the database
  // • Handle the case where the product is not found
  // • Send a success response with the update result
  // • Handle any errors that occur during the process

  try {
    // Extract the product ID from the request parameters
    const productId = req.params.id;

    // Retrieve the updated product data from the request body
    const updatedProduct = req.body;

    // Update the product in the database using the product ID and the updated data
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(productId) }, // Find the product by its ID
      { $set: updatedProduct } // Set the new values for the product
    );

    // Check if the product was found and updated
    if (result.matchedCount === 0) {
      // If no product was found, return a 404 Not Found status with an error message
      return res.status(404).json({ error: "Product not found" });
    }

    // Send a success response with the update result
    res.json({
      message: "Product updated successfully",
      modifiedCount: result.modifiedCount, // Include the number of modified documents
    });
  } catch (error) {
    // Log any errors that occur during the product update process
    console.error("Error updating product:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a specific product
app.delete("/products/delete/:id", async (req, res) => {
  // Task list:
  // • Extract the product ID from the request parameters
  // • Delete the product from the database
  // • Handle the case where the product is not found
  // • Send a success response with the deletion result
  // • Handle any errors that occur during the process

  try {
    // Extract the product ID from the request parameters
    const productId = req.params.id;
    // Attempt to delete the product from the database using its ID
    const result = await productsCollection.deleteOne({
      _id: new ObjectId(productId),
    });

    // Check if a product was actually deleted
    if (result.deletedCount === 0) {
      // If no product was found, return a 404 Not Found status with an error message
      return res.status(404).json({ error: "Product not found" });
    }

    // Send a success response with information about the deletion
    res.json({
      message: "Product deleted successfully",
      deletedCount: result.deletedCount, // Include the number of deleted documents
    });
  } catch (error) {
    // Log any errors that occur during the product deletion process
    console.error("Error deleting product:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// ORDERS ROUTES

// Retrieve all orders of a specific seller
app.get("/orders", async (req, res) => {
  // Task list:
  // • Handle GET requests to retrieve orders for a specific seller
  // • Verify the seller's authentication using Firebase
  // • Fetch orders from the database for the authenticated seller
  // • Send a response with the retrieved orders
  // • Handle any errors that occur during the process

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_CONFIG); // Firebase service account credentials
    // Check if Firebase app is already initialized
    if (admin.apps.length < 1) {
      // Firebase Admin SDK initialization
      // This allows server-side Firebase operations with elevated privileges
      admin.initializeApp({
        // Use the service account credentials for authentication
        credential: admin.credential.cert(serviceAccount),
      });
    }

    console.log(admin.apps.length);

    // Get the Firebase ID token from the request headers
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    // Check if the idToken is missing or undefined
    if (!idToken) {
      // If no token is provided, return a 401 Unauthorized status
      // with an error message indicating that authentication is required
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const sellerID = decodedToken.uid;

    // Fetch orders for the specific seller from the database
    const orders = await ordersCollection
      .find({ sellerID: sellerID })
      .toArray();

    // Send a success response with the retrieved orders
    res.json({
      message: "Orders retrieved successfully",
      orders: orders,
    });
  } catch (error) {
    // Log any errors that occur during the order retrieval process
    console.error("Error retrieving orders:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({
      errorMessage: "Internal server error - Error retrieving orders",
      error,
    });
  }
});

// Add new order
app.post("/orders/add", async (req, res) => {
  // Task list:
  // • Handle POST requests to create multiple new orders
  // • Validate the request body (ensure it's an array)
  // • Remove any existing _id fields from the orders
  // • Insert multiple orders into the database
  // • Send a response with the created orders and insert count
  // • Handle any errors that occur during the process

  try {
    const orderedProducts = req.body;

    // Ensure orderedProducts is an array
    if (!Array.isArray(orderedProducts)) {
      return res
        .status(400)
        .json({ error: "Invalid request body. Expected an array of orders." });
    }

    // Remove any existing _id fields from the orders
    const ordersWithoutIds = orderedProducts.map((order) => {
      const { _id, ...orderWithoutId } = order;
      return orderWithoutId;
    });

    // Insert multiple orders into the database
    const result = await ordersCollection.insertMany(ordersWithoutIds);

    // Send a success response with the created orders
    res.status(201).json({
      message: "Orders created successfully",
      orders: result.ops,
      insertedCount: result.insertedCount,
    });
  } catch (error) {
    // Log any errors that occur during the order creation process
    console.error("Error creating orders:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a specific order
app.delete("/orders/:orderID", async (req, res) => {
  // Task list:
  // • Handle DELETE requests to remove a specific order
  // • Validate the order ID
  // • Delete the order from the database
  // • Send a response indicating success or failure

  try {
    // Extract the order ID from the request parameters
    const { orderID } = req.params;

    // Validate the order ID
    if (!orderID) {
      return res.status(400).json({ error: "Missing order ID" });
    }

    // Delete the order from the database
    const result = await ordersCollection.deleteOne({ orderID: orderID });

    // Check if an order was actually deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send a success response
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    // Log any errors that occur during the order deletion process
    console.error("Error deleting order:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get random product reviews
app.get("/product-reviews", async (req, res) => {
  // Task list:
  // • Handle GET requests to retrieve random product reviews
  // • Fetch a random number (not less than 10) of product reviews from the database
  // • Send the reviews as a response
  // • Handle any errors that occur during the process

  try {
    // Determine the number of reviews to fetch (random number between 10 and 20)
    const reviewCount = Math.floor(Math.random() * 11) + 10;

    // Fetch random reviews from the database
    const reviews = await reviewsCollection
      .aggregate([{ $sample: { size: reviewCount } }])
      .toArray();

    // Check if reviews were found
    if (reviews.length === 0) {
      return res.status(404).json({ error: "No reviews found" });
    }

    // Send the reviews as a response
    res.status(200).json(reviews);
  } catch (error) {
    // Log any errors that occur during the review retrieval process
    console.error("Error fetching product reviews:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new product review
app.post("/product-reviews/add", async (req, res) => {
  // Task list:
  // • Handle POST requests to add a new product review
  // • Validate the incoming review data
  // • Insert the new review into the database
  // • Send a success response
  // • Handle any errors that occur during the process

  try {
    console.log("Adding product review");
    // Extract the review data from the request body
    const { review } = req.body;

    // Insert the new review into the database
    const result = await reviewsCollection.insertOne(review);

    // Check if the review was successfully inserted
    if (result.insertedCount === 0) {
      return res.status(500).json({ error: "Failed to add review" });
    }

    // Send a success response
    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    // Log any errors that occur during the review addition process
    console.error("Error adding product review:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Simple route
// Define a route for the root URL ("/")
app.get("/", (req, res) => {
  // Task list:
  // • Handle GET requests to the root URL
  // • Send a simple "Hello, World!" response to the client

  // Send the "Hello, World!" text as the response
  res.send("Hello, World!");
  console.log("Server Running");
});

// Create payment intent for Stripe
app.post("/create-payment-intent", async (req, res) => {
  // Task list:
  // • Handle POST requests to create a payment intent
  // • Extract the amount from the request body
  // • Create a payment intent using the Stripe API
  // • Send the clientSecret back to the client
  // • Handle any errors that occur during the process

  try {
    // Extract the amount from the request body
    const { amount } = req.body;

    // Create a payment intent using the Stripe API
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });
    // Send the clientSecret back to the client
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    // Log any errors that occur during the payment intent creation process
    console.error("Error creating payment intent:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
async function startServer() {
  // Task list:
  // • Connect to the database
  // • Determine the server port
  // • Start the server
  // • Log a message when the server starts successfully

  // Establish a connection to the database before starting the server
  await connectToDatabase();

  // Set the port number, using the environment variable if available, otherwise default to 3000
  const PORT = process.env.PORT || 5000;

  // Start the server and make it listen on the specified port
  app.listen(PORT, () => {
    // Log a message to the console indicating that the server has started and on which port
    console.log(`Server is running on port ${PORT}`);
  });
}

// Start the server

// Task list:
// • Call the startServer function to initialize the server
// • Use .catch() to handle any errors that occur during server startup
// • Pass any caught errors to console.error for logging

// Call the asynchronous startServer function to begin the server initialization process
startServer()
  // Use .catch() to handle any errors that might occur during the server startup
  .catch(
    // Pass any caught errors to console.error for logging and debugging purposes
    console.error
  );
