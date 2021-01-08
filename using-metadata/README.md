# Vercel Addon: Using Metadata

This UiHook takes two inputs from the user and keeps them inside the metadata store provided by ZEIT addons.

## Run Locally

Install NPM dependencies with:

```
npm install
```

Then run this UiHook locally with:

```
vercel dev -p 5005
```

Then [create a Vercel integration](https://vercel.com/docs/integrations) and set the UiHook URI to: `http:///localhost:5005`

## Deploy to Production

Deploy this UiHook to production with:

```
vercel --target=production
```

Then use the alias of your deployment as the new UiHook URI of your addon.
