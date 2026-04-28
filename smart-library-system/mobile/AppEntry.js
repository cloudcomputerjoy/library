const registerRootComponent = require('expo/src/launch/registerRootComponent');

let App;
try {
  App = require('./App').default;
} catch (e) {
  App = require('./App');
}

if (!App || !App.default) {
  if (App.default) {
    App = App.default;
  } else {
    App = App;
  }
}

registerRootComponent(App);
