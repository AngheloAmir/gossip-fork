import React from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import dynamic from 'umi/dynamic';
import renderRoutes from 'umi/lib/renderRoutes';
import history from '@@/history';

const FILEDIR = 'D:/Projects/_work privasim 2023/gossip-browserrouter/';

const routes = [
  {
    path: '/',
    component: require('../../layout/index.js').default,
    routes: [
      {
        path: '/',
        exact: true,
        component: require('../index/index.js').default,
        _title: 'Gossip',
        _title_default: 'Gossip',
      },
      {
        path: '/present',
        exact: true,
        component: require('../present/index.js').default,
        _title: 'Gossip',
        _title_default: 'Gossip',
      },
      {
        component: () =>
          React.createElement(
            require(FILEDIR + 'node_modules/umi-build-dev/lib/plugins/404/NotFound.js')
              .default,
            { pagesPath: 'src/pages', hasRoutesInConfig: false },
          ),
        _title: 'Gossip',
        _title_default: 'Gossip',
      },
    ],
    _title: 'Gossip',
    _title_default: 'Gossip',
  },
  {
    component: () =>
      React.createElement(
        require(FILEDIR + 'node_modules/umi-build-dev/lib/plugins/404/NotFound.js')
          .default,
        { pagesPath: 'src/pages', hasRoutesInConfig: false },
      ),
    _title: 'Gossip',
    _title_default: 'Gossip',
  },
];

window.g_routes = routes;
const plugins = require('umi/_runtimePlugin');
plugins.applyForEach('patchRoutes', { initialValue: routes });

export { routes };

export default class RouterWrapper extends React.Component {
  unListen() {}

  constructor(props) {
    super(props);

    // route change handler
    function routeChangeHandler(location, action) {
      plugins.applyForEach('onRouteChange', {
        initialValue: {
          routes,
          location,
          action,
        },
      });
    }
    this.unListen = history.listen(routeChangeHandler);
    const isDva =
      history.listen
        .toString()
        .indexOf('callback(history.location, history.action)') > -1;
    if (!isDva) {
      routeChangeHandler(history.location);
    }
  }

  componentWillUnmount() {
    this.unListen();
  }

  render() {
    const props = this.props || {};
    return <Router>{renderRoutes(routes, props)}</Router>;
  }
}
