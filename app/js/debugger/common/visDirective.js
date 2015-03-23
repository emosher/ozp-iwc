/* global debuggerModule */

debuggerModule.directive('timeSeries', function() {
    return {
        restrict : 'E',
//            replace : true,
//            template: "<div></div>",
        scope: {
            metrics: '=',
            timeFrame: '='
        },
        link: function($scope,element){
            $scope.container = element[0];
            // Create a DataSet with data (enables two way data binding)
            $scope.data = new vis.DataSet({

            });
            $scope.$on("timeSeriesClear",function(){
                $scope.data.clear();
            });

            $scope.groups = new vis.DataSet();
            // Configuration for the Timeline
            $scope.options = {
                stack:false,
                height: "100%",
                groupOrder: 'content',
                start: new Date(),
                end: new Date(Date.now() + 60000),
                zoomMax: 60000,
                legend: true
            };

            // Create a Timeline
            $scope.timeline = new vis.Graph2d($scope.container, $scope.data,$scope.groups, $scope.options);
        },
        controller: function($scope){

            $scope.removeOld = function(timeFrame){
                timeFrame = timeFrame || $scope.timeFrame;
                var now = Date.now() - timeFrame;
                var removals = [];
                $scope.data.get({
                    filter: function(item) {
                        if(now > item.x.getTime()){
                            removals.push(item.id);
                        }
                    }
                });
                $scope.data.remove(removals);
            };

            $scope.$on("timeSeriesData",function(event,data) {
                $scope.removeOld();
                $scope.data.add(data);
                var now=$scope.timeline.getCurrentTime();
                var range=$scope.timeline.getWindow();
                if(now.getTime() > range.end.getTime()) {
                    $scope.timeline.moveTo(now);
                }
            });

            $scope.$on("timeSeriesClear",function(){
                $scope.data.clear();
            });

            $scope.$watch('metrics',function(newVal){
//                    $scope.timeline.setGroups(
                $scope.groups.update(newVal.map(function(m) {
                    return {
                        id: m.name,
                        content: m.name,
                        visible: m.visible
                    };
                }));
            },true);
        }
    };
});

debuggerModule.directive('visTimeline', function() {
    return {
        restrict : 'EA',
        replace : true,
        scope: {
            timelineId: '='
        },
        link: function($scope,element){
            $scope.container = element[0];
            // Create a DataSet with data (enables two way data binding)
            $scope.data = new vis.DataSet();

            // Configuration for the Timeline
            $scope.options = {
                stack:false,
                height: "100%",
                groupOrder: 'content',
                start: new Date()- 30000,
                end: new Date(Date.now() + 60000)
            };

            // Create a Timeline
            $scope.timeline = new vis.Timeline($scope.container, $scope.data, $scope.options);

            $scope.timeline.on('select', function (properties) {

                if(properties.items.length > 0){

                    var electionMsg = $scope.$parent.selectedElection.packets[properties.items[0]];
                    if(electionMsg){
                        $scope.$apply(function() {
                            $scope.$parent.packetContents = electionMsg;
                        });
                    } else{
                        var storageEvent = $scope.$parent.selectedElection.storageEvents[properties.items[0]];
                        $scope.$apply(function() {
                            $scope.$parent.packetContents = storageEvent;
                        });
                    }

                } else {
                    $scope.$apply(function(){
                        $scope.$parent.packetContents = null;
                    });
                }

            });

            $scope.$on("timeLineClear",function(newVal){
                $scope.timeline.setGroups(newVal.electionGroups);
                $scope.timeline.setItems(newVal.elections);
                var now = Date.now();
                $scope.timeline.setWindow(now-30000, now+ 60000);
            });
        },
        controller: function($scope){
            $scope.$watch('$parent.selectedElection',function(newVal){
                if(newVal) {
                    $scope.timeline.setGroups(newVal.electionGroups);
                    $scope.timeline.setItems(newVal.elections);
                    var now = Date.now();
                    $scope.timeline.setWindow(now-30000, now+ 60000);
                } else {
                    $scope.timeline.clear({items:true,groups:true});
                }
            });
        }
    };
});

