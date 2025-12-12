require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./modules/auth/auth.routes');
const hrRoutes = require('./modules/hr/hr.routes');
const generalRoutes = require('./modules/general/general.routes');
const accessRoutes = require("./modules/access/access.routes");
const attachmentsRoutes = require("./modules/attachments/attachments.routes");
const listsRoutes = require("./modules/lists/lists.routes"); 
const flightsRoutes = require("./modules/flights/flights.routes");
const hotelsRoutes = require('./modules/hotels/hotels.routes');



const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/access", accessRoutes);

// Logger
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

app.use("/api/attachments", attachmentsRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/lists', listsRoutes);
app.use("/api/flights", flightsRoutes);
app.use('/api/hotels', hotelsRoutes);



app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use((req, res) => {
  console.log(`[NOT FOUND] ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
