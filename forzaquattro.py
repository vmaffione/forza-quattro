import webapp2
import jinja2
import os
from google.appengine.ext import db

# loads jinja2
jinja_environment = jinja2.Environment(autoescape = True,
        loader = jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')))


USER1 = 'MACHETE'
USER2 = 'POLLO'


class User1Event(db.Model):
    content = db.StringProperty(required = True)

class User2Event(db.Model):
    content = db.StringProperty(required = True)


class Base(webapp2.RequestHandler):
    def put_event(self, c):
        player = self.request.get('player')
        if player == USER2:
            event = User2Event(content = c)
        elif player == USER1:
            event = User1Event(content = c)
        else:
            event = None

        if event:
            self.response.out.write('OK')
            event.put()
        else:
            self.response.out.write('KO')


class Move(Base):
    def post(self):
        col = self.request.get('col');
        move = self.request.get('move');

        self.put_event(col + ' ' + move)
        pass


class Start(Base):
    def post(self):
        self.put_event('started')


class Poll(webapp2.RequestHandler):
    def post(self):
        player = self.request.get('player')
        if player == USER2:
            q = User1Event.all()
        elif player == USER1:
            q = User2Event.all()
        else:
            q = None

        result = ''

        if q:
            for event in q:
                result += event.content + ','
                event.delete()

        self.response.out.write(result)

