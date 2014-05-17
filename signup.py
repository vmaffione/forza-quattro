import webapp2
import cgi
import re


class WelcomeHandler(webapp2.RequestHandler):
    def get(self):
        username = cgi.escape(self.request.get('username'), quote = True)
        self.response.out.write('Welcome, %s' % username)


signup_form = """
<form method="post">
    <h2>
        Sign up
    </h2>
    <div>
        <label>
            Username
            <input type="text" name="username" value="%(username)s">
        </label>
        %(uerr)s
    </div>
    <br>

    <div>
        <label>
            Password
            <input type="password" name="password">
        </label>
        %(perr)s
    </div>
    <br>

    <label>
        Verify password
        <input type="password" name="verify">
    </label>
    <br> <br>

    <div>
        <label>
            Email (optional)
            <input type="text" name="email" value="%(email)s">
        </label>
        %(eerr)s
    </div>
    <br> <br>
    <input type="submit">
</form>
"""


class SignupHandler(webapp2.RequestHandler):
    def write_form(self, username = '', email = '', uerr = '', perr = '',
                         eerr = ''):
        #curs = db.GqlQuery("SELECT * FROM User");

        username = cgi.escape(username, quote = True)
        email = cgi.escape(email, quote = True)
        self.response.out.write(signup_form % {'username': username,
                                                'email': email,
                                                'uerr': uerr,
                                                'perr': perr,
                                                'eerr': eerr})

    def get(self):
        self.write_form()

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

        if ok:
            # create an User entity and insert into the DataStore
            #user = User(username = username, password = password,
                        #email = email)
            #user.put()
            self.redirect('/welcome?username=%s' % username)
        else:
            self.write_form(username, email, uerr, perr, eerr)


