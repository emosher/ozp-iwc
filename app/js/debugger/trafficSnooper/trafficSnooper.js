/* global debuggerModule */
debuggerModule.controller("packetLogController",["$scope",function(scope) {
    scope.logging=false;
    scope.viewFilter="";
    scope.viewFilterValidation="";
    scope.packets=[];
    scope.maxShown=50;
    scope.filterError="";
    scope.selectedPacket=null;
    scope.setSelectedPacket=function(p) {
        scope.selectedPacket=p;
    };
        
    var filterFunction=function() {
        return true;
    };
    
    /* jshint evil:true */
    var createFilterFunction=function(filter) {
        if(!filter) { filter="true";}
        var f=new Function("srcPeer","sequence","data","return ("+filter+");");
        try {
            f("123456",123,{});
            return f;
        }catch (e) {
            if(e instanceof TypeError) {
                // likely an data field that is null/undefined, so let it slide
                return f;
            } else {
                throw e;
            }
        }        
    };

    
    scope.updateFilter=function(filter){
        try {
            scope.filterError="";
            scope.viewFilterValidation="hasSuccess";
            filterFunction=createFilterFunction(filter);
        } catch (e) {
            scope.filterError=e.message;
            scope.viewFilterValidation="has-error";
        }
    };
    
    scope.$watch("viewFilter",function() {
        try {
            scope.filterError="";
            scope.viewFilterValidation="hasSuccess";
            createFilterFunction(scope.viewFilter);
        } catch (e) {
            console.log("Filter error ",e);
            scope.filterError=e.message;
            scope.viewFilterValidation="has-error";
        }      
    });
    scope.logicalFilter=function() {
        return function(p) { 
            try { return filterFunction(p.srcPeer,p.sequence,p.data); }
            catch(e) {
                return false;
            }
        };
        
    };

    var logPacket=function(msg) {        
        if(!scope.logging) {
            return;
        }

        var packet=msg.packet;
        scope.$apply(function() {
           scope.packets.push(packet);
        });
    };

    ozpIwc.defaultPeer.on("receive",logPacket);
    ozpIwc.defaultPeer.on("send",logPacket);

}]);

debuggerModule.directive( "trafficSnooper", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/trafficSnooper.tpl.html'
    };
}]);

debuggerModule.directive( "trafficSnooperToolbar", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/trafficSnooperToolbar.tpl.html'
    };
}]);

debuggerModule.directive( "trafficSnooperContent", [function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/trafficSnooperContent.tpl.html'
    };
}]);
