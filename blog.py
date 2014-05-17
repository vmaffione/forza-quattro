import webapp2
import jinja2
import os
from google.appengine.ext import db

# loads jinja2
jinja_environment = jinja2.Environment(autoescape = True,
        loader = jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), 'templates')))


class Post(db.Model):
    subject = db.StringProperty(required = True)
    content = db.TextProperty(required = True)
    created = db.DateTimeProperty(auto_now_add = True)
    pass


class BlogPermalink(webapp2.RequestHandler):
    def get(self, post_id):
        post = Post.get_by_id(int(post_id))
        if not post:
            self.abort(404)

        template_values = {
            'post': post,
        }

        template = jinja_environment.get_template('permalink.html')
        self.response.out.write(template.render(template_values))


class BlogHandler(webapp2.RequestHandler):
    def get(self):
        posts = db.GqlQuery("SELECT * FROM Post ORDER BY created DESC")
        template_values = {
            'posts': posts,
        }

        template = jinja_environment.get_template('blog.html')
        self.response.out.write(template.render(template_values))


class BlogPostHandler(webapp2.RequestHandler):
    def write_form(self, subject = '', content = '', subject_err = '',
                        content_err = ''):
        template_values = {
            'subject': subject,
            'content': content,
            'subject_err': subject_err,
            'content_err' : content_err,
        }

        template = jinja_environment.get_template('newpost.html')
        self.response.out.write(template.render(template_values))

    def get(self):
        self.write_form()

    def post(self):
        subject = self.request.get('subject')
        content = self.request.get('content')

        ok = True
        if subject == '':
            subject_err = 'You need to specify a subject'
            ok = False

        content_err = ''
        if content == '' or content.isspace():
            content_err = 'You need to specify a content'
            ok = False

        if ok:
            post = Post(subject = subject, content = content)
            post.put()
            self.redirect('/blog/%s' % post.key().id())
        else:
            self.write_form(subject, content, subject_err, content_err)


