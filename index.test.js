// import request from "supertest";
// import express from "express";
// import { describe, test, expect } from '@jest/globals';

const request = require('supertest');
const express = require('express');
const { describe, test, expect } = require('@jest/globals');


test('hello world!', () => {
	expect(1 + 1).toBe(2);
});

// Recreate the app for testing
const app = express();
app.use(express.json());
app.disable("x-powered-by");

app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome here. " });
});

app.get("/greetu", (req, res) => {
    const name = req.query.name;
    if (name && typeof name === "string" && name.trim().length > 3) {
        res.status(200).json({ message: `Hello ${name.trim()}!` });
    } else {
        res.status(400).json({
            error: "Invalid name parameter",
            message: "Please provide a valid non-empty name as a query parameter.",
        });
    }
});

app.get("/greet", (req, res) => {
    if (req.query.name && req.query.name.trim().length < 3) {
        return res.status(400).json({
            error: "Name must be at least 3 characters long",
        });
    }
    res.status(200).json({
        message: `Hello ${req.query.name || "world"}!`,
    });
});

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

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});

app.get("/status", (req, res) => {
    const uptime = process.uptime();
    res.status(200).json({
        status: "Server is running",
        uptime: uptime,
        pretty: `${Math.floor(uptime)} seconds`,
        timestamp: new Date().toISOString(),
    });
});

app.get("/version", (req, res) => {
    res.status(200).json({
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

app.post('/submit', express.json(), (req, res) => {
    res.json({ received: req.body });
});

describe("API Endpoints", () => {
    test("GET / returns welcome message", async () => {
        const res = await request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Welcome here. ");
    });

    test("GET /greetu returns greeting for valid name", async () => {
        const res = await request(app).get("/greetu?name=Alice");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Hello Alice!");
    });

    test("GET /greetu returns error for invalid name", async () => {
        const res = await request(app).get("/greetu?name=Al");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Invalid name parameter");
    });

    test("GET /greet returns greeting for valid name", async () => {
        const res = await request(app).get("/greet?name=Bob");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Hello Bob!");
    });

    test("GET /greet returns error for short name", async () => {
        const res = await request(app).get("/greet?name=Bo");
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Name must be at least 3 characters long");
    });

    test("GET /greet returns default greeting", async () => {
        const res = await request(app).get("/greet");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Hello world!");
    });

    test("POST /echo returns echoed data", async () => {
        const data = { foo: "bar" };
        const res = await request(app).post("/echo").send(data);
        expect(res.status).toBe(200);
        expect(res.body.received).toEqual(data);
    });

    test("POST /echo returns error for empty body", async () => {
        const res = await request(app).post("/echo").send({});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe("No data provided");
    });

    test("GET /health returns status OK", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("OK");
        expect(typeof res.body.timestamp).toBe("string");
    });

    test("GET /status returns server status", async () => {
        const res = await request(app).get("/status");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("Server is running");
        expect(typeof res.body.uptime).toBe("number");
        expect(typeof res.body.pretty).toBe("string");
        expect(typeof res.body.timestamp).toBe("string");
    });

    test("GET /version returns API version", async () => {
        const res = await request(app).get("/version");
		//console.log(res.body.timestamp, typeof res.body.timestamp);

        expect(res.status).toBe(200);
        expect(res.body.version).toBe("1.0.0");

        expect(typeof res.body.timestamp).toBe("string");
    });

    test("POST /submit echoes submitted data", async () => {
        const data = { test: "data" };
        const res = await request(app).post("/submit").send(data);
        expect(res.status).toBe(200);
        expect(res.body.received).toEqual(data);
    });
});