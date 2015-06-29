##Removing a Child Resource from the Data API

**DEPRECATED: Functionally the removeChild action just routes the child resource to the "delete" action.**

To remove a child resource from the Data API, it should be removed via it's parent resource with the `removeChild`
action.

To know what child to remove, the resource key returned in the
[`addChild` resolution](storing.md) is passed in the entity's resource field.

```
var dataApi = client.data();

var removeEntry = { resource: "/shoppingCart/1234" };

dataApi.removeChild('/shoppingCart',{ entity: removeEntry});
```