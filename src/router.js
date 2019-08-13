import React from 'react';
import { Router, Route, Switch, Redirect } from 'dva/router';
import { getRouterData } from './common/router';

function RouterConfig({ history, app }) {
  const routerData = getRouterData(app);
  return (
    <Router history={history}>
      <div>
        <Switch>
          {/* <Redirect exact from="/" to="/main/index" /> */}
          <Redirect exact from="/" to="/login" />
          <Route path="/login" component={routerData['/login'].component} />
          <Route path="/main/index" component={routerData['/main/index'].component} />
        </Switch>
      </div>
    </Router>
  );
}

export default RouterConfig;
