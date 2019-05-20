![https://gcloud-integration.zeit.sh/static/integration.svg](https://gcloud-integration.zeit.sh/static/integration.svg)
# Google Cloud + Now Integration

This is a Now integration for Google Cloud Platform

## Features

The integration connects your ZEIT projects with your Google Cloud Platform projects and allows you to:

- Run your Now deployments as cron jobs with Cloud Scheduler
- Create and connect to MySQL/PostgreSQL databases with Cloud SQL
- Easily authenticate with virtually any Google Cloud SDK in deployments
- Connect to Google Cloud Storage buckets
- Integrate your projects with Firestore
- Create Firebase Web App configs
- Integrate with Google AI products like Cloud Vision, Translation and Video Intelligence

### Setup

To set it up, user needs to create a Service Account in GCP (the integration shows a guide on how to do that), and paste it into the input on the initial screen. Once that's done, it will pull the project data, check enabled APIs and give them the option to add their service account credentials to projects, create DB instances, etc.

If some APIs are disabled, integration will detect that and show where the API can be enabled

### Running locally

1. Clone the repo
2. Run `now dev`