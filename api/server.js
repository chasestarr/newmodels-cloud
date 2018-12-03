const bodyparser = require('body-parser');
const cors = require('cors');
const cron = require('node-cron');
const express = require('express');

const auth = require('./auth.js');
const database = require('./database.js');
const newmodels = require('./newmodels');

const connection = database.makeConnection();
const app = express();

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function authMiddleware(request, response, next) {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.sendStatus(401);
  }

  const token = authorization.replace('Bearer ', '');

  try {
    const userId = auth.userIdFromToken(token);

    if (!userId) {
      return response.sendStatus(401);
    }

    database
      .getUserById(connection, userId)
      .then(([err, user]) => {
        if (err) {
          return response.sendStatus(401);
        }

        if (!user) {
          return response.sendStatus(401);
        }

        request.userId = userId;
        return next();
      })
      .catch(() => {
        return response.sendStatus(401);
      });
  } catch (e) {
    return response.sendStatus(401);
  }
}

app.get('/', (_, response) => response.json({ ok: true }));

app.get(
  '/resources',
  asyncMiddleware(async (request, response) => {
    const page = parseInt(request.query.page, 10) || null;
    const resources = await database.getPaginatedResourcesRanked(connection, page);

    const resourcesWithVotes = await Promise.all(
      resources.map(async r => {
        const votes = await database.getVotesForResource(connection, r.id);
        return {
          ...r,
          points: votes.length,
        };
      })
    );
    response.json({ resources: resourcesWithVotes });
  })
);

app.post(
  '/resources/:resourceId/vote',
  authMiddleware,
  asyncMiddleware(async (request, response) => {
    const [err] = await database.addVote(connection, request.userId, request.params.resourceId);
    if (err) {
      return response.sendStatus(err);
    }

    response.sendStatus(204);
  })
);

app.post(
  '/resources/:resourceId/unvote',
  authMiddleware,
  asyncMiddleware(async (request, response) => {
    const [err] = await database.removeVote(connection, request.userId, request.params.resourceId);
    if (err) {
      return response.sendStatus(err);
    }

    response.sendStatus(204);
  })
);

app.get(
  '/user',
  authMiddleware,
  asyncMiddleware(async (request, response) => {
    const [err, user] = await database.getUserById(connection, request.userId);
    if (err) {
      return response.sendStatus(err);
    }

    const votes = await database.getVotesByUserId(connection, request.userId);

    response.json({ username: user.username, votes: votes.map(v => v.resource_id) });
  })
);

app.post(
  '/users',
  asyncMiddleware(async (request, response) => {
    const [err] = await database.addUser(connection, request.body.username, request.body.password);
    if (err) {
      return response.sendStatus(err);
    }

    response.sendStatus(200);
  })
);

app.post(
  '/users/login',
  asyncMiddleware(async (request, response) => {
    const [err, user] = await database.getUserByUsername(connection, request.body.username);
    if (err) {
      return response.sendStatus(err);
    }

    const authenticated = auth.compareHash(request.body.password, user.hash);
    if (!authenticated) {
      return response.sendStatus(401);
    }

    const jwt = auth.issueJwt(user.id);
    response.json({ jwt });
  })
);

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  // schedule newmodels scrape job to run each hour
  cron.schedule('0 * * * *', newmodels);

  console.log(`server is listening on ${PORT}`);
});
