import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withRouter, matchPath } from 'react-router';
import { Route, Switch } from 'react-router-dom';
import { NProgress } from '@tanem/react-nprogress';
import { CSSTransition } from 'react-transition-group';
import { connect } from 'react-redux';
import { message } from 'antd';
import { ViewerbaseDragDropContext, ErrorBoundary } from '@ohif/ui';
import asyncComponent from './components/AsyncComponent.js';
import * as RoutesUtil from './routes/routesUtil';
import cookie from 'js-cookie';
import {
  getAccountInfo,
  actionGetToken,
  requestLogin,
  actionGetPermissionToken,
  actionGetListPermission,
} from './system/systemAction';
import {
  TOKEN,
  REFRESH_TOKEN,
  FIRST_REFRESH_TOKEN,
} from './constants/constants';

import NotFound from './routes/NotFound.js';
import { Bar, Container } from './components/LoadingBar';
import './theme-tide.css';
// override css
import './VinLabApp.css';
import './VinLabApp.less';
// Contexts
import AppContext from './context/AppContext';

const CallbackPage = asyncComponent(() =>
  import(/* webpackChunkName: "CallbackPage" */ './routes/CallbackPage.js')
);

class OHIFStandaloneViewer extends Component {
  static contextType = AppContext;
  state = {
    isLoading: false,
  };

  static propTypes = {
    history: PropTypes.object.isRequired,
    setContext: PropTypes.func,
    location: PropTypes.object,
  };

  componentDidMount() {
    if (cookie.get(TOKEN) || cookie.get(REFRESH_TOKEN)) {
      this.props.getAccountInfo();
    }

    this.unlisten = this.props.history.listen((location, action) => {
      if (this.props.setContext) {
        this.props.setContext(window.location.pathname);
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  async getToken(code) {
    try {
      console.log('GET TOKEN');
      const res = await actionGetToken(code);
      if (res && res.data && res.data.access_token) {
        cookie.set(FIRST_REFRESH_TOKEN, res.data.refresh_token, {
          expires: new Date(
            (res.data.refresh_expires_in || 1800) * 1000 + Date.now()
          ),
        });
        const resPermission = await actionGetListPermission(
          res.data.access_token
        );

        const listPermission =
          resPermission && resPermission.data && resPermission.data.data;

        const { data } = await actionGetPermissionToken(
          res.data.access_token,
          listPermission
        );
        cookie.set(TOKEN, data.access_token, {
          expires: new Date((data.expires_in || 1800) * 1000 + Date.now()),
        });
        cookie.set(REFRESH_TOKEN, data.refresh_token, {
          expires: new Date(
            (data.refresh_expires_in || 1800) * 1000 + Date.now()
          ),
        });
        cookie.remove(FIRST_REFRESH_TOKEN);
        this.props.getAccountInfo();
      }
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    if (!cookie.get(TOKEN) && !cookie.get(REFRESH_TOKEN)) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      if (code) {
        this.getToken(code);
      } else if (!error) {
        requestLogin();
      } else {
        const error_description = urlParams.get('error_description');
        error_description && message.error(error_description || '');
      }
      return null;
    }

    const { appConfig = {} } = this.context;
    const routes = RoutesUtil.getRoutes(appConfig);

    const currentPath = this.props.location.pathname;
    const noMatchingRoutes = !routes.find(r =>
      matchPath(currentPath, {
        path: r.path,
        exact: true,
      })
    );

    return (
      <>
        <NProgress isAnimating={this.state.isLoading}>
          {({ isFinished, progress, animationDuration }) => (
            <Container
              isFinished={isFinished}
              animationDuration={animationDuration}
            >
              <Bar progress={progress} animationDuration={animationDuration} />
            </Container>
          )}
        </NProgress>
        <Switch>
          <Route
            exact
            path="/silent-refresh.html"
            onEnter={RoutesUtil.reload}
          />
          <Route
            path="/callback"
            render={() => <CallbackPage userManager={{}} />}
          />
          {!noMatchingRoutes &&
            routes.map(({ path, Component }) => (
              <Route key={path} exact path={path}>
                {({ match }) => (
                  <CSSTransition
                    in={match !== null}
                    timeout={300}
                    classNames="fade"
                    unmountOnExit
                    onEnter={() => {
                      this.setState({
                        isLoading: true,
                      });
                    }}
                    onEntered={() => {
                      this.setState({
                        isLoading: false,
                      });
                    }}
                  >
                    {match === null ? (
                      <></>
                    ) : (
                      <ErrorBoundary context={match.url}>
                        <Component
                          match={match}
                          location={this.props.location}
                        />
                      </ErrorBoundary>
                    )}
                  </CSSTransition>
                )}
              </Route>
            ))}
          {noMatchingRoutes && <NotFound />}
        </Switch>
      </>
    );
  }
}

const ConnectedOHIFStandaloneViewer = connect(
  null,
  { getAccountInfo }
)(OHIFStandaloneViewer);

export default ViewerbaseDragDropContext(
  withRouter(ConnectedOHIFStandaloneViewer)
);
