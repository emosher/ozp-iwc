##Data API Children Resources
Children resources are JSON objects that relate to a common parent resource. The resource name of the child resource
is arbitrary as it is created at run time, but a link to child is created in the parent resource so actions like
*"Run some function on all children of resource A"* are possible.

***

####An example of children resources: items in a shopping cart

**`/shoppingCart`**: a resource that holds information pertaining to a user's purchase. This is the **parent resource**
and it holds a field `total`, the total of all items in the shopping cart.

**`/shoppingCart/1234`**: a runtime generated resource holding information pertaining an entry in the shopping cart.
Since the entry may contain unique information like `quantity`, `size`, and `color` it does not make sense to make a
hardcoded resource. Rather, letting the IWC create a resource name and link it to `/shoppingCart` creates better
versatility. This, if added as a child, will be a **child resource** of `/shoppingCart`

This structure lets calculating and keeping an update total in `/shoppingCart` simple with minimal coding needed.