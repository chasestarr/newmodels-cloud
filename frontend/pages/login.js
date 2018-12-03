import { Block } from 'baseui/block';
import { Button } from 'baseui/button';
import { FormControl } from 'baseui/form-control';
import { StatefulInput as Input } from 'baseui/input';
import React from 'react';

class Login extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      create: {
        username: '',
        password: '',
        error: '',
      },
      login: {
        username: '',
        password: '',
        error: '',
      },
    };

    this.handleChange = this.handleChange.bind(this);
  }

  async createAccount(username, password) {
    const res = await fetch(`${process.env.BACKEND_URL}/users`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 200) {
      await this.login(username, password);
      return;
    }

    if (res.status === 409) {
      this.setState({ create: { ...this.state.create, error: 'username already exists' } });
      return;
    }

    this.setState({ create: { ...this.state.create, error: 'unspecified error' } });
  }

  async login(username, password) {
    const res = await fetch(`${process.env.BACKEND_URL}/users/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 200) {
      const { jwt } = await res.json();
      localStorage.setItem('token', jwt);
      window.location = '/';
      return;
    }

    if (res.status === 401) {
      return this.setState({
        create: { ...this.state.login, error: 'incorrect username/password combination' },
      });
    }

    if (res.status === 404) {
      return this.setState({ create: { ...this.state.login, error: 'username does not exist' } });
    }

    this.setState({ create: { ...this.state.login, error: 'unspecified error' } });
  }

  async handleChange(form, label, value) {
    this.setState({ [form]: { ...this.state[form], [label]: value, error: '' } });
  }

  render() {
    return (
      <div>
        <Block paddingTop="scale800">
          <Block>login</Block>

          <Block maxWidth="240px">
            <FormControl label="username">
              <Input
                size="compact"
                value={this.state.login.username}
                onChange={event => this.handleChange('login', 'username', event.target.value)}
              />
            </FormControl>
          </Block>

          <Block maxWidth="240px">
            <FormControl label="password">
              <Input
                size="compact"
                type="password"
                value={this.state.login.password}
                onChange={event => this.handleChange('login', 'password', event.target.value)}
              />
            </FormControl>
          </Block>

          <Button onClick={() => this.login(this.state.login.username, this.state.login.password)}>
            login
          </Button>
        </Block>

        <Block paddingTop="scale800">
          <Block>create account</Block>

          <Block maxWidth="240px">
            <FormControl label="username" error={this.state.create.error}>
              <Input
                size="compact"
                value={this.state.create.username}
                onChange={event => this.handleChange('create', 'username', event.target.value)}
              />
            </FormControl>
          </Block>

          <Block maxWidth="240px">
            <FormControl label="password">
              <Input
                size="compact"
                type="password"
                value={this.state.create.password}
                onChange={event => this.handleChange('create', 'password', event.target.value)}
              />
            </FormControl>
          </Block>

          <Button
            onClick={() =>
              this.createAccount(this.state.create.username, this.state.create.password)
            }
          >
            create account
          </Button>
        </Block>
      </div>
    );
  }
}

export default Login;
