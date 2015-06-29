##Listing API Resources
To obtain a list of all resources in the API, the **list** action is used.

**The list action on the root path returns an array of all of the API's resource keys in it's entity**. This is because
the list action matches any resource that **begins with** the resource provided.

The list action does not create or update a resource, rather finds resources within the API that match the resource 
string provided. 

```
var dataApi = client.data();

dataApi.list("/").then(function(res){
    var dataResources = res.entity;
});
```

The value of `res`, the resolved object of the list request, is formatted as follows:

```
{
    "response":"ok",
    "src":"data.api",
    "dst":"4e31a811.31de4ddb",
    "entity":[
        "/someResource",
        "/pizza",
        "/theme",
        "/parent",
        "/parent/1234",
        "/parent/5678",
    ],
    "ver":1,
    "time":1424897169456,
    "msgId":"i:1397"
    "replyTo":"p:704",
}
```

**entity**: The value of the resource. In this case, the resource is dynamically generated as an array of all resource
names in the api. This means there is no Data API resource that is providing this information, rather it is gathered
when called.

**ver**: The version of the resource. In the case of a list action no individual resource is returned, rather a list of
matches. Because of this, history of the version does not exist so it will always be `1`.
