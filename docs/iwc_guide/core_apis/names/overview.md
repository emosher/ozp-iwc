##Names API
Status of the bus. This api exposes information regarding applications connected to the bus.

***

###Actions
**get**: Requests the Names API to return the resource stored with a specific key.

**set**: Requests the Names API to store the given resource with the given key.

**list**: Requests the Names API to return a list of children keys pertaining to a specific key.

**watch**: Requests the Names API to respond any time the resource of the given key changes.

**unwatch**: Requests the Names API to stop responding to a specified watch request.

**delete**:Requests the Names API to remove a given resource.

***

###Accessing the API
To call functions on the Names API, reference `client.names()` on the connected client.

```
var client = new ozpIwc.Client({
    peerUrl: "http://ozone-development.github.io/iwc"
});

client.connect().then(function(){
    var namesApi = client.names();
});
```
