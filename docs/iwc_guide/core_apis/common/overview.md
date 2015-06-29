##Common Functionality

All APIs have access to the following actions. Some APIs may choose to prevent or modify the behavior of an action.

**get**: Requests the API to return the resource stored with a specific key. (see [Retrieving Resources](retrieving.md))

**bulkGet**: Requests the API to return multiple resources stored with a matching key. (see [Retrieving Resources](retrieving.md))

**set**: Requests the API to store the given resource with the given key. (see [Storing Resources](storing.md))

**list**: Requests the API to return a list of children keys pertaining to a specific key. (see [Listing Resources](listing.md))

**watch**: Requests the API to respond any time the resource of the given key changes. (see [Watching Resources](watching.md))

**unwatch**: Requests the API to stop responding to a specified watch request. (see [Watching Resources](watching.md))

**delete**: Requests the API to remove a given resource. (see [Removing Resources](removing.md))
