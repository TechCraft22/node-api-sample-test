process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);  
  process.exit(1); // Optional: crash the app to restart cleanly
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});


import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// create a swagger document
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";

import prettyMs from "pretty-ms";
import swaggerDocument from "./swagger.json" assert { type: "json" };
import { error } from "console";

const app = express();

app.use(express.json());
const PORT = process.env.PORT || 3000;
const errorLogFilePath = path.join(path.dirname(fileURLToPath(import.meta.url)),"logs", "errors.log" );


// Middleware to handle CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Allow all origins
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    // Preflight request, respond with 204 No Content
    return res.sendStatus(204);
  }
  next();
}); 

// TO-do hide x-powered-by header
app.disable("x-powered-by"); // Disable the x-powered-by header for security reasons

// Swagger definition options
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AI Project API",
      version: "1.0.0",
      description: "Auto-generated Swagger API documentation",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: [fileURLToPath(import.meta.url)], // You can specify additional files here
};

// Generate swagger spec at runtime
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve the auto-generated Swagger JSON
app.get("/swagger", (req, res) => {
  //res.setHeader('Content-Type', 'application/json');

  if (!swaggerSpec) {
    return res.status(500).json({
      error: "Swagger specification could not be generated.",
    });
  } else if (Object.keys(swaggerSpec).length === 0) {
    return res.status(500).json({
      error: "Swagger specification is empty.",
    });
  } else {
    // write the swagger spec to a file
    const swaggerFilePath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "swagger.json"
    );
    try {
      fs.writeFileSync(swaggerFilePath, JSON.stringify(swaggerSpec, null, 2));
      console.log("Swagger specification written to swagger.json");
      res.status(200).json({
        message: "Swagger specification generated successfully."        
      });
    } catch (error) {
        console.error("Error writing Swagger specification to file:", error);
      return res.status(500).json({
        error: "Failed to write Swagger specification to file.",
      });
    }
  }
  //res.send(swaggerSpec);
});


// Serve the Swagger UI
// Note: Ensure that the swagger.json file is in the same directory as this script or adjust the path accordingly.
if (!swaggerDocument) {
  console.error(
    "Swagger document not found. Please ensure swagger.json exists in the correct path."
  );
  process.exit(1);
}
// use swagger for API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  const logMessage = `${new Date().toISOString()} - ${req.method}::${
    req.url
  }\n`;
  const logFilePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "requests.log"
  );
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      writeErrorLog(`Failed to write Request log to file: ${err.message}\n`);  
      console.error("Failed to write to log file:", err);
    }
  });

  next();
});

// Middleware to serve static HTML files without extension
app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !path.extname(req.path) && // no extension
    req.path !== "/" // skip root
  ) {
    const publicDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "public"
    );
    const htmlFilePath = path.join(publicDir, req.path + ".html");
    fs.access(htmlFilePath, fs.constants.F_OK, (err) => {
      if (!err) {
        res.sendFile(htmlFilePath);
      } else {
        next();
      }
    });
  } else {
    next();
  }
});

// Serve static files from the 'public' directory
app.use(
  express.static(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "public")
  )
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome here. ",
  });
});

app.get("/greetu", (req, res) => {
  const name = req.query.name;
  if (name && typeof name === "string" && name.trim().length > 3) {
    res.status(200).json({
      message: `Hello ${name.trim()}!`,
    });
  } else {
    res.status(400).json({
      error: "Invalid name parameter",
      message: "Please provide a valid non-empty name as a query parameter.",
    });
  }
});

//generate swagger documentation for the /greet endpoint
/**
 * @swagger
 * /greet:
 *   get:
 *     summary: Greet a user
 *     description: Returns a greeting message with the provided name or "world" if no name is given.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
 *         description: The name of the user to greet.
 *     responses:
 *       200:
 *         description: A greeting message.
 *       400:
 *         description: Invalid name parameter.
 */
app.get("/greet", (req, res) => {
  // TODO: Validate that name is at least 2 characters
  if (req.query.name && req.query.name.trim().length < 3) {
    return res.status(400).json({
      error: "Name must be at least 3 characters long",
    });
  }
  res.status(200).json({
    message: `Hello ${req.query.name || "world"}!`,
  });
});


// TO DO create swagger documentation for the /echo endpoint
/** * @swagger
 * /echo:
 *   post:
 *     summary: Echo back the provided JSON data
 *     description: Returns the JSON data sent in the request body.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Successfully echoed back the provided data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: object
 *                   additionalProperties: true
 *       400:
 *         description: No data provided in the request body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No data provided"
 *                 message:
 *                   type: string
 *                   example: "Please provide a JSON body in the request."
 */
app.post("/echo", (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "No data provided",
      message: "Please provide a JSON body in the request.",
    });
  }
  res.status(200).json({
    received: req.body,
  });
});

// TO DO create swagger documentation for the /health endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check server health
 *     description: Returns the health status of the server.
 *     responses:
 *       200:
 *         description: Server is healthy.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-18T12:15:31.195Z"
 */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// TO-DO create swagger documentation for the /status endpoint
/** 
 * @swagger
 * /status:
 *   get:
 *     summary: Get server status
 *     description: Returns the server status, uptime, and current timestamp.
 *     responses:
 *       200:
 *         description: Server status information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Server is running"
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 pretty:
 *                   type: string
 *                   example: "2 minutes 3 seconds"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-18T12:15:31.195Z"
 */

app.get("/status", (req, res) => {
  res.status(200).json({
    status: "Server is running",
    uptime: Number(process.uptime().toFixed(2)),
    pretty: prettyMs(process.uptime() * 1000), // convert seconds to milliseconds for pretty formatting
    timestamp: new Date().toISOString(),
  });
});

// TO-DO create swagger documentation for the /version endpoint
/**
 * @swagger
 * /version:
 *   get:
 *     summary: Get API version
 *     description: Returns the API version and current timestamp.
 *     responses:
 *       200:
 *         description: API version information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-18T12:15:31.195Z"
 */
app.get("/version", (req, res) => {
  res.status(200).json({
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});


//create swagger documentation for the /test-error-async endpoint
/** * @swagger
 * /test-error-async:
 *   get:
 *     summary: Test asynchronous error handling
 *     description: This endpoint is used to test asynchronous error handling in the application.
 *     responses:
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Something went wrong!"
 *                 handler:
 *                   type: string
 *                   example: "Error Middleware"
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
// Endpoint to test asynchronous error handling
app.get('/test-error-async', async (req, res, next) => {
  try {
    // Async error
    await someNonExistentFunction(); // or Promise.reject()
  } catch (err) {
    next(err); // forward to error handler
  }
});

// create swagger documentation for the /test-error endpoint
/** * @swagger
 * /test-error:
 *   get:
 *     summary: Test synchronous error handling
 *     description: This endpoint is used to test synchronous error handling in the application.
 *     responses:
 *       500:
 *         description: An error occurred while processing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Something went wrong!"
 *                 handler:
 *                   type: string
 *                   example: "Error Middleware"
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
// Endpoint to test synchronous error handling
// This route will throw an error synchronously
app.get('/test-error', (req, res, next) => {
    console.log('test-error route called, about to throw error');
  // Synchronous error
  throw new Error('🔥 Simulated error from /test-error');
});

// create swagger documentation for the /submit endpoint full at once
/** * @swagger
 * /submit:
 *   post:
 *     summary: Submit JSON data
 *     description: This endpoint receives JSON data and echoes it back.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Successfully received the data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: object
 *                   additionalProperties: true
 */
// Endpoint to submit JSON data
// This route will echo back the received JSON data
app.post('/submit', express.json(), (req, res) => {
  res.json({ received: req.body });
});



// Middleware to handle 404 errors
app.use((req, res, next) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource could not be found.",
    handler: "404 Middleware",
  });
});

// convert following into independent function to write to a log file
// Middleware to log errors to a file


const writeErrorLog = (errorLog)  => {
    console.log("Writing error log to file...");
    console.log("Error log:", errorLog);
    console.log("Error log File:", errorLogFilePath);
    
    fs.appendFile(errorLogFilePath, errorLog, (error) => {
        if (error) {
         console.error("Failed to write to error log file:", error);
        }
    });
}

 
// Error 5xx handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (res.headersSent) {
    // Response already sent — delegate to default error handler
    return next(err);
  }

  const errorLog = `${new Date().toISOString()} - Error: ${err.message}\nStack: ${err.stack}\n`;
  writeErrorLog(errorLog);

  res.status(500).json({
    error: "Something went wrong!",
    handler: "Error Middleware",
    message: err.message || "Internal Server Error",
  });
});

//start the server
app.listen(PORT, () => {
  console.log("Server is runnning on port http://localhost:", PORT);
});
