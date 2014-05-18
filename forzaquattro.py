import webapp2
import jinja2
import os
from google.appengine.ext import db

# loads jinja2
jinja_environment = jinja2.Environment(autoescape = True,
        loader = jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')))


class Main(webapp2.RequestHandler):
    def post(self):
        col = self.request.get('col');
        move = self.request.get('move');
        self.response.out.write('received ' + col + move)
        pass

