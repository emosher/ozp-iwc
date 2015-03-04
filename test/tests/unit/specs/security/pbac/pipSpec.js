describe("Policy Information Point",function() {

    var pip;

    beforeEach(function(){

        spyOn(ozpIwc.util,"ajax").and.callFake(function(){
            return Promise.resolve({
                'nonCachedExample:val1': ["serverLoadedVal"]
            });
        });
        pip = new ozpIwc.policyAuth.PIP({
            attributes : {
                'ozp:attributeCollection:fake': {
                    'ozp:val1': ["fakeVal"],
                    'ozp:val2': ["otherFakeVal"]
                }
            }
        });
        jasmine.getGlobal().setTimeout = function (funcToCall, millis) {
            funcToCall();
        };
    });

    afterEach(function() {
        jasmine.getGlobal().setTimeout = window.setTimeout;
    });

    it("returns an attribute from the cache if possible",function(){
        pip.getAttributes('ozp:attributeCollection:fake')
            .success(function(attr){
                expect(attr).toEqual(pip.attributes['ozp:attributeCollection:fake']);
            });
    });

    it('sends a request to the attributes URI/URN to gather attributes not in the cache',function(done){
        pip.getAttributes('ozp:attributeCollection:NOTINCACHE')
            .success(function(attr){
                expect(attr).toEqual({
                    'nonCachedExample:val1': ["serverLoadedVal"]
                });
                done();
        });
    });

    it('grants Attributes to an existing attributeId',function(){
        pip.grantAttributes('ozp:attributeCollection:fake',{
                'ozp:fake1' : 'newVal',
                'ozp:fake2' : 'newVal2'
            });
        expect(pip.attributes['ozp:attributeCollection:fake']).toEqual({
            'ozp:fake1': ['newVal'],
            'ozp:fake2': ['newVal2']
        });
    });

    it('grants Attributes to a non existing attributeId ',function(){
        pip.grantAttributes('ozp:attributeCollection:fake2',{
                'ozp:fake1' : 'newVal',
                'ozp:fake2' : 'newVal2'
        });
        expect(pip.attributes['ozp:attributeCollection:fake2']).toEqual({
                'ozp:fake1' : ['newVal'],
                'ozp:fake2' : ['newVal2']
        });
    });

    it('grants Attributes from a parent to an existing attributeId',function(){
        pip.attributes['ozp:attributeCollection:parent'] = {
            'ozp:fake1' : ['newVal'],
            'ozp:fake2' : ['newVal2']
        };

        pip.grantParent('ozp:attributeCollection:fake','ozp:attributeCollection:parent')
            .success(function(){
                expect(pip.attributes['ozp:attributeCollection:fake']).toEqual({
                    'ozp:val1': ["fakeVal"],
                    'ozp:val2': ["otherFakeVal"],
                    'ozp:fake1' : ['newVal'],
                    'ozp:fake2' : ['newVal2']
                });
            });
    });

    it('grants Attributes from a parent to a non existing attributeId',function(){
        pip.grantAttributes('ozp:attributeCollection:parent', {
            'ozp:val1': "fakeVal",
            'ozp:val2': "otherFakeVal"
        });

        pip.grantParent('ozp:attributeCollection:fake2','ozp:attributeCollection:parent');


        expect(pip.attributes['ozp:attributeCollection:fake2']).toEqual({
            'ozp:val1': ["fakeVal"],
            'ozp:val2': ["otherFakeVal"]
        });
    });

});