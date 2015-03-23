/* global debuggerModule */
debuggerModule.directive( "jsonPre", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/jsonPre.tpl.html',
        scope: {
            data: "="
        }
    };
}]);