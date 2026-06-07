import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("join-camp-dashboard");
});

socket.on("new-sos", (data) => {
    console.log("\n🚨 NEW SOS RECEIVED");
    console.log(data);
});

socket.on("sos-accepted", (data) => {
    console.log("\n✅ SOS ACCEPTED");
    console.log(data);
});

socket.on("disconnect", () => {
    console.log("Disconnected");
});

socket.on("location-updated", (data) => {
  console.log("Received:", data);
});