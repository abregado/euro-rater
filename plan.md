we are making a progressive web app using html, css and vanilla typescript. We will use as few dependancies as possible. The web app will be hosted on github pages using github actions. 

The app has two screens. 

List Screen
One shows a list of country entries. Each country entry has a country name, a song name, an artist name, and a grab handle on the left so they can be dragged to change their ordering. On the right side of the country item is a button to open an edit screen.

The list starts empty. At the top of the list, there is a button which opens a dialog so the user can select which country prototype to add. Each prototype can only be added to the list once. Once all prototypes have been added, the button no longer displays. The prototypes are configuarble in a config file at compile time. Add a single prototype to the config file for me and I will fill out the rest.

The state updates  during dragging to preview what the new order will be when the drag is dropped.

On mobile, controls are with touch. On desktop, with mouse. Both inputs need to work.

The state of the list will be saved after every move to local storage.

Edit Screen
Here the contry entry details are at the top. Underneath are a set of number fields and a long form text area. The number fields are for different ratings. The ratings are configurable in a config file that is read at compile time. Add a single rating type to the config file and i will add the rest later.

At the top right, there is a button to save and close the edit screen and go back to the list screen.

The app only supports a portrait aspect ratio. On Desktop, have the app floating in the center of the browser window horizontally using a container.

The style should be colorful and a little garish, since this is for the Eurovision song contest. Maybe some 90's geocities homepage vibes could work here.

We need to be able to test it locally. Tell me how to do that.

Also make an appropriate gitignore. I will init the repo after you are done and push it to git hub to test. 

Produce a CLAUDE.md file explaining the project to yourself in the least amount of words possible. There is no need to include detailed implimentation details here.

