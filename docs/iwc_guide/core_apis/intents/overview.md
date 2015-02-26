##Intents API
An API for handling for application intents. Follows the idea of android intents. Allows applications to register to
handle certain intents (ex. graphing data, displaying HTML). Like android, the IWC Intents api presents the user with
a dialog to choose what application should handle their request.

***

###Actions
**get**: Requests the Intents API to return the resource stored with a specific key.

**set**: Requests the Intents API to store the given resource with the given key.

**list**: Requests the Intents API to return a list of children keys pertaining to a specific key.

**watch**: Requests the Intents API to respond any time the resource of the given key changes.

**unwatch**: Requests the Intents API to stop responding to a specified watch request.

**register**: Requests the Intents API to register the given client to handle the given type of intent with the specified callback.

**invoke**:Requests the Intents API to invoke the given intent type from the client. Another client will consume the invocation.

**broadcast**:Requests the Intents API to invoke the given intent type from the client. ALl clients registered for this intent type will consume the invocation.

**delete**:Requests the Intents API to remove a given resource.

***

###Accessing the API
To call functions on the Intents API, reference `client.intents()` on the connected client.

```
var client = new ozpIwc.Client({
    peerUrl: "http://ozone-development.github.io/iwc"
});

client.connect().then(function(){
    var intentsApi = client.intents();
});
```
