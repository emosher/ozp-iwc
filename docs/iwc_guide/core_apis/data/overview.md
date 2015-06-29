##Data Api
A simple key/value JSON store for sharing common resources amongst applications. Persists creation, updates, and 
deletions to its endpoint.

***

###Common Actions
All common API actions apply to the Data API, one behavioural difference is resource creation, updates, and deletions
are persisted.

**get**: Requests the Data API to return the resource stored with a specific key.

**bulkGet**: Requests the Data API to return multiple resources stored with a matching key.

**set**: Requests the Data API to store the given resource with the given key.

**list**: Requests the Data API to return a list of children keys pertaining to a specific key.

**watch**: Requests the Data API to respond any time the resource of the given key changes.

**unwatch**: Requests the Data API to stop responding to a specified watch request.

**delete**: Requests the Data API to remove a given resource.

###Additional Actions
Additional actions for the Data API pertain to the the concept of children nodes. Refer to 
[Children Resources](children/overview.md) for further information.

**addChild**: Requests the Data API to create a resource below the resource provided. If a resource has children added
to it, it will begin updating its `collection` property with said children resources.

**removeChild**: Requests the Data API to remove the child resource. **deprecated**: Functionally uses delete action. 

***

###Accessing the API
To call functions on the Data API, reference `client.data()` on the connected client.

```
var client = new ozpIwc.Client({
    peerUrl: "http://ozone-development.github.io/iwc"
});

client.connect().then(function(){
    var dataApi = client.data();
});
```
