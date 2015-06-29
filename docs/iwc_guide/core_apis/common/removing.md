##Removing a resource from an API
To remove a resource stored in an API the `delete` action is used.

```
var dataApi = client.data();

dataApi.delete('/foo');
```
Deleting a resource that does not exist **is a valid action**. Thus, so long as the API allows deletion of resources 
resolved response would be as follows:

```
{
    "ver": 1,
    "src": "data.api",
    "msgId": "p:3684",
    "time": 1435674349620,
    "response": "ok",
    "replyTo": "p:3660",
    "dst": "c1f6b99e.21851da2"
}
```

**Note:** If the API does not allow deletion of resources, the promise will reject with a response of "noPermission".

```
var namesApi = client.names();

namesApi.delete('/api/names.api').catch(function(err){
    //err.response === "noPermission"
});
```

The value of `err`, the rejected object of the delete request, is formatted as follows:
```
{
  "ver": 1,
  "src": "system.api",
  "msgId": "p:71",
  "time": 1435674505220,
  "response": "noPermission",
  "entity": {
    "ver": 1,
    "src": "c1f6b99e.21851da2",
    "msgId": "p:6748",
    "time": 1435674505218,
    "dst": "system.api",
    "action": "delete",
    "resource": "/a/nonexistant/resource",
    "entity": {}
  },
  "replyTo": "p:6748",
  "dst": "c1f6b99e.21851da2"
}
```
