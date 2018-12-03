function makeConnection() {
  const { Pool } = require('pg');
  return new Pool({ connectionString: process.env.POSTGRES_URI, max: 3 });
}

async function addResource(pool, label, source) {
  if (!label || !source) {
    return [404, null];
  }

  const resources = await pool.query({
    text: 'SELECT * from resources WHERE label = $1 OR source = $2',
    values: [label, source],
  });

  if (resources.rows.length) {
    return [409, null];
  }

  const resource = await pool.query({
    text: 'INSERT INTO resources(label, source) VALUES($1, $2)',
    values: [label, source],
  });

  return [null, resource.rows[0]];
}

async function getPaginatedResourcesRanked(pool, page = 0) {
  const LIMIT = 30;
  const offset = page * LIMIT;
  const result = await pool.query({
    text: `
      SELECT resources.*, points
      FROM resources
      JOIN (
        SELECT resources.id, coalesce(COUNT(votes.id), 0) AS points
        FROM resources
        LEFT OUTER JOIN votes ON votes.resource_id = resources.id
        GROUP BY resources.id
      ) y ON y.id = resources.id
      ORDER BY (points - 1)/POW((EXTRACT(EPOCH FROM (NOW()::timestamp - resources.created_at))/3600)+2, 1.5) DESC
      LIMIT $1 OFFSET $2
    `,
    values: [LIMIT, offset],
  });

  return result.rows;
}

async function addVote(pool, userId, resourceId) {
  const votes = await pool.query({
    text: 'SELECT * from votes WHERE user_id = $1 AND resource_id = $2',
    values: [userId, resourceId],
  });

  if (votes.rows.length) {
    return [409, null];
  }

  const vote = await pool.query({
    text: 'INSERT INTO votes(user_id, resource_id) VALUES($1, $2)',
    values: [userId, resourceId],
  });

  return [null, vote.rows[0]];
}

async function removeVote(pool, userId, resourceId) {
  const votes = await pool.query({
    text: 'SELECT * from votes WHERE user_id = $1 AND resource_id = $2',
    values: [userId, resourceId],
  });

  if (!votes.rows.length) {
    return [404, null];
  }

  const vote = await pool.query({
    text: 'DELETE from votes WHERE user_id = $1 AND resource_id = $2',
    values: [userId, resourceId],
  });

  return [null, vote.rows[0]];
}

async function getVotesForResource(pool, resourceId) {
  const votes = await pool.query({
    text: 'SELECT * from votes WHERE resource_id = $1',
    values: [resourceId],
  });

  return votes.rows;
}

async function getVotesByUserId(pool, userId) {
  const votes = await pool.query({
    text: 'SELECT * from votes WHERE user_id = $1',
    values: [userId],
  });

  return votes.rows;
}

async function addUser(pool, username, password) {
  const users = await pool.query({
    text: 'SELECT * from users WHERE username = $1',
    values: [username],
  });

  if (users.rows.length) {
    return [409, null];
  }

  const createHash = require('./auth').createHash;
  const hash = await createHash(password);

  const user = await pool.query({
    text: 'INSERT INTO users(username, hash) VALUES($1, $2)',
    values: [username, hash],
  });

  return [null, user.rows[0]];
}

async function getUserById(pool, userId) {
  const user = await pool.query({
    text: 'SELECT * from users WHERE id = $1',
    values: [userId],
  });

  if (!user.rows.length) {
    return [404, null];
  }

  return [null, user.rows[0]];
}

async function getUserByUsername(pool, username) {
  const user = await pool.query({
    text: 'SELECT * from users WHERE username = $1',
    values: [username],
  });

  if (!user.rows.length) {
    return [404, null];
  }

  return [null, user.rows[0]];
}

module.exports = {
  makeConnection,

  addResource,
  getPaginatedResourcesRanked,

  addUser,
  getUserById,
  getUserByUsername,

  addVote,
  removeVote,
  getVotesByUserId,
  getVotesForResource,
};
