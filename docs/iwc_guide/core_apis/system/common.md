##Listing, Storing, Retrieving, Watching Resources in the System API
The System API has all of the **read** actions that the [Data API](../data/overview.md) has. Since this API is
read-only, actions like `set` and `delete` do not apply. Calling these actions is possible, but the client will
receive a rejection response of `badAction` to show that these actions are not possible on the System API.

The `list`, `get`, `watch`, and `unwatch` actions behave in the System API as they do in the
[Data API](../data/overview.md), but the System API does not have children resources.

The `list` action only applies to the root of the API.

***

###Attempting to Store a Resource
As stated above, the System API is limited to read actions. If an attempt to use a write action is made, an error is
thrown.

```
var systemApi = client.system();

var data = { 'title': 'Fake Application'};

systemApi.set('/application/foo', {entity: data}).catch(function(err){
    console.log(err);
});
```

`err` will have the following format:

```
{
"response":"badAction",
"entity":{
    "action":"set",
    "originalRequest":{
        "ver":1,
        "src":"a75ddc86.ebf425e0",
        "msgId":"p:12061",
        "time":1424980467227,
        "dst":"system.api",
        "action":"set",
        "resource":"/application/foo",
        "entity":{
            "title":"Fake Application"
        }
    }
},
"ver":1,
"time":1424980467227,
"replyTo":"p:12061",
"src":"system.api",
"dst":"a75ddc86.ebf425e0",
"msgId":"i:70"
}
```

**response**: `badAction` denotes this action was not permitted

**entity**: The entity of the response will be information about the request. Here it is clear that the action was `set`
and the request was for the `"/application/foo"` resource.