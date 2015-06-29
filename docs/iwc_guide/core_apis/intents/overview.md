##Intents Api
An intent module for applications to share working features amongst one another, modeled after Android intents.

Aside from creating, updating, and deleting intent handler registrations the Intents API acts as a read only API.
It contains state machines internal to the bus to drive the handling of intents. Rather than acting as a key/value 
store, this API returns data on read requests catered to the type of resource it is requesting. This allows a simplistic
client interface.
***

###Common Actions
The following common Actions apply to the Intents API. Note that some actions have resource specific behavior covered below.

**get**: Requests the Intents API to return the resource stored with a specific key.

**bulkGet**: Requests the Intents API to return multiple resources stored with a matching key.

**set**: Requests the Intents API to store the given resource with the given key.

**list**: Requests the Intents API to return a list of children keys pertaining to a specific key.

**watch**: Requests the Intents API to respond any time the resource of the given key changes.

**unwatch**: Requests the Intents API to stop responding to a specified watch request.

**delete**: Requests the IntentsAPI to remove a given resource.

###Additional Actions
**register**: Registers a handler resource for an intent.

**invoke**: Sends out data to be handled by a desired intent. The intent chooser will be displayed if multiple options
are available.

**broadcast**: Sounds out data to be handled by all registered handlers for a desired intent.

***

###Intents API resource structure
The Intents API relies on the path-level separation resource scheme to easily separate differences in resources. 

The table below breaks down the differences in each level. The bracket notation is not a literal part of the resource 
string, rather an explanation of what that string segment resembles. (ex `/{color}/{size}` signifies the first level of 
the path is some color ("blue", "green", ect), and the second level is a size ("small", "medium", ect).

**/{major}/{minor}**: A content type grouping of intent actions. For example, 
`/application/vnd.ozp-iwc-launch-data-v1+json` would be the root path to all intent actions pertaining launch data.

**/{major/{minor}/{action}**: An intent definition for a certain content type. For example, 
`/application/vnd.ozp-iwc-launch-data-v1+json/run` would be an invokable intent for running an application. This path is
also the root path for all of its registered handlers. **Invoking a definition will drive the user to choose a handler 
preference if more than one is available**.

**/{major/{minor}/{action}/{handlerId}**: A registered handler for an intent. For example, 
`/application/vnd.ozp-iwc-launch-data-v1+json/run/1234` would be an invokable intent for running an application. 
**Invoking a registered handler will trigger the callback on the client that registered**.

**/inFlightIntent/{id}**: Internal state machine resources. used by the client library to report on the status of an 
intent being handled. Not intended for use by widgets.


| Resource                              | Content Type                                   | set | get  | delete | register | invoke | broadcast |
|---------------------------------------|------------------------------------------------|-----|------|--------|----------|--------|-----------|
| /{major}/{minor}                      |                                                | no  | yes* | no     | no       | no     | no        |
| /{major}/{minor}/{action}             |                                                | no  | yes  | yes    | yes      | yes    | yes       |
| /{major}/{minor}/{action}/{handlerId} | application/vnd.ozp-iwc-intent-handler-v1+json | yes | yes  | yes    | yes      | yes    | no        |
| /inFlightIntent/{id}                  |                                                | yes | yes  | yes    | no       | no     | no        |

Requesting an action on a resource that does not fit the given resource structure will result in a response of 
"badResource":
```
{
    "ver": 1,
    "src": "intents.api",
    "msgId": "p:1033",
    "time": 1435685026449,
    "response": "badResource",
    "entity": {
        "ver": 1,
        "src": "3de31e8b.a5efe614",
        "msgId": "p:867",
        "time": 1435685026438,
        "dst": "intents.api",
        "action": "get",
        "resource": "/foo",
        "entity": {}
    },
    "replyTo": "p:867",
    "dst": "3de31e8b.a5efe614"
}

```
**/{major}/{minor}**: requesting a get of this path will return all actions available to that content type.

For information on registering and invoking intents see [Intent Registrations](registration.md) and 
[Intent Invocations](invocation.md).

***

###Accessing the API
To call functions on the Data API, reference `client.intents()` on the connected client.

```
var client = new ozpIwc.Client({
    peerUrl: "http://ozone-development.github.io/iwc"
});

client.connect().then(function(){
    var intentsApi = client.intents();
});
```
