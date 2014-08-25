/**
 * Network Integration
 */


describe("System API", function () {
    var client;
    var participant;
    
    beforeEach(function(done) {
        client=new ozpIwc.Client({
            peerUrl: "http://localhost:14002"
        });
        participant=new ozpIwc.test.MockParticipant({
            clientUrl: "http://localhost:14001",
            'client': client
        });
        
        var gate=done_semaphore(2,done);

        participant.on("connected",gate);
        client.on("connected",gate);
    });
    
    afterEach(function() {
        client.disconnect();
        participant.close();
    });

    

    describe("/user resource", function() {
        xit("has pretty name and email in /user",function(done) {

        });

        xit("set action is noPerm",function(done) {
            
        });
        xit("delete action is noPerm",function(done) {
            
        });
    });

    describe("/system resource", function() {
        xit("has system version in /system",function(done) {
            
        });

        xit("set is a badAction",function(done) {
            
        });

        xit("delete is a badAction",function(done) {
            
        });
    });

    describe("/application resources", function() {
        xit("lists the sampleData applications at /application",function(done) {
            
        });
        xit("gets reference data at /application/${id}",function(done) {
            
        });
        xit("set action is noPerm",function(done) {
            
        });
        xit("delete action is noPerm",function(done) {
            
        });
    });
    

});
