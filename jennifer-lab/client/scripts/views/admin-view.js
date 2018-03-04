'use strict';

var app = app || {};

(function (module) {
  const adminView = {};

  adminView.initAdminPage = function (ctx, next) {
    $('.nav-menu').slideUp(350);
    $('.admin-view').show();

    $('#admin-form').on('submit', function(event) {
      event.preventDefault();
      let token = event.target.passphrase.value;

      // DONE - COMMENT: Is the token cleared out of local storage? Do you agree or disagree with this structure?
      // No, the token is not cleared out of local storage, and it would be better to clear it because that would be more secure. As it is, this allows anyone logged in to this computer to use the API unless someone manually clears local storage. It's probably not an issue as long as this client is only run from a privately-owned computer, but it would certainly be insecure if it were run on a public computer.
      $.get(`${__API_URL__}/api/v1/admin`, {token})
        .then(res => {
          localStorage.token = true;
          page('/');
        })
        .catch(() => page('/'));
    })
  };

  adminView.verify = function(ctx, next) {
    if(!localStorage.token) $('.admin').addClass('admin-only');
    else $('.admin').show();
    next();
  }

  module.adminView = adminView;
})(app)