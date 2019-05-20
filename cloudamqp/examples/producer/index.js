const express = require('express')
const amqp = require('amqplib')
const app = express()
const QUEUE = 'tasks';

app.get('*', async (req, res) => {
  if (!process.env.CLOUDAMQP_URL) {
    return res.status(200).send(`Please select a RabbitMQ instance in your ZEIT dashboard and re-deploy`);
  }
  try {
    console.log('URL', process.env.CLOUDAMQP_URL);
    const connection = await amqp.connect(process.env.CLOUDAMQP_URL);
    const channel = await connection.createChannel();
    const ok = await channel.assertQueue(QUEUE);
    if (!ok) {
      throw new Error('Failed asserting queue');
    }
    await channel.sendToQueue(QUEUE, Buffer.from('utmost important task'));
    return res.status(200).send(`Task queued`)
  } catch (e) {
    return res.status(500).send(`Error queueing task: ${e.message}`)
  }
})

module.exports = app
