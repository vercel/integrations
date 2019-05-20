# ZEIT Addon: Connect With GitHub

This ZEIT addons connects with a GitHub account and show details of the connected user.

## Run Locally

Install NPM dependencies with:

```
npm install
```

Then run this UiHook locally with:

```
now dev -p 5005
```

Then [create a ZEIT addon](https://zeit.co/docs/addons) and set the UiHook URI to: `http:///localhost:5005`

## Deploy to Production

**Add ROOT_URL**

This is the URL of the app once you deployed into production. This is an alias you get when you deploy your app with `now --target=production`.
Set that as the `ROOT_URL` env variable in your `now.json` file.

**Create a GitHub OAuth app**

First of all, [create](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/) a GitHub OAuth app and get the client id and client secret.
Add then to the related environment variables defined in your `now.json` file.

While creating your app, GitHub ask for a callback URL. For that, add the following url:

```
ROOT_URL/github-callback
```
Here, `ROOT_URL` is the URL you defined in your `now.json` file.

**Deploy this UiHook to production with:**

```
now --target=production
```

Then use the alias of your deployment as the new UiHook URI of your addon.
