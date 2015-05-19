/* global debuggerModule */
debuggerModule.controller("MyAppsCtrl",["$scope","iwcClient",function(scope,client) {

  function saveAppData(appResource) {
    return client.system().get(appResource).then(function(response) {
        scope.appListings.push(response.entity);
    })["catch"](function(err){
          console.log("Not Supported: " + err.response);
    });
  }

    function getApplicationResources() {
      return client.system().get('/application').then(function (response) {
          return response.entity;
      })["catch"](function(err){
          return console.log("Not Supported: " + err.response);
      });
    }

    function getUserInfo() {
      return client.system().get('/user').then(function (response) {
          scope.username = response.entity.username;
          scope.userRole = response.entity.highestRole;
          return response.entity;
      })["catch"](function(err){
          return console.log("Not Supported: " + err.response);
      });
    }

    function getApplications() {
      scope.loadingMarketplace = true;
      return getApplicationResources().then(function(apps) {
        console.log('got ' + apps.length + ' apps from MP');
        scope.appListings = [];
        return apps.reduce(function (previous, current) {
          return previous.then(function () {
            return saveAppData(current);
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

  scope.refresh = function() {
        getUserInfo();
        getApplications().then(function () {
          if (!scope.$$phase) {
              scope.$apply();
          }
        });
  };

}]);

debuggerModule.directive( "myApps", [function() {
    return {
      restrict: 'E',
      templateUrl: 'templates/myApps.tpl.html'
    };
}]);