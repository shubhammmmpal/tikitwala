import { Server } from "socket.io";
import Camp from "../models/camp.model.js";
import { calculateNearbyUsersCount } from "../controllers/auth.controller.js";
import User from "../models/User.model.js";
import { calculateNearbySOSCount } from "../utils/helper.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket Connected:", socket.id);

    socket.on("join-camp-dashboard", async () => {
      socket.join("all-camps");

      const agents = await User.find({
        role: "agent",
      }).select("_id");


      // initial user count 

      try {
        const counts = [];

        for (const agent of agents) {
          const totalUsers = await calculateNearbyUsersCount(agent._id);

          counts.push({
            agentId: agent._id,
            totalUsers,
          });
        }

        // Send initial data only to this dashboard
        socket.emit("initial-active-user-count", counts);
      } catch (error) {
        console.log(error);
      }


    // total sos count 
      const sosCounts = [];

      for (const agent of agents) {
        const totalSOS = await calculateNearbySOSCount(agent._id);

        sosCounts.push({
          agentId: agent._id,
          totalSOS,
          missed: "Missed"
        });
      }

      socket.emit("initial-sos-count", sosCounts);

      // total camp counts 

      const totalCamps = await Camp.countDocuments();

      socket.emit("camp-count-updated", {
        totalCamps,
      });

      console.log(`${socket.id} joined all-camps`);
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
