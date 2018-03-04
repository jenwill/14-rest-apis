'use strict'

// Application dependencies
const express = require('express');
const cors = require('cors');
const pg = require('pg');
const bodyParser = require('body-parser').urlencoded({extended: true});
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
const CLIENT_URL = process.env.CLIENT_URL;
const TOKEN = process.env.TOKEN;

// DONE - COMMENT: Explain the following line of code. What is the API_KEY? Where did it come from?
//This is an authorization code that I got from the Google Books API by registering my project at the the API website. I exported it to my local environment, so now I can use it as a variable here.
const API_KEY = process.env.GOOGLE_API_KEY;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Application Middleware
app.use(cors());

// API Endpoints
app.get('/api/v1/admin', (req, res) => res.send(TOKEN === parseInt(req.query.token)));

app.get('/api/v1/books/find', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';

  // DONE - COMMENT: Explain the following four lines of code. How is the query built out? What information will be used to create the query?
  // This code adds information to the API query from the user-input book search form. It is built out with a series of if statements so that it only adds that part of the query if there was any data input into that part of the form. 
  let query = ''
  if(req.query.title) query += `+intitle:${req.query.title}`;
  if(req.query.author) query += `+inauthor:${req.query.author}`;
  if(req.query.isbn) query += `+isbn:${req.query.isbn}`;

  // DONE - COMMENT: What is superagent? How is it being used here? What other libraries are available that could be used for the same purpose?
  //Superagent is middleware that sends queries to the external API (Google Books, in this case), and sends results back to the client. It is fullfilling a similar role here that Postgres filled in our labs earlier this week, only it is communicating with the Google Books API and Postgres was communicating with our database.
  superagent.get(url)
    .query({'q': query})
    .query({'key': API_KEY})
    .then(response => response.body.items.map((book, idx) => {

      // DONE - COMMENT: The line below is an example of destructuring. Explain destructuring in your own words.
      //Destructuring is a shorthand syntax for assigning multiple properties of an object to multiple variables. This is equivalent to writing
      //let title = book.volumeInfo.title;
      //let authors = book.volumeInfo.authors;
      //etc.
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;

      // DONE - COMMENT: What is the purpose of the following placeholder image?
      // It provides a book image to be used if there is no image provided by Google Books.
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      // DONE - COMMENT: Explain how ternary operators are being used below.
      // For each key/value pair: if Google Books returned a value for that key, assign that value. If it did not return a value, assign the placeholder specified in the code below. For example, if there is a title it will be found in the 'title' variable created in the destructuring statement above; assign it to the 'title' key. But if there is nothing in the 'title' variable, assign 'No title available' to the 'title' key.
      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
        book_id: industryIdentifiers ? `${industryIdentifiers[0].identifier}` : '',
      }
    }))
    .then(arr => res.send(arr))
    .catch(console.error)
})

// DONE - COMMENT: How does this route differ from the route above? What does ':isbn' refer to in the code below?
//The route above is invoked when the user submits the book search form, and it can return a list of multiple books. This route is invoked when the user chooses one specific book by clicking the Add to List button, and it returns one specific book.
//:isbn is the number added to the end of the route by the .findOne() method, which it got from the data-bookid attribute of the DOM element containing the clicked button.
app.get('/api/v1/books/find/:isbn', (req, res) => {
  let url = 'https://www.googleapis.com/books/v1/volumes';
  superagent.get(url)
    .query({ 'q': `+isbn:${req.params.isbn}`})
    .query({ 'key': API_KEY })
    .then(response => response.body.items.map((book, idx) => {
      let { title, authors, industryIdentifiers, imageLinks, description } = book.volumeInfo;
      let placeholderImage = 'http://www.newyorkpaddy.com/images/covers/NoCoverAvailable.jpg';

      return {
        title: title ? title : 'No title available',
        author: authors ? authors[0] : 'No authors available',
        isbn: industryIdentifiers ? `ISBN_13 ${industryIdentifiers[0].identifier}` : 'No ISBN available',
        image_url: imageLinks ? imageLinks.smallThumbnail : placeholderImage,
        description: description ? description : 'No description available',
      }
    }))
    .then(book => res.send(book[0]))
    .catch(console.error)
})

app.get('/api/v1/books', (req, res) => {
  client.query(`SELECT book_id, title, author, image_url, isbn FROM books;`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.get('/api/v1/books/:id', (req, res) => {
  client.query(`SELECT * FROM books WHERE book_id=${req.params.id}`)
    .then(results => res.send(results.rows))
    .catch(console.error);
});

app.post('/api/v1/books', bodyParser, (req, res) => {
  let {title, author, isbn, image_url, description} = req.body;
  client.query(`
    INSERT INTO books(title, author, isbn, image_url, description) VALUES($1, $2, $3, $4, $5)`,
    [title, author, isbn, image_url, description]
  )
  .then(results => res.sendStatus(201))
  .catch(console.error);
});

app.put('/api/v1/books/:id', bodyParser, (req, res) => {
  let {title, author, isbn, image_url, description} = req.body;
  client.query(`
    UPDATE books
    SET title=$1, author=$2, isbn=$3, image_url=$4, description=$5
    WHERE book_id=$6`,
    [title, author, isbn, image_url, description, req.params.id]
  )
  .then(() => res.sendStatus(204))
  .catch(console.error)
})

app.delete('/api/v1/books/:id', (req, res) => {
  client.query('DELETE FROM books WHERE book_id=$1', [req.params.id])
  .then(() => res.sendStatus(204))
  .catch(console.error);
});

app.get('*', (req, res) => res.redirect(CLIENT_URL));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));