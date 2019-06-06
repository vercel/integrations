# DELETE Hooks - Redirect URI example

Integrations that require OAuth credentials need to set a Redirect URI. If a user removes a configuration for such an integration sometimes is useful to do some cleanup tasks.
This example UiHook demonstrates how it can be handled.

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

Leave the "UIHook URL" field blank.
