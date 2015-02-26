##User Information in the System API
The System API dedicates the `/user` resource for any information desired from the current user's account information.
Since applications are presented to the System API based on the user's account, this presents capabilities for
applications to present a more personalized UI.

***

###Retrieving User Information
To retrieve information on the current user, the `get` action is used on the `/user` resource of the System API.

```
var systemApi = client.system();

systemApi.get('/user').then(function(res){
    console.log(res);
});
```

The `entity` of the response `res` is of the `application/vnd.ozp-profile-v1+json` format:

```
{
    "createdDate": "2015-02-26T16:00:21.000+0000",
    "email": "johns@test.org",
    "bio": "",
    "lastLogin": "2015-02-26T20:08:47.000+0000",
    "highestRole": "USER",
    "launchInWebtop": false,
    "organizations": [],
    "stewardedOrganizations": [],
    "id": 57,
    "displayName": "John",
    "username": "johns",
    "contentType": "application/vnd.ozp-profile-v1+json"
}
```

***

###Example: Getting the User's Display Name
In some applications, the user's name may be desired. For example, with a notification, a developer may want the
notification to be more personable than *"Reminder to submit work."* with something like
*"John, remember to submit your work."*

```
var getDisplayName = function() {
    var systemApi = client.system();

    if(this.displayName){
        return Promise.resolve(this.displayName);
    } else {
        return systemApi.get('/user').then(function(res){
            var userData = res.entity;
            this.displayName = userData.displayName;
            return this.displayName;
        });
    }
};

getDisplayName().then(function(name){
    console.log(name + ', remember to submit your work.');
});
```

In this example, after the first retrieval the displayName is cached in `getDisplayName` so that requests aren't made
every time there after.

This is not limited to just the display name, this example could be scaled to store a cache of any user information
available, but for demonstrative purposes just this one parameter was used.
