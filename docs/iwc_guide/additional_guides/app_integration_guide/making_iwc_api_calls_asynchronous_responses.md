###Making IWC Api Calls With expected Asynchronous Responses
Some api calls expect data returned, for example a `get` action. Because of this, the action call returns a promise. This allows operating on asynchronous IWC responses to be as easy as

```
client.data().get("/buz").then(function(response){
    console.log(response);
});
```
Response:
```
{
    foo: "bar" 
}
```

Although, if making `set` and `get` calls one after another, it is not guaranteed that the `set` finishes before the `get`. With the help of promises the order of operations can be enforced:
```
client.data().set("/buz",{
    entity: {
        foo: "bar"
    }
}).then(function(setReply){
    return client.api("data.api").get("/buz");
}).then(function(getReply){
    console.log(getReply.entity);
});
```

Response:
```
{
    foo: "bar" 
}
```
