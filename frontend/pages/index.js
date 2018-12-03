import { Block } from 'baseui/block';
import he from 'he';
import fetch from 'isomorphic-fetch';
import moment from 'moment';
import React from 'react';
const { URL } = require('universal-url');

const GithubLogo = () => (
  <Block as="a" href="https://github.com/chasestarr/newmodels-cloud" marginLeft="16px">
    <svg width="11" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <title>GitHub icon</title>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  </Block>
);

class WithUser extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      votes: {},
    };
  }

  componentDidMount() {
    if (!this.state.username) {
      this.getUser();
    }
  }

  async getUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const res = await fetch(`${process.env.BACKEND_URL}/user`, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (res.status === 200) {
      const data = await res.json();
      const votesAsMap = data.votes.reduce((acc, cur) => ({ ...acc, [cur]: true }), {});
      this.setState({ username: data.username, votes: votesAsMap });
    }
  }

  handleVote = async resourceId => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.BACKEND_URL}/resources/${resourceId}/vote`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });

    if (res.status === 204) {
      this.setState({ votes: { ...this.state.votes, [resourceId]: true } });
    }
  };

  handleUnvote = async resourceId => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.BACKEND_URL}/resources/${resourceId}/unvote`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });

    if (res.status === 204) {
      this.setState({ votes: { ...this.state.votes, [resourceId]: false } });
    }
  };

  render() {
    return (
      <React.Fragment>
        {this.props.children({
          username: this.state.username,
          votes: this.state.votes,
          handleVote: this.handleVote,
          handleUnvote: this.handleUnvote,
        })}
      </React.Fragment>
    );
  }
}

class Resource extends React.Component {
  handleClick = resourceId => {
    if (this.props.hasVoted) {
      this.props.onUnvote(resourceId);
    } else {
      this.props.onVote(resourceId);
    }
  };

  shouldComponentUpdate(nextProps) {
    if (nextProps.hasVoted !== this.props.hasVoted) {
      return true;
    }

    if (nextProps.username !== this.props.username) {
      return true;
    }
  }

  render() {
    return (
      <Block marginTop="scale200" marginBottom="scale200">
        <Block display="flex" alignItems="flex-end">
          <Block
            alignItems="flex-end"
            display="flex"
            font="font200"
            justifyContent="flex-end"
            marginRight="scale300"
            width="24px"
          >
            {this.props.index + 1}
          </Block>
          <Block as="a" color="primary" href={this.props.source} marginRight="scale200">
            {he.decode(this.props.label)}
          </Block>
          <Block color="mono900">
            (
            <Block as="a" href={'//' + new URL(this.props.source).host} color="mono900">
              {new URL(this.props.source).host}
            </Block>
            )
          </Block>
        </Block>
        <Block color="mono800" font="font100" marginLeft="32px">
          {this.props.points} points {moment(this.props.created_at).fromNow()}
          {this.props.username && (
            <React.Fragment>
              {' | '}
              <Block as="button" onClick={() => this.handleClick(this.props.id)}>
                {this.props.hasVoted ? 'unvote' : 'vote'}
              </Block>
            </React.Fragment>
          )}
        </Block>
      </Block>
    );
  }
}

const Header = props => (
  <Block
    display="flex"
    justifyContent="space-between"
    paddingLeft="scale400"
    paddingRight="scale400"
  >
    <Block color="primary600">NEW MODELS</Block>

    <Block>
      <Block as={props.username ? 'span' : 'a'} color="mono800" href="/login">
        {props.username ? props.username : 'login'}
      </Block>
      <GithubLogo />
    </Block>
  </Block>
);

const Index = props => (
  <div style={{ margin: '0 auto' }}>
    <WithUser>
      {({ username, votes, handleVote, handleUnvote }) => (
        <React.Fragment>
          <Header username={username} />
          <Block paddingTop="scale600" paddingBottom="scale600">
            {props.resources.map((resource, index) => (
              <Resource
                index={index}
                {...resource}
                hasVoted={!!votes[resource.id]}
                onVote={handleVote}
                onUnvote={handleUnvote}
                username={username}
                key={index}
              />
            ))}
          </Block>
          <Block paddingLeft="scale400">
            {props.prev && (
              <Block as="a" color="primary" href={props.prev}>
                prev
              </Block>
            )}
            {props.next && (
              <Block as="a" color="primary" href={props.next}>
                next
              </Block>
            )}
          </Block>
        </React.Fragment>
      )}
    </WithUser>
  </div>
);

Index.getInitialProps = async function({ query }) {
  const res = await fetch(`${process.env.BACKEND_URL}/resources?page=${query.page}`);
  const data = await res.json();

  const page = parseInt(query.page, 10) || 0;
  const next = data.resources.length === 30 ? `/?page=${page + 1}` : null;
  const prev = page ? `/?page=${page - 1}` : null;

  return { resources: data.resources, next, prev };
};

export default Index;
