describe("Data API data loading",function() {
	var dataApi;
    var endpoint;
	beforeEach(function() {
        dataApi=new ozpIwc.DataApi({
            'participant': new TestClientParticipant(),
            'name': "testApiBase.api",
            'router': new FakeRouter()
        });
        dataApi.isRequestQueueing=false;

        endpoint=jasmine.createSpyObj('endpoint',['get','put','delete']);
        ozpIwc.endpoint=function() { return endpoint; };
	});
    
    xit("fetches data from the server",function() {
        endpoint.get.and.returnValue({
           _links: {
               item: []
           },
           _embedded: {
               item: []
           }             
        });
        expect(endpoint.get).toBeDefined();
        return dataApi.transitionToLoading().then(function() {
           expect(endpoint.get).toHaveBeenCalledWith("/"); 
        });
    });
});