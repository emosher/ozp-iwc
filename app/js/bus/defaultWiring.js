var ozpIwc=ozpIwc || {};

if(ozpIwc.Peer) {
	ozpIwc.defaultPeer=new ozpIwc.Peer();
}

if(ozpIwc.Router) {
	ozpIwc.defaultRouter=new ozpIwc.Router({
			peer:ozpIwc.defaultPeer
		});
}

if(ozpIwc.LocalStorageLink) {
	ozpIwc.defaultLocalStorageLink=new ozpIwc.KeyBroadcastLocalStorageLink({
		peer: ozpIwc.defaultPeer
	});
}

if(ozpIwc.PostMessageParticipantListener) {
	ozpIwc.defaultPostMessageParticipantListener=new ozpIwc.PostMessageParticipantListener({
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

ozpIwc.initialized.success(function(config) {
    console.log("initialized with ",config);
}).failure(function(code,response) {
    console.error("failed to initialize IWC, status code=",code,", response=",response);
});

//
//if(ozpIwc.NamesApi) {
//	ozpIwc.namesApi=new ozpIwc.LeaderGroupParticipant({
//		name: "names.api",
//		target: new ozpIwc.NamesApi()
//	});
//	ozpIwc.defaultRouter.registerParticipant(ozpIwc.namesApi);
//}
//
//if(ozpIwc.IntentsApi) {
//	ozpIwc.intentsApi=new ozpIwc.LeaderGroupParticipant({
//		name: "intents.api",
//		target: new ozpIwc.IntentsApi()
//	});
//	ozpIwc.defaultRouter.registerParticipant(ozpIwc.intentsApi);
//}