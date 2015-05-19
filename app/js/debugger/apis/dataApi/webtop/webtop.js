/* global debuggerModule */
debuggerModule.controller('WebtopCtrl', ["$scope", "$http", "iwcClient", function(scope, http, client) {
  var dashboardDataResource = '/dashboard-data';

  scope.refresh = function() {
      scope.appListings = [];
      scope.dashboardData = [];
      getApplications().then(function() {
        getDashboards().then(function() {
          if(!scope.$$phase) { scope.$apply(); }
        });
      });

  };

  function getApplicationResources() {
    return client.system().get('/application').then(function (reply) {
        return reply.entity;
      });
  }

  function saveAppData(appResource, appListings) {
    return client.system().get(appResource).then(function(appData) {
      appListings.push(appData.entity);
    });
  }

  function getDashboardData() {
    return client.data().get(dashboardDataResource).then(function (reply) {
        return reply.entity;
      });
  }

  function getDashboards() {
    scope.loadingDashboards = true;
    return getDashboardData().then(function(dashboardData) {
      if(!(dashboardData.dashboards && dashboardData.dashboards.length)){
        scope.invalidDashboards = true;
        scope.loadingDashboards = false;
        if(!scope.$$phase) { scope.$apply(); }
        return;
      }
      scope.invalidDashboards = false;
      scope.dashboardData = dashboardData;
      var dashboards = scope.dashboardData.dashboards;
      // match up app names with those from mp
      for (var a=0; a < dashboards.length; a++) {
        dashboards[a].validApps = [];
        dashboards[a].invalidApps = [];
        for (var b=0; b < dashboards[a].frames.length; b++) {
          for (var c=0; c < scope.appListings.length; c++) {
            if (dashboards[a].frames[b].appId === scope.appListings[c].id) {
              dashboards[a].validApps.push(scope.appListings[c].name);
            } else if (dashboards[a].frames[b].appName === scope.appListings[c].name) {
              console.log('warning: got invalidated app: ' + scope.appListings[c].name);
              dashboards[a].invalidApps.push(scope.appListings[c].name);
              scope.dashboardData.dashboards[a].frames[b].appId = scope.appListings[c].id;
            }
          }
        }
      }
      scope.loadingDashboards = false;
      if(!scope.$$phase) { scope.$apply(); }
    });
  }

  function getApplications() {
    scope.loadingMarketplace = true;
    return getApplicationResources().then(function(apps) {
    console.log('got ' + apps.length + ' apps from MP');
    scope.appListings = [];
    return apps.reduce(function (previous, current) {
            return previous.then(function () {
              return saveAppData(current, scope.appListings);
            })["catch"](function (error) {
              console.log('should not have happened: ' + error);
            });
          }, Promise.resolve()).then(function () {
            // all application data obtained
            console.log('finished getting app data for ' + scope.appListings.length + ' apps');
            scope.loadingMarketplace = false;
            if(!scope.$$phase) { scope.$apply(); }
          });

    });
  }

  function setData(dst, resource, entity) {
    return client.api(dst).set(resource, {"entity": entity}).then(function (response) {
            console.log('updated OK');
        })["catch"](function(err) {
          console.log('update failed',err);
      });
  }

  // assumes scope.dashboardData has already been modified (happens during
  // initial load and refresh)
  scope.syncDashboardData = function() {
    return setData('data.api', dashboardDataResource, scope.dashboardData).then(function() {
      scope.refresh();
    });
  };

  scope.reloadDashboardData = function() {
    console.log('getting dashboard json data...');
    http.get('data/dashboard-data.json').success(function(data) {
      console.log(data);
      setData('data.api', dashboardDataResource, data)
          .then(scope.refresh);
    });
  };

  scope.clearDashboardData = function() {
    var data = {};
    setData('data.api', dashboardDataResource, data)
        .then(scope.refresh);
  };

  // initialization
  //scope.refresh();

}]);

debuggerModule.directive( "webtop", function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/webtop.tpl.html'
    };
});