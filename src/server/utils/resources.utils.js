const FeedParser = require('feedparser');
const request = require('request');
const db = require('../db/database');

/*
 * validate and fetch articles from rss feed
 */
const fetchFeed = (url, callback) => {
    const req = request(url);
    const feedparser = new FeedParser();
    const feedItems = [];

    // eslint-disable-next-line func-names
    req.on('response', (response) => {
        if (response.statusCode === 200) {
            response.pipe(feedparser);
        }
    });

  req.on('error', (err) => {
    callback(err);
  });

    feedparser.on('readable', () => {
        try {
            const item = feedparser.read();
            if (item !== null) {
                feedItems.push(item);
            }
        } catch (err) {
            // TODO: probably need customized message and UI popup here
            console.log(`fetchFeed: err.message == ${err.message}`);
        }
    });

    feedparser.on('end', () => {
        // do optional processing here
        callback(undefined, feedItems);
    });

    feedparser.on('fetchFeed', (err) => {
        console.log(`getFeed: err.message == ${err.message}`);
    });
};

const pollRSS = (url, permissionType, cb) => {
    const resourceType = 'Blog Post';
    let num = 0;
    let threshold = 0;
    const maxNumQuery = 'SELECT MAX_NUM FROM SCHEDULER WHERE ID = ?;';
    const thresholdQuery = 'SELECT THRESHOLD FROM PERMISSION WHERE PERMISSION.TYPE = ?';
    const postQuery = 'INSERT INTO ContentResource (`resourceType`, `approvalThreshold`, `url`, `submissionTime`, '
        + '`approvedTime`, `approvalCount`, `title`,`categoryName`) VALUES (?, ?, ?, ?, NULL, 0, ?, ?)';

    // max num of articles to retrieve and user threshold
    db.query(maxNumQuery + thresholdQuery, ['RSS-retrieval', permissionType], (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            num = rows[0][0].MAX_NUM;
            threshold = rows[1][0].THRESHOLD;
            console.log(num);
            console.log(threshold);
        }


        // fetch from rss url
        fetchFeed(url, (error, feedItems) => {
            if (error) {
                console.log(`fetchFeed: err.message == ${error.message}`);
            }
            let slicedFeedItems = feedItems.slice(0, num);
            // submit polled articles
            slicedFeedItems.forEach((item) => {
                // hardcoded "RSS blog post", admin users will have to re-categorize
                const postData = [resourceType, threshold, item.link, new Date(), item.title, 'RSS Blog Post'];
                // note: possible duplicate entries, db error suppressed
                db.query(postQuery, postData, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Successfully inserted!');
                    }
                });
            });
            cb(slicedFeedItems);
        });
    });
};

// get all RSS feeds with permissionType, and poll each
// wired to scheduler
const pollAllRSS = () => {
    db.query(`SELECT c.url as url, p.TYPE as permissionType FROM ContentResource c LEFT JOIN 
                PERMISSION p ON c.approvalThreshold = p.THRESHOLD 
                WHERE c.resourceType = 'RSS Feed'`, (error, rows) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Successfully retrieved all RSS feeds!');
            console.log('Poll starting ...');
            rows.forEach((item) => {
                pollRSS(item.url, item.permissionType, (slicedFeedItems) => {
                    const response = {
                        resources: slicedFeedItems
                            .map(item => ({
                                url: item.link,
                                title: item.title,
                                category: 'RSS Blog Post'
                            }))
                    };
                    console.log(response);
                });
            });
        }
    });
};

// enable https on all inserted links
const httpsify = (url) => {
    let outUrl = url;
    if (!(url.startsWith('http://') || url.startsWith('https://'))) {
        outUrl = `https://${url}`;
    } else if (url.startsWith('http://')) {
        outUrl = `https://${url.split('http://')[1]}`;
    }
    return outUrl;
};

// ping url and see if head request is 200
const isLive = (url, onSuccess, onError) => {
    request({ method: 'HEAD', uri: url }, (error, response) => {
        if (!error && response.statusCode === 200) {
            onSuccess();
        } else {
            onError();
        }
    });
};

module.exports = {
    fetchFeed, pollRSS, pollAllRSS, httpsify, isLive
};
