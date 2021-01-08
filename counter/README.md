# Vercel Addon: Counter

A simple counter implemented as a Vercel UiHook.

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
vercel --prod
```

Then use the alias of your deployment as the new UiHook URI of your addon.
