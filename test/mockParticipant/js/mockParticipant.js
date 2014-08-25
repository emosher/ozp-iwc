
ozpIwc.test = ozpIwc.test || {};

ozpIwc.test.MockParticipant=function(config) {
    this.clientUrl=config.clientUrl;
    this.client=config.client;
    
    this.events=new ozpIwc.Event();
	this.events.mixinOnOff(this);
    this.runId=0;
    
    var self=this;
    // set up the side-band channel to the window.
   	this.messageEventListener=window.addEventListener("message", function(event) {
//        console.log("mockparticipant received: ",event.data);
       self.postMessageHandler.apply(self,arguments);
    }, false);
    
    this.iframe = document.createElement("iframe");
    this.iframe.src = this.clientUrl;
    this.iframe.height = 1;
    this.iframe.width = 1;
    this.iframe.style = "display:none !important;";
    this.callbacks={};
    document.body.appendChild(this.iframe);
};

ozpIwc.test.MockParticipant.prototype.close=function() {
    window.removeEventListener("message",this.messageEventListener,false);
    document.body.removeChild(this.iframe);
};     

ozpIwc.test.MockParticipant.prototype.postMessageHandler=function(event) {
    // ignore anything not from our iframe
    if(event.source !== this.iframe.contentWindow) {
        return;
    }
    
    switch(event.data.msgType) {
        case "address": 
            this.address=event.data.address;
            this.sendDirectly({
                'msgType': "address",
                'address': this.client.address
            });
            this.events.trigger("connected",this);
            break;
        case "return":
            var cb=this.callbacks[event.data.runId];
            if(cb) {
                cb.call(null,event.data.returnValue);
                delete this.callbacks[event.data.runId];
            }
            break;
        default:
            console.log("Unknown message type from mock participant: ",event.data);
            break;
    }
};

ozpIwc.test.MockParticipant.prototype.sendDirectly=function(data,callback) {
    if(callback) {
        data.runId=this.runId;
        this.callbacks[this.runId++]=callback;
    }
    this.iframe.contentWindow.postMessage(data,"*");
};

ozpIwc.test.MockParticipant.prototype.send=function(packet,callback) {
    this.sendDirectly({
        'msgType': "send",
        'packet': packet
    },callback);
};

ozpIwc.test.MockParticipant.prototype.run=function(func,callback) {
    this.sendDirectly({
        'msgType': "run",
        'runId' : this.runId,
        'func': func.toString()
    },callback);
};