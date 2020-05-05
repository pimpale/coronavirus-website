# Innexo.io: Contact Tracer
## About

Innexo.io serves as a platform for the public that would allow individuals affected by the virus
to upload their location data and members of the community to compare their own location to verify whether
they have potentially been exposed to the virus. The user who has been positively tested with COVID-19 uploads
their data, inputting the range in which they were sick and had symptoms. The web application would then display
this location data on a map; in order to protect the privacy of the user, the application allows them to erase
areas they want to hide, such as their home address. Once the user is satisfied with their privacy, they enter
the upload button. Their data then gets put into a SQLite3 database. Anonymous users can then acquire their own
location history from google and load it into the website. The application will then check if they were in a
nearby radius of someone who has COVID-19. After their location history is compared, any intersection between
the interested member and a user infected with the virus will be shown with a marker dot, indicating how far
the affected member was in the infection cycle. In order to maintain user privacy, individual metrics will not
be shown. If the interested member learns that they have been exposed to the virus, they have an option to
upload their data as well and can view other pages of the website which inform what next steps to take, whether
it be self-isolation or testing.


## Installation & Running

There are two major components of this app: the frontend and the backend. It is necessary to initialize both
projects in order to run the app. For frontend, you must run:
```
# install scripts
cd frontend

npm i
npm i --only=dev

npm run prod
```

Then, to instantiate the backend, you should do:
```
cd ..
npm i
npm i --only=dev

node app.js
```

The application should now be running on port 8080 of your machine.
