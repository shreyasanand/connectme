# Connect.me
A simple multi-room chat application developed using node.js and twitter bootstrap.

# How to install?
    1) Download and install node.js from www.nodejs.org.
    2) Download and extract the project file zip folder.
    3) Run the database ConnectmeDump.sql file to setup the database.
    4) Open the “app.js” file and update your MySql database username and password in line 49 and 50.
    5) Run a command terminal and navigate to the extracted folder and execute the following commands:  
            npm install 
    6) Once the installation is complete, type the following command in the same command prompt: 
            node app
    7) Go to your browser and open the following link: http:/localhost:3000/ 
    8) The application is ready to use.
    
# How to use?

    1) Click on the Sign-up button and register yourself. 
    2) Once registered, it would redirect you to sign-in with your credentials. 
    3) Once authenticated, you would see the chat homepage.
    4) Towards the right, you can see the available chat rooms.
    5) Click on ‘+’ to create your own chatroom. In the modal, enter a unique chat room name and click on ‘create’.
    6) A chatroom with the name defined by user is created and also added in the chat room list.
    7) ‘Join’ must be clicked to join a chat room.
    8) If any other user has joined the same chat room, a notification is displayed in the same chatroom window. For ex: ‘mary has joined           the room’.
    9) Similarly, if a person has left a chatroom, notification saying user has left the chatroom. For ex: ‘mary has left the room’.
    10)	User can leave a chat room by clicking on the ‘x’ sign on the chat room box.
    11)	User can also simultaneously chat with people in multiple chatrooms.
    12)	‘Logout’ option allows the user to log out of the application. Once the user logs out, he will automatically be logged out from all         of the chat rooms.

# Screenshots

![alt tag](https://raw.github.com/shreyasanand/connectme/master/login.PNG)
![alt tag](https://raw.github.com/shreyasanand/connectme/master/Signup.PNG)
![alt tag](https://raw.github.com/shreyasanand/connectme/master/homepage.PNG)
![alt tag](https://raw.github.com/shreyasanand/connectme/master/createroom.PNG)
![alt tag](https://raw.github.com/shreyasanand/connectme/master/chat.PNG)
![alt tag](https://raw.github.com/shreyasanand/connectme/master/chat1.PNG)
    
# Would you like to see a demo?

I have hosted the application on the cloud using heroku. Here is a link to it : http://thawing-meadow-5786.herokuapp.com/

It was fun developing it. Hope you have fun using it :)


