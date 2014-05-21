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
        player = self.request.get('player').upper()
        if player == USER2:
            event = User2Event(content = c)
            color = '1'
        elif player == USER1:
            event = User1Event(content = c)
            color = '2'
        else:
            event = None
            color = ''

        if event:
            event.put()

        return color

    def drain_events(self, mine):
        player = self.request.get('player').upper()
        if player == USER2:
            if not mine:
                q = User1Event.all()
                color = '1'
            else:
                q = User2Event.all()
                color = '2'
        elif player == USER1:
            if not mine:
                q = User2Event.all()
                color = '2'
            else:
                q = User1Event.all()
                color = '1'
        else:
            q = None
            color = ''

        result = ''
        if q:
            for event in q:
                result += event.content + ','
                event.delete()

        return color, result


class Move(Base):
    def post(self):
        col = self.request.get('col')
        move = self.request.get('move')

        color = self.put_event(col + ' ' + move)
        self.response.out.write(color)


class Start(Base):
    def post(self):
        # clean up leftovers
        color, events = self.drain_events(mine = True)
        self.response.out.write(color)


class Poll(Base):
    def post(self):
        color, events = self.drain_events(mine = False)
        self.response.out.write(color + ',' + events)

