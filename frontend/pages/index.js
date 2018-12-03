import { Block } from 'baseui/block';
import he from 'he';
import fetch from 'isomorphic-fetch';
import moment from 'moment';
import React from 'react';
const { URL } = require('universal-url');

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
    <Block as={props.username ? 'span' : 'a'} color="mono800" href="/login">
      {props.username ? props.username : 'login'}
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
