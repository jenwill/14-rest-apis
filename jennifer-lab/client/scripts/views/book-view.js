'use strict';
var app = app || {};

(function(module) {
  $('.icon-menu').on('click', function(event) {
    $('.nav-menu').slideToggle(350);
  })

  function resetView() {
    $('.container').hide();
    $('.nav-menu').slideUp(350);
  }

  const bookView = {};

  bookView.initIndexPage = function(ctx, next) {
    resetView();
    $('.book-view').show();
    $('#book-list').empty();
    module.Book.all.map(book => $('#book-list').append(book.toHtml()));
    next()
  }

  bookView.initDetailPage = function(ctx, next) {
    resetView();
    $('.detail-view').show();
    $('.book-detail').empty();
    let template = Handlebars.compile($('#book-detail-template').text());
    $('.book-detail').append(template(ctx.book));

    $('#update-btn').on('click', function() {
      page(`/books/${$(this).data('id')}/update`);
    });

    $('#delete-btn').on('click', function() {
      module.Book.destroy($(this).data('id'));
    });
    next()
  }

  bookView.initCreateFormPage = function() {
    resetView();
    $('.create-view').show();
    $('#create-form').on('submit', function(event) {
      event.preventDefault();

      let book = {
        title: event.target.title.value,
        author: event.target.author.value,
        isbn: event.target.isbn.value,
        image_url: event.target.image_url.value,
        description: event.target.description.value,
      };

      module.Book.create(book);
    })
  }

  bookView.initUpdateFormPage = function(ctx) {
    resetView();
    $('.update-view').show()
    $('#update-form input[name="title"]').val(ctx.book.title);
    $('#update-form input[name="author"]').val(ctx.book.author);
    $('#update-form input[name="isbn"]').val(ctx.book.isbn);
    $('#update-form input[name="image_url"]').val(ctx.book.image_url);
    $('#update-form textarea[name="description"]').val(ctx.book.description);

    $('#update-form').on('submit', function(event) {
      event.preventDefault();

      let book = {
        book_id: ctx.book.book_id,
        title: event.target.title.value,
        author: event.target.author.value,
        isbn: event.target.isbn.value,
        image_url: event.target.image_url.value,
        description: event.target.description.value,
      };

      module.Book.update(book, book.book_id);
    })
  };

// DONE - COMMENT: What is the purpose of this method?
// It initializes the Search view, presenting a search form to the user. It creates an event listener on the Submit button, so when the button is clicked a 'book' object is created containing the user-input data. Then it calls Book.find, passing it the new book object and specifying bookView.initSearchResultsPage as a callback function.
  bookView.initSearchFormPage = function() {
    resetView();
    $('.search-view').show();
    $('#search-form').on('submit', function(event) {
      // DONE - COMMENT: What default behavior is being prevented here?
      // Reloading the page when the submit button is activated.
      event.preventDefault();

      // DONE - COMMENT: What is the event.target, below? What will happen if the user does not provide the information needed for the title, author, or isbn properties?
      // event.target is the form that is connected to the submit button. If the user does not provide information for any of the form fields, the book object gets a blank value for that property.
      let book = {
        title: event.target.title.value || '',
        author: event.target.author.value || '',
        isbn: event.target.isbn.value || '',
      };

      module.Book.find(book, bookView.initSearchResultsPage);

      // DONE - COMMENT: Why are these values set to an empty string?
      //To clear the search form when its data is submitted.
      event.target.title.value = '';
      event.target.author.value = '';
      event.target.isbn.value = '';
    })
  }

  // DONE - COMMENT: What is the purpose of this method?
  //This displays the book search results passed to it by Book.find.
  bookView.initSearchResultsPage = function() {
    resetView();
    $('.search-results').show();
    $('#search-list').empty();

    // DONE - COMMENT: Explain how the .map() method is being used below.
    // At this point, Book.all contains the search results list (at other times, it contains all books in our database). The .map() methods steps through the Book.all array and assigns the current entry to the 'book' parameter. It then converts the book information to html with the .toHtml() method and appends it to the DOM element with id 'search-list'. After .map() is done, we have a displayed list of the search results.

    module.Book.all.map(book => $('#search-list').append(book.toHtml()));
    $('.detail-button a').text('Add to list').attr('href', '/');
    $('.detail-button').on('click', function(e) {
      // DONE - COMMENT: Explain the following line of code.
      // When the user clicks on the button, this code calls .findOne() to get and display that book. To determine which book should be found, it traverses the DOM up three levels to target the right element: it's the list item with a data-bookid attribute, and it's the value of that attribute that is being sent to the .findOne() method.
      module.Book.findOne($(this).parent().parent().parent().data('bookid'))
    });
  }

  // DONE - COMMENT: Explain the following line of code.
  // This adds the bookView object to the module object, allowing bookView's methods to be accessed from outside this function. The methods are accessed by calling app.bookView, because the parameter passed to this function is specified as 'app' in the line below.
  module.bookView = bookView;
  
  //DONE - COMMENT: Explain the following line of code.
  // This invokes the IFFE, passing it the argument 'app'. Now the methods of the bookView object can be accessed using app.bookView, as described in the previous comment.
})(app)

