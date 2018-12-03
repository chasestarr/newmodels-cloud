import App, { Container } from 'next/app';
import React from 'react';
import { Provider as StyletronProvider } from 'styletron-react';
import { isServer, styletron } from './__styletron';

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return isServer ? (
      <Container>
        <Component {...pageProps} />
      </Container>
    ) : (
      <Container>
        <StyletronProvider value={styletron}>
          <Component {...pageProps} />
        </StyletronProvider>
      </Container>
    );
  }
}

export default MyApp;
