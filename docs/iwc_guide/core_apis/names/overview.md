##Names Api
Status of the bus. This api exposes information regarding applications connected to the bus. This is a read-only API.

***

###Common Actions
All common API actions apply to the Names API, but only read actions are permitted.

**get**: Requests the Names API to return the resource stored with a specific key.

**bulkGet**: Requests the Names API to return multiple resources stored with a matching key.

**set**: Requests the Names API to store the given resource with the given key.

**list**: Requests the Names API to return a list of children keys pertaining to a specific key.

**watch**: Requests the Names API to respond any time the resource of the given key changes.

**unwatch**: Requests the Names API to stop responding to a specified watch request.

**delete**: Requests the Names API to remove a given resource.

###Names API resource structure
The Names API relies on the path-level separation resource scheme to easily separate differences in resources. 

The table below breaks down the differences in each level. The bracket notation is not a literal part of the resource string,
rather an explanation of what that string segment resembles. (ex `/{color}/{size}` signifies the first level of the path
is some color ("blue", "green", ect), and the second level is a size ("small", "medium", ect).

All of the following resources can be gathered as collections using the list action (see 
[Listing Resources](../common/listing.md))

**/api/{address}**: An API on the bus. Contains an array of actions pertaining to the API.

**/address/{address}**: A connection to the bus. All components of the IWC bus have an assigned address. Contains 
information on the component assigned to the address.

**/multicast/{group}/{member}**: A group-specific multicast member. Multicast messages are distributed to all members 
of the group (internal messaging not client messaging). Contains information on the component assigned to the address.

**/router/{address}**: A router connected to the IWC bus. Each window has a router to distribute messages amongst its
participants. Contains information on its participants.

| Resource                    | Content Type                                      | set | get | delete |
|-----------------------------|---------------------------------------------------|-----|-----|--------|
| /api/{address}              | application/vnd.ozp-iwc-api-v1+json               | no  | yes | no     |
| /address/{address}          | application/vnd.ozp-iwc-address-v1+json           | no  | yes | no     |
| /multicast/{group}/{member} | application/vnd.ozp-iwc-multicast-address-v1+json | no  | yes | no     |
| /router/{address}           | application/vnd.ozp-iwc-router-v1+json            | no  | yes | no     |

Requesting an action on a resource that does not fit the given resource structure will result in a response of 
"badResource":
```
{
    "ver": 1,
    "src": "names.api",
    "msgId": "p:95269",
    "time": 1435697461893,
    "response": "badResource",
    "entity": {
        "ver": 1,
        "src": "3de31e8b.a5efe614",
        "msgId": "p:88546",
        "time": 1435697461811,
        "dst": "names.api",
        "action": "get",
        "resource": "/hello",
        "entity": {}
    },
    "replyTo": "p:88546",
    "dst": "3de31e8b.a5efe614"
}
```

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
