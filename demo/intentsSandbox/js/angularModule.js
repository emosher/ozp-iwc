angular.module('app', ['ui.bootstrap', 'dialogs'])

    .service('sharedIntent', function() {
        var intent;

        return {
            getIntent: function() {
                return intent;
            },
            setIntent: function(val) {
                intent = val;
            }
        }
    })
    .controller('intentsApiScope', function ($scope, $dialogs, sharedIntent) {
        console.log($dialogs);
        $scope.data = ozpIwc.intentsApi;
        var config = {
            'contentType': 'application/ozp-intents-handler-v1+json',
            'resource': "intents.api/text/plain/view/1234",
            'type': "text/plain",
            'action': "view",
            'icon': "http://www.ozoneplatform.org/images/Ozone-Banner_30x110.png",
            'label': "View Plain Text",
            'invokeIntent': "system.api/application/123-412"
        };
        $scope.data.findOrMakeValue(config);

        config = {
            'contentType': "application/ozp-intents-definition-v1+json",
            'resource': "intents.api/text/plain/view",
            'type': "text/plain",
            'action': "view",
            'icon': "http://www.ozoneplatform.org/images/Ozone-Banner_30x110.png",
            'label': "View Plain Text",
            'handlers': [
                "intents.api/text/plain/view/1234",
                "intents.api/text/plain/view/4321"
            ]
        };
        $scope.data.findOrMakeValue(config);


        $scope.invoke = function (packet) {
            sharedIntent.setIntent(packet);
            dlg = $dialogs.create('/intentPopup.html', 'customDialogCtrl', {}, {keyboard: true});
            dlg.result.then(function (name) {
                $scope.name = name;
            }, function () {
                $scope.name = 'You decided not to enter in your name, that makes me sad.';
            });

        }
    })

    .controller('customDialogCtrl', function ($scope, $modalInstance, data, sharedIntent) {
        //-- Variables --//

        $scope.intent = sharedIntent.getIntent();

        console.log($scope);
        //-- Methods --//

        $scope.cancel = function () {
            $modalInstance.dismiss('Canceled');
        }; // end cancel

        $scope.invokeSelected = function () {
            $modalInstance.close($scope.user.name);
        }; // end save

        $scope.hitEnter = function (evt) {
            if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.user.name, null) || angular.equals($scope.user.name, '')))
                $scope.save();
        };
    })

    .filter('keyFilter', function () {
        return function (items, field) {
            if (!angular.isDefined(field) || field.length === 0) {
                return items;
            }
            var result = {};
            angular.forEach(items, function (value, key) {
                if (key.indexOf(field) > 0) {
                    result[key] = value;
                }
            });
            console.log(result);
            return result;
        };
    })

//http://jsfiddle.net/6sxUs/
    .filter('rowGrouping', function () {
        return function (input, count) {
            var rows = [];
            for (var i = 0; i < input.length; i++) {
                if (i % count === 0) {
                    rows.push([]);
                }
                rows[rows.length - 1].push(input[i]);
            }
        };
    });