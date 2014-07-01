angular.module('app')
    .controller('intentsApiScope', function ($scope, $dialogs, sharedIntent) {
        $scope.data = ozpIwc.intentsApi;

        $scope.newIntent = function () {
            var dlg = $dialogs.create('/views/generators/intentGenerator.html', 'genCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {

            }, function () {

            });
        };

        $scope.openDialog = function (node) {
            sharedIntent.setIntent(node);
            switch (node.resource.split('/').length) {
                case 5:
                    var dlg = $dialogs.create('/views/displays/intentPopupHandler.html', 'dialogCtrl', {}, {keyboard: true});
                    dlg.result.then(function (result) {
                    }, function () {
                    });
                    break;
                case 4:
                    var dlg = $dialogs.create('/views/displays/intentPopupDefinition.html', 'dialogCtrl', {}, {keyboard: true});
                    dlg.result.then(function (result) {
                    }, function () {
                    });
                    break;
                case 3:
                    var dlg = $dialogs.create('/views/displays/intentPopupCapabilities.html', 'dialogCtrl', {}, {keyboard: true});
                    dlg.result.then(function (result) {
                    }, function () {
                    });
                    break;
            }

        }
    })

    .controller('dialogCtrl', function ($scope, $dialogs, $modalInstance, data, sharedIntent) {

        $scope.intent = sharedIntent.getIntent();

        $scope.cancel = function () {
            $modalInstance.dismiss('Canceled');
        };

        $scope.invokeSelected = function () {
            $modalInstance.close();
        };

        $scope.hitEnter = function (evt) {
            if (angular.equals(evt.keyCode, 13))
                $scope.close();
        };

        $scope.openDefinition = function (child) {
            sharedIntent.setIntent(ozpIwc.intentsApi.findOrMakeValue({resource: child}));
            var dlg = $dialogs.create('/views/displays/intentPopupDefinition.html', 'dialogCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {
            }, function () {
            });
        };

        $scope.openHandler = function (child) {
            sharedIntent.setIntent(ozpIwc.intentsApi.findOrMakeValue({resource: child}));
            var dlg = $dialogs.create('/views/displays/intentPopupHandler.html', 'dialogCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {
            }, function () {
            });
        };
    })

    .controller('genCtrl', function ($scope, $dialogs, $modalInstance, data, sharedIntent) {
        $scope.cancel = function () {
            $modalInstance.dismiss('Canceled');
        }; // end cancel

        $scope.invokeSelected = function () {
            $modalInstance.close();
        }; // end save

        $scope.hitEnter = function (evt) {
            if (angular.equals(evt.keyCode, 13))
                $scope.save();
        };

        $scope.createCapability = function () {
            var dlg = $dialogs.create('/views/generators/intentGeneratorCapability.html', 'genCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {
            }, function () {
            });
        };

        $scope.createDefinition = function () {
            var dlg = $dialogs.create('/views/generators/intentGeneratorDefinition.html', 'genCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {
            }, function () {
            });
        };

        $scope.createHandler = function () {
            var dlg = $dialogs.create('/views/generators/intentGeneratorHandler.html', 'genCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {
            }, function () {
            });
        };

        $scope.createIntent = function (packet) {
            ozpIwc.intentsApi.findOrMakeValue(packet);
        };
    });