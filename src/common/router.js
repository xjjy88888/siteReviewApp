import { createElement } from 'react';
import dynamic from 'dva/dynamic';

let routerDataCache;

const modelNotExisted = (app, model) =>
  // eslint-disable-next-line
  !app._models.some(({ namespace }) => {
    return namespace === model.substring(model.lastIndexOf('/') + 1);
  });

// wrapper of dynamic
const dynamicWrapper = (app, models, component) => {
  // () => require('module')
  // transformed by babel-plugin-dynamic-import-node-sync
  if (component.toString().indexOf('.then(') < 0) {
    models.forEach(model => {
      if (modelNotExisted(app, model)) {
        // eslint-disable-next-line
        app.model(require(`../models/${model}`).default);
      }
    });
    return props => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return createElement(component().default, {
        ...props,
        routerData: routerDataCache,
      });
    };
  }
  // () => import('module')
  return dynamic({
    app,
    models: () =>
      models.filter(model => modelNotExisted(app, model)).map(m => import(`../models/${m}.js`)),
    // add routerData prop
    component: () => {
      if (!routerDataCache) {
        routerDataCache = getRouterData(app);
      }
      return component().then(raw => {
        const Component = raw.default || raw;
        return props =>
          createElement(Component, {
            ...props,
            routerData: routerDataCache,
          });
      });
    },
  });
};

export const getRouterData = app => {
  const routerConfig = {
    '/login': {
      component: dynamicWrapper(app, ['login'], () => import('../routes/Login')),
    },
    // '/main': {
    //   component: dynamicWrapper(app, ['region', 'my', 'login'], () => import('../routes/Main')),
    // },
    '/main/index': {
      component: dynamicWrapper(
        app,
        [
          'index',
          'spot',
          'project',
          'csUnit',
          'photoPoint',
          'labelPoint',
          'offlineMap',
          'my',
          'login',
        ],
        () => import('../routes/Index')
      ),
    },
    '/main/index/spot-edit': {
      component: dynamicWrapper(app, [], () => import('../routes/Spot/SpotEdit')),
    },
    '/main/index/spot-search': {
      component: dynamicWrapper(app, [], () => import('../routes/Spot/SpotSearch')),
    },
    '/main/index/spot-imageSync': {
      component: dynamicWrapper(app, [], () => import('../routes/Spot/SpotImageSync')),
    },
    '/main/index/spot-picture': {
      component: dynamicWrapper(app, [], () => import('../routes/Spot/SpotPicture')),
    },
    '/main/index/project-edit': {
      component: dynamicWrapper(app, [], () => import('../routes/Project/ProjectEdit')),
    },
    '/main/index/project-search': {
      component: dynamicWrapper(app, [], () => import('../routes/Project/ProjectSearch')),
    },
    '/main/index/project-relationSpots': {
      component: dynamicWrapper(app, [], () => import('../routes/Project/ProjectRelationSpots')),
    },
    '/main/index/offline-map': {
      component: dynamicWrapper(app, [], () => import('../routes/My/OfflineMap')),
    },
    '/main/index/data-sync': {
      component: dynamicWrapper(app, ['dataSync'], () => import('../routes/My/DataSync')),
    },
    '/main/index/attachment-sync': {
      component: dynamicWrapper(app, ['attachmentSync'], () =>
        import('../routes/My/AttachmentSync')
      ),
    },
    '/main/index/csUnit': {
      component: dynamicWrapper(app, [], () => import('../routes/CsUnit')),
    },
    '/main/index/instruction': {
      component: dynamicWrapper(app, [], () => import('../routes/Instruction')),
    },
    '/main/index/download-instruction': {
      component: dynamicWrapper(app, [], () => import('../routes/Instruction/downloadInstruction')),
    },
    '/main/index/photoPoint-edit': {
      component: dynamicWrapper(app, [], () => import('../routes/PhotoPoint/PhotoPointEdit')),
    },
    '/main/index/photoPoint-picture': {
      component: dynamicWrapper(app, [], () => import('../routes/PhotoPoint/PhotoPicture')),
    },
    '/main/index/labelPoint-edit': {
      component: dynamicWrapper(app, [], () => import('../routes/LabelPoint/LabelPointEdit')),
    },
    '/main/index/labelPoint-picture': {
      component: dynamicWrapper(app, [], () => import('../routes/LabelPoint/LabelPointPicture')),
    },
  };

  // Route configuration data
  // eg. {name,authority ...routerConfig }
  const routerData = {};
  // The route matches the menu
  Object.keys(routerConfig).forEach(path => {
    let router = routerConfig[path];
    // If you need to configure complex parameter routing,
    // https://github.com/ant-design/ant-design-pro-site/blob/master/docs/router-and-nav.md#%E5%B8%A6%E5%8F%82%E6%95%B0%E7%9A%84%E8%B7%AF%E7%94%B1%E8%8F%9C%E5%8D%95
    // eg . /list/:type/user/info/:id
    router = {
      ...router,
      name: router.name,
    };
    routerData[path] = router;
  });
  return routerData;
};
