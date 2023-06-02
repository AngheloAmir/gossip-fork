import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import findRoute from 'D:/Projects/_work privasim 2023/gossip-browserrouter/node_modules/umi-build-dev/lib/findRoute.js';
import { BrowserRouter } from 'react-router-dom';
import history from './history';

const plugins = require('umi/_runtimePlugin');
window.g_plugins = plugins;
plugins.init({
  validKeys: [
    'patchRoutes',
    'render',
    'rootContainer',
    'modifyRouteProps',
    'onRouteChange',
    'modifyInitialProps',
    'initialProps',
    'dva',
  ],
});
plugins.use(require('../../../node_modules/umi-plugin-dva/lib/runtime'));

const app = require('@tmp/dva')._onCreate();
window.g_app = app;

// render
let clientRender = async () => {
  window.g_isBrowser = true;
  let props = {};
  // Both support SSR and CSR
  if (window.g_useSSR) {
    // If server-side rendering is enabled, use the data injected by the server for initializing client-side components
    props = window.g_initialData;
  } else {
    const pathname = location.pathname;
    const activeRoute = findRoute(require('@@/router').routes, pathname);
    // Before client-side rendering, execute the getInitialProps method to fetch initial data
    // for the components
    if (
      activeRoute &&
      activeRoute.component &&
      activeRoute.component.getInitialProps
    ) {
      const initialProps = plugins.apply('modifyInitialProps', {
        initialValue: {},
      });
      props = activeRoute.component.getInitialProps
        ? await activeRoute.component.getInitialProps({
            route: activeRoute,
            isServer: false,
            location,
            ...initialProps,
          })
        : {};
    }
  }
  const rootContainer = plugins.apply('rootContainer', {
    initialValue: React.createElement(require('./router').default, props),
  });
  ReactDOM[window.g_useSSR ? 'hydrate' : 'render'](
    <BrowserRouter>{rootContainer}</BrowserRouter>,
    document.getElementById('root')
  );
};
const render = plugins.compose('render', { initialValue: clientRender });

const moduleBeforeRendererPromises = [];
// client render
if (__IS_BROWSER) {
  Promise.all(moduleBeforeRendererPromises)
    .then(() => {
      render();
    })
    .catch(err => {
      window.console && window.console.error(err);
    });
}

// export server render
let serverRender, ReactDOMServer;
if (!__IS_BROWSER) {
  const { matchRoutes } = require('react-router-config');
  const { StaticRouter, createLocation } = require('react-router-dom');
  const stringify = require('serialize-javascript');
  const router = require('./router');

  const getInitialProps = async (pathname, props) => {
    const { routes } = router;
    const matchedComponents = matchRoutes(routes, pathname)
      .map(({ route }) => {
        if (route.component) {
          return !route.component.preload
            ? route.component
            : route.component.preload().then(component => component.default);
        }
      })
      .filter(c => c);
    const loadedComponents = await Promise.all(matchedComponents);

    const initialProps = plugins.apply('modifyInitialProps', {
      initialValue: {},
    });
    const promises = loadedComponents.map(component => {
      if (component && component.getInitialProps) {
        return component.getInitialProps({
          isServer: true,
          ...props,
          ...initialProps,
        });
      }
      return Promise.resolve(null);
    });

    return Promise.all(promises);
  };

  serverRender = async (ctx = {}) => {
    const [pathname] = (ctx.req.url || '').split('?');
    global.req = {
      url: ctx.req.url,
    };
    const location = createBrowserHistory().location;
    location.pathname = pathname;
    const activeRoute = findRoute(router.routes, pathname);
    const { component, ...restRoute } = activeRoute || {};
    const context = {};
    const initialData = await getInitialProps(pathname, {
      route: restRoute,
      req: ctx.req || {},
      res: ctx.res || {},
      context,
      location,
    });

    const pageData = initialData[initialData.length - 1];
    if (pageData === undefined) {
      initialData[initialData.length - 1] = plugins.apply('initialProps', {
        initialValue: pageData,
      });
    }

    const props = Array.isArray(initialData)
      ? initialData.reduce(
          (acc, curr) => ({
            ...acc,
            ...curr,
          }),
          {},
        )
      : {};

    const App = React.createElement(
      StaticRouter,
      {
        location,
        context,
      },
      React.createElement(router.default, props),
    );

    const rootContainer = plugins.apply('rootContainer', {
      initialValue: App,
    });
    const htmlTemplateMap = {};
    const matchPath = activeRoute ? activeRoute.path : undefined;
    return {
      htmlElement: matchPath ? htmlTemplateMap[matchPath] : '',
      rootContainer,
      matchPath,
      g_initialData: props,
      context,
    };
  };
  ReactDOMServer = require('react-dom/server');
}

export { ReactDOMServer };
export default (__IS_BROWSER ? null : serverRender);

// hot module replacement
if (__IS_BROWSER && module.hot) {
  module.hot.accept('./router', () => {
    clientRender();
  });
}
