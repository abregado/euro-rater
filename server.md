

A settings area where the user can put in a Name and an ip address (with port). There is also an export button here which exports their current state as json including their name and a timestamp. There is also an import button to import a json file. There is a check box to have the app try to connect to the server (local/group mode). The default is to start in local mode. These settings need to be saved in local Storage.

Whenever the user makes an update, their new state json is sent to the server address they have entered (if they entered one). We dont do any handshake or confirmation, just send it blindly. If the server does not receive the update, that is ok, it will all be sent again with the next state.

The settings screen also has a button to send their update if they have entered a ip address and name.
The name field defaults to YourName

All of this has to work if the user does not enter an ip address or name, so they can use it locally.

I want to use node and websockets exclusivly for communication. There is no login or authentication.

The server is another web app, this time not a PWA because it will only run on desktop. 

Only server only keeps one copy of each named persons state json. If a new one comes in, then it overrides the last one if the timestamp is more recent.

The server web app shows a combined list of all entries that are in all of the state jsons it currently has. It can display as many emojis as needed. Each emoji is in a pill, and if multiple people have selected the same emoji then a number appears next to the emoji in its pill. The order of the country entries is based on the order they appear in the state jsons. We need some a sorting function for figuring out the final order, because each persons state json will have them placed differently. Higher in the list is "better" or higher rated. I will need suggestions on sorting techniques for this.

The server web app has no interactive components in the list view.

Below the list view is another widget showing the names of all state jsons that it has recieved. There is a trash can icon next to each name, to delete that state json. When this happens, it triggers an update to the country item list.

The server web app should trigger an update to the view every time it receives a new state json or a state json update.

Both of these apps (client/server) will exist in the current repo. The client app should be built and hosted on github pages as we are doing now. The client needs to work locally without server communication, and only send updates to a server if the user enters an IP address.