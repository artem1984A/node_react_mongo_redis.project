
const redis = require('redis');

// Class to track user IPs
class IpTracker {
  #redisClient;

  constructor() {
    this.#redisClient = redis.createClient();
    this.#redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.#redisClient.connect().catch(console.error);
  }

  // Private method to store the IP of the user in Redis
  async #trackIp(ip) {
    try {
      // Increment the IP hit count
      await this.#redisClient.incr(ip);
      const accessCount = await this.#redisClient.get(ip);
      console.log(`IP ${ip} has accessed the site ${accessCount} times`);
    } catch (error) {
      console.error('Error tracking IP:', error);
    }
  }

  // Public method to get access count for an IP
  async getAccessCount(ip) {
    try {
      const accessCount = await this.#redisClient.get(ip);
      return accessCount || 0;
    } catch (error) {
      console.error('Error getting access count:', error);
      return 0; // Return 0 if there's an error
    }
  }


// Public method to get the IP from the request
getClientIp(req) {
    return req.ip || req.connection.remoteAddress;
  }


  // Public method to handle the request and track IP
  handleRequest(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    this.#trackIp(ip); // Call the private method to track the IP
    next();
  }
}

module.exports = IpTracker;