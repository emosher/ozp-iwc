##Retrieving a Resource from an API
To retrieve a resource stored in an API the `get` action is used. The retrieval is asynchronous, and the response is
passed through the resolution of the action's promise.

```
var dataApi = client.data();

var foo;

dataApi.get('/foo').then(function(res){
        foo = res.entity;
});
```

The value of `res`, the resolved object of the get request, is formatted as follows:

```
{
    "response":"ok",
    "src":"data.api",
    "dst":"4e31a811.31de4ddb",
    "entity":{ 
        "bar": 'buz' 
    },
    "ver":1,
    "time":1424897872164,
    "msgId":"i:33"
    "replyTo":"p:7",
}
```

Requesting a resource that does not exist is not an valid action, this will result in an promise rejection with a
`'noResource'` response and an entity containing the request packet.

```
var dataApi = client.data();

dataApi.get('/a/nonexistant/resource').catch(function(err){
        //err.response === "noResource"
});
```

The value of `err`, the rejected object of the get request, is formatted as follows:

```
{
    "ver": 1,
    "src": "data.api",
    "msgId": "p:686",
    "time": 1435674200150,
    "response": "noResource",
    "entity": {
      "ver": 1,
      "src": "c1f6b99e.21851da2",
      "msgId": "p:692",
      "time": 1435674200148,
      "dst": "data.api",
      "action": "get",
      "resource": "/a/nonexistant/resource",
      "entity": {}
    },
    "replyTo": "p:692",
    "dst": "c1f6b99e.21851da2"
}
```

###Retrieving a collection of resources
In some cases, gathering multiple resources at once is desired. The `bulkGet` action takes a resource path, and returns 
the resource values for all of the API's resources that match.

For example, the Names API has a collection of resources on the various APIs connected to the IWC. These resources are
labeled as `/api/{address}` (/api/data.api, /api/names.api, ...).

```
var namesApi = client.names();
var apiMap = {}
names.bulkGet("/api").then(function(res){
    for(var i in res.entity){
        var resource = res.entity[i].resource;
        var apiEntity = res.entity[i].entity;
        
        apiMap[resource] = apiEntity;
    }
});
```

The value of `res`, the resolved object of the bulkGet request is formatted as follows (omitted entries due to length):
```
{
    "ver": 1,
    "src": "names.api",
    "msgId": "p:119470",
    "time": 1435701118804,
    "contentType": "application/json",
    "entity": [
        {
            "entity": {
                "actions": [
                    "get",
                    "set",
                    "delete",
                    "watch",
                    "unwatch",
                    "list",
                    "bulkGet",
                    "addChild",
                    "removeChild"
                ]
            },
            "lifespan": {
                "type": "Ephemeral"
            },
            "contentType": "application/vnd.ozp-iwc-api-v1+json",
            "permissions": {},
            "eTag": 1,
            "resource": "/api/data.api",
            "collection": []
        },
        {
            "entity": {
                "actions": [
                    "get",
                    "set",
                    "delete",
                    "watch",
                    "unwatch",
                    "list",
                    "bulkGet"
                ]
            },
            "lifespan": {
                "type": "Ephemeral"
            },
            "contentType": "application/vnd.ozp-iwc-api-v1+json",
            "permissions": {},
            "eTag": 1,
            "resource": "/api/names.api",
            "collection": []
        },
        // Omitted additional entries due to size...
    ],
    "response": "ok",
    "replyTo": "p:3370",
    "dst": "abc57c00.e3b19f7f"
}
```

The resulting `apiMap` variable would look as so:
```
{
    "/api/data.api": {
        "actions": [
            "get",
            "set",
            "delete",
            "watch",
            "unwatch",
            "list",
            "bulkGet",
            "addChild",
            "removeChild"
        ]
    },
    "/api/names.api": {
        "actions": [
            "get",
            "set",
            "delete",
            "watch",
            "unwatch",
            "list",
            "bulkGet"
        ]
    },
    // Omitted additional entries due to size...
}

```