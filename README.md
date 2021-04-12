Journal
=================

“Journal” is a blog website where user can post usual daily life articles to share their life.

Server side is mainly developed by Node.js and other packages, and MongoDB Atlas is used for database. EJS is the main frame for front-end. Ajax is used for creating routes for delete / update.


## Demo

1. Top page

![Kapture 2021-04-12 at 15 32 02](https://user-images.githubusercontent.com/50275402/114350547-4cc73e80-9ba4-11eb-8124-691988e28968.gif)

2. Compose posts

![Kapture 2021-04-12 at 15 19 53](https://user-images.githubusercontent.com/50275402/114349813-5603db80-9ba3-11eb-8cd0-49e5c708d854.gif)

3. Account page

![Kapture 2021-04-12 at 15 20 36](https://user-images.githubusercontent.com/50275402/114350082-b09d3780-9ba3-11eb-9eea-329455d8a43b.gif)

## Deploy

https://journal21.herokuapp.com/

## Requirement

* Node.js version 14.15.4
* npm version 6.14.10
* jQuery version 3.4.1  
* Bootstrap version 4.4.1
* MongoDB shell version 4.2.0

## Usage

1. Account registration and sign in

	* Third party authentication (Google and Facebook) is available as well as local registration.

2. Read posts

	* You can read all posts without sign in.
  
	* Posts can be sorted by authors and also filtered by search.

3. Compose posts

    * Compose posts with images on top. Posts can be saved as drafts or published directly.
  
    * You can edit or delete posts and drafts from dashboard.
    
4. Account update
  
   * username and avatar can be updated from account page.
  
   * users can resign from from account page.
	
## Install

  The simplest way is to clone ogoriai repository from github. 
	
  You need to install Node.js and npm beforehand so that you can install all other dependencies locally, like Express.js, Passport.js,and EJS.
  
  Then, use CLI and insert the line below.

```
$ git clone https://github.com/mai-saito/Ogoriai.git

$cd [your cloned repository]

$npm install
```

