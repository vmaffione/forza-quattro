import webapp2
import re
from google.appengine.ext import db
import random
import hashlib
import string
import jinja2
import os


# loads jinja2
jinja_environment = jinja2.Environment(autoescape = True,
        loader = jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')))

USERMU = 'muffin'
USERMI = 'pusheen'


class MessageMu(db.Model):
    content = db.TextProperty(required = True)

class MessageMi(db.Model):
    content = db.TextProperty(required = True)


def make_salt():
    return ''.join(random.choice(string.letters) for x in xrange(5))


class Logout(webapp2.RequestHandler):
    def get(self):
        self.response.headers.add_header('Set-Cookie', 'uid=;Path=/')
        self.redirect('/miao')


class MyHandler(webapp2.RequestHandler):
    def write_form(self, template_name, **kwargs):
        template = jinja_environment.get_template(template_name)
        self.response.out.write(template.render(kwargs))

    def auth(self):
        uid = self.request.cookies.get('uid')
        if not uid:
            self.redirect('/miao')
            return None
        pair = uid.split('|')
        if len(pair) != 2:
            self.redirect('/miao')
            return None
        username = pair[0]
        if pair[1] != hashlib.md5(username).hexdigest():
            self.redirect('/miao')
            return None

        return username


class Post(MyHandler):
    def get(self):
        username = self.auth()
        if not username:
            return

        self.write_form('miao-post.html', message = "Scrivi un messaggio...")

    def post(self):
        username = self.auth()
        if not username:
            return

        message = self.request.get('message')
        if username == USERMU:
            record = MessageMu(content = message)
        elif username == USERMI:
            record = MessageMi(content = message)
        else:
            # This should never happen
            self.redirect('/miao/logout')
            return

        record.put()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('OK')


class Poll(MyHandler):
    def post(self):
        username = self.auth()
        if not username:
            self.redirect('/miao/logout')
            return

        if username == USERMU:
            query = MessageMi.all()
            othername = USERMI
        elif username == USERMI:
            query = MessageMu.all()
            othername = USERMU
        else:
            # This should never happen
            self.redirect('/miao/logout')
            return

        result = othername
        if query:
            for m in query:
                result += '|' + m.content
                m.delete()

        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write(result)


class Access(MyHandler):
    def get(self):
        self.write_form('miao-access.html')

    def post(self):
        username = self.request.get('username')

        if username != USERMU and username != USERMI:
            self.write_form('miao-access.html', uerr = '... sbagliato!')
            return

        #query = User.gql("WHERE username = :1", username)
        #user = query.get()

        # add_header doesn't like unicode strings
        username = str(username)
        self.response.headers.add_header('Set-Cookie', 'uid=%s|%s; Path=/' % (username, hashlib.md5(username).hexdigest()))
        self.redirect('/miao/post')

