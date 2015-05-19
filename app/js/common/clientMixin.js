///*
// * @class ozpIwc.ClientMixin
// * Augments a participant or connection that supports basic IWC communications
// * functions for sending and receiving.
// * The receiving class must have:
// *   Method: sendImpl(packetFragment)
// *   Property: connectPromise - Promise that's fulfilled when the connection is made.
// *       Defaults to Promise.resolve()
// *
// * The receiving class is expected to call routeToReplies(packet) whenever it receives a
// * reply.  RouteToReplies returns true if the packet was handled by a reply callback.
// *
// */
//ozpIwc.ClientMixin=function(client) {
//    client.cmReplyCallbacks={};
//    client.cmMsgIdSequence=1;
//    client.connectPromise = client.connectPromise || Promise.resolve();
//    client.send=ozpIwc.ClientMixin.send;
//    client.routeToReplies=ozpIwc.ClientMixin.routeToReplies;
//};
//
//ozpIwc.ClientMixin.routeToReplies=function(packet) {
//    if(packet.replyTo && this.cmReplyCallbacks[packet.replyTo]) {
//        var self=this;
//        var done=function() {
//            if(self.cmReplyCallbacks[packet.replyTo]) {
//                delete self.cmReplyCallbacks[packet.replyTo];
//            }
//        };
//
//        this.cmReplyCallbacks[packet.replyTo](packet,done);
//
//        return true;
//    }
//    return false;
//};
//
//ozpIwc.ClientMixin.send=function(packetFragment,callback) {
//    var self=this;
//    var packet={
//        ver: 1,
//        src: this.address
//    };
//
//    ozpIwc.object.eachEntry(packetFragment,function(k,v) {
//        packet[k]=v;
//    });
//    packet.time=packet.time || ozpIwc.util.now();
//    packet.msgId=packet.msgId || this.cmMsgIdSequence++;
//
//    return this.connectPromise.then(function() {
//        self.sendImpl(packet);
//        return new Promise(function(resolve,reject) {
//            self.cmReplyCallbacks[packet.msgId]=function(reply,done) {
//                if(!callback) {
//                    done();
//                }
//                if(reply.response==="ok") {
//                    resolve(reply);
//                } else if(/^(?:no|bad|error)/.test(reply.response)) {
//                    reject(reply);
//                } else if(callback) {
//                    callback(reply,done);
//                }
//            };
//        });
//    });
//};
