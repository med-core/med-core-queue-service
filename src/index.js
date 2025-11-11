import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "./config/database.js";
import { sendError } from "./utils/errorHandler.js";
import { verifyTokenSocket } from "./middlewares/verifyTokenSocket.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "queue", clients: io.engine.clientsCount });
});

app.get("/", (req, res) => {
  res.send("Queue Service (WebSocket) funcionando correctamente");
});

app.use((err, req, res, next) => {
  sendError(err, res);
});

// Auth para WebSocket
io.use(verifyTokenSocket);

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.user.fullname} (${socket.user.role})`);
  socket.emit("queue:update", { message: "Conectado al sistema de colas" });

  socket.on("queue:join", () => {
    if (socket.user.role !== "PACIENTE") return;
    socket.emit("queue:joined", { ticket: `P${Date.now().toString().slice(-3)}` });
    io.emit("queue:update", { action: "new_patient", user: socket.user.fullname });
  });

  socket.on("queue:next", () => {
    if (!["MEDICO", "ENFERMERO", "ADMINISTRADOR"].includes(socket.user.role)) return;
    io.emit("queue:next", { calledBy: socket.user.fullname });
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

async function startServer() {
  try {
    await connectDB();
    console.log("Conectado a MongoDB mediante Prisma (Queue Service)");

    server.listen(process.env.PORT || 3000, () => {
      const PORT = server.address().port;
      console.log(`Queue Service (WebSocket) corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error("Fallo crítico al iniciar Queue Service:", error.message);
    process.exit(1);
  }
}

startServer();

export default app;