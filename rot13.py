import webapp2
import cgi


def rot13_process(text):
    text = list(text)
    for i in range(len(text)):
        code = ord(text[i])
        if code >= 65 and code <= 90:
            code += 13
            if code > 90:
                code -= 26;
        elif code >= 97 and code <= 122:
            code += 13
            if code > 122:
                code -= 26
        text[i] = chr(code)

    return cgi.escape(''.join(text), quote = True)


rot13_form = """
<form method="post">
    <label>
        Enter the text to be encoded/decoded
        <input type="textarea" name="text" value="%(text)s">
    </label>
    <br>
    <input type="submit">
</form>
"""


class Rot13Handler(webapp2.RequestHandler):
    def write_form(self, text = ''):
        self.response.out.write(rot13_form % {'text': text})

    def get(self):
        self.write_form()

    def post(self):
        text = self.request.get('text')
        self.write_form(rot13_process(text))


