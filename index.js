
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const cookieParser = require('cookie-parser'); // Import cookie-parser
const cors = require('cors');
const redis = require('redis');
const IpTracker = require('./IpTracker');

const ipTracker = new IpTracker(); // Initialize the class

const User = require('./models/reactmodels/user.model');
const Event = require('./models/reactmodels/event.model');
const Category = require('./models/reactmodels/category.model');
const { request } = require('http');

const PORT =  3000;
const app = express();
app.use(cookieParser());
app.use(cors());


// Initialize Redis client
const redisClient = redis.createClient({
  socket: {
      path: '***',
      port: 6379
  }
});

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

// Connect to the Redis server
redisClient.connect().then(() => {
  console.log('Connected to Redis via UNIX socket');
}).catch(console.error);



mongoose.connect("mongodb+srv://***")
.then(() => {
  console.log("Connected to MongoDB");
  // Start the server once connected to the database
  app.listen(PORT, '127.0.0.1', () => console.log("Server running on port " + PORT));
})
.catch((err) => {
  console.error("Connection to MongoDB failed:", err);
});




app.use('/home', express.static(path.resolve(__dirname, 'build')));

app.get('/home/*', 
  (req, res, next) => {
    ipTracker.handleRequest(req, res, next); // Track the IP using the class method
  },
  (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build/index.html')); // Serve React App
  }
);

app.get('/api/events', ipTracker.handleRequest.bind(ipTracker), async (req, res) => {
  try {
    // Get the client's IP address
    const clientIp = ipTracker.getClientIp(req);

    // Fetch events where the IP matches the client's IP or '127.0.0.1' (localhost)
    const events = await Event.find({
      $or: [
        { 'ip.ip': clientIp },
        { 'ip.ip': '127.0.0.1' }
      ]
    });

    // Update the access count for each event based on Redis
    const updatedEvents = await Promise.all(events.map(async (event) => {
      // Ensure that the ip object exists in the event
      if (!event.ip) {
        event.ip = {};  // Initialize the ip object if undefined
      }

      // Set the access count from Redis or default to 0 if not found
      event.ip.accessCount = req.accessCount || 0;

      // Save the updated event in MongoDB
      await event.save();

      return event;
    }));

    res.json(updatedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send('Error fetching events');
  }
});




// Routes for Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send('Error fetching categories');
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send('Error fetching users');
  }
});


app.post('/api/events', async (req, res) => {
  try {
    // Retrieve the IP address of the client making the request
    const clientIp = req.ip || req.connection.remoteAddress;
    const accessCount = await ipTracker.getAccessCount(clientIp);

    // Extract the necessary fields from the request body
    const { title, description, image, startTime, endTime, location, categoryIds, createdBy } = req.body;

    // Ensure createdBy is converted to ObjectId using 'new'
    const createdByObjectId = new mongoose.Types.ObjectId(createdBy);

    const newEvent = new Event({
      title,
      description,
      image,
      startTime,
      endTime,
      location,
      categoryIds,
      createdBy: createdByObjectId,  // Use the converted ObjectId
      ip: {
        ip: clientIp,
        accessCount: accessCount,
      },
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error saving event to database:', error);
    res.status(500).json({ message: 'Error saving event to the database', error: error.message });
  }
});


// Route to update an existing event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, startTime, endTime, location, categoryIds, createdBy } = req.body;

    // Ensure that createdBy is a valid ObjectId
    const createdByObjectId = new mongoose.Types.ObjectId(createdBy);

    // Retrieve the client's IP address and access count
    const clientIp = req.ip || req.connection.remoteAddress;
    const accessCount = await ipTracker.getAccessCount(clientIp);

    // Find the event by ID and update it with the new data
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        title,
        description,
        image,
        startTime,
        endTime,
        location,
        categoryIds,
        createdBy: createdByObjectId,
        ip: {
          ip: clientIp, // Store client IP in the event
          accessCount: accessCount, // Store access count in the event
        },
      },
      { new: true, runValidators: true } // Return the updated document and run validation
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});


// Other routes (e.g., fetching events, categories, users)...

// Route to delete an event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});