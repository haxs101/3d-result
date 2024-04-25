const axios = require('axios');
const cheerio = require('cheerio');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

// Function to scrape data from the website
async function scrapeData() {
  try {
    const url = 'https://philnews.ph/pcso-lotto-result/swertres-result/';
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    // Parse the HTML and extract the data you need
    const data1 = $('label#shortcode_swertres11am_id > span').text();
    const data2 = $('label#shortcode_swertres4pm_id > span').text();
    const data3 = $('label#shortcode_swertres9pm_id > span').text();
    const date_today = $('label#shortcode_date').contents().first().text().trim();

    const data =  date_today + "\n" + "11AM result is: " + data1 + "\n" + "4PM result is: " + data2 + "\n" + "9PM result is: " + data3 + "\n";
    return data;
  } catch (error) {
    console.error('Error scraping data:', error);
    return null;
  }
}

// Function to send data to Slack webhook
async function sendToSlack(data) {
  try {
    const webhookUrl = 'https://hooks.slack.com/services/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';
    await axios.post(webhookUrl, {
      text: data
    });
    console.log('Data sent to Slack successfully.');
  } catch (error) {
    console.error('Error sending data to Slack:', error);
  }
}

// Function to make the scheduled request
async function makeScheduledRequest() {
  try {
    const data = await scrapeData();
    if (data) {
      console.log('Data scraped successfully:', data);
      console.log(data); // Console log the scraped data
      await sendToSlack(data);
    } else {
      console.log('No data scraped.');
    }
  } catch (error) {
    console.error('Error making scheduled request:', error);
  }
}

// Call makeScheduledRequest once at the beginning
makeScheduledRequest();

// Schedule requests for 2:30pm, 5:30pm, and 9:30pm Philippine time
const times = ['14:10', '17:10', '21:10']; // Philippine time in 24-hour format

times.forEach(time => {
  const rule = new schedule.RecurrenceRule();
  rule.hour = parseInt(time.split(':')[0]);
  rule.minute = parseInt(time.split(':')[1]);
  rule.tz = 'Asia/Manila'; // Set timezone to Philippine time

  schedule.scheduleJob(rule, function() {
    console.log(`Scheduled request at ${time} Philippine time...`);
    makeScheduledRequest();
  });
});
