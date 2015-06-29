## Quick Start
The purpose of this guide is to get a base hosting of the IWC running locally.

Building and Running the Bus (includes a static mock-backend)
--------------
1.  Install node.js.
2.  sudo npm install -g grunt-cli bower
3.  git clone git@github.com:ozone-development/ozp-iwc.git
4.  cd ozp-iwc
5.  git submodule init && git submodule update
6.  npm install && bower install
7. grunt connect-all
8. Browse to http://localhost:14000 for an index of samples and tests.

Connecting a Javascript entity to the Bus
--------------
1. Include the IWC's client library to your html.        
    * **If using bower**: Include the ozp-iwc library to your bower dependencies. Then reference the bower_component 
      file.
        ```
        bower install ozp-iwc --save-dev
        ```
        
        ```
        <script src="<relative pathing for project>/bower_components/ozp-iwc-/dist/js/ozpIwc-client.min.js"></script>
        ```
     
    * **Not using bower**: Copy the library (dist/js/ozpIwc-client.min.js) into your widget's project and refer to it 
      with the script tag.
        ```
        <script src="<relative pathing for project>/ozpIwc-client.min.js"></script>
        ```    
        
2. Create a IWC client
```
   var client = new ozpIwc.Client({ peerUrl: "http://localhost:13000"});
```

3. Test that the client can connect
```
  client.connect().then(function(){
        console.log("IWC Client connected with address:", client.address);
    }).catch(function(err){
        console.log("IWC Client failed to connect:", err);
    });
```

Key-Value capabilities
--------------
1. Storing 
    ```
        var value = {
            size: "medium",
            quantity: 1,
            color: "red"
        };
    
        client.data().set("/t-shirt/Style01",{entity: value});
    ```

2. Retrieving
    ```
       var value;
       
       client.data().get("/t-shirt/Style01").then(function(resp){
           value = resp.entity;
       });
    ```

3. Watching
    ```
        var onChange = function(resp){
            console.log("Old value:", resp.entity.oldValue);
            console.log("New value:", resp.entity.newValue);
        };
        
        client.data().watch("/t-shirt/Style01",onChange);
    ```

Application capabilities
--------------
1. Listing applications registered to the bus
    ```
    var applications;
    
    client.system().get("/application").then(function(resp){
        applications = resp.entity;
    });
    ```

2. Launching an application registered to the bus

    ```
        var application = "/application/1234";
        
        client.system().launch(application);
    ```


Intent capabilities
--------------
1. Registering an intent
    ```
        var intent = "/application/json/print";
        
        var config = {
            entity: {
                type: "/application/json",
                action: "print",
                icon: "printIcon.png",
                label: "Console logs data received from the invoker"
            }
        };
        
        var onInvoke = function(resp){
                console.log("Intent invoked with the following data:", resp.entity);
        };

        client.intents().register(intent, config, onInvoke);
    ```

2. Invoking an intent
    ```
        var intent = "/application/json/print";
        var value = {
            size: "medium",
            quantity: 1,
            color: "red"
        };
            
        client.intents().invoke(intent,value);
    ```
    
3. Broadcasting an intent (all registrants will handle)
    ```
        var intent = "/application/json/print";
        var value = {
            size: "medium",
            quantity: 1,
            color: "red"
        };
            
        client.intents().broadcast(intent,value);
    ```
