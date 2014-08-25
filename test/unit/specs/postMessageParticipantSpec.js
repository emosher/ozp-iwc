describe("Post Message Participant",function() {
    var fakeRouter;

    var tick = function (t) {
        fakeRouter.pump();
        jasmine.clock().tick(t);
        fakeRouter.pump();
    };

    var moveTime = function (step) {
        var elected = false;
        var round = 0;
        while (!elected) {
//			console.log("============= Round " + round + " ===================");
            round++;
            jasmine.clock().tick(step);
            fakeRouter.pump();

            elected = leaders.some(function (l) {
                return l.isLeader();
            });
        }
    };
    var makeParticipant = function() {
        var l = new ozpIwc.PostMessageParticipant({
            origin : "http://localhost:14000",
            sourceWindow : this.window,
            credentials : []
        });
        fakeRouter.registerParticipant(l);
        return l;
    };

    beforeEach(function () {
        fakeRouter= new FakeRouter();
    });

    it("permits receiving packets that have a destination matching the receiveAs Attribute", function() {
        var participant = makeParticipant();
        var res = participant.receiveFromRouterImpl(new TestPacketContext({
            'packet': {
                'dst': participant.address
            }
        }));
        expect(res.resolution).toEqual("success");
    });

    it("denies receiving packets that don't have a destination matching the receiveAs Attribute", function() {
        var participant = makeParticipant();
        var res = participant.receiveFromRouterImpl(new TestPacketContext({
            'packet': {
                'dst': participant.address+1
            }
        }));
        expect(res.resolution).toEqual("failure");
    });

    it("permits sending packets that have a source matching the sendAs Attribute", function() {
        var participant = makeParticipant();
        var res = participant.send({
                'src': participant.address
            });
        expect(res.resolution).toEqual("success");
    });

    it("denies sending packets that don't have a source matching the sendAs Attribute", function() {
        var participant = makeParticipant();

        var res = participant.send({
            'src': participant.address+1
        });
        expect(res.resolution).toEqual("failure");
    });
});