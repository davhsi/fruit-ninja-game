const { CronJob } = require('cron');
const https = require('https');
require('dotenv').config();

const backendUrl = process.env.BACKEND_URL;

const job = new CronJob(
  '*/14 * * * *', // every 14 minutes
  function () {
    console.log(`[Cron] Pinging backend to keep server active`);

    https
      .get(backendUrl, (res) => {
        if (res.statusCode === 200) {
          console.log('[Cron] Server is active');
        } else {
          console.error(`[Cron] Failed: status code ${res.statusCode}`);
        }
      })
      .on('error', (err) => {
        console.error('[Cron] Ping error:', err.message);
      });
  },
  null,
  true,
  'America/Los_Angeles'
);

module.exports = job;
