# DELETE Hooks Example

This is a ZEIT Integration using the Delete Hook URL. It does nothing other than printing some messages to the console.

But it shows how you can handle the DELETE Hook request when the user removes the Integration configuration.

Using that, the Integration can implement clean up tasks like deleting created databases and so on.

## Run Locally

Install NPM dependencies with:

```
npm install
```

Then run it locally with:

```
now dev -p 5005
```

## Tunnel your local app with `ngrok`

Since this example is run locally, it needs to be publicly exposed using a tunnel service like [`ngrok`](https://ngrok.com). After you download it, start it with the command `./ngrok http 5005`. 

This will give you a public URL in the form of `http://<id>.ngrok.io` that you will use it when creating the integration. 

We are using this URL as the PUBLIC_URL in the section below.

## Create the Integration

Create an integration by logging in to the [Integration Console](https://zeit.co/dashboard/integrations/console).
When you are creating the integration, you will have to enter couple of URLs. Here are values for them:

* UI Hook URL - `PUBLIC_URL`
* Redirect URL - Leave it blank
* Delete Hook URL - `PUBLIC_URL/delete`

## Receive the Delete Hook

Install your newly added integration. Then remove it and inspect the console. You will see a message like this:

```
> Received the Delete Hook with the following HTTP body
{
  "configurationId": "icfg_YMM5AjMelloMmgzsgEN2AZNk",
  "userId": "96SnxkFiMyVKsK3pnoHfx3Hz",
  "teamId": "team_nLlpyC6REAqxydlFKbrMDlud"
}
```
