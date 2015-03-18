###Making IWC Api Calls With Expected Recurring Asynchronous Responses
Some api actions will respond periodically. An example is a `watch` action. A watch action in the `data.api` receives notification whenever the resource being watched changes. To print out anytime `/buz` changes would look like so:
```
client.data().watch("/buz",function(reply){
    console.log(reply)
});
```

The deference between this implementation and the promise response above is actions that only expect a singular callback fall into the promise style.

This callback function style is used because the desired functionality may be to watch a resource forever.

To end receiving expected recurring responses a `done()` flag is called (much like in Jasmine tests)
```
client.data().watch("/buz".function(reply,done){
    console.log(reply);
    if(reply.newValue === { foo : "oof"}){
        done();
    }
});
```
