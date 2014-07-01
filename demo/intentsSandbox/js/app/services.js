angular.module('app').service('sharedIntent', function () {
    var intent;

    return {
        getIntent: function () {
            return intent;
        },
        setIntent: function (val) {
            intent = val;
        }
    }
});