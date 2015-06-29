##Storing a Child Resource in the Data API

To add a child resource, the `addChild` action is used on the desired parent resource.

Adding a child to the Data API triggers its parent to keep an up-to-date list of its child resources in its
`collection` property. This means doing a `get` on `/shoppingCart` will return a collection of children in its resources.

Since the resource key of the child is runtime generated, it will be returned in the promise resolution's
`entity.resource` as a string.

```
var dataApi = client.data();

var cartEntry = {
    'price': 10,
    'size': 'M',
    'color': 'red',
    'quantity': 1
};

var cartEntryResource = "";

dataApi.addChild('/shoppingCart',{ entity: cartEntry}).then(function(res){
        cartEntryResource = res.entity.resource;
});
```

In this example, the added child will have a resource similar to `/shopingCart/1234` with `1234` being the random
runtime child key.