# ZEIT Addon: MongoDB Atlas

This addon allows you to connect with a MongoDB Atlas account. After that, it can link a database cluster to any project in your ZEIT account.

When linked, the addon will set the  `MONGO_URL` environment variable related to selected database cluster. 

Then, the user can deploy without configuring database users, ip-filtering and creating ZEIT secrets manually.

## Run Locally

```
now dev -p 5005
```

## Deploy to Production

```
now --target=production
```
