import webapp2
import jinja2
import os
from google.appengine.ext import db

# loads jinja2
jinja_environment = jinja2.Environment(autoescape = True,
        loader = jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')))


DEBUG = True
USER1 = 'MACHETE'
USER2 = 'POLLO'
state = {
            USER1 : {'events': [], 'color': '1'},
            USER2 : {'events': [], 'color': '2'}
        }


def other(player):
    if player == USER1:
        return USER2
    if player == USER2:
        return USER1
    return None


class Base(webapp2.RequestHandler):
    def get_color(self):
        global state

        player = self.request.get('player').upper()
        if player in state.keys():
            return state[player]['color']

    def put_event(self, c):
        global state

        player = self.request.get('player').upper()
        if player in state.keys():
            state[player]['events'].append(c)

        if DEBUG:
            print "put_event: %s '%s'" % (player, c)

        return self.get_color()

    def drain_events(self):
        global state

        player = self.request.get('player').upper()
        other_player = other(player)
        if other_player in state.keys():
            q = state[other_player]['events']
        else:
            q = None

        if q:
            result = ','.join(q)
            del q[:]
        else:
            result = ''

        if DEBUG:
            print "drain_events %s '%s'" % (player, result)

        return result

    def clear_events(self):
        player = self.request.get('player').upper()
        if player in state.keys():
            del state[player]['events'][:]

        if DEBUG:
            print "clear_events %s" % (player, )

        return self.get_color()


class Move(Base):
    def post(self):
        col = self.request.get('col')
        move = self.request.get('move')
        seqnum = self.request.get('seqnum')

        color = self.put_event(col + ' ' + move + ' ' + seqnum)
        self.response.out.write(color)


class Start(Base):
    def post(self):
        # clean up leftovers
        color = self.clear_events()
        self.response.out.write(color)


class Poll(Base):
    def post(self):
        events = self.drain_events()
        self.response.out.write(events)

