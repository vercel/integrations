# ZEIT Integration - Webhook Explorer

This example app allow you to explore [ZEIT Webhooks](https://zeit.co/docs/api/#endpoints/webhooks).

![Webhooks Explorer](https://files-ne8tttozb.zeit.sh/)

## Additional Tools

You cannot receive webhooks with a `localhost` URL. So, you need to use a tunneling service like [ngrok](https://ngrok.com/).

For this guide, we assume you have installed `ngrok` and it's available on the CLI path.

## Creating the Integration

Visit the [Integration Dashboard](https://zeit.co/dashboard/integrations/console) and create an integration. Add `http://localhost:5005` for "Redirect URL" and "UIHook URL".

Then visit your created integration and you'll find a `client_id` and `client_secret` for your integration.

After that, add those values to related variables in the [constant.js](./constant.js) file.

## Running the ngrok Tunnel

Run the following command in a different CLI tab:

```
ngrok http 5005
```

This will show you a URL. Set that as the `ROOT_URL` in the [constant.js](./constant.js) file.

## Run your integration

Now run your integration with:

```
now dev -p 5005
```

## Add the integration and explore events

Now visit the Marketplace URL of your integration and explore webhooks.

Your marketplace URL has a format like this:

```
https://zeit.co/integrations/:slug
```

