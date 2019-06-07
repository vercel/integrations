# DELETE Hooks Example

This is a ZEIT Integration using the Redirect URI. It does nothing other than printing some messages to the console.

But it shows how you can handle the DELETE Hook request when the user removes the Integration configuration.
Using that, the Integration can implement clean up tasks like deleting created databases and so on.

## Run Locally

Install NPM dependencies with:

```
npm install
```

Then run this UiHook locally with:

```
now dev -p 5005
```

## Create the Integration

Create an integration by logging in to the [Integration Console](https://zeit.co/dashboard/integrations/console).

Then set the "Redirect URL" to `http://localhost:5005`.

Leave the "UIHook URL" field blank. <br/>
(This example does not provide a UIHook. That's why we didn't set it. But you can always set it in your integration.)
