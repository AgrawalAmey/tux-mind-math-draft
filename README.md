# GSoC Proposal 2016

## Table of Contents 
- Tux Mind Maths
  - Synopsis
  - Why Mind Maths?
  - Features 
  - Technical Details 
  - Graphics
  - Current Progress 
  - Timeline
- Personal background 
  - Academic Background
  - Coding experience
  - Graphic Design Experience 
  - Educational Initiatives 
  - Tux4Kids and Me 
  - Contact Details

## 1 Tux Mind Maths
#### 1.1 Synopsis 
The aim of Tux Mind Maths is to help children learn while they play. Mind Maths will be a set of seven different games each focused at one set of operations from Vedic Mathematics. Tux Mind Math would be made available on web, native desktop, android and iOS platforms.
The games will be intended to provide a complete gaming experience and give them a productive diversion, which they would love. 

#### 1.2 Why Mind Maths? 
Mathematics is the foundation of all disciplines of sciences and technology, But unfortunately many students face mathematical anxiety in their early encounters with maths. Many of these can be attributed to the discomfort while dealing with numbers. Vedic maths provides an easier way to deal with many common types of problems. Tux Mind Math can help students overcome their fears with a fun gaming experience. Also I believe the gaming provokes for an improvised performance than any general re-enforced learning methods. Over time, children can increase calculation speed to great extent provided right gaming platform.

#### 1.3 Features 
Tux Mind Math will showcase Six core games based on popular video games over last two decades. Namely Packman, Snake, Fruit Ninja, Flappy Bird,2D Temple run and Billiards. Each level will have animated tutorials for the type of problems being tested in the given level. Teachers/parents will be able to control the game speed based on the proficiency and learning rate of children.Great attention will be to make the game available on all major platforms. Web and mobile platforms provide simple access to content while it is much more convenient for schools to have games installed natively, specially the ones with slow internet connections.

#### 1.4 Technical Details 
The project will be primarily based on javascipt, HTML5. The web-app will be packaged into single executable file for native application using nw.js. The native version will be available on Windows, Linux and Mac operating systems. The mobile app will be packaged using apache cordova optimized for Android and iOS devices. 

3 out of 6 games do not actually need any physics simulations. Considering the fact that the game has to perform well on mobile platforms, using gaming engines like phasor would not be optimal solution. Hence the front-end stack will be based on Javascipt (along with jquery) and HTML5 canvas to optimize the performance. 

Each game will exist as individual ES6 module, which will be loaded with SystemJs module loader. These modules will use YUI style module pattern. 
The styling will be based on SVGs and CSS (with SASS). Gulp will be used as the build tool along with JSPM for dependency management and bundling. 

The back-end required for maintaining leaders-board will be written in Node.js using express framework. MySQL will be used as database server.

#### 1.5 Graphics
Tux Mind Math will be themed to intra-galatic space adventure which would be pleasing to children. All the graphics will be in SVG format for reducing memory overhead on the web and also provide seamless scaling across different screen sizes.

#### 1.6 Current Progress 
I have made two of the games proposed as demos, namely pacman and snake.Graphics for the same have not be developed yet. I have developed graphics for the game landing and level selection.

The links to demo versions of the games are:

- [Pacman](http://agrawalamey.github.io/tux-mind-math-draft/pacman)
- [Snake](http://agrawalamey.github.io/tux-mind-math-draft/pacman)

Following are some exports from the UI design:

Landing page
![alt text](https://github.com/AgrawalAmey/tux-mind-math-draft/blob/master/design/exports/prepod/home.jpg "Home screen design")

Level select page
![alt text](https://github.com/AgrawalAmey/tux-mind-math-draft/blob/master/design/exports/prepod/levelSelect.jpg "Level Select")


#### 1.7 Timeline 
The whole development process will be agile. Mentor will be able to track progress via github.

###### Community Bonding Period:
**Goal:** 
Understating the expectations of mentors and short-listing Vedic maths techniques to be included.

**Tasks:**

1. Going through various techniques in Vedic Mathematics which can be helpful to children.
2. Short-listing the best techniques found.

###### 14-31st May:
**Goal:** 
Getting ready the modules for all the games.

**Tasks:**

1. Developing the rest four games.
2. Converting to ES6 modules and fixing any bugs in the two demo games.
3. Testing the newly created modules.
4. Preparing initial documentation.

###### 1-10th June:
**Goal:** 
Designing graphics for all games and the UI.

**Tasks:**

1. Designing graphics for games and characters in UI.
2. Optimizing graphics and bundling them as sprites.

###### 11-20th June: 
**Goal:** 
Integrating graphics in project.

**Tasks:**

1. Developing style sheets and building UI.
2. Integrating data in the SVGs according to the needs of particular game.
3. Updating documentation.

###### 21-28th June:
**Goal:** 
Cleaning up code for mid-term evaluation.

###### 29th June-10th July:
**Goal:**
Integrating the maths techniques with games.

**Tasks:**

1. Selecting from short-listed techniques and testing the best game to integrate them with.  
2. Designing the animation sprite sequences for the tutorials.
3. Integrating the tutorials with front-end.
4. Optimizing game speed and their levels for best learning efficiency.

###### 11-20th July:
**Goal:**
Creating login and leader-board.

**Tasks:**

1. Designing database. 
2. Developing Node.js back-end modules
3. Developing the required front-end UI.
4. Integration and testing.
5. Updating documentation.

###### 21-28th July:
**Goal:**
Final integration and cleanup for front-end.

**Tasks:**

1. Finding and eliminating any code design inconsistencies. 
2. Optimizing any lose end.
3. Deployment on a test server.

###### 29th July-4th August:
**Goal:**
Packaging the code with nw.js and performing optimizations.

**Tasks:**

1. Packaging the code for different OS.
2. Optimizing code for performance and network interactions.
3. Updating documentation.

###### 5-12 August:
**Goal:**
Packaging the code with cordova and performing optimizations.

**Tasks:**

1. Adding native functionalities for Android and windows.
2. Updating documentation.

###### 13-16 August:
**Goal:**
Deployment on different platforms.

**Tasks:**

1. Deploying the code on all platforms.
2. Final documentation cleanup.

## 2 Personal background 
#### 2.1 Academic Background
I am currently pressuring computer science at Birla Institute of Technology and Science, Pilani, India (GMT+5:30). Machine Learning  algorithms and linear algebra are fields of academic interests.

#### 2.2 Coding Experience
I have experience  with C, Java, HTML5, CSS along with SASS, Javascript, ES6, SQL. My primary development environment is Linux (Ubuntu 15.10).I have created many front-end projects (games, quizzes, pages) but some of my most challenging projects are with Department of Visual Media, BITS Pilani.

To mention a few,
- [Oasis 2015 Website](http://www.bits-oasis.org): The official website for cultural festival of BITS Pilani, received more than 20,000 sessions in 20 days.
- [Apogee 2016 Website](http://www.bits-apogee.org): The official website for technical festival of BITS Pilani, received more than 25,000 sessions in 30 days.
- [Lacuna 2016](http://www.bits-apogee.org/lacuna): An online Sherlockian game, consisting of 12 micro-games was played by more than 500 users in span of 3 days.

#### 2.3 Graphic Design Experience 
My primary tool for graphics design has been CorelDraw while I am familiar withAdobe Photoshop, Adobe Illustrator and Inkscape. I have served as lead graphic designer for all the projects mentioned above.I have also done many freelance projects which can be tracked on my [behance profile](https://www.behance.net/ameyagrawal). 

#### 2.4 Educational Initiatives 
Me along with 8 others have started an educational initiative called ‘YUJ’ to help high school students identify and perceive their interests as career. The first edition  of our fest Concepticon received participation  from more than 1000 students. I have played  role as audit and tech coordinator. More details can be found on our facebook page.

#### 2.5 Tux4Kids and Me 
This is the first time I am contributing to an open-source project. I have played tux math command as a kid, the philosophy tux4kids reflects is concurrent with mine and hence I feel excited to be a part of it.

#### 2.6 Contact Details
**Email:**
- inspiria12@gmail.com
- f2014148@pilani.bits-pilani.ac.in (On mailing-list)

**Freenode IRC Nick:** amey
