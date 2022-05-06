const redis = require("./redis_client");
/* eslint-disable no-unused-vars */
const keyGenerator = require("./redis_key_generator");
const timeUtils = require("../../../utils/time_utils");
const { inferredPredicate } = require("@babel/types");
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();

  // START Challenge #7
  // begin transaction
  const transaction = client.multi();
  // establish the key
  const key = keyGenerator.getKey(
    `limiter:${opts.interval}:${name}:${opts.maxHits}`
  );
  const currentTimeStamp = Date.now();
  // add hit to sorted set
  transaction.zadd(
    key,
    currentTimeStamp,
    `${currentTimeStamp}-${Math.random()}`
  );
  // move the window
  transaction.zremrangebyscore(key, "-inf", currentTimeStamp - opts.interval);
  // count hits in the window
  transaction.zcard(key);

  const response = await transaction.execAsync();
  const [zaddResponse, zremrangebyscoreResponse, hits] = response;

  if (opts.maxHits - hits >= 0) {
    return opts.maxHits - hits;
  } else {
    return -1;
  }
  // return -2;
  // END Challenge #7
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
