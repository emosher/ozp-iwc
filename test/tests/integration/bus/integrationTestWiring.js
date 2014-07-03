var ozpIwc=ozpIwc || {};

if(ozpIwc.Peer) {
    ozpIwc.defaultPeer=new ozpIwc.Peer();
}

ozpIwc.TestParticipant=ozpIwc.util.extend(ozpIwc.InternalParticipant,function(config) {
    ozpIwc.InternalParticipant.apply(this,arguments);
    this.participantType="testParticipant";
    this.msgIdSequence=0;
});

if(ozpIwc.Router) {
    ozpIwc.defaultRouter=new ozpIwc.Router({
        peer:ozpIwc.defaultPeer
    });
    if (ozpIwc.Participant) {
        ozpIwc.testParticipant = new ozpIwc.TestParticipant({name: "Test Participant"});
        ozpIwc.defaultRouter.registerParticipant(ozpIwc.testParticipant);
        ozpIwc.defaultRouter.peer.events.on("receive", function(event) {
            var packet = event.packet.data;
            //intercept test packets and return, with additional info, to sending Participant
            if (packet.test) {
                var testReply = {
                    ver: 1,
                    src: ozpIwc.testParticipant.address,
                    msgId: "p:" + ozpIwc.testParticipant.msgIdSequence++,
                    time: new Date().getTime(),
                    dst: packet.src,
                    maxSeqIdPerSource: ozpIwc.Peer.maxSeqIdPerSource,
                    packetsSeen: ozpIwc.defaultRouter.peer.packetsSeen,
                    echo: true,//marker used by originating Participant
                    packet: packet
                };
                ozpIwc.defaultRouter.send(testReply, ozpIwc.testParticipant);
            }
        });
    }
}

if(ozpIwc.LocalStorageLink) {
    ozpIwc.defaultLocalStorageLink=new ozpIwc.KeyBroadcastLocalStorageLink({
        peer: ozpIwc.defaultPeer
    });
}

if(ozpIwc.PostMessageParticipantListener) {
    ozpIwc.defaultPostMessageParticipantListener=new ozpIwc.PostMessageParticipantListener( {
        router: ozpIwc.defaultRouter
    });
}

if(ozpIwc.BasicAuthorization) {
    ozpIwc.authorization=new ozpIwc.BasicAuthorization();
}

if(ozpIwc.DataApi) {
    ozpIwc.dataApi=new ozpIwc.DataApi({
        'participant': new ozpIwc.LeaderGroupParticipant({'name': "data.api"})
    });

    ozpIwc.defaultRouter.registerParticipant(ozpIwc.dataApi.participant);
}

if(ozpIwc.IntentsApi) {
    ozpIwc.intentsApi=new ozpIwc.IntentsApi({
        'participant': new ozpIwc.LeaderGroupParticipant({'name': "intents.api"})
    });

    ozpIwc.defaultRouter.registerParticipant(ozpIwc.intentsApi.participant);
}