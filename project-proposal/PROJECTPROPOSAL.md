# Project Proposal  

The objective is to create an Instagram clone with nearly identical UI and a few particular features of the original Instagram (i.e., uploading and sharing photos, liking and commenting on posts) but lacking lots of its latest features (stories, reels, explore page, direct messaging, live). 

## The Desktop Version: 

#### Login Landing Page

<img src='./project-proposal-photos/Screenshot (119).png' alt=''>

* Landing page with login/signup should be almost identical, only without the automatic sign-in (continue as grammarcommie). I will figure out how to use a picture of a phone with screenshots of the app that changes every couple of seconds in a loop. Everything that won't be included on this page: (change of language, the entire bottom nav bar, options to download from Google Play or Microsoft). Those features are for a real application, not a clone.

#### Homepage 

<img src='./project-proposal-photos/Screenshot (110).png' alt=''>

* No stories (that would be a complex feature I'd implement in the future, but for now just sharing photos will do which is how the original instagram used to be).
* Double tapping for liking photo (one of the defining features of Instagram).
* No save buttons (I think having likes in your profile settings is enough for "saving" things you like)
* Home, profile search, notifications, create, and profile button on the left side. No explore page because it could require extra attention and wouldn't be necessary because of the lack of users. Should there be suggestions of profiles on the right side?
* There won't be a messaging feature, although in the future that could be an option. 
* Like comments and comment on comments

#### Creating a Post Userflow

<img src='./project-proposal-photos/Screenshot (107).png' alt=''>

* Adding a photo would involve accessing computer's files on the desktop version.

<img src='./project-proposal-photos/Screenshot (114).png' alt=''>

* When adding a photo, maybe figure out how to crop a photo? Add more than one photo? Or automatically adjust to show the full photo would probably be the easiest?

<img src='./project-proposal-photos/Screenshot (115).png' alt=''>

* Maybe figure out how to add a few basic filters? Black & white, lark, slumber e.g.

<img src='./project-proposal-photos/Screenshot (116).png' alt=''>

* We can tag people, but I would have to figure out how to tag someone on any part of the photo and stay as a label. A simpler version could just be a search bar, where you can click on a user which will automatically show that user's @ as a link in the caption. 
* I probably won't add location because that would involve more work like implementing a Google maps feature. And no "Accessibility" or "Advanced settings".

<img src='./project-proposal-photos/Screenshot (117).png' alt=''>

* Backing back out of the post creation mode would ask to discard photo. I can also do this by clicking anywhere outside of the photo adding part, or clicking on the X top right.

#### Profile Page

<img src='./project-proposal-photos/Screenshot (111).png' alt=''>

* Hovering on photo on profile would show amount of likes and comments the post has.
* There should be an edit profile button - can edit name, username, bio, email (gender, phone number, and website don't seem necessary to me on this simple version).   
* Profile should show number of followers, posts, and follows. 
* Hovering on profile photo should be able to show that you can click and edit. When clicked on, you can remove or upload new photo. 

<img src='./project-proposal-photos/Screenshot (112).png' alt=''>

* Personal profile feed would look different from this. I wouldn't have the comments be on the side (it makes more sense to me to have everything vertical like the mobile version so responsiveness would be easier to implement). 

## Mobile Version:  

* Navigation bar would be on bottom (home, search, create, and profile button).
* Would be cool to learn how implement a swiping feature for creating a new post if I have enough time. But the priority would be to just have the create button to lead to the camera and gallery (on the
nav bar). 
* I'm not including the reels, story, or live features because that would be more complex. But to be able to have the create button show the gallery of the phone would be 
nice, but I'm not sure how hard that would be. In this way, there could be a button for the camera. If accessing the gallery of the phone is too complex, then the create button should just take you to the front camera (and a button for the back camera as well). 

## Tools To Be Used: 

* Sequelize.js (SQALchemy for JS), not necessary but worth checking out.  
* Otherwise React and Node. Look into component libraries like bootstrap, materialUI. 
* Deploy frontend on GH-pages (even if blank). Backend - look for free deployment options. Use CRA. 
* Node - express. Express generator (a starter) 
* Web manifests - for accessing camera for mobile version.
* Photo filters - CSS filters. 

## The Feature I'd Like to Add: 

<img src='./project-proposal-photos/Screenshot (120).png' alt=''>

The feature I'd like to add is the optional addition of watermark generator to help independant artists avoid copyright issues and prevent other users from stealing their work. User can have an drop down of font styles to choose from and can type in whatever name they want. The watermark would appear at the bottom right corner. 

## Routes: 

All routes need to ensure that user is signed in.
* GET all users 
* GET user profile by username (should include user's likes, comments, posts, follows, and followers)
* GET user post detail by post id (should include post's likes, comments)
* POST create new post by user_id
* PATCH username's profile info 
* PATCH change a password
* POST like post by user_id
* POST like comment by user_id
* POST comment on photo or comment
* POST follow new account by user_id
* DELETE a post 

## Things I'm Not So Sure About:
* Should I include how many weeks, days, or hours ago a comment, a follow, and a post has been made like in the original Instagram? I'm not sure how simple or easy that is. 
* Should I allow clickable tags to be added for every post made? That is, when a post has relevant hashtags in its caption, should the tags lead to a page with all other posts with the same tag? It sounds easy to implement. Maybe I should include such a feature because it is so characteristic of Instagram.
* How hard would it be to tag any part of a photo with a user? And let a label show up whenever the photo is tapped? This would probably involve another data table referencing a post, user, and involving the coordinates of a photo (this could be time consuming but really cool, but not a priority right now).

## Hardest Features To Think About: 
* Being able to access the files of the computer, accessing the camera, and having comment chaining for posts.
