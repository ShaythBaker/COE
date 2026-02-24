require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./modules/auth/auth.routes");
const hrRoutes = require("./modules/hr/hr.routes");
const generalRoutes = require("./modules/general/general.routes");
const accessRoutes = require("./modules/access/access.routes");
const attachmentsRoutes = require("./modules/attachments/attachments.routes");
const listsRoutes = require("./modules/lists/lists.routes");
const flightsRoutes = require("./modules/flights/flights.routes");
const hotelsRoutes = require("./modules/hotels/hotels.routes");
const clientsRoutes = require("./modules/clients/clients.routes");
const guidesRoutes = require("./modules/guides/guides.routes");
const transportationRoutes = require("./modules/transportation/transportation.routes");
const placesRoutes = require("./modules/places/places.routes");
const routesRoutes = require("./modules/routes/routes.routes");
const qoutationsRoutes = require("./modules/qoutations/qoutations.routes");

const restaurantsRoutes = require("./modules/restaurants/restaurants.routes"); 
const extraServicesRoutes = require("./modules/extraServices/extraServices.routes");


const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"], // adjust to your frontend URL
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/access", accessRoutes);

// Logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.use("/api/attachments", attachmentsRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/general", generalRoutes);
app.use("/api/lists", listsRoutes);
app.use("/api/flights", flightsRoutes);
app.use("/api/hotels", hotelsRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/guides", guidesRoutes);
app.use("/api/transportation", transportationRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/routes", routesRoutes); 
app.use("/api/qoutations", qoutationsRoutes);
app.use('/api/restaurants', restaurantsRoutes); 
app.use("/api/extra-services", extraServicesRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.use((req, res) => {
  console.log(`[NOT FOUND] ${req.method} ${req.url}`);
  res.status(404).json({ message: "Route not found" }); 
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
