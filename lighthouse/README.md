# lighthouse-integration

## development

To develop the integration locally, run a Mongo DB server and setup it with the following script:

```sh
export MONGO_DB=xxx
export MONGO_URI=mongodb+srv://xxx
./scripts/mongo.js
```

And then run the server:

```sh
export API_SECRET=xxx
export CLIENT_ID=xxx
export CLIENT_SECRET=xxx
export MONGO_DB=xxx
export MONGO_URI=mongodb+srv://xxx
export HOST=http://xxx
now dev
```

To invoke audits, run:

```sh
export API_SECRET=xxx
export HOST=http://xxx
./scripts/invoke-update.sh
```
