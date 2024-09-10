Tjis was created as modification for #ReactAdvanced project which was deployed at https://arnhem-front-end.site and used MongoDB as a database.
In this implementation added Redis client for tracking users IP (througe the class implemented in IpTracker.js) and as following to rendering an events in #ReactAdvanced which was created only the user which now 
using this app 
(for this purpos for this purpose exploited methods from IpTracker class in body of get request from server side to React app )
, or events from #ReactAdvanced which was created by local host (so, as "127.0.0.1" in data base at Mongo).
The disadvantage is that the IP address is not always representative of one user, therefore, for the purpose of identifying a single user, it is still better to work with cache.
This project in full implementation can be watched at site https://www.ryzhov.website/home/  .

Getting Started

Prerequisites

Make sure you have the following installed:

	•	Node.js
	•	npm or yarn

Installation
git clone https://github.com/artem1984A/node_react_mongo_redis.project
cd node_react_mongo_redis.project

npm install
# or
yarn install

node index

For MacOS:

brew install redis
redis-server 
or
redis-server --daemonize yes
redis-cli ping (You should receive a response PONG, which indicates that the server is running and responding to commands.)
