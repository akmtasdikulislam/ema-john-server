// Standard Node.js modules
const path = require("path");

// Third-party packages
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection configuration
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.dkmkvf0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Database and collection references
let database, productsCollection;

// Connect to MongoDB
async function connectToDatabase() {
  // Task list:
  // • Establish connection to MongoDB
  // • Log successful connection
  // • Initialize database and collection references
  // • Handle and log any connection errors

  try {
    // Attempt to connect to the MongoDB server
    await client.connect();

    // Log a success message if the connection is established
    console.log("Connected successfully to MongoDB");

    // Initialize the database reference using the environment variable
    database = client.db(process.env.DB_DATABSE);

    // Initialize the collection reference using the environment variable
    productsCollection = database.collection(process.env.DB_COLLECTION);
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
  // • Send the products as a JSON response
  // • Handle any errors that occur during the process

  try {
    // Query the productsCollection to find all documents and convert to an array
    const products = await productsCollection.find({}).toArray();

    // Send the retrieved products as a JSON response
    res.json(products);
  } catch (error) {
    // Log any errors that occur during the product retrieval process
    console.error("Error fetching products:", error);

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
      .find({ sellerUid: sellerUid })
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

// Get a specific product
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
      message: "Product inserted successfully",
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

  try {
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
    const sellerId = decodedToken.uid;

    // Fetch orders for the specific seller from the database
    const orders = await db
      .collection("orders")
      .find({ sellerId: sellerId })
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
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new order
app.post("/orders/add", async (req, res) => {
  // Task list:
  // • Handle POST requests to create a new order
  // • Validate the request body
  // • Create a new order in the database
  // • Send a response with the created order

  try {
    // Extract order details from the request body
    const { customerId, products, totalAmount } = req.body;

    // Validate the request body
    if (!customerId || !products || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create a new order document
    const newOrder = {
      customerId,
      products,
      totalAmount,
      orderDate: new Date(),
    };

    // Insert the new order into the database
    const result = await db.collection("orders").insertOne(newOrder);

    // Send a success response with the created order
    res.status(201).json({
      message: "Order created successfully",
      order: {
        _id: result.insertedId,
        ...newOrder,
      },
    });
  } catch (error) {
    // Log any errors that occur during the order creation process
    console.error("Error creating order:", error);

    // Send a 500 Internal Server Error status with an error message
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a specific order
app.delete("/orders/:orderId", async (req, res) => {
  // Task list:
  // • Handle DELETE requests to remove a specific order
  // • Validate the order ID
  // • Delete the order from the database
  // • Send a response indicating success or failure

  try {
    // Extract the order ID from the request parameters
    const { orderId } = req.params;

    // Validate the order ID
    if (!orderId) {
      return res.status(400).json({ error: "Missing order ID" });
    }

    // Delete the order from the database
    const result = await db
      .collection("orders")
      .deleteOne({ _id: new ObjectId(orderId) });

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

// Simple route
// Define a route for the root URL ("/")
app.get("/", (req, res) => {
  // Task list:
  // • Handle GET requests to the root URL
  // • Send a simple "Hello, World!" response to the client

  // Send the "Hello, World!" text as the response
  res.send("Hello, World!");
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
  const PORT = process.env.PORT || 3000;

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
