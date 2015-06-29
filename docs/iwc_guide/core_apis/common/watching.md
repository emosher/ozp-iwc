##Watching a resource in an API
To watch a resource stored in an API for changes, the **watch** action is used.

the promise resolves when a response to the request is handled, **not when a change has occurred**.

The onChange callback is called whenever there is a change in the resource.

```
var dataApi = client.data();

var onChange = function(reply,done){
    var newVal = reply.entity.newValue;
    var oldVal = reply.entity.oldValue;

    var doneCondition = { 'foo': 1 };

    if(newVal === doneCondition){
        done();
    }

};

dataApi.watch('/foo',onChange);
```

***

The value of the onChange callback's `reply` argument varies from a normal response (see 
[Receiving Responses](getting_started/api/api_responses.md)):

```
{
    "dst":"20c0f063.b80a890a",
    "src":"data.api",
    "replyTo":"p:1856",
    "response":"changed",
    "resource":"/foo",
    "entity":{
        "newValue":{"bar":"bark"},
        "oldValue":{"bar":"buz"},
        "newCollection":[],
        "oldCollection":[]
    },
    "ver":1,
    "msgId":"i:3761",
    "time":1424901227419
}
```

**response**: The reply's response will not be `"ok"` like a request's response, rather a `"changed"` will denote the
value has changed.

**entity**: The entity of the reply is not value stored in the resource, rather a report of the change in state of the resource.

**entity.newValue**: The new value of the resource.

**entity.oldValue**: The old value of the resource.

**entity.newCollection**: new collection resources that start with the watched resources pattern. This will be an empty
array if the resource does not have a pattern. (see  [Storing Resources](core_apis/common/storing.md) for information on
setting the resources pattern).

**entity.oldCollection**: old collection resources that start with the watched resources pattern. This will be an empty
array if the resource does not have a pattern.


###Collection
The collection field of a resource defaults to only updating if the following are true:

1.  The resource has a `pattern` property.
2.  The resource is being watched by some connection on the bus.
    
The collection field will continue to update so long as both conditions are true. Some APIs may choose to update 
certain resources based on their own criteria. In these cases, sufficient documentation should be provided to denote 
when and how a resources collection updates.

###Stoping a watch
To stop watching the resource based on its state, calling the `done()` function passed to the callback will remove
 the watch.

###Stopping a watch external to its callback
In some cases, stopping a watch may be desired outside of the onChange callback. For this reason, there is the `unwatch`
action. When registering a watch, 2 important properties are returned in the resolution:

1.  **dst**: the participant that sent the request
2.  **replyTo**: the packet that was sent to create the watch

With these 2 properties, the watch can be unregistered using `unwatch` as so:
```
var watchData = {
    src: null,
    msgId: null
};

dataApi.watch('/foo',onChange).then(function(res){
    watchData.src = res.dst;
    watchData.msgId = res.replyTo;
    
});

// Somewhere else after the watch resolution occurs
dataApi.unwatch('/foo',watchData);
```


###Watching a resource that does not exist
When registering a watch on a non-existant resource, the promise resolution will return as follows:
```
{
  "ver": 1,
  "src": "data.api",
  "msgId": "p:410",
  "time": 1435676177310,
  "response": "ok",
  "replyTo": "p:39925",
  "dst": "c1f6b99e.21851da2"
}
```

###Watching a resource that already exists
When registering a watch on an existing resource, the promise resolution will be that of a `get` action:
```
{
  "ver": 1,
  "src": "data.api",
  "msgId": "p:41758",
  "time": 1435676337690,
  "lifespan": {
    "type": "Persistent"
  },
  "permissions": {},
  "eTag": 3,
  "resource": "/balls",
  "pattern": "/balls/",
  "collection": [
    "/balls/63abb1f0",
    "/balls/a650bb08"
  ],
  "entity": {
      "foo": "bar"
  },
  "response": "ok",
  "replyTo": "p:41340",
  "dst": "c1f6b99e.21851da2"
}
```


###Watching a resource that gets deleted
When a resource that is being watched gets deleted, the watchers of said resource receive a change notification 
indicating the deletion.

```
{
    "ver": 1,
    "src": "cd78b1cf.21851da2",
    "msgId": "p:44993",
    "time": 1435676498955,
    "dst": "c1f6b99e.21851da2",
    "replyTo": "p:41340",
    "response": "changed",
    "resource": "/balls",
    "permissions": {},
    "entity": {
        "newValue": null,
        "OldValue":{
            "foo": "bar"
        },
        "oldCollection": [
            "/balls/63abb1f0",
            "/balls/a650bb08"
        ],
        "newCollection": null,
        "deleted": true
    }
}
```

The value of `entity.deleted` will be marked true to indicate the resource has been deleted. The watch will remain active
regardless of deletion and notify if it is recreated. If removing a watch on deletion of a resource is desired, applying
conditional logic for the `done()` flag based on `entity.deleted` can produce this functionality.