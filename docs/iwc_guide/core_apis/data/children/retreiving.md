##Retrieving a Child Resource in the Data API

To gather information of child resources, the `get` action is used on the desired parent resource.
```
var dataApi = client.data();
var children = [];

dataApi.get("/shoppingCart").then(function(res){
    children = res.collection;
});
```

Children resources are structurally no different than their parent, so gathering the child resource is a normal `get`
action:
```
dataApi.get("/shoppingCart/1234").then(function(res){

});
```