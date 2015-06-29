##Registering an Intent Handler
When registering an intent handler, two entity properties are used to make choosing a handler easier for the end user:

1.  **label**: A short string noting the widget handling the intent (typically the widget title).
2.  **icon**: A url path to a icon to use for the widget.
    
When a label/icon is not provided, the page title of the widget is used as the label and the icon will default to a
predefined default icon.

```
var intentsApi = client.intents();

var config = {
    "contentType": "application/vnd.ozp-iwc-intent-handler-v1+json",
    "entity": {
        "label": "My JSON Viewer",
        "icon": "https://www.example.com/icon.png"
    }
};

var onInvoke = function(event) {
    var payload = event.entity;
    someWidgetFunction(payload);
};

intentsApi.register("/application/json/view", config, onInvoke);
```
If the registration resource path matches `/{minor}/{major}/{action}` ("/application/json/view") the handler Id will be 
generated automatically and returned in the promise resolution. 

If the registration resource path matches `/{minor}/{major}/{action}/{handlerId}` ("/application/json/view/123") the 
handler Id given will be used. 

The registration promise resolution does not handle the intent invocation, rather reports the status of the registration:
```
{
    "ver": 1,
    "src": "intents.api",
    "msgId": "p:2380",
    "time": 1435690954688,
    "response": "ok",
    "entity": {
        "resource": "/application/json/view/3229d7e2"
    },
    "replyTo": "p:15791",
    "dst": "3de31e8b.a5efe614"
}
```

The `entity.resource` property of the response is the resource that was used for the handler. To unregister simply
delete said resource:
```
intentsApi.delete("/application/json/view/3228d7e2");
```