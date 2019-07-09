# lighthouse-integration

## Development

To develop the integration locally, create the intergration with the setting:

```
Redirect URL: http://localhost:3000/callback.js
UI Hook URL:  http://localhost:3000/ui.js
```

Run a Mongo DB server and setup it with the following script:

```sh
export MONGO_DB=xxx
export MONGO_URI=mongodb+srv://xxx
./scripts/mongo.js
```

And then run the integration:

```sh
export API_SECRET=anything
export CLIENT_ID=xxx
export CLIENT_SECRET=xxx
export MONGO_DB=xxx
export MONGO_URI=mongodb+srv://xxx
export HOST=http://localhost:3000
now dev
```

To invoke audits locally, run:

```sh
export API_SECRET=anything
export HOST=http://localhost:3000
./scripts/invoke-update.sh
```

### Environment variables

- `API_SECRET`: A secret for authenticating private API calls internally. It can be any string.
- `CLIENT_ID`: The client id
- `CLIENT_SECRET`: The client secret
- `MONGO_DB`: Mongo database name
- `MONGO_URI`: URI to connect
- `HOST`: Hostname of the server
