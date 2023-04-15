# Instagram Clone Backend 

This is the Express backend for [Instapost Frontend](https://github.com/pasha-log/capstone2-frontend).

## Database Schema 

[DDL](https://drive.google.com/file/d/1PqLgji3S31GIKA6EGZa5SwTGlfmEwrVI/view?usp=sharing)

## Tools used: 

* Application skeleton: [Express Generator](https://www.npmjs.com/package/express-generator)
* RDBMS: [Postgresql](https://www.postgresql.org/)
* Authentication/validation: [bcrypt](https://en.wikipedia.org/wiki/Bcrypt), [JSON Web Token](https://jwt.io/), [JSON Schema](https://json-schema.org/)
* Image file data marshaling: [AWS SDK](https://aws.amazon.com/sdk-for-javascript/)
* Storage engine for AWS S3: [Multer S3](https://www.npmjs.com/package/multer-s3)
* Auto-update utility: [Nodemon](https://www.npmjs.com/package/nodemon)
* Logger middleware: [Morgan](https://www.npmjs.com/package/morgan)
* Cross-origin resource sharing: [CORS](https://www.npmjs.com/package/cors)
* Terminal styling: [Colors](https://www.npmjs.com/package/colors) 
* Testing framework: [Jest](https://www.npmjs.com/package/jest)
* HTTP server testing: [SuperTest](https://www.npmjs.com/package/supertest)

## Getting started

Install all dependencies with `npm i`  
The project uses PostgreSQL as its RDBMS.  
Make sure to create and seed databases with this command: 

    psql < instapost.sql 

To run this project:
    
    nodemon server.js

This will start the API server on `localhost:3001/`

To run the tests (make sure [jest](https://www.npmjs.com/package/jest) is installed, it is not listed as a dependency):

    jest -i

The entirety of this project is a RESTFUL JSON API.

## Routes

### /auth

Authorization and authentication is performed using JSON Web Tokens. Send your JWT as bearer tokens in the authorization header of all of your requests sent to the API.

#### POST /auth/register

This route is used for creating new users in the database, and is validated with JSON schema. Include the following in the payload of your POST request, all fields are required:
``` json
{
    "username": "string, max 30 chars",
    "password": "string, min 5 chars, max 20 chars",
    "fullName": "string, max 30 chars",
    "email": "string, email format, min 6 chars, max 60 chars"
}
```
Other pieces of data like bio and profileImageURL can be updated with the PATCH /:username request. 

This will create a new entry in the users table of the database, with a hashed and salted password. The server will respond with the auth token for the newly registered user.

#### POST /auth/token

This route is used to get another auth token. Send the username and password of the user you want to authenticate as in your request payload. If the credentials are valid, the server will respond with an auth token.
``` json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtc2ciOiJjb25ncmF0dWxhdGlvbnMiLCJob3dldmVyIjoibm90IGEgdmVyeSByZXdhcmRpbmcgc2VjcmV0LCBpcyBpdD8ifQ.PpjeIMk-mILsVOG-eLDcgmrmkXyNTnXRt01bFMfbtSU" }
```

<hr>

### /users

Routes corresponding with user activity in the database.

#### GET /users/:username
##### Auth Required: Same User as :username
This endpoint will respond with all the user's info in the database, with the following format:
``` json
{
    "user": 
        {
            "username": "johnny_doe_",
            "fullName": "John Doe",
            "email": "john.doe@gmail.com",
            "profileImageURL": "https://randomuser.me/api/portraits/lego/3.jpg",
            "bio": "One in the hand is worth two in the bush", 
            "posts": [{
                "postId": 23,
                "postURL": "https://randomuser.me/api/portraits/lego/3.jpg",
                "caption": "Just me",
                "watermark": "The John Foe",
                "filter": "grayscale(100%)",
                "createdAt": "2023-04-02 14:39:38.975684"
            }, ... ],
            "postLikes": [{
                "postId": 6,
                "username": "johnny_doe_",
                "postURL": "https://randomuser.me/api/portraits/lego/3.jpg",
                "caption": "Oh yeah, look at me",
                "watermark": null,
                "filter": null,
                "createdAt": "2023-04-02 14:23:50.695016"
            }, ... ],
            "following": [{
                "username": "shelby_sherlock",
                "fullName": "Shelby Sherlock",
                "profileImageURL": "https://randomuser.me/api/portraits/lego/3.jpg"
            }, ... ],
            "followers": [{
                "username": "shelby_sherlock",
                "fullName": "Shelby Sherlock",
                "profileImageURL": "https://randomuser.me/api/portraits/lego/3.jpg"
            }, ... ] 
        }
}
```


#### GET /users/
You can filter your results by passing parameters to the query string. The following parameter is available:
- name: User must have this string appearing somewhere in its `username` or `fullName`, case insensitive.

E.g. `users/user?name=pas` will return a list of all users where `"pas"` appears somwhere in their `username` or `fullName`.

#### POST /users/upload
##### Auth Required: None
This endpoint will send an image file to an Amazon S3 bucket and send an resultant object with the status of success. This is done with the Multer middleware.
E.g. you send a file to this route:
```json
{
    "lastModified": 1679602398563,
    "lastModifiedDate": "Thu Mar 23 2023 13:13:18 GMT-0700 (Pacific Daylight Time)",
    "name": "unnamed2.jpg",
    "size": 1357832,
    "type": "image/jpeg",
    "webkitRelativePath": ""
}
```
The result:
```json
{
    "result": {
        "Bucket": "instagram-clone-photo",
        "ETag": "\"e7bf6f55e9131832bb8f9051729fe8a3\"",
        "Key": "uploads/4e708a55-7d23-46d1-a23d-1bbe9c5a6589-unnamed2.jpg",
        "Location": "https://instagram-clone-photo.s3.us-west-1.amazonaws.com/uploads/4e708a55-7d23-46d1-a23d-1bbe9c5a6589-unnamed2.jpg",
        "ServerSideEncryption": "AES256",
        "key": "uploads/4e708a55-7d23-46d1-a23d-1bbe9c5a6589-unnamed2.jpg",
        }, 
    "status": "success"
}
```

#### POST /users/create
##### Auth Required: Must be a user logged in
Creates a new entry in the posts table of the database. Include the data matching the following schema in the payload of your request, `username` and `postURL`are required. `caption`, `watermark`, `watermarkFont`, and `filter` are optional:
```json
{
    "username": "johnny_doe_", 
    "caption": "Just me and my girl",
    "watermark": "The John Foe",
    "watermarkFont": "sans serif",
    "filter": null,
    "postURL": "https://instagram-clone-photo.s3.us-west-1.amazonaws.com/uploads/4e708a55-7d23-46d1-a23d-1bbe9c5a6589-unnamed2.jpg"
}
```

#### GET /users/comments/:postId
##### Auth Required: Must be a user logged in
Get all the comments for a single post. Include the `postId` as a parameter and you'll receive the following:
```json
{
    "comments": [
        {
            "commentId": 3,
            "parentId": null,
            "message": "Wow! What a great post, John.", 
            "username": "shelby_sherlock",
            "createdAt": "2023-04-02 14:23:50.695016",
            "numLikes": "3",
            "children": [{"commentId": ...}, ...]
        },
        ...
    ]
}
```
If there are replies to a comment and replies to *that* comment as well, there will be an array of `children` for that comment. Each top level comment would have a `parentId` of null.

#### POST /users/comment
##### Auth Required: Must be a user logged in
To create a comment on a post, provide the following inputs: 
```json
{
    "username": "johnny_doe_",
    "postId": 5,
    "parentId": 2, 
    "message": "I don't know if that's true, Barbara." 
}
```
To signify that a comment is a reply, enter a `parentId` to reference the commentId being replied to. Otherwise, just leave it null. 

<hr>

#### POST /users/follow and /users/unfollow
##### Auth Required: Must be a user logged in
To either follow another user or unfollow, you must provide the following respectively:
```json
{
    "usernameFollowing": "johnny_doe_",
    "usernameBeingFollowed": "Shelby_Sherlock"
}
```
```json
{
    "usernameUnfollowing": "johnny_doe_",
    "usernameBeingUnfollowed": "Shelby_Sherlock"
}
```

#### GET /users/:username/followerPosts
##### Auth Required: Must be a user logged in
Will respond with a the posts from users that the provided `username` follows:
```json
{
    "users": [{
        "username": "shelby_sherlock",
        "profileImageURL": "https://randomuser.me/api/portraits/lego/3.jpg",
        "posts": [{
            "postId": 88,
            "postURL": "https://instagram-clone-photo.s3.us-west-1.amazonaws.com/uploads/4e708a55-7d23-46d1-a23d-1bbe9c5a6589-unnamed2.jpg",
            "caption": "Hallelujah",
            "createdAt": "2023-04-02 14:23:50.695016"
        }, ...]
    }, ...]
}
```

#### POST /users/like and /users/unlike
##### Auth Required: Must be a user logged in
Must provide `username`, `commentOrPostId`, and `likeType` to like or unlike either a post or a comment. E.g.:
```json
{
    "username": "Johnny_Doe_",
    "commentOrPostId": 3,
    "likeType": "post"
}
```

#### PATCH /users/:username
##### Auth required: Must be a user logged in and match with the username parameter
Provide any of the following data to be updated: 
```json 
{
    "profileImageURL": "https://randomuser.me/api/portraits/lego/3.jpg",
	"fullName": "John Doe",
	"username": "theJohnDoe",
	"bio": "Oh yeaaaah",
	"email": "john.doe@gmail.com"
}
```

