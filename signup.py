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


class User(db.Model):
    username = db.StringProperty(required = True)
    email = db.StringProperty(required = False)
    salt = db.StringProperty(required = True)
    hashed = db.StringProperty(required = True)


def make_hashed_password(username, password, salt = None):
    if not salt:
        salt = ''.join(random.choice(string.letters) for x in xrange(5))
    h = hashlib.sha256(username + password + salt).hexdigest()
    return salt, h


class WelcomeHandler(webapp2.RequestHandler):
    def get(self):
        uid = self.request.cookies.get('uid')
        if not uid:
            self.redirect('/signup')
            return
        pair = uid.split('|')
        if len(pair) != 2:
            self.redirect('/signup')
            return
        user = User.get_by_id(int(pair[0]))
        if not user or pair[1] != hashlib.md5(user.salt).hexdigest():
            self.redirect('/signup')
            return
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.out.write('Welcome, %s' % user.username)


class MyHandler(webapp2.RequestHandler):
    def write_form(self, template_name, **kwargs):
        template = jinja_environment.get_template(template_name)
        self.response.out.write(template.render(kwargs))


class SignupHandler(MyHandler):
    def get(self):
        self.write_form('signup.html')

    def post(self):
        username = self.request.get('username')
        password = self.request.get('password')
        verify   = self.request.get('verify')
        email    = self.request.get('email')

        ok = True
        uerr = ''
        if not re.match(r'^[_a-zA-Z0-9]{3,20}$', username):
            uerr = 'That\'s not a vaild username'
            ok = False

        perr = ''
        if not re.match(r'^.{3,20}$', password):
            perr = 'Invalid password'
            ok = False
        elif password != verify:
            perr = 'Passwords don\'t match'
            ok = False

        eerr = ''
        if email != '' and not re.match(r'^[\S]+@[\S]+\.[\S]+$', email):
            eerr = 'Invalid email'
            ok = False

        if not ok:
            self.write_form('signup.html', username = username, email = email, uerr = uerr, perr = perr, eerr = eerr)
            return

        # check if the username already exists
        query = User.gql("WHERE username = :1", username)
        if query.count():
            self.write_form('signup.html', username = username, email = email, uerr = 'User already exists')
            return

        # create an User entity and insert into the DataStore
        salt, hashed_pwd = make_hashed_password(username, password)
        user = User(username = username, email = email,
                        salt = salt, hashed = hashed_pwd)
        user.put()
        self.response.headers.add_header('Set-Cookie', 'uid=%s|%s; Path=/' % (user.key().id(), hashlib.md5(salt).hexdigest()))
        print "new user: %s, %s, %s, %s" % (username, email, salt, hashed_pwd)
        self.redirect('/welcome')


class LoginHandler(MyHandler):
    def get(self):
        self.write_form('login.html')

    def post(self):
        username = self.request.get('username')
        password = self.request.get('password')

        query = User.gql("WHERE username = :1", username)
        user = query.get()
        if not user:
            self.write_form('login.html', username = username, uerr = 'User not registered')
            return
        salt, hashed_pwd = make_hashed_password(username, password, user.salt)
        if hashed_pwd != user.hashed:
            self.write_form('login.html', username = username, perr = 'Invalid password')
            return

        self.response.headers.add_header('Set-Cookie', 'uid=%s|%s; Path=/' % (user.key().id(), hashlib.md5(salt).hexdigest()))
        self.redirect('/welcome')

