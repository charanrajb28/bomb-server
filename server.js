import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Batch from "./models/Batch.js";
import { generateGrid } from "./utils/gridGenerator.js";

dotenv.config();
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// **MongoDB Connection**
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

let batches = {}; // Store active batch data

// **API: Create a New Batch**
app.post("/create-batch", async (req, res) => {
    const { batchName, playerCount } = req.body;
    if (!batchName || !playerCount) return res.status(400).json({ error: "Missing parameters" });

    const gridData = generateGrid(playerCount);
    const newBatch = new Batch({ batchName, playerCount, grid: gridData, players: {} });

    try {
        const savedBatch = await newBatch.save();
        batches[savedBatch._id] = savedBatch;
        res.json(savedBatch);
    } catch (error) {
        res.status(500).json({ error: "Error creating batch" });
    }
});

// **API: Fetch All Batches**
app.get("/batches", async (req, res) => {
    const allBatches = await Batch.find();
    res.json(allBatches);
});

// **WebSocket: Handle Game Sessions**
io.on("connection", (socket) => {
    console.log(`🟢 Player Connected: ${socket.id}`);

    socket.on("joinBatch", async (batchId) => {
        if (!batches[batchId]) batches[batchId] = await Batch.findById(batchId);
        if (!batches[batchId]) return socket.emit("error", "Batch not found");

        batches[batchId].players[socket.id] = { x: 0, y: 0, coins: 100, shield: false };
        await batches[batchId].save();
        
        socket.join(batchId);
        io.to(batchId).emit("updatePlayers", batches[batchId].players);
    });

    socket.on("move", async ({ batchId, x, y }) => {
        if (!batches[batchId]) return;

        const player = batches[batchId].players[socket.id];
        if (!player) return;

        const grid = batches[batchId].grid;
        if (grid[x] && grid[x][y] !== "B") {
            player.x = x;
            player.y = y;

            await batches[batchId].save();
            io.to(batchId).emit("updatePlayers", batches[batchId].players);
        } else {
            delete batches[batchId].players[socket.id]; // Player eliminated
            io.to(batchId).emit("playerEliminated", socket.id);
        }
    });

    socket.on("disconnect", async () => {
        console.log(`🔴 Player Disconnected: ${socket.id}`);
        for (let batchId in batches) {
            if (batches[batchId].players[socket.id]) {
                delete batches[batchId].players[socket.id];
                await batches[batchId].save();
                io.to(batchId).emit("updatePlayers", batches[batchId].players);
            }
        }
    });
});

server.listen(3001, () => console.log("🚀 Server running on port 3001"));