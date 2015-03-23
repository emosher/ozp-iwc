/* global debuggerModule */
debuggerModule.controller("packetLogController",["$scope", "$filter",function(scope,$filter) {
    scope.logging=false;
    scope.viewFilter="";
    scope.viewFilterValidation="";
    scope.packets=[];
    scope.maxShown = 50;
    scope.filteredPackets=[];
    scope.filterError="";
    scope.selectedPacket=null;
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

    scope.updateFilteredPackets = function(packets) {
      scope.filteredPackets = packets.filter(scope.logicalFilter);
    };

    scope.updateFilter=function(filter){
        try {
            scope.filterError="";
            scope.viewFilterValidation="hasSuccess";
            filterFunction=createFilterFunction(filter);
            scope.updateFilteredPackets(scope.packets);
        } catch (e) {
            scope.filterError=e.message;
            scope.viewFilterValidation="has-error";
        }
    };

    scope.clear = function(){
        scope.packets = [];
        scope.updateFilteredPackets(scope.packets);
        scope.selectedPacket = null;
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

    scope.$watch("maxShown",function(){
        arrayLimiter(scope.packets,scope.maxShown);
        scope.updateFilteredPackets(scope.packets);
    });

    scope.logicalFilter=function(p) {
            try {
                return filterFunction(p.srcPeer,p.sequence,p.data);
            }catch(e) {
                return false;
            }
    };


    var arrayLimiter = function(array,limiter){
        var amtOver = array.length - limiter;
        if (amtOver > 0){
            array.splice(0,amtOver);
        }
        return array;
    };

    var logPacket=function(msg) {        
        if(!scope.logging) {
            return;
        }

        var packet=msg.packet;
        scope.$apply(function() {
            scope.packets.push(packet);
            arrayLimiter(scope.packets,scope.maxShown);
            scope.updateFilteredPackets(scope.packets);
        });
    };

    var columnDefs =  [{
        field:'data.time',
        displayName:'Time'
    },{
        field:'srcPeer',
        displayName:'Src Peer'
    },{
        field:'sequence',
        displayName:'Sequence'
    },{
        field:'data.dst',
        displayName:'Destination'
    },{
        field:'data.src',
        displayName:'Source'
    },{
        field:'data.msgId',
        displayName:'Message ID'
    },{
        field:'data.replyTo',
        displayName:'Reply To'
    },{
        field:'data.action',
        displayName:'Action'
    },{
        field:'data.response',
        displayName:'Response'
    },{
        field:'data.resource',
        displayName:'Resource'
    },{
        field:'data.contentType',
        displayName:'Content Type'
    }];

    scope.gridOptions = {
        data : 'filteredPackets',
        columnDefs: columnDefs,
        rowHeight: 24,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        onRegisterApi: function( gridApi ) {
            scope.gridApi = gridApi;
            scope.gridApi.core.handleWindowResize();
            scope.gridApi.selection.on.rowSelectionChanged(scope,function(row){
                if(row.isSelected){
                    scope.selectedPacket = row.entity;
                }

            });
        }
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