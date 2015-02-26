##System API
Application registrations of the bus. This api gives connections to the bus awareness of what applications the bus has
knowledge of. Different then the names api, these application's are not the current running applications, rather these
are registrations of where applications are hosted and default configurations for launching them. This gives IWC
clients the capability to launch other applications.

***

###Actions
**get**: Requests the System API to return the resource stored with a specific key.

**list**: Requests the System API to return a list of children keys pertaining to a specific key.

**watch**: Requests the System API to respond any time the resource of the given key changes.

**unwatch**: Requests the System API to stop responding to a specified watch request.

**launch**:Requests the System API to open an instance of the specified application.

***

###Accessing the API
To call functions on the System API, reference `client.system()` on the connected client.

```
var client = new ozpIwc.Client({
    peerUrl: "http://ozone-development.github.io/iwc"
});

client.connect().then(function(){
    var systemApi = client.system();
});
```
