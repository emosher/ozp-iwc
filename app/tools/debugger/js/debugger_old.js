

var client=new ozpIwc.InternalParticipant({name: "debuggerClient"});
ozpIwc.defaultRouter.registerParticipant(client);
//===============================================================================================
// Topology tab
//===============================================================================================
var TopologyMap=function(config) {
	this.tableEl=config.tableEl;
	this.routerRows={};
	this.participantRows={};
	this.multicastMembers={};
};

TopologyMap.prototype.findRouterRow=function(k) {
	if(!this.routerRows[k]) {
		this.routerRows[k]=$('<tr class="routerRow"><td class="RouterKey">'+k+'</td>'
					+'<td class="routerValue"><table class="participantTable"><thead><tr>'
					+ '<td>Address</td>'
					+ '<td>Type</td>'
					+ '<td>Name</td>'
					+ '</tr></thead></table></td>');
		this.tableEl.append(this.routerRows[k]);
	};
	return this.routerRows[k];
};

TopologyMap.prototype.findParticipantRow=function(k,routerRow) {
	if(!this.participantRows[k]) {
		this.participantRows[k]=$('<tr>'
						+'<td><span class="address"></span></td>'
						+'<td class="type"></td>'
						+'<td class="name"></td>'
						);
		routerRow.find(".participantTable").append(this.participantRows[k]);
	}
	return this.participantRows[k];
};

TopologyMap.prototype.updateRouter=function(packet) {
	var el=this.findRouterRow(packet.resource);

	var val;
	if(packet.action==="changed") {
		val=packet.entity.newValue;
	} else {
		val=packet.entity;
	}
	if(val.participants) {
		for(var p in val.participants) {
			var pEl;
			var data=val.participants[p];
			
			if(data.type==="multicast") {
				var pEl=this.findParticipantRow(p,this.tableEl.find(".routerMulticast"));
				pEl.find(".address").text(p);
				pEl.find(".type").text(data.type);
				this.multicastMembers[p]=this.multicastMembers[p] || {};
				for(var memberI=0; memberI < data.members.length; ++memberI) {
					this.multicastMembers[p][data.members[memberI]]=1;
				}
				
				pEl.find(".name").html(Object.keys(this.multicastMembers[p]).join("<br>"));
			} else {
				var pEl=this.findParticipantRow(p,el);
				pEl.find(".address").text(p);
				pEl.find(".type").text(data.type);
				pEl.find(".name").text(data.name);
			}
			delete data.address;
			delete data.type;
			delete data.name;
			$(pEl).find(".address").popover({
				html: true,
				title: "otherData",
				content: "<pre>"+JSON.stringify(data,null,2) +"</pre>",
				container: $('#topologyTab')
			});
		}
	}
};


TopologyMap.prototype.updateKeys=function(packet) {
	var keys=packet.entity;
	var self=this;
	
	for(var i=0; i< keys.length; ++i) {
		var k=keys[i];
		if(!this.routerRows[k]) {
			client.send({
				dst: 'names.api',
				action: 'watch',
				resource: k
			},function(p) { self.updateRouter(p);});
		}

		
		client.send({
			dst: 'names.api',
			action: 'get',
			resource: k
		},function(p) { self.updateRouter(p);});
	}
};

TopologyMap.prototype.refresh=function() {
	var self=this;
	client.send({
		dst: 'names.api',
		action: 'list'
	},function(p) { self.updateKeys(p); });
};

var topologyMap;

$(document).ready(function() {
	topologyMap=new TopologyMap({tableEl:$("#topologyTable")});
	topologyMap.refresh();
});



//===============================================================================================
// Log tab
//===============================================================================================

// set value to "hidden" to hide the column
var logColumnsShown={
	dateString: "",
	srcPeer: "hidden",
	sequence: "hidden",
	dst: "",
	src: "",
	msgId: "",
	replyTo: "",
	action: "",
	resource: "",
	contentType: ""
};

var packetCapture=false;
function togglePacketCapture() {
	packetCapture=!packetCapture;
	$("#togglePacketCapture").text(packetCapture?"Stop Capture":"Start Capture");
}

function clearPacketCapture() {
	$("#messages tr.summary, tr.packet").remove();
}

function updateLogColumns() {
	for(var k in logColumnsShown) {
		if(logColumnsShown[k]==="") {
			$("."+k).removeClass("hidden");
		} else {
			$("."+k).addClass("hidden");
		}
	}
}

function filterPacket(packet) {
	var filter=$('#packetCaptureFilter').val();
	var clauses=filter.split("&&");
	var regex=/^\s*([\w\.]+)(.*)"(.*)"\s*$/;

	for(var i=0; i< clauses.length; ++i) {
		var match=regex.exec(clauses[i]);
		if(!match) {
			$('#packetCaptureFilter').css("background-color","lightred");
		} else {
			var path=match[1].split(".");
			var value=packet;
			while(path.length) {
				var p=path.shift();
				if(typeof(value[p]) === "undefined") {
					return false;
				}
				value=value[p];
			}
			switch(match[2]) {
				case "==":
					if(match[3]!==value) {
						return false;
					}
					break;
				default:
					break;
			}
		}
	}
	return true;
}

function logPacket(msg) {
	if(!packetCapture) {
		return;
	}
	var packet=msg.packet;
	
	if(!filterPacket(packet)) {
		return;
	}	
	
	var date=new Date(packet.data.time);
	var dateString=date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + " " +
					date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();

	$("#messages").append( 
			'<tr class="summary">'+
				'<td class="dateString '+ logColumnsShown.dateString +'">'+dateString+'</td>'+
				'<td class="srcPeer '+ logColumnsShown.srcPeer +'">'+packet.src_peer+'</td>'+
				'<td class="sequence '+ logColumnsShown.sequence +'">'+packet.sequence+'</td>'+
				'<td class="dst '+ logColumnsShown.dst +'">'+packet.data.dst+'</td>'+
				'<td class="src '+ logColumnsShown.src +'">'+packet.data.src+'</td>'+
				'<td class="msgId '+ logColumnsShown.msgId +'">'+packet.data.msgId+'</td>'+
				'<td class="replyTo '+ logColumnsShown.replyTo +'">'+(packet.data.replyTo || "")+'</td>'+
				'<td class="action '+ logColumnsShown.action +'">'+(packet.data.action || "")+'</td>'+
				'<td class="resource '+ logColumnsShown.resource +'">'+(packet.data.resource || "")+'</td>'+
				'<td class="contentType '+ logColumnsShown.contentType +'">'+(packet.data.contentType || "")+'</td>'+
				'</tr><tr class="packet">'+
				'<td colspan="10"><pre>' + JSON.stringify(msg,null,2) + '</pre></td>'+
			'</tr>'
	);
};
ozpIwc.defaultPeer.on("receive",logPacket);
ozpIwc.defaultPeer.on("send",logPacket);

$(document).ready(function() {
	$('#debuggerAddress').text(client.address);
	$("#messages").on("click","tr.summary",function(event) {
		event.preventDefault();
		$(this).next("tr.packet").toggle();
	});
});
	
//===============================================================================================
// Stats tab
//===============================================================================================

function updateStats() {
	$("#stats").text(JSON.stringify(ozpIwc.metrics.toJson(),null,2));
};

var updateMetrics=false;

function toggleUpdateMetrics() {
	updateMetrics=!updateMetrics;
		$("#toggleUpdateMetrics").text(updateMetrics?"Disable Update":"Enable Update");
}

$(document).ready(function() {
	updateLogColumns();
	updateStats();
	window.setInterval(function() {
		if(updateMetrics) {
			updateStats();
		}
	},1000);
			
});

//===============================================================================================
// Key Value tab
//===============================================================================================

var knownKVKeys={};

function updateValue(packet) {
	var el=knownKVKeys[packet.resource];
	if(!el) {
		el=createKeyRow(packet.resource);
	}
	var val;
	if(packet.action==="changed") {
		val=packet.entity.newValue;
	} else {
		val=packet.entity;
	}
	el.find('.kvValue').text(JSON.stringify(val,null,2));
	if(packet.entity && packet.entity.watchers) {
		el.find('.kvWatchers').text(JSON.stringify(packet.entity.watchers,null,2));
	}
}

function createKeyRow(k) {
	var table=$('#keyValueTable');
	knownKVKeys[k]=$('<tr class="KVRow"><td class="KVKey">'+k+'</td>'
				+'<td><pre class="kvValue"></pre></td>'
				+'<td><pre class="kvWatchers"></pre></td>'
				+'</tr>');
	table.append(knownKVKeys[k]);
	return knownKVKeys[k];
}

function updateKeys(packet) {
	var table=$('#keyValueTable');
	var keys=packet.entity;
	
	table.remove('tr.KVRow');
	for(var i=0; i< keys.length; ++i) {
		var k=keys[i];
		if(!knownKVKeys[k]) {
			client.send({
				dst: 'keyValue.api',
				action: 'watch',
				resource: k
			},updateValue);
		}

		
		client.send({
			dst: 'keyValue.api',
			action: 'get',
			resource: k
		},updateValue);
	}
}

function refreshKV() {
	$('#keyValueTable tr.KVRow').remove();
	knownKVKeys={};
	
	client.send({
		dst: 'keyValue.api',
		action: 'list'
	},updateKeys);
}

$(document).ready(function() {
	refreshKV();
});

//===============================================================================================
// Key Value tab
//===============================================================================================

var LeaderGroup=function(groupName) {
	this.groupName=groupName;
	this.leader="";
	this.members={};
	this.lastElection="";
	this.lastSync=undefined;
	this.el=$('<tr><td class="leaderGroup">'+groupName+'</td>'+
					'<td class="lastElection"></td>'+
					'<td class="currentLeader"></td>'+
					'<td><pre class="members"></pre></td>'+
					'<td class="lastSync"></td>'+
					'<td><ul class="history"></ul></td>'+
					'</tr>');
	
	this.update=function(packet) {
		var now=ozpIwc.util.now();
		var history=this.el.find(".history");
		
		this.members[packet.src]={
			lastSeen: prettyDate(now),
			priority: packet.entity.priority
		};
		switch(packet.action) {
				case 'election':
					this.lastElection=now;
					history.append('<li>'+packet.src + " called an election");
					break;
				case 'victory':
					this.leader=packet.src;
					history.append('<li>'+packet.src + " declared victory");
					break;
				case 'sync':
					this.lastSync=packet.time || now;
					history.append('<li>'+packet.src + " pushed sync data");
					break;
		}
		
		this.el.find(".lastElection").text(prettyDate(this.lastElection));
		this.el.find(".currentLeader").text(this.leader);
		this.el.find(".members").text(JSON.stringify(this.members,null,2));
		this.el.find(".lastSync").text(this.lastSync?prettyDate(this.lastSync):"");

	};
};

var knownLeaderGroups={};

function prettyDate(epochTime) {
	var date=new Date(epochTime);
	return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + " " +
				date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "." + date.getMilliseconds();
}


function logLeaderPacket(msg) {
	var packet=msg.packet.data;
	if(!packet.dst.match(".election")) {
		return;
	}
	var leaderGroup=knownLeaderGroups[packet.dst];
	if(!leaderGroup) {
		leaderGroup=knownLeaderGroups[packet.dst]=new LeaderGroup(packet.dst);
		$("#leaderInfoTab table").append(leaderGroup.el);
	}
	leaderGroup.update(packet);
};
ozpIwc.defaultPeer.on("receive",logLeaderPacket);
ozpIwc.defaultPeer.on("send",logLeaderPacket);


//===============================================================================================
// LocalStorage tab
//===============================================================================================


function drawLocalStorage() {
	var table=$("#localStorageTab table");
	table.find(".localStorageRow").remove();
	for(var i=0; i < localStorage.length;++i) {
		var k=localStorage.key(i);
		var v=localStorage.getItem(k);
		table.append('<tr class="localStorageRow">'
			+ "<td>" + k + "</td>"
			+"<td><pre>"+v+"</pre></td>"
			+"</tr>");
	}
}

function wipeLocalStorage() {
	while(localStorage.length) {
		localStorage.removeItem(localStorage.key(0));
	}
	drawLocalStorage();
}

$(document).ready(function() {
	drawLocalStorage();
});