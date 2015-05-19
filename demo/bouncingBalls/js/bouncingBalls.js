
var balls={};

var Ball=function(ballRef,svgElement) {
    this.svg=svgElement;
    this.el=document.createElementNS("http://www.w3.org/2000/svg", 'g');
    this.el.setAttribute("class","ball");

    this.circle=document.createElementNS("http://www.w3.org/2000/svg", 'circle');
    this.el.appendChild(this.circle);

    this.label=document.createElementNS("http://www.w3.org/2000/svg", 'text');
    this.label.setAttribute("class","svgHidden");
    this.el.appendChild(this.label);

    this.svg.append(this.el);


    this.ballResource=ballRef;
    this.totalLatency=0;
    this.packets=0;
    this.lastUpdate=ozpIwc.util.now();
    this.updateDelta=0;
    this.updateCount=0;
    this.refreshed = false;
    var watchRequest={
        dst: "data.api",
        action: "watch",
        resource: ballRef
    };
    var self=this;

    client.send(watchRequest,function(reply) {
        self.watchId=reply.replyTo;
        self.packets++;
        var now=ozpIwc.util.now();
        self.totalLatency+=now-reply.time;

        if(reply.response==="changed") {
            self.refreshed = true;
            self.draw(reply.entity.newValue);
        }
    });
    this.removeWatchdog = function(){
        if(self.refreshed){
            self.refreshed = false;
            return;
        } else {

            var svgimg = document.createElementNS('http://www.w3.org/2000/svg','image');
            svgimg.setAttribute('height','200');
            svgimg.setAttribute('width','200');
            svgimg.setAttribute('id','testimg2');
            svgimg.setAttributeNS('http://www.w3.org/1999/xlink','href','explosion.gif');
            svgimg.setAttribute('x','-100');
            svgimg.setAttribute('y','-100');
            self.el.appendChild(svgimg);
            self.circle.setAttribute("class","svgHidden");
            window.setTimeout(function(){
                self.remove();
            },500);
        }
    };
   setInterval(this.removeWatchdog,10000);

    $(this.el).click(function() {
        if(self.label.getAttribute("class").match("svgHidden")) {
            self.label.setAttribute("class","");
        }else {
            self.label.setAttribute("class","svgHidden");
        }
    });
};

Ball.prototype.draw=function(info) {
    if(!info) {
        this.remove();
    }
    var now=ozpIwc.util.now();
    this.updateDelta+=now-this.lastUpdate;
    this.updateCount++;
    this.lastUpdate=now;

    this.el.setAttribute("transform","translate(" + info.x +","+ info.y + ")");
//	this.el.setAttribute("y",info.y);
    this.circle.setAttribute("r",info.r);
    this.circle.setAttribute("fill",info.color);
    this.label.setAttribute("x",info.r  + 5);
    this.label.textContent=info.label
        + "[pkt=" + this.packets
        + ",updateAvg=" + Math.floor(this.updateDelta/this.updateCount) + "ms"
//			+ ",avg=" + (this.totalLatency/this.packets).toPrecision(2)
        +']';

};

Ball.prototype.remove=function() {
    clearTimeout(this.removeWatchdog);
    client.send({
        dst: "data.api",
        action: "unwatch",
        resource: this.ballResource,
        replyTo: this.watchId
    });
    this.el.setAttribute('display','none');
//    this.el.remove();
    delete balls[this.ballResource];
};


var extents={
    minX: 0,
    minY: 0,
    maxX: 1000,
    maxY: 1000
};

var AnimatedBall=function(config) {
    config = config || {};
    this.state={
        x: 100+Math.floor(Math.random()*100),
        y: 100+Math.floor(Math.random()*100),
        vx: -100+Math.floor(Math.random()*200),
        vy: -100+Math.floor(Math.random()*200),
        r: 25+Math.floor(Math.random()*50),
        color: currentColor,
        owner: config.owner,
        label: config.resource
    };
    this.resource=config.resource;
    this.onTick=config.onTick || function() {};

    this.tick=function(delta) {
        var ball=this.state;
        ball.x+=delta*ball.vx;
        ball.y+=delta*ball.vy;

        if(ball.x-ball.r <= extents.minX || ball.x+ball.r >= extents.maxX) {
            ball.vx=-ball.vx;
        }
        if(ball.y-ball.r <= extents.minY || ball.y+ball.r >= extents.maxY) {
            ball.vy=-ball.vy;
        }
        ball.x=Math.max(ball.x,extents.minX+ball.r);
        ball.x=Math.min(ball.x,extents.maxX-ball.r);
        ball.y=Math.max(ball.y,extents.minY+ball.r);
        ball.y=Math.min(ball.y,extents.maxY-ball.r);


        client.send({
            dst: "data.api",
            action: "set",
            resource: this.resource,
            entity: ball
        });
    };

    this.cleanup=function() {
        client.send({
            dst: "data.api",
            action: "delete",
            resource: this.resource
        });
    };
};

var ourBalls=[];
var currentColor="black";

$(document).ready(function(){
    var colors=$("#ballColor option");

    var params=ozpIwc.util.parseQueryParams();

    currentColor=params['color'] || colors[Math.floor(Math.random() * colors.length)].value;
    $("#ballColor").val(currentColor);

    var setBallsColor=function(color) {
        $('#viewport rect')[0].setAttribute("fill",color);
        for(var i=0;i<ourBalls.length;++i) {
            ourBalls[i].state.color=color;
        }
    };

    setBallsColor(currentColor);

    $("#ballColor").change(function(e) {
        var color=e.target.value;
        setBallsColor(color);
    });


	window.setInterval(function() {
		var elapsed=(ozpIwc.util.now()-client.startTime)/1000;

		$('#averageLatencies').text(
			"Pkt/sec [sent: " + (client.sentPackets/elapsed).toFixed(1) + ", " +
			"received: " + (client.receivedPackets/elapsed).toFixed(1) + "]"
		);
	},500);
});

var client=new ozpIwc.Client({peerUrl:"http://" + window.location.hostname + ":13000"});

client.on("connected",function() {
	// setup
	var viewPort=$('#viewport');
    var fps=20;
    $('#myAddress').text(client.address);
    $('#fps').text(""+fps);
	//=================================================================
	// cleanup when we are done
	window.addEventListener("beforeunload",function() {
		for(var i=0;i<ourBalls.length;++i) {
			ourBalls[i].cleanup();
		}
	});

	//=================================================================
	// Animate our balls
	var lastUpdate=new Date().getTime();
	var animate=function() {
		var now=new Date().getTime();
		var delta=(now-lastUpdate)/1000.0;
		for(var i=0;i<ourBalls.length;++i) {
			ourBalls[i].tick(delta);
		}
		lastUpdate=now;
	};

	window.setInterval(animate,1000/fps);


	//=================================================================
	// listen for balls changing
	var watchRequest={
		dst: "data.api",
		action: "watch",
		resource: "/balls"
	};
	var onBallsChanged=function(reply) {
		if(reply.entity.addedChildren) {
			reply.entity.addedChildren.forEach(function(b) {
    			balls[b]=new Ball(b,viewPort);
            });
		}
		if(reply.entity.removedChildren) {
			reply.entity.removeChildren.forEach(function(b) {
                balls[b].cleanup();
            });
		}
	};
	client.send(watchRequest,onBallsChanged).then(function(e){
        console.log(e);
    });

	//=================================================================
	// get the existing balls
	var listExistingBalls={
		dst: "data.api",
		action: "list",
		resource: "/balls"
	};

	client.send(listExistingBalls).then(function(reply) {
		for(var i=0; i<reply.entity.length;++i) {
			balls[reply.entity[i]]=new Ball(reply.entity[i],viewPort);
		}
	});

	//=================================================================
	// add our ball
	var pushRequest={
		dst: "data.api",
		action: "addChild",
		resource: "/balls",
		entity: {}
	};

	client.send(pushRequest).then(function(packet){
		if(packet.response==="ok") {
			ourBalls.push(new AnimatedBall({
				resource:packet.entity.resource
			}));

		} else {
            ozpIwc.log.log("Failed to push our ball: " + JSON.stringify(packet,null,2));
		}
	});
});
