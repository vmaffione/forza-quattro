import webapp2
import cgi
import re

import signup, rot13, birthday, blog
import forzaquattro


class ThanksHandler(webapp2.RequestHandler):
    def get(self):
        self.response.out.write('Thanks! That\'s a totally valid day!')


application = webapp2.WSGIApplication([
    (r'/birthday', birthday.BirthdayHandler),
    (r'/thanks', ThanksHandler),
    (r'/rot13', rot13.Rot13Handler),
    (r'/signup', signup.SignupHandler),
    (r'/login', signup.LoginHandler),
    (r'/logout', signup.LogoutHandler),
    (r'/welcome', signup.WelcomeHandler),
    (r'/blog/newpost', blog.BlogPostHandler),
    (r'/blog/?', blog.BlogHandler),
    (r'/blog/?\.json', blog.BlogHandlerJson),
    (r'/blog/(\d+)', blog.BlogPermalink),
    (r'/blog/(\d+)\.json', blog.BlogPermalinkJson),
    (r'/forzaquattro/start', forzaquattro.Start),
    (r'/forzaquattro/move', forzaquattro.Move),
    (r'/forzaquattro/poll', forzaquattro.Poll),
    ], debug = True)
