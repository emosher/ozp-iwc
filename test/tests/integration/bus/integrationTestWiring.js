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
                var authenticatedRoles=0;
                var authorizedRoles=0;
                var internalParticipantCallbacks=0;
                var leaderGroupElectionQueue=0;
                var postMessageParticipants=0;
                var routerParticipants=0;
                var linksStorage=0;
                var metricsTypes=0;
                var specs = ozpIwc.metrics.gauge('security.authentication.roles').get();
                if (specs) {
                    authenticatedRoles=specs.roles;
                }
                specs=ozpIwc.metrics.gauge('security.authorization.roles').get();
                if (specs) {
                    authorizedRoles=specs.roles;
                }
                specs=ozpIwc.metrics.gauge('transport.internal.participants').get();
                if (specs) {
                    internalParticipantCallbacks=specs.callbacks;
                }
                specs=ozpIwc.metrics.gauge('transport.leaderGroup.election').get();
                if (specs) {
                    leaderGroupElectionQueue=specs.queue;
                }
                specs=ozpIwc.metrics.gauge('transport.postMessageListener.participants').get();
                if (specs) {
                    postMessageParticipants=specs.participants;
                }
                specs=ozpIwc.metrics.gauge('transport.router.participants').get();
                if (specs) {
                    routerParticipants = specs.participants;
                }
                specs=ozpIwc.metrics.gauge('1links.localStorage.buffer').get();
                if (specs) {
                    linksStorage=specs.used;
                }
                specs=ozpIwc.metrics.gauge('registry.metrics').get();
                if (specs) {
                    metricsTypes = specs.types;
                } else {
                    console.log("no metrics");
                }
                var testReply = {
                    ver: 1,
                    src: ozpIwc.testParticipant.address,
                    msgId: "p:" + ozpIwc.testParticipant.msgIdSequence++,
                    time: new Date().getTime(),
                    dst: packet.src,
                    maxSeqIdPerSource: ozpIwc.Peer.maxSeqIdPerSource,
                    packetsSeen: ozpIwc.defaultRouter.peer.packetsSeen,
                    'authenticatedRoles': authenticatedRoles,
                    'authorizedRoles': authorizedRoles,
                    'internalParticipantCallbacks': internalParticipantCallbacks,
                    'leaderGroupElectionQueue': leaderGroupElectionQueue,
                    'postMessageParticipants': postMessageParticipants,
                    'routerParticipants': routerParticipants,
                    'linksStorage': linksStorage,
                    'metricsTypes': metricsTypes,
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