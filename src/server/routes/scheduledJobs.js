

const nodeschedule = require('node-schedule');
const db = require('../db/database');
const email = require('../email/email');
const rss = require('../utils/resources.utils');

const jobs = {};

/*
 * after app start listening
 * start all scheduled jobs
 * respect to parameters in the database
 */
module.exports.start = function () {
  db.query('SELECT * FROM SCHEDULER', (error, rows) => {
    if (error) {
      console.log(`error in starting Scheduler: ${error}`);
      return error;
    }
    rows.forEach((row) => {
      jobs[row.ID] = nodeschedule.scheduleJob(`0 0 1-31/${row.FREQUENCY} * *`, () => {
        console.log(`scheduled job is: ${row.ID} with frequency ${row.FREQUENCY}`);
        if (row.ID === 'approval-reminder') {
          email.ApprovalReminderEmail();
        } else if (row.ID === 'subscription-email') {
          email.WeeklyUpdatesEmail();
        } else if (row.ID === 'RSS-retrieval') {
          rss.pollAllRSS();
        }
      });
    });
    console.log('Success Start Scheduler!');
    return 1;
  });
};

/*
 * change the frequencies of scheduled jobs
 * tasks: [{taskId, newFreq, maxNum}]
 */
module.exports.changeScheduledJob = (tasks) => {
  tasks.forEach((task) => {
    const job = jobs[task.taskId];
    job.cancel();
    jobs[task.taskId] = nodeschedule.scheduleJob(`0 0 1-31/${task.newFreq} * *`, () => {
      console.log(`scheduled jobs: ${task.taskId} every ${task.newFreq} days`);
      if (task.taskId === 'approval-reminder') {
        email.ApprovalReminderEmail();
      } else if (task.taskId === 'subscription-email') {
        email.WeeklyUpdatesEmail();
      } else if (task.taskId === 'RSS-retrieval') {
        rss.pollAllRSS();
      }
    });
  });
};


module.exports.changeScheduledJobsTest = () => {
  const rule = new nodeschedule.RecurrenceRule();
  rule.second = 5;
  const j = nodeschedule.scheduleJob(rule, () => {
    email.dynamicemail();
    console.log('running a task every minute');
    j.cancel();
  });
};
