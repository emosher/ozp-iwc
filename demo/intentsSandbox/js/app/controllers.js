angular.module('app')
    .controller('intentsApiScope', function ($scope, $dialogs, sharedIntent) {
        $scope.data = ozpIwc.intentsApi;

        $scope.newIntent = function () {
            var dlg = $dialogs.create('/views/generators/intentGenerator.html', 'genCtrl', {}, {keyboard: true});
            dlg.result.then(function (result) {

            }, function () {

            });
        };

        $scope.getIntentDlg = function () {
            var dlg = $dialogs.create('/views/queries/byResource.html', 'dialogCtrl', {}, {keyboard: true});
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

        $scope.getIntent = function(resource) {
            var type = ozpIwc.intentApi.parseResource(resource).intentValueType;
            switch (type) {
                case 'handler':
                    $scope.openHandler(resource);
                    break;
                case 'definition':
                    $scope.openHandler(resource);
                    break;
                case 'capability':
                    sharedIntent.setIntent(ozpIwc.intentsApi.findOrMakeValue({resource: resource}));
                    var dlg = $dialogs.create('/views/displays/intentPopupCapabilities.html', 'dialogCtrl', {}, {keyboard: true});
                    dlg.result.then(function (result) {
                    }, function () {
                    });
                    break;
            }
        }
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
            packet.action = 'register';
            packet.dst = 'intent.api';
            var out = client.send(packet);
            console.log(out);
            //var node = ozpIwc.intentsApi.handleRegister(packet);
        };
    })
    .controller('queryCtrl', function ($scope, $dialogs, $modalInstance, data, sharedIntent) {

    });