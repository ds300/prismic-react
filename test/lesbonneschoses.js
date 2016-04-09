"use strict";

var Prismic = require('prismic.io');
var Promise = require('promise');

var API_URL = 'https://lesbonneschoses.prismic.io/api';
var RELEASE_REF = 'master';
var ACCESS_TOKEN = null;

module.exports = new Promise((resolve, reject) => {

  function retrieveContent(err, api) {
    if (err) {
        console.error("Could not initialize API: " + err);
    } else {
      // obtain the reference
      var release = RELEASE_REF;
      var ref;
      for (var currentRef in api.data.refs) {
          if ((!release || release.toLowerCase() == "master") && (api.data.refs[currentRef].isMaster)) {
              ref = api.data.refs[currentRef].ref;
          }
          else if (release == api.data.refs[currentRef].label) {
              ref = api.data.refs[currentRef].ref;
          }
      }

      // user release as reference if no reference found
      if (!ref) {
        ref = release || 'master';
      }

      var pages = [];
      function doPage (page) {
        // gather data
        api.form('everything')
          .query('')
          .ref(ref)
          .page(page)
          .pageSize(100)
          .submit((err, res) => {
            if (err) {
              reject(err);
            } else {
              if (res.results.length) {
                pages = pages.concat(res.results);

                if (page < res.total_pages) {
                  doPage(page+1);
                } else {
                  resolve(pages);
                }
              } else {
                resolve(pages);
              }
            }
          });
      }
      doPage(1);
    }
  }

  Prismic.Api(API_URL, retrieveContent, ACCESS_TOKEN);
});
