const { CronJob } = require('cron');
const https = require('https');

const backendUrl = 'https://fruitninjahsi.onrender.com'; // Replace with a specific endpoint if necessary

const job = new CronJob('*/14 * * * *', function () {
  console.log(`Attempting to keep server active`);

  https
    .get(backendUrl, (res) => {
      if (res.statusCode === 200) {
        console.log('Server is active');
      } else {
        console.error(
          `Failed to reach server, status code: ${res.statusCode}`
        );
      }
    })
    .on('error', (err) => {
      console.error('Error during server ping:', err.message);
    });
}, null, true, 'America/Los_Angeles');

// Export the cron job.
module.exports = job;
