[![Stories in Ready](https://badge.waffle.io/HRR17-Jigglypuff/stack-salaries.png?label=ready&title=Ready)](https://waffle.io/HRR17-Jigglypuff/stack-salaries)
# Stack Salaries
Team Jigglypuff: [Felipe](https://github.com/ftmatsumoto), [Yuan](https://github.com/liuyuanneu), [Jason](https://github.com/tylerwebworx) [Ryo](https://github.com/ryo-capricorn92)

An app for software engineers to post anonymous salary info based on their stack and location with optional filters based on criteria such as educational background, age, years of experience.

# Back end

The back-end currently uses Express/MongoDB/Mongoose.
As part of the current webpack config file, the server is compiled every time you run
`npm start`

```
server
│   secret    - This contains the secret token for passport authentication
│   server-c  - The compiled version of the server
│   server    - The server file
│
└─── controllers
    │   stackdataController  - Holds all the helper methods needed to query the database for stack entries
    │
    │
└─── models
    │   stackdata   - The stack entry model
    │   user        - The user model
└─── passport
    │   github      - Github authentication strategy (you can utilize and include on the frontend)
    │   local       - This authentication strategy verifies the email and password upon login
    │   passport    - This authentication strategy verifies a valid JWT token was sent in
                      the header for protected areas
└─── public
    │               Contains old HTML files, feel free to ignore
```

# Front-end

The front-end utilizes Redux/React.
As part of the current webpack config, the client/src file is compiled every time you run
`npm start`.
Helpful hint: If you don't want to wait that long, run `npm run quick`, this only compiles
the client side.

```
client
│   secret    - This contains the secret token for passport authentication
│   server-c  - The compiled version of the server
│   server    - The server file
│
└─── compiled
    │   stackdataController  -
    │
    │
└─── src
    │
    ├─── actions
    │   │    actionCreator
    │   │
    │   ├─── auth
    │   │     auth.js  - This file contains helper methods for client side authentication
    │   │
    │   ├─── components
    │   │     All components in this folder are dumb components aka they don't use redux directly
    │   │
    │   ├─── containers
    │   │     Containers are smart containers that have direct access to the redux store using
    │   │     actions
    │   │
    │   ├─── reducers
    │   │     All reducers here deal with search and user info
    │   ├─── utils
    │   │     flash   - This helper class displays flash message. Feel free to replace with module
    │   │
    ├─── index.html
    ├─── index.js
    ├─── router.js    - Routing is done on the client side and server side using React Router
```

# Feature To Do List
- Activate oauth on the client side (server side strategy already in place)
- Upload user profile photos
- Enhance form validation for 'Add a Salary'
- Enhance the advanced search
- Display user's previous positions and salaries on the dashboard
- Display a keyword cloud on the main page based on popular searches
