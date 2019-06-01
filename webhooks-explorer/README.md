# ZEIT Integration - Webhook Explorer

This example app allow you to explore [ZEIT Webhooks](https://zeit.co/docs/api/#endpoints/webhooks).

![Webhooks Explorer](https://files-ne8tttozb.zeit.sh/)

## Additional Tools

You cannot recieve webhooks with a `localhost` URL. So, you need to use a tunneling service like [ngrok](https://ngrok.com/).

For this guide, we assume you have installed `ngrok` and it's available on the CLI path.

## Creating the Integration

Vist the [Integartion Dashboard](https://zeit.co/dashboard/integrations/console) and create an integration. Add `http://localhost:5005` for "Redirect URL" and "UIHook URL".

Then visit your created integration and you'll find `client_id` and `client_secret` for your integration.

After that, add those values to related variables in the [constant.js](./constant.js) file.

## Running the ngrok Tunnel

Run the following command in a different CLI tab:

```
ngrok http -p 5005
```

Then you'll get a URL, set that as the `ROOT_URL` in the [constant.js](./constant.js) file.

## Run your integration

Now run you integration with:

```
now dev -p 5005
```

## Add the integration and explore events

Now visit your Marketplace URL of this integration and explore webhooks.

Your markeplace URL has a format like this:

```
https://zeit.co/integrations/:slug
```

