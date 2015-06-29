##System API
The System API contains information on applications registered to the IWC bus, as well as the functionality of launching
them. The System API is read only

###Common Actions
All common API actions apply to the System API, but only read actions are permitted.

**get**: Requests the System API to return the resource stored with a specific key.

**bulkGet**: Requests the System API to return multiple resources stored with a matching key.

**set**: Requests the System API to store the given resource with the given key.

**list**: Requests the System API to return a list of children keys pertaining to a specific key.

**watch**: Requests the System API to respond any time the resource of the given key changes.

**unwatch**: Requests the System API to stop responding to a specified watch request.

**delete**: Requests the System API to remove a given resource.


###Additional Actions
**launch**: Opens a desired application. (see [Launching Applications](launching.md))


###System API resource structure
The System API relies on the path-level separation resource scheme to easily separate differences in resources. 

The table below breaks down the differences in each level. The bracket notation is not a literal part of the resource string,
rather an explanation of what that string segment resembles. (ex `/{color}/{size}` signifies the first level of the path
is some color ("blue", "green", ect), and the second level is a size ("small", "medium", ect).

All of the following resources can be gathered as collections using the list action (see 
[Listing Resources](../common/listing.md))

**/system**: Information pertaining to the bus configuration. **Not currently implemented**

**/user**: Read only information pertaining to the current user. **Not currently implemented**

**/application/{id}**: Read only information pertaining to an application registered to the bus.

| Resource                    | Content Type                                      | set | get | delete |
|-----------------------------|---------------------------------------------------|-----|-----|--------|
| /system                     | application/vnd.ozp-iwc-system-v1+json            | no  | yes | no     |
| /user                       | application/vnd.ozp-iwc-user-v1+json              | no  | yes | no     |
| /application/{id}           | application/vnd.ozp-application-v1+json           | no  | yes | no     |

Requesting an action on a resource that does not fit the given resource structure will result in a response of 
"badResource":
```
{
    "ver": 1,
    "src": "system.api",
    "msgId": "p:1233",
    "time": 1435697455893,
    "response": "badResource",
    "entity": {
        "ver": 1,
        "src": "3de31e8b.a5eaa6134",
        "msgId": "p:88546",
        "time": 1435697461811,
        "dst": "system.api",
        "action": "get",
        "resource": "/hello",
        "entity": {}
    },
    "replyTo": "p:88546",
    "dst": "3de31e8b.a5efe614"
}
```

###Why can't I register applications in the System API?
Application registration is meant to be isolated from the IWC. The bus does not care how an application was registered,
it gathers its listings from it's backend. This prevents the IWC from becoming a "application management tool" and 
allows it to function simply as an "application usage tool".

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
