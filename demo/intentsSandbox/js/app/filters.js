angular.module('app')
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