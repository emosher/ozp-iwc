


//var client=new ozpIwc.Client({
//	peerUrl: window.location.origin+"/iwc" //"http://localhost:13000"
//});
//
//client.on("connected",function() {
//	$('#myAddress').text(client.participantId);
//});

var Widget=function(config) {
	this.iframe=$('<iframe src="' + config.url + '" sandbox="allow-scripts allow-same-origin"></iframe>');
	this.header=$('<header>'+config.name+'</header>');
	this.gridster=config.gridster;
	
	var close=$('<button>X</buton>');
	var popout=$('<button>^</button>');
	
	var self=this;
	close.click(function() {
		self.gridster.remove_widget(self.el);
	});
	popout.click(function() {
		window.open(config.url,"_blank","width="+self.el.width() + ",height="+ self.el.height());
		self.gridster.remove_widget(self.el);
	});
	
	this.header.append(popout);
	this.header.append(close);
	
	this.el=$('<div class="widget"></div>');
	
	this.el.data("controller",this);
	this.el.append(this.header);
	this.el.append(this.iframe);
};

Widget.prototype.updateSize=function() {
	this.iframe.width(this.el.width());
	this.iframe.height(this.el.height()-this.header.outerHeight());
};

var gridster;

var widgetDefs={
	'Blue Balls' : "../bouncingBalls?color=blue",//"http://"+window.location.hostname + ":15000",
	'Red Balls' : "../bouncingBalls?color=red",//"http://"+window.location.hostname + ":15001",
	'Green Balls' : "../bouncingBalls?color=green",//"http://"+window.location.hostname + ":15002",
	'Black Balls' : "../bouncingBalls?color=black",//"http://"+window.location.hostname + ":15003",
	'Debugger' : "../tools/debugger"
};

$(function(){
	var onResize=function(e, ui, $widget) {
		$widget.data("controller").updateSize();
	};
	gridster=$(".gridster").gridster({
			widget_margins: [5, 5],
			widget_base_dimensions: [120, 120],
			draggable: {
				handle: 'header'
			},
			resize: {
        enabled: true,
//				resize: onResize,
				stop: onResize
      }
		}).data('gridster');
		
	for(var widgetName in widgetDefs) {
		var button=$("<button>" + widgetName + '</button>');
		button.data("widgetName",widgetName);
		button.click(function() {
			var name=$(this).data("widgetName");
			var widget=new Widget({
				'name': name, 
				'url': widgetDefs[name], 
				'gridster':gridster
			});
			gridster.add_widget(widget.el,2,2);
			widget.updateSize();
		});
		$('.header').append(button);
	}
	
		
});

