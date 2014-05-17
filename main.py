import webapp2
import cgi
import re

import signup, rot13, birthday, blog


class ThanksHandler(webapp2.RequestHandler):
    def get(self):
        self.response.out.write('Thanks! That\'s a totally valid day!')


application = webapp2.WSGIApplication([
    (r'/birthday', birthday.BirthdayHandler),
    (r'/thanks', ThanksHandler),
    (r'/rot13', rot13.Rot13Handler),
    (r'/signup', signup.SignupHandler),
    (r'/welcome', signup.WelcomeHandler),
    (r'/blog/newpost', blog.BlogPostHandler),
    (r'/blog/?', blog.BlogHandler),
    (r'/blog/(\d+)', blog.BlogPermalink),
    ], debug = True)
